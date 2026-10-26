import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import { newsService } from './newsService.ts';
import { sportsService } from './sportsService.ts';
import { AskAssistantRequest, AskAssistantResponse, Citation } from './types.ts';
import { memoryCache } from './cache.ts';
import crypto from 'crypto';

// In-Memory Daily AI Quota Tracker (Resets at midnight UTC)
interface DailyAiUsage {
  date: string;
  count: number;
}

let dailyQuota: DailyAiUsage = {
  date: new Date().toISOString().split('T')[0],
  count: 0,
};

export function checkAndIncrementAiQuota(): { allowed: boolean; current: number; max: number } {
  const today = new Date().toISOString().split('T')[0];
  if (dailyQuota.date !== today) {
    dailyQuota = { date: today, count: 0 };
  }

  const maxDaily = parseInt(process.env.AI_DAILY_LIMIT || '100', 10);
  if (dailyQuota.count >= maxDaily) {
    return { allowed: false, current: dailyQuota.count, max: maxDaily };
  }

  dailyQuota.count += 1;
  return { allowed: true, current: dailyQuota.count, max: maxDaily };
}

// Timeout wrapper helper
export function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
    ),
  ]);
}

export class AiService {
  private client: GoogleGenAI | null = null;

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;

    if (!this.client) {
      this.client = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return this.client;
  }

  // Answer user research queries
  async askAssistant(req: AskAssistantRequest): Promise<AskAssistantResponse> {
    const ai = this.getClient();
    const maxChars = parseInt(process.env.AI_MAX_INPUT_CHARS || '1500', 10);
    const query = req.query.trim().slice(0, maxChars);

    // Check query cache
    const cacheKey = `ai_query_${crypto.createHash('sha256').update(`${query}:${req.language || 'en'}`).digest('hex')}`;
    const cachedResponse = memoryCache.get<AskAssistantResponse>(cacheKey);
    if (cachedResponse) {
      return cachedResponse;
    }

    // Retrieve contextual live records to ground the answer
    const relevantNews = await newsService.searchNews(query, req.categoryFilter);
    const topNewsContext = relevantNews.slice(0, 5);

    // Retrieve sports context if sports keywords detected
    let sportsContextStr = '';
    const isSportsQuery = /match|score|vs|standing|league|cup|player|tournament|fixture|goal|quarter|championship/i.test(query);
    if (isSportsQuery) {
      const fixtures = await sportsService.getFixtures();
      const relevantFixtures = fixtures.filter(f =>
        f.homeTeam.name.toLowerCase().includes(query.toLowerCase()) ||
        f.awayTeam.name.toLowerCase().includes(query.toLowerCase()) ||
        f.competition.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 4);

      if (relevantFixtures.length > 0) {
        sportsContextStr = `\n[VERIFIED SPORTS DATABASE RECORDS]:\n` +
          relevantFixtures.map(f => `- ${f.competition}: ${f.homeTeam.name} vs ${f.awayTeam.name} (${f.status.toUpperCase()}, Score: ${f.homeTeam.score ?? 'N/A'} - ${f.awayTeam.score ?? 'N/A'}, Time: ${f.startTime}, Venue: ${f.venue})`).join('\n');
      }
    }

    const newsContextStr = topNewsContext.map((n, i) =>
      `[Source ${i + 1} - ${n.publisher} (${new Date(n.publishedAt).toLocaleDateString()})]: ${n.title}\nSummary: ${n.summary}\nURL: ${n.url}`
    ).join('\n\n');

    if (!ai) {
      const citations: Citation[] = topNewsContext.map(n => ({
        title: n.title,
        url: n.url,
        publisher: n.publisher,
        publishedAt: n.publishedAt
      }));

      return {
        answer: topNewsContext.length > 0
          ? `Here is the current verified reporting on "${query}":\n\n` +
            topNewsContext.map(n => `• **${n.title}** (${n.publisher}): ${n.summary}`).join('\n\n') +
            `\n\n*(Note: To unlock live Gemini 3.8 deep research synthesis with full dialectical analysis, please ensure your GEMINI_API_KEY is configured in server environment variables).*`
          : `No matching records found in our connected provider index for "${query}". Set GEMINI_API_KEY to enable real-time web-grounded research synthesis.`,
        citations,
        confidence: topNewsContext.length > 0 ? 'moderate' : 'low',
        limitations: 'Live generative AI reasoning requires a valid GEMINI_API_KEY. Displaying direct verified index records.',
        suggestedFollowUps: [
          'What are the key primary sources for this topic?',
          'What are the conflicting viewpoints among researchers?',
          'What official statements have been released?'
        ],
        generatedAt: new Date().toISOString(),
        modelUsed: 'FactInfoLive Provider Index Fallback',
      };
    }

    // Cost protection: Check daily quota before invoking Gemini
    const quota = checkAndIncrementAiQuota();
    if (!quota.allowed) {
      const citations: Citation[] = topNewsContext.map(n => ({
        title: n.title,
        url: n.url,
        publisher: n.publisher,
        publishedAt: n.publishedAt
      }));

      return {
        answer: `Daily AI research query limit (${quota.max} queries) reached. Generative synthesis is paused until midnight UTC.\n\nDirect verified wire stories on this topic:\n` +
          topNewsContext.map(n => `• **${n.title}** (${n.publisher}): ${n.summary}`).join('\n\n'),
        citations,
        confidence: 'moderate',
        limitations: 'Application daily rate-limit reached. Resets at 00:00 UTC.',
        suggestedFollowUps: ['Browse category archives', 'View latest sports scores'],
        generatedAt: new Date().toISOString(),
        modelUsed: 'FactInfoLive Query Safeguard',
      };
    }

    try {
      const prompt = `You are the lead research intelligence analyst for FactInfoLive, a world-class global news, sports, and science verification platform.
Analyze the user's question with utmost factual rigor, neutrality, and clear source attribution.

User Question: "${query}"
Language: ${req.language || 'en'}

Connected Live Provider Context:
${newsContextStr || 'No direct local articles matched. Use empirical verified knowledge and state uncertainties.'}
${sportsContextStr}

Instructions:
1. Provide a comprehensive, clear, and objective answer in English (or translated to the requested language if requested).
2. Clearly distinguish confirmed facts, developing situations, official statements, and analytical commentary.
3. If medical or health-related, include an explicit reminder that research updates are not a substitute for clinical advice.
4. If there are competing viewpoints (political, economic, scientific), summarize both sides fairly without taking partisan stances.
5. Provide 3 specific follow-up questions the user might want to explore next.
6. Return output in valid JSON format matching this schema:
{
  "answer": "Clear markdown answer with facts and inline citations",
  "perspectives": {
    "perspectiveA": "Description of viewpoint A if applicable",
    "perspectiveB": "Description of viewpoint B if applicable",
    "neutralSummary": "Neutral synthesis"
  },
  "confidence": "high" | "moderate" | "developing_story" | "low",
  "limitations": "Explicit note on what data is unknown or developing",
  "suggestedFollowUps": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}`;

      // Wrap in timeout (8 seconds) to prevent hanging
      const response = await withTimeout(
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
            thinkingConfig: {
              thinkingLevel: ThinkingLevel.LOW,
            },
          },
        }),
        8000,
        'Gemini API request timed out after 8 seconds.'
      );

      const responseText = response.text || '{}';
      let parsed: any = {};
      try {
        parsed = JSON.parse(responseText);
      } catch {
        parsed = {
          answer: responseText,
          confidence: 'moderate',
          limitations: 'Synthesized from available context.',
          suggestedFollowUps: ['Can you provide more details?', 'What is the background of this event?']
        };
      }

      const citations: Citation[] = topNewsContext.map(n => ({
        title: n.title,
        url: n.url,
        publisher: n.publisher,
        publishedAt: n.publishedAt
      }));

      const finalResponse: AskAssistantResponse = {
        answer: parsed.answer || responseText,
        citations,
        perspectives: parsed.perspectives,
        confidence: parsed.confidence || 'high',
        limitations: parsed.limitations || 'Subject to updates as ongoing reporting develops.',
        suggestedFollowUps: parsed.suggestedFollowUps || [
          'What are the historical precedents for this event?',
          'What do independent analysts predict will happen next?'
        ],
        generatedAt: new Date().toISOString(),
        modelUsed: 'gemini-3.8-flash',
      };

      // Cache valid response for 10 minutes
      memoryCache.set(cacheKey, finalResponse, 600);
      return finalResponse;
    } catch (err: any) {
      return {
        answer: `AI Research Assistant temporarily unavailable: ${err?.message || 'Request timeout'}. Displaying verified wire dispatches below.`,
        citations: topNewsContext.map(n => ({ title: n.title, url: n.url, publisher: n.publisher })),
        confidence: 'low',
        limitations: 'AI service timed out or reached provider rate limit. Direct provider records displayed.',
        suggestedFollowUps: ['Try searching with specific keywords', 'Check latest world news category'],
        generatedAt: new Date().toISOString(),
        modelUsed: 'gemini-3.8-flash (timeout/error fallback)',
      };
    }
  }

  // Low-level text translation with Gemini primary + Open Engine fallback and 24h caching
  async translateText(text: string, targetLanguage: string): Promise<string> {
    if (!text || !targetLanguage || targetLanguage === 'en') {
      return text;
    }

    const cleanText = text.trim();
    if (!cleanText) return '';

    const cacheKey = `tr_txt_${targetLanguage}_${crypto.createHash('sha256').update(cleanText).digest('hex')}`;
    const cached = memoryCache.get<string>(cacheKey);
    if (cached) return cached;

    // Tier 1: Try Gemini if API key is present and daily quota allows
    const ai = this.getClient();
    if (ai) {
      const quota = checkAndIncrementAiQuota();
      if (quota.allowed) {
        try {
          const prompt = `Translate this news text from English into ${targetLanguage.toUpperCase()}.
Preserve people names, brand names, numbers, dates, and journalistic factual neutrality.
Do NOT add explanations or preamble. Return ONLY the translated string.

Text to translate:
"${cleanText}"`;

          const res = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                temperature: 0.1,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.LOW,
                },
              },
            }),
            5000,
            'Gemini translation timeout'
          );

          const result = (res.text || '').trim();
          if (result && result.length > 0 && result !== cleanText) {
            memoryCache.set(cacheKey, result, 86400); // 24 hours
            return result;
          }
        } catch {
          // Fall through to Tier 2 open engine
        }
      }
    }

    // Tier 2: Free open translation engine (€0 budget, no key needed)
    try {
      // Chunk text if over 450 characters for safe URL transmission
      if (cleanText.length > 450) {
        const sentences = cleanText.match(/[^.!?]+[.!?]+/g) || [cleanText];
        const translatedSentences = await Promise.all(
          sentences.map(async (s) => {
            const trimmed = s.trim();
            if (!trimmed) return '';
            return this.translateText(trimmed, targetLanguage);
          })
        );
        const combined = translatedSentences.filter(Boolean).join(' ');
        if (combined) {
          memoryCache.set(cacheKey, combined, 86400);
          return combined;
        }
      } else {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 4500);
        const endpoint = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|${targetLanguage}`;
        const res = await fetch(endpoint, { signal: controller.signal });
        clearTimeout(timeout);

        if (res.ok) {
          const data = await res.json();
          const tr = data?.responseData?.translatedText;
          if (tr && typeof tr === 'string' && tr.trim().length > 0) {
            const cleaned = tr.trim();
            memoryCache.set(cacheKey, cleaned, 86400);
            return cleaned;
          }
        }
      }
    } catch {
      // Fail safely to original text
    }

    return cleanText;
  }

  // Fast translation service for headline and summary
  async translateNewsItem(
    title: string,
    summary: string,
    targetLanguage: string
  ): Promise<{ title: string; summary: string; translated: boolean; originalLanguage: string }> {
    if (!targetLanguage || targetLanguage === 'en') {
      return { title, summary, translated: false, originalLanguage: 'en' };
    }

    const cacheKey = `tr_${targetLanguage}_${crypto.createHash('sha256').update(`${title}:::${summary}`).digest('hex')}`;
    const cached = memoryCache.get<{ title: string; summary: string }>(cacheKey);
    if (cached) {
      return { ...cached, translated: true, originalLanguage: 'en' };
    }

    // Attempt Gemini JSON translation first
    const ai = this.getClient();
    if (ai) {
      const quota = checkAndIncrementAiQuota();
      if (quota.allowed) {
        try {
          const prompt = `Translate this news headline and summary from English into ${targetLanguage.toUpperCase()}.
Preserve publisher names, dates, numbers, and factual tone. Do NOT add commentary.

Headline: "${title}"
Summary: "${summary}"

Return JSON:
{
  "title": "Translated headline",
  "summary": "Translated summary"
}`;

          const res = await withTimeout(
            ai.models.generateContent({
              model: 'gemini-3.8-flash',
              contents: prompt,
              config: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                thinkingConfig: {
                  thinkingLevel: ThinkingLevel.LOW,
                },
              },
            }),
            5000,
            'Translation request timed out'
          );

          const parsed = JSON.parse(res.text || '{}');
          if (parsed.title && parsed.summary) {
            const result = { title: parsed.title, summary: parsed.summary };
            memoryCache.set(cacheKey, result, 86400); // 24 hours
            return { ...result, translated: true, originalLanguage: 'en' };
          }
        } catch {
          // Fall through to open translation engine
        }
      }
    }

    // Fallback: Translate individually with open translation engine
    try {
      const [trTitle, trSummary] = await Promise.all([
        this.translateText(title, targetLanguage),
        this.translateText(summary, targetLanguage),
      ]);

      const isTranslated = trTitle !== title || trSummary !== summary;
      if (isTranslated) {
        const result = { title: trTitle, summary: trSummary };
        memoryCache.set(cacheKey, result, 86400);
        return { ...result, translated: true, originalLanguage: 'en' };
      }
    } catch {
      // Graceful fallback to original content
    }

    return { title, summary, translated: false, originalLanguage: 'en' };
  }

  // Translate full article including content paragraphs
  async translateArticle(
    title: string,
    summary: string,
    content: string | undefined,
    targetLanguage: string
  ): Promise<{ title: string; summary: string; content?: string; translated: boolean; originalLanguage: string }> {
    if (!targetLanguage || targetLanguage === 'en') {
      return { title, summary, content, translated: false, originalLanguage: 'en' };
    }

    const cacheKey = `tr_full_${targetLanguage}_${crypto.createHash('sha256').update(`${title}:::${summary}:::${content || ''}`).digest('hex')}`;
    const cached = memoryCache.get<{ title: string; summary: string; content?: string }>(cacheKey);
    if (cached) {
      return { ...cached, translated: true, originalLanguage: 'en' };
    }

    const [trItem, trContent] = await Promise.all([
      this.translateNewsItem(title, summary, targetLanguage),
      content ? this.translateText(content, targetLanguage) : Promise.resolve(undefined),
    ]);

    const result = {
      title: trItem.title,
      summary: trItem.summary,
      content: trContent,
    };

    const isTranslated = trItem.translated || (content !== undefined && trContent !== content);
    if (isTranslated) {
      memoryCache.set(cacheKey, result, 86400);
    }

    return { ...result, translated: isTranslated, originalLanguage: 'en' };
  }
}

export const aiService = new AiService();
