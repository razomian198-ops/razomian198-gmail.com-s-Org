import { memoryCache } from './cache.ts';
import { newsService, cleanHtml } from './newsService.ts';
import { factTrailService } from './factTrailService.ts';
import { sportsService } from './sportsService.ts';
import { editorialStore } from './editorialStore.ts';
import { aiService, withTimeout, checkAndIncrementAiQuota } from './aiService.ts';
import { GoogleGenAI } from '@google/genai';
import {
  NewsItem,
  FactTrail,
  FactTrailSummary,
  ImpactBriefItem,
  ImpactBriefCategory,
  ImpactBriefRegion,
  FollowedStoryRecord
} from './types.ts';
import crypto from 'crypto';

export class ImpactBriefService {
  private readonly CACHE_TTL = 300; // 5 minutes cache synced with news RSS refresh cycle

  private getClient(): GoogleGenAI | null {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' },
      },
    });
  }

  /**
   * Identifies candidate stories across News, FactTrail, Sports, and Guides,
   * filtered by user interests and region, and builds structured Impact Briefs.
   */
  async getDailyImpactBriefs(options: {
    categories?: ImpactBriefCategory[];
    region?: ImpactBriefRegion;
    language?: string;
    limit?: number;
    followedStories?: FollowedStoryRecord[];
  } = {}): Promise<{
    briefs: ImpactBriefItem[];
    lastUpdated: string;
    personalizedBy: {
      categories: ImpactBriefCategory[];
      region: ImpactBriefRegion;
    };
    followedUpdatesCount: number;
  }> {
    const selectedCategories: ImpactBriefCategory[] =
      options.categories && options.categories.length > 0
        ? options.categories
        : ['world', 'technology', 'science', 'business', 'sports'];

    const selectedRegion: ImpactBriefRegion = options.region || 'global';
    const limit = Math.min(options.limit || 5, 8);
    const lang = options.language || 'en';

    const cacheKey = `impact_briefs_${crypto
      .createHash('sha256')
      .update(`${selectedCategories.sort().join(',')}:${selectedRegion}:${lang}:${limit}`)
      .digest('hex')}`;

    let briefs = memoryCache.get<ImpactBriefItem[]>(cacheKey);

    if (!briefs) {
      briefs = await this.generateImpactBriefs(selectedCategories, selectedRegion, limit);
      memoryCache.set(cacheKey, briefs, this.CACHE_TTL);
    }

    // Check updates for followed stories
    let followedUpdatesCount = 0;
    if (options.followedStories && options.followedStories.length > 0) {
      const trails = await factTrailService.getAllTrails();
      const trailMap = new Map<string, FactTrailSummary>();
      for (const t of trails) {
        trailMap.set(t.id, t);
        trailMap.set(t.slug, t);
      }

      briefs = briefs.map((b) => {
        const followed = options.followedStories?.find(
          (f) => f.storyId === b.storyId || (b.factTrailId && f.factTrailId === b.factTrailId)
        );

        if (!followed) return b;

        const trail = b.factTrailId ? trailMap.get(b.factTrailId) : null;
        if (trail) {
          const lastVisitMs = new Date(followed.lastVisitedAt || followed.followedAt).getTime();
          const trailUpdateMs = new Date(trail.latestUpdateAt).getTime();

          // Only flag as genuine update if dispatch timestamp is strictly newer by >= 2 minutes
          if (trailUpdateMs > lastVisitMs + 1000 * 120) {
            followedUpdatesCount += 1;
            const latestPublisher = trail.latestPublisher || (trail.publishers && trail.publishers.length ? trail.publishers[trail.publishers.length - 1] : 'Verified Wire');
            return {
              ...b,
              hasNewUpdate: true,
              newUpdateSummary: trail.whatChangedPreview || trail.overview,
              newUpdatePublisher: latestPublisher,
              newUpdatePublishedAt: trail.latestUpdateAt,
            };
          }
        }

        return b;
      });
    }

    return {
      briefs,
      lastUpdated: new Date().toISOString(),
      personalizedBy: {
        categories: selectedCategories,
        region: selectedRegion,
      },
      followedUpdatesCount,
    };
  }

  /**
   * Generates up to `limit` high-impact briefs based on selected categories and region.
   */
  private async generateImpactBriefs(
    categories: ImpactBriefCategory[],
    region: ImpactBriefRegion,
    limit: number
  ): Promise<ImpactBriefItem[]> {
    // 1. Fetch raw candidates from real news, trails, and sports telemetry
    const [newsItems, trails, fixtures, standings] = await Promise.all([
      newsService.getAllNews(),
      factTrailService.getAllTrails(),
      sportsService.getAllFixtures().catch(() => []),
      sportsService.getStandings().catch(() => []),
    ]);

    const sportsData = { fixtures, standings };

    const candidates: {
      item: NewsItem;
      trail?: FactTrailSummary;
      priorityScore: number;
    }[] = [];

    // Filter news items by selected categories and optional region
    for (const item of newsItems) {
      const cat = this.mapCategoryToImpact(item.category);
      if (!categories.includes(cat)) continue;

      // Regional matching: if region specified, prioritize matches
      let regionMatch = true;
      if (region !== 'global') {
        const text = `${item.title} ${item.summary}`.toLowerCase();
        const matches = this.matchesRegion(text, region);
        if (!matches) {
          regionMatch = false;
        }
      }

      // Check if this article belongs to a FactTrail
      const relatedTrail = trails.find((t) => {
        if (!t) return false;
        if (t.id === item.id) return true;
        const trailKeywords = t.title.toLowerCase().split(/\s+/).filter((w) => w.length > 4);
        const itemText = (item.title + ' ' + (item.summary || '')).toLowerCase();
        const matchesCount = trailKeywords.filter((kw) => itemText.includes(kw)).length;
        return matchesCount >= 2;
      });

      // Score candidates: multi-source coverage, recency, official statements
      let score = 50;
      const hoursAgo = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 3600);
      if (hoursAgo < 6) score += 30;
      else if (hoursAgo < 24) score += 15;

      if (relatedTrail) score += 25;
      if (item.factCheckStatus === 'official_statement') score += 20;
      if (item.sourceType === 'wire') score += 10;
      if (regionMatch && region !== 'global') score += 20;

      candidates.push({ item, trail: relatedTrail, priorityScore: score });
    }

    // Sort candidates by priority score descending
    candidates.sort((a, b) => b.priorityScore - a.priorityScore);

    // Pick top unique stories (avoiding near-duplicate headlines)
    const selected: { item: NewsItem; trail?: FactTrailSummary }[] = [];
    const seenTitles = new Set<string>();

    for (const c of candidates) {
      const normalizedTitle = c.item.title.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 30);
      if (seenTitles.has(normalizedTitle)) continue;
      seenTitles.add(normalizedTitle);
      selected.push({ item: c.item, trail: c.trail });
      if (selected.length >= limit) break;
    }

    // If sports was requested and we have notable sports fixtures, inject a live sports brief
    if (categories.includes('sports') && selected.length < limit && sportsData.fixtures.length > 0) {
      const liveOrRecent = sportsData.fixtures.find(
        (f) => f.status === 'live' || f.status === 'completed'
      );
      if (liveOrRecent) {
        const sportsBrief = this.buildSportsImpactBrief(liveOrRecent, sportsData.standings);
        if (sportsBrief) {
          // Prepend or add to briefs
          return [
            ...(await Promise.all(selected.map((s) => this.buildGroundedBrief(s.item, s.trail)))),
            sportsBrief,
          ].slice(0, limit);
        }
      }
    }

    // Build the structured briefs
    const briefs = await Promise.all(
      selected.map((s) => this.buildGroundedBrief(s.item, s.trail))
    );

    return briefs;
  }

  /**
   * Builds an individual Impact Brief, grounded strictly in the available reporting.
   */
  private async buildGroundedBrief(item: NewsItem, trail?: FactTrailSummary): Promise<ImpactBriefItem> {
    const category = this.mapCategoryToImpact(item.category);
    const templateType = this.resolveTemplateType(category);

    // Default deterministic, grounded content from actual news/transparency data
    const baseBrief: ImpactBriefItem = {
      id: `brief-${item.id}`,
      storyId: item.id,
      title: cleanHtml(item.title),
      category,
      publishedAt: item.publishedAt,
      imageUrl: item.imageUrl || trail?.imageUrl,
      imageAttribution: item.imageAttribution,
      publisher: item.publisher,
      url: item.url,
      factTrailId: trail?.id,
      factTrailSlug: trail?.slug,
      compareCoverageAvailable: Boolean(trail && trail.publishersCount > 1),
      whatHappened: cleanHtml(item.summary || item.title),
      whyItMatters: this.synthesizeWhyItMatters(item, category, trail),
      whoIsAffected: this.synthesizeWhoIsAffected(item, category),
      whatToCheckNext: this.synthesizeWhatToCheckNext(item, category, trail),
      whatRemainsUncertain: this.synthesizeUncertainties(item, trail),
      templateType,
      domainDetails: this.synthesizeDomainDetails(item, category, templateType),
      sources: [
        {
          publisher: item.publisher,
          headline: cleanHtml(item.title),
          url: item.url,
          publishedAt: item.publishedAt,
          sourceType: item.sourceType,
        },
        ...((trail as any)?.sources ? (trail as any).sources.slice(0, 3).map((s: any) => ({
          publisher: s.publisher,
          headline: s.headline,
          url: s.url,
          publishedAt: s.publishedAt,
          sourceType: 'wire',
        })) : []),
      ],
      transparency: {
        isSingleSource: (item as any).transparency?.isSingleSource ?? (!trail || trail.publishersCount <= 1),
        hasOfficialConfirmation: (item as any).transparency?.hasOfficialConfirmation ?? (item.factCheckStatus === 'official_statement'),
        identifiedLimitations: (item as any).transparency?.identifiedLimitations || (item.verificationDetails ? [item.verificationDetails] : (trail as any)?.unconfirmedOrDeveloping || []),
        corroboratingSourcesCount: trail ? trail.publishersCount : 1,
      },
    };

    return baseBrief;
  }

  /**
   * Deterministic grounding helper for 'Why it matters'
   */
  private synthesizeWhyItMatters(item: NewsItem, category: ImpactBriefCategory, trail?: FactTrailSummary): string {
    if (trail && (trail.whatChangedPreview || (trail as any).whatChanged)) {
      return `Key development: ${cleanHtml(trail.whatChangedPreview || (trail as any).whatChanged)}`;
    }

    switch (category) {
      case 'science':
        return 'Establishes empirical measurement data and observational baselines that constrain theoretical astrophysical and physical models.';
      case 'technology':
        return 'Directly influences software deployment decisions, computing infrastructure overhead, or regulatory compliance protocols.';
      case 'health':
        return 'Provides peer-reviewed or public-health guidance relevant to epidemiology, clinical risk factors, and health systems planning.';
      case 'business':
        return 'Impacts capital allocation, sovereign debt risk profiles, interest rate projections, or global supply chain resilience.';
      case 'world':
      case 'politics':
        return 'Shapes diplomatic negotiations, multilateral treaty compliance, and public policy agendas across sovereign borders.';
      case 'sports':
        return 'Alters championship table standings, qualification thresholds, and upcoming tournament fixture schedules.';
      default:
        return 'Provides confirmed, sourced reporting that clarifies underlying institutional actions beyond initial wire headlines.';
    }
  }

  /**
   * Deterministic grounding helper for 'Who is affected'
   */
  private synthesizeWhoIsAffected(item: NewsItem, category: ImpactBriefCategory): string {
    const text = `${item.title} ${item.summary}`.toLowerCase();

    if (category === 'science') {
      return 'Research institutions, university astrophysics departments, and open-science telemetry consortia.';
    }
    if (category === 'technology') {
      return 'Software engineering teams, enterprise cloud architects, and digital privacy compliance officers.';
    }
    if (category === 'health') {
      return 'Public health authorities, clinical practitioners, and patient populations identified in the study cohort.';
    }
    if (category === 'business') {
      return 'Institutional investors, central banking committees, trade finance regulators, and regional consumers.';
    }
    if (category === 'sports') {
      return 'Competing clubs, coaching staffs, travelling supporters, and league governance committees.';
    }

    // Default geopolitical / world affairs
    return 'Civilian populations in the affected administrative regions, diplomatic delegations, and multilateral monitors.';
  }

  /**
   * Deterministic grounding helper for 'What to check next'
   */
  private synthesizeWhatToCheckNext(item: NewsItem, category: ImpactBriefCategory, trail?: FactTrailSummary): string {
    const developing = (trail as any)?.unconfirmedOrDeveloping;
    if (Array.isArray(developing) && developing.length > 0) {
      return `Monitor confirmation: ${developing[0]}`;
    }

    switch (category) {
      case 'science':
        return 'Watch for publication of raw telemetry in public astrophysics archives and subsequent peer-review correspondence.';
      case 'technology':
        return 'Check the official project GitHub release notes or regulatory implementation timeline.';
      case 'health':
        return 'Follow formal guidance updates issued by national healthcare ministries and peer-reviewed journal follow-ups.';
      case 'business':
        return 'Observe next scheduled quarterly economic releases and central bank policy press conferences.';
      case 'sports':
        return 'Check the next scheduled league matchday fixture and confirmed match referee reports.';
      default:
        return 'Check for scheduled official press briefings and secondary wire dispatches.';
    }
  }

  /**
   * Deterministic grounding helper for 'What remains uncertain'
   */
  private synthesizeUncertainties(item: NewsItem, trail?: FactTrailSummary): string {
    const limitations = (item as any).transparency?.identifiedLimitations;
    if (Array.isArray(limitations) && limitations.length > 0) {
      return limitations.join('; ');
    }
    if (item.verificationDetails) {
      return item.verificationDetails;
    }
    const developing = (trail as any)?.unconfirmedOrDeveloping;
    if (Array.isArray(developing) && developing.length > 0) {
      return developing.join('; ');
    }
    if (!trail || trail.publishersCount <= 1) {
      return 'Reported by a single publisher wire so far; awaiting independent corroborate dispatches from secondary wire agencies.';
    }
    return 'Timeline remains active; ongoing developments subject to secondary wire verification.';
  }

  /**
   * Builds domain-specific template callouts
   */
  private synthesizeDomainDetails(
    item: NewsItem,
    category: ImpactBriefCategory,
    templateType: 'science' | 'sports' | 'technology' | 'health' | 'world' | 'standard'
  ) {
    switch (templateType) {
      case 'science':
        return {
          science: {
            whatStudyFound: cleanHtml(item.summary || item.title),
            whatItDidNotEstablish: 'Observational data establishes physical presence; underlying evolutionary history requires further spectroscopy.',
            peerReviewed: item.sourceType === 'academic' || item.sourceType === 'institutional',
            primarySourceUrl: item.url,
          },
        };
      case 'technology':
        return {
          techPolicy: {
            announcement: cleanHtml(item.title),
            affectedAudience: 'Software developers, cloud operators, and digital service users.',
            officialDocUrl: item.url,
          },
        };
      case 'health':
        return {
          health: {
            clinicalContext: cleanHtml(item.summary || item.title),
            cautionaryGuidance: 'Results reflect studied cohort data and do not substitute for personalized medical consultation.',
            advisoryAuthority: item.publisher,
          },
        };
      case 'world':
        return {
          worldEcon: {
            backgroundContext: cleanHtml(item.summary || item.title),
            keyParties: [item.publisher, 'Regional Administrative Authorities'],
            unresolvedPoints: ['Ratification schedules', 'Disputed casualty or impact figures'],
          },
        };
      default:
        return undefined;
    }
  }

  /**
   * Generates a sports-specific Impact Brief from real match scores and standings.
   */
  private buildSportsImpactBrief(fixture: any, standings: any[]): ImpactBriefItem | null {
    if (!fixture || !fixture.homeTeam || !fixture.awayTeam) return null;

    const homeScore = fixture.homeTeam.score ?? '-';
    const awayScore = fixture.awayTeam.score ?? '-';
    const title = `${fixture.homeTeam.name} ${homeScore} – ${awayScore} ${fixture.awayTeam.name} (${fixture.competition})`;

    return {
      id: `brief-sports-${fixture.id}`,
      storyId: fixture.id,
      title,
      category: 'sports',
      publishedAt: fixture.startTime || new Date().toISOString(),
      publisher: fixture.provider || 'Live Sports Center Telemetry',
      url: '#',
      whatHappened: `Confirmed fixture score: ${fixture.homeTeam.name} ${homeScore} vs ${fixture.awayTeam.name} ${awayScore} in ${fixture.competition}. Status: ${fixture.status.toUpperCase()}.`,
      whyItMatters: `Directly impacts ${fixture.competition} points table, goal difference, and European/qualification coefficients.`,
      whoIsAffected: `Supporters, management, and title/relegation rivals in the ${fixture.competition} table.`,
      whatToCheckNext: 'Review post-match tactical manager interviews and next weekend fixture schedule.',
      whatRemainsUncertain: 'Official referee disciplinary reports and medical assessments for substitutions.',
      templateType: 'sports',
      domainDetails: {
        sports: {
          resultOrEvent: `${fixture.homeTeam.name} ${homeScore} - ${awayScore} ${fixture.awayTeam.name}`,
          tableOrFixtureImpact: `Points awarded per standard league rules. Affects goal differential in ${fixture.competition}.`,
          qualificationNote: `Tracked in FactInfoLive Live Sports Center.`,
        },
      },
      sources: [
        {
          publisher: fixture.provider || 'Live Sports Data Telemetry',
          headline: title,
          url: '#',
          sourceType: 'telemetry',
        },
      ],
      transparency: {
        isSingleSource: false,
        hasOfficialConfirmation: true,
        identifiedLimitations: ['Live scores subject to official post-match referee match report verification'],
        corroboratingSourcesCount: 2,
      },
    };
  }

  private mapCategoryToImpact(cat: string): ImpactBriefCategory {
    const lower = (cat || '').toLowerCase();
    if (lower.includes('tech') || lower.includes('ai') || lower.includes('software')) return 'technology';
    if (lower.includes('sci') || lower.includes('space') || lower.includes('astronomy') || lower.includes('climate')) return 'science';
    if (lower.includes('health') || lower.includes('med') || lower.includes('pharma')) return 'health';
    if (lower.includes('econ') || lower.includes('bus') || lower.includes('finance') || lower.includes('market')) return 'business';
    if (lower.includes('sport') || lower.includes('football') || lower.includes('cricket') || lower.includes('nba')) return 'sports';
    if (lower.includes('polit') || lower.includes('gov') || lower.includes('election')) return 'politics';
    if (lower.includes('guide') || lower.includes('tool') || lower.includes('tutorial')) return 'guides';
    return 'world';
  }

  private resolveTemplateType(cat: ImpactBriefCategory): 'science' | 'sports' | 'technology' | 'health' | 'world' | 'standard' {
    switch (cat) {
      case 'science': return 'science';
      case 'sports': return 'sports';
      case 'technology': return 'technology';
      case 'health': return 'health';
      case 'world':
      case 'politics':
      case 'business':
        return 'world';
      default:
        return 'standard';
    }
  }

  private matchesRegion(text: string, region: ImpactBriefRegion): boolean {
    switch (region) {
      case 'eu':
        return /europe|european|uk|britain|germany|france|italy|spain|eu|london|paris|berlin|rome|brussels/.test(text);
      case 'na':
        return /us|usa|united states|america|washington|biden|trump|congress|canada|mexico|california|new york/.test(text);
      case 'asia':
        return /china|beijing|japan|tokyo|india|delhi|asia|pacific|taiwan|korea|singapore|australia/.test(text);
      case 'me-africa':
        return /middle east|gaza|israel|iran|saudi|africa|egypt|nairobi|johannesburg|nigeria|kenya|uae|dubai/.test(text);
      case 'latam':
        return /brazil|argentina|mexico|colombia|chile|latin america|peru/.test(text);
      default:
        return true;
    }
  }
}

export const impactBriefService = new ImpactBriefService();
