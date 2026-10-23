import { GoogleGenAI } from '@google/genai';
import { newsService } from './newsService.ts';
import { sportsService } from './sportsService.ts';
import { AskAssistantRequest, AskAssistantResponse, Citation } from './types.ts';

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

  async askAssistant(req: AskAssistantRequest): Promise<AskAssistantResponse> {
    const ai = this.getClient();
    const query = req.query.trim();

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
      // Graceful fallback when key is not configured in local environment
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
            `\n\n*(Note: To unlock live Gemini 3.8 deep research synthesis with full dialectical analysis, please ensure your GEMINI_API_KEY is configured in Google AI Studio Settings → Secrets).*`
          : `No matching records found in our connected provider index for "${query}". Please configure GEMINI_API_KEY in AI Studio Settings → Secrets to enable real-time web-grounded research synthesis.`,
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

    try {
      const prompt = `You are the lead research intelligence analyst for FactInfoLive, a world-class global news, sports, and science verification platform.
Analyze the user's question with utmost factual rigor, neutrality, and clear source attribution.

User Question: "${query}"
Language: ${req.language || 'en'}

Connected Live Provider Context:
${newsContextStr || 'No direct local articles matched. Use Google Search grounding to retrieve current factual verified information.'}
${sportsContextStr}

Instructions:
1. Provide a comprehensive, clear, and objective answer in English (or translated to the requested language if requested).
2. Clearly distinguish confirmed facts, developing situations, official statements, and analytical commentary.
3. If medical or health-related, include an explicit reminder that research updates are not a substitute for clinical advice.
4. If there are competing viewpoints (political, economic, scientific), summarize both sides fairly without taking partisan stances.
5. Provide 3 specific follow-up questions the user might want to explore next.
6. Return output in valid JSON format matching this schema:
{
  "answer": "Clear markdown answer with facts and inline citations like [1] or [Source: Publisher]",
  "perspectives": {
    "perspectiveA": "Description of viewpoint A if applicable",
    "perspectiveB": "Description of viewpoint B if applicable",
    "neutralSummary": "Neutral synthesis"
  },
  "confidence": "high" | "moderate" | "developing_story" | "low",
  "limitations": "Explicit note on what data is unknown or developing",
  "suggestedFollowUps": ["Follow-up question 1", "Follow-up question 2", "Follow-up question 3"]
}`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      });

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

      // Collect citations from retrieved news items
      const citations: Citation[] = topNewsContext.map(n => ({
        title: n.title,
        url: n.url,
        publisher: n.publisher,
        publishedAt: n.publishedAt
      }));

      return {
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
    } catch (err: any) {
      return {
        answer: `An error occurred while connecting to the AI synthesis service: ${err?.message || 'Network error'}. Showing available verified index stories below.`,
        citations: topNewsContext.map(n => ({ title: n.title, url: n.url, publisher: n.publisher })),
        confidence: 'low',
        limitations: 'AI service temporarily unavailable. Direct provider records displayed.',
        suggestedFollowUps: ['Try searching with specific keywords', 'Check latest world news category'],
        generatedAt: new Date().toISOString(),
        modelUsed: 'gemini-3.8-flash (error state)',
      };
    }
  }
}

export const aiService = new AiService();
