import { GoogleGenAI } from '@google/genai';
import { newsService } from './newsService.ts';
import { editorialStore, EDITORIAL_AUTHORS } from './editorialStore.ts';
import {
  NewsItem,
  StructuredSummary,
  EditorialArticle,
  EditorialPostType,
  ArticleSeoMetadata
} from './types.ts';

export class EditorialAiService {
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

  // 1. Generate 10-point structured summary for any supported news story
  async generateStorySummary(story: NewsItem): Promise<StructuredSummary> {
    const ai = this.getClient();

    if (!ai) {
      return {
        headline: story.title,
        quickSummary30s: story.summary,
        keyTakeaways: [
          `Reported by ${story.publisher} under ${story.category.toUpperCase()} wire syndication.`,
          `Factual dispatch timestamp: ${new Date(story.publishedAt).toLocaleDateString()}.`,
          `Classification: ${story.factCheckStatus?.toUpperCase() || 'VERIFIED SOURCED'}.`,
          `Direct original reporting link preserved: ${story.url}`,
          story.summary.slice(0, 120) + '...',
        ],
        whatHappened: story.summary,
        whyItMatters: `This event directly impacts international developments in ${story.category} and requires independent monitoring.`,
        confirmedVsUncertain: {
          confirmed: [
            `Verified publication by ${story.publisher}.`,
            `Dispatch category: ${story.category}.`,
          ],
          uncertain: [
            story.isDeveloping
              ? 'Specific downstream outcomes remain developing as secondary corroboration arrives.'
              : 'Full longitudinal impact subject to subsequent peer/regulatory reports.',
          ],
        },
        context: {
          dates: [new Date(story.publishedAt).toLocaleDateString()],
          locations: [story.publisher],
          background: `Retrieved via official ${story.publisher} wire desk.`,
        },
        originalSource: {
          publisher: story.publisher,
          url: story.url,
          publishedAt: story.publishedAt,
          updatedAt: story.retrievedAt,
        },
        relatedCoverage: [
          {
            publisher: story.publisher,
            url: story.url,
            title: story.title,
          },
        ],
        timestamps: {
          publishedAt: story.publishedAt,
          updatedAt: story.retrievedAt,
        },
      };
    }

    try {
      const prompt = `You are a senior investigative editor for FactInfoLive.
Analyze this retrieved news dispatch and generate an authentic, structured 10-point intelligence summary.
DO NOT fabricate quotes, figures, or unverified claims.

Story Title: "${story.title}"
Publisher: "${story.publisher}"
Published At: "${story.publishedAt}"
URL: "${story.url}"
Summary / Content: "${story.summary} ${story.content || ''}"

Return a valid JSON object matching this schema:
{
  "quickSummary30s": "Concise 30-second factual summary (2-3 sentences)",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
  "whatHappened": "Detailed factual account of the actual event",
  "whyItMatters": "Analytical importance and broader implications",
  "confirmed": ["List of explicitly confirmed facts"],
  "uncertain": ["What remains unconfirmed, unknown, or debated"],
  "dates": ["Key dates mentioned"],
  "locations": ["Key locations mentioned"],
  "background": "Historical context leading up to this event"
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      const parsed = JSON.parse(res.text || '{}');

      return {
        headline: story.title,
        quickSummary30s: parsed.quickSummary30s || story.summary,
        keyTakeaways: parsed.keyTakeaways || [story.summary],
        whatHappened: parsed.whatHappened || story.summary,
        whyItMatters: parsed.whyItMatters || 'Crucial for understanding contemporary global shifts.',
        confirmedVsUncertain: {
          confirmed: parsed.confirmed || [`Confirmed by ${story.publisher}`],
          uncertain: parsed.uncertain || ['Follow-up investigations underway'],
        },
        context: {
          dates: parsed.dates || [new Date(story.publishedAt).toLocaleDateString()],
          locations: parsed.locations || ['Global'],
          background: parsed.background || `Reported by ${story.publisher}`,
        },
        originalSource: {
          publisher: story.publisher,
          url: story.url,
          publishedAt: story.publishedAt,
          updatedAt: story.retrievedAt,
        },
        relatedCoverage: [
          { publisher: story.publisher, url: story.url, title: story.title },
        ],
        timestamps: {
          publishedAt: story.publishedAt,
          updatedAt: new Date().toISOString(),
        },
      };
    } catch {
      return {
        headline: story.title,
        quickSummary30s: story.summary,
        keyTakeaways: [story.summary],
        whatHappened: story.summary,
        whyItMatters: 'Relevant to current world affairs.',
        confirmedVsUncertain: {
          confirmed: [`Reported by ${story.publisher}`],
          uncertain: ['Developing details'],
        },
        context: {
          dates: [story.publishedAt],
          locations: [story.publisher],
          background: 'Sourced from live wire dispatches.',
        },
        originalSource: {
          publisher: story.publisher,
          url: story.url,
          publishedAt: story.publishedAt,
        },
        relatedCoverage: [],
        timestamps: {
          publishedAt: story.publishedAt,
          updatedAt: new Date().toISOString(),
        },
      };
    }
  }

  // 2. Full 10-step AI Content Creation Workflow
  async runAiWorkflow(params: {
    topic: string;
    type: EditorialPostType;
    category?: string;
  }): Promise<{ article: EditorialArticle; workflowMetadata: any }> {
    const ai = this.getClient();
    const topic = params.topic.trim();

    // Step 1: Retrieve relevant source material from live wire index
    const relevantNews = await newsService.searchNews(topic, params.category);
    const topContext = relevantNews.slice(0, 4);

    const contextStr = topContext
      .map(
        (n, i) =>
          `[Source ${i + 1} - ${n.publisher} (${n.publishedAt})]: ${n.title}\n${n.summary}\nURL: ${n.url}`
      )
      .join('\n\n');

    let title = `${topic}: Strategic Analysis & Intelligence Brief`;
    let subtitle = 'AI-Assisted Editorial Draft · Human Verification Required';
    let content = `### Overview\nThis explanatory brief addresses ${topic}.\n\n### Key Findings\nBased on verified source reporting, key variables continue to develop across relevant institutions.`;
    let takeaways = [`Initial research synthesis compiled on ${new Date().toLocaleDateString()}`];
    let claimsToVerify: Array<{ claim: string; sourceUrl?: string; verified: boolean; notes?: string }> = [];
    let outline = ['1. Executive Summary', '2. Background and Context', '3. Key Evidence and Verification', '4. Future Projections'];
    let suggestedMeta: ArticleSeoMetadata = {
      seoTitle: `${topic} Analysis | FactInfoLive`,
      metaDescription: `In-depth research briefing on ${topic} with verified source citations.`,
      focusKeyword: topic.split(' ')[0],
      schemaType: 'NewsArticle',
      slug: topic.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50),
    };

    if (ai) {
      try {
        const prompt = `You are an elite editorial research director for FactInfoLive.
You are assisting in drafting an original ${params.type.toUpperCase()} article on the topic: "${topic}".

Verified Source Material Retrieved from Connected Wire:
${contextStr || 'No direct local wire item found. Use strictly verified empirical knowledge and identify any uncertainties.'}

Execute the following 10 editorial steps:
1. Propose a compelling, high-credibility editorial headline and subtitle.
2. Produce a comprehensive article outline.
3. Draft the complete original explanatory article (in rich Markdown with ### headings, analytical depth, and neutral tone).
4. Produce a concise 30-second summary and exactly 5 key takeaways.
5. Extract 3-5 specific factual claims made in the article that require editorial fact-checking, and attach the supporting source URL if available from the retrieved context.
6. Identify missing evidence, conflicting information, or potentially outdated assumptions.
7. Generate optimized SEO metadata (SEO Title 30-60 chars, Meta Description 120-160 chars, Focus Keyword).
8. Suggest category and 4-6 specific tags.

Return a valid JSON object matching this schema:
{
  "title": "Editorial headline",
  "subtitle": "Clear explanatory subtitle",
  "outline": ["Section 1", "Section 2", "Section 3", "Section 4"],
  "content": "Full article text in markdown with ### headings",
  "quickSummary30s": "2-3 sentence summary",
  "keyTakeaways": ["Takeaway 1", "Takeaway 2", "Takeaway 3", "Takeaway 4", "Takeaway 5"],
  "claimsToVerify": [
    {"claim": "Specific claim", "sourceUrl": "URL if available", "verified": true, "notes": "Verification methodology"}
  ],
  "missingOrConflictingEvidence": "Explicit note on missing data or source disagreements",
  "suggestedCategory": "category",
  "suggestedTags": ["tag1", "tag2", "tag3"],
  "seoTitle": "SEO Title (30-60 characters)",
  "metaDescription": "Meta Description (120-160 characters)",
  "focusKeyword": "keyword"
}`;

        const res = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        const data = JSON.parse(res.text || '{}');
        if (data.title) title = data.title;
        if (data.subtitle) subtitle = data.subtitle;
        if (data.content) content = data.content;
        if (data.keyTakeaways) takeaways = data.keyTakeaways;
        if (data.claimsToVerify) claimsToVerify = data.claimsToVerify;
        if (data.outline) outline = data.outline;
        if (data.seoTitle) suggestedMeta.seoTitle = data.seoTitle;
        if (data.metaDescription) suggestedMeta.metaDescription = data.metaDescription;
        if (data.focusKeyword) suggestedMeta.focusKeyword = data.focusKeyword;
      } catch (err) {
        console.error('AI editorial generation failed, using structured template:', err);
      }
    }

    // Save as AI DRAFT in 7-stage workflow for human review (never published automatically)
    const draftArticle = editorialStore.createArticle(
      {
        type: params.type,
        title,
        subtitle,
        content,
        author: EDITORIAL_AUTHORS.editorial_board,
        category: params.category || 'world',
        tags: [topic.split(' ')[0], 'Intelligence', 'Verification'],
        status: 'ai_draft', // 7-stage workflow: AI Draft requires editorial approval
        isAiAssisted: true,
        claimsToVerify,
        seoMetadata: suggestedMeta,
        structuredSummary: {
          headline: title,
          quickSummary30s: `Draft intelligence brief on ${topic}.`,
          keyTakeaways: takeaways,
          whatHappened: `Editorial assistant prepared a structured brief on ${topic}.`,
          whyItMatters: 'Essential for ongoing editorial coverage.',
          confirmedVsUncertain: {
            confirmed: topContext.map((c) => `${c.publisher}: ${c.title}`),
            uncertain: ['Pending human editorial review and claim corroboration.'],
          },
          context: {
            dates: [new Date().toLocaleDateString()],
            locations: ['Editorial Desk'],
            background: 'Generated via FactInfoLive Editorial Workflow Module.',
          },
          originalSource: {
            publisher: topContext[0]?.publisher || 'FactInfoLive Wire Retrieval',
            url: topContext[0]?.url || 'https://factinfolive.org',
            publishedAt: new Date().toISOString(),
          },
          relatedCoverage: topContext.map((c) => ({
            publisher: c.publisher,
            url: c.url,
            title: c.title,
          })),
          timestamps: {
            publishedAt: '',
            updatedAt: new Date().toISOString(),
          },
        },
      },
      'AI Workflow Assistant'
    );

    return {
      article: draftArticle,
      workflowMetadata: {
        sourcesRetrievedCount: topContext.length,
        sourcesRetrieved: topContext.map((c) => ({ publisher: c.publisher, title: c.title, url: c.url })),
        outline,
        claimsCount: claimsToVerify.length,
        suggestedCategory: params.category || 'world',
        draftSavedId: draftArticle.id,
      },
    };
  }

  // 3. Multilingual Translation Assistant (English, Italian, French, Spanish, German, Urdu, Arabic)
  async translateContent(
    text: string,
    targetLanguage: string
  ): Promise<{ translatedText: string; language: string }> {
    const ai = this.getClient();
    if (!ai) {
      return {
        translatedText: `[Translation to ${targetLanguage} unavailable: Gemini API key required]\n\n${text}`,
        language: targetLanguage,
      };
    }

    try {
      const prompt = `You are a professional multilingual translator for a prestigious international intelligence broadsheet.
Translate the following editorial text accurately and elegantly into ${targetLanguage.toUpperCase()}.
Preserve markdown headings, formatting, and factual terminology. Ensure RTL formatting conventions if Arabic or Urdu.

Text to translate:
"""
${text}
"""`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          temperature: 0.1,
        },
      });

      return {
        translatedText: res.text || text,
        language: targetLanguage,
      };
    } catch {
      return {
        translatedText: text,
        language: targetLanguage,
      };
    }
  }

  // 4. Claims & Citation Audit
  async auditArticleClaims(content: string): Promise<{
    claims: Array<{ claim: string; requiresVerification: boolean; reason: string }>;
    conflictsDetected: string[];
    missingEvidence: string[];
  }> {
    const ai = this.getClient();
    if (!ai) {
      return {
        claims: [
          {
            claim: 'General factual assertions in draft',
            requiresVerification: true,
            reason: 'Manual editorial verification required',
          },
        ],
        conflictsDetected: [],
        missingEvidence: ['Verify primary source documents before final publication approval.'],
      };
    }

    try {
      const prompt = `You are an institutional fact-checking editor.
Audit the following draft article content for factual claims, unsupported generalizations, missing citations, and potential contradictions:

Content:
"""
${content}
"""

Return a valid JSON object matching:
{
  "claims": [
    {"claim": "statement from text", "requiresVerification": true, "reason": "why this needs proof"}
  ],
  "conflictsDetected": ["Any internal contradictions or conflicting interpretations"],
  "missingEvidence": ["Missing statistical baselines or unsourced figures"]
}`;

      const res = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.1,
        },
      });

      return JSON.parse(res.text || '{}');
    } catch {
      return {
        claims: [],
        conflictsDetected: [],
        missingEvidence: ['API audit temporarily offline'],
      };
    }
  }

  // 5. Suggest Article Ideas based on Real Developments
  async suggestIdeas(): Promise<Array<{ title: string; category: string; angle: string; basisStoryUrl?: string }>> {
    const latestNews = await newsService.getNewsByCategory('all');
    const recentSample = latestNews.slice(0, 6);

    const defaultIdeas = [
      {
        title: 'The Next Generation of Solid-State Electrolytes: Beyond the Flammability Horizon',
        category: 'technology',
        angle: 'Examine pilot commercialization lines in Europe and Asia overcoming sulfide moisture sensitivity.',
      },
      {
        title: 'Ocean Thermal Inertia: Why Surface Cooling Does Not Equal Climate Stabilization',
        category: 'science',
        angle: 'Deep dive into Argo 6,000m telemetry and long-term thermosteric sea level expansion.',
      },
      {
        title: 'The Geopolitics of Sovereign AI Clusters: Energy Grids Meet Silicon Sovereignty',
        category: 'world',
        angle: 'Investigate how national computing infrastructure is driving dedicated nuclear and renewable power contracts.',
      },
      {
        title: 'Tactical Evolution of the Low Block: How Hybrid Transitions Neutralize Counter-Pressing',
        category: 'sports',
        angle: 'Data-driven analysis of modern tactical rest-defenses in Champions League and international tournaments.',
      },
    ];

    if (recentSample.length > 0) {
      return recentSample.slice(0, 4).map((n) => ({
        title: `Deep Explainer: The Global Impact of ${n.title.slice(0, 65)}...`,
        category: n.category,
        angle: `Grounded in recent reporting by ${n.publisher}; synthesize multi-perspective implications.`,
        basisStoryUrl: n.url,
      }));
    }

    return defaultIdeas;
  }
}

export const editorialAiService = new EditorialAiService();
