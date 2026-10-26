import crypto from 'crypto';
import { memoryCache } from './cache.ts';
import { newsService } from './newsService.ts';
import {
  NewsItem,
  FactTrail,
  FactTrailUpdate,
  FactTrailSource,
  FactTrailSummary,
} from './types.ts';

// Common generic words and journalistic fillers that should not trigger spurious grouping
const GENERIC_WORDS = new Set([
  'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'arent', 'as', 'at',
  'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'cant', 'cannot', 'could',
  'couldnt', 'did', 'didnt', 'do', 'does', 'doesnt', 'doing', 'dont', 'down', 'during', 'each', 'few', 'for', 'from',
  'further', 'had', 'hadnt', 'has', 'hasnt', 'have', 'havent', 'having', 'he', 'hed', 'hell', 'hes', 'her', 'here',
  'heres', 'hers', 'herself', 'him', 'himself', 'his', 'how', 'hows', 'i', 'id', 'ill', 'im', 'ive', 'if', 'in',
  'into', 'is', 'isnt', 'it', 'its', 'itself', 'lets', 'me', 'more', 'most', 'mustnt', 'my', 'myself', 'no', 'nor',
  'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own',
  'same', 'shant', 'she', 'shed', 'shell', 'shes', 'should', 'shouldnt', 'so', 'some', 'such', 'than', 'that', 'thats',
  'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'theres', 'these', 'they', 'theyd', 'theyll',
  'theyre', 'theyve', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'wasnt', 'we',
  'wed', 'well', 'were', 'weve', 'werent', 'what', 'whats', 'when', 'whens', 'where', 'wheres', 'which', 'while',
  'who', 'whos', 'whom', 'why', 'whys', 'with', 'wont', 'would', 'wouldnt', 'you', 'youd', 'youll', 'youre', 'youve',
  'your', 'yours', 'yourself', 'yourselves', 'live', 'breaking', 'update', 'updates', 'watch', 'video', 'photos',
  'says', 'said', 'amid', 'first', 'new', 'day', 'today', 'week', 'month', 'year', 'time', 'hours', 'latest',
  'report', 'reports', 'reported', 'tell', 'tells', 'told', 'make', 'makes', 'made', 'take', 'takes', 'took',
  'poll', 'polls', 'vote', 'votes', 'voting', 'close', 'closed', 'closes', 'open', 'opens', 'opened', 'result', 'results',
  'race', 'races', 'face', 'faces', 'facing', 'call', 'calls', 'called', 'debate', 'debates', 'plan', 'plans',
  'beat', 'beats', 'win', 'wins', 'won', 'lose', 'loses', 'lost', 'draw', 'draws', 'drew', 'game', 'games', 'match', 'matches',
  'show', 'shows', 'shown', 'back', 'part', 'parts', 'across', 'leave', 'leaves', 'left', 'lead', 'leads', 'bring', 'brings',
  'look', 'looks', 'see', 'seen', 'find', 'finds', 'found', 'hold', 'holds', 'held', 'turn', 'turns', 'hit', 'hits'
]);

interface ExtractedFeatures {
  entities: Set<string>;
  headlineEntities: Set<string>;
  keyTerms: Set<string>;
  numbers: Set<string>;
}

export class FactTrailService {
  private readonly CACHE_KEY = 'fact_trails_all';
  private readonly CACHE_TTL = 300; // 5 minutes cache synchronized with news RSS fetch cycle

  // Extracts proper nouns, numerical figures, and distinctive terms from news text
  private extractFeatures(title: string, summary: string = ''): ExtractedFeatures {
    const rawHeadlineTokens = title.split(/\s+/);
    const rawAllTokens = `${title} ${summary}`.split(/\s+/);

    const headlineEntities = new Set<string>();
    const entities = new Set<string>();
    const keyTerms = new Set<string>();
    const numbers = new Set<string>();

    for (const raw of rawHeadlineTokens) {
      const clean = raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      if (!clean) continue;
      const lower = clean.toLowerCase();

      // Numbers or stats (e.g., 160000, 10, 2026)
      if (/^\d+(\.\d+)?%?$/.test(clean)) {
        numbers.add(clean);
      }

      // Proper nouns in headline
      if (clean.length >= 3 && /^[A-Z][a-z0-9]/.test(clean) && !GENERIC_WORDS.has(lower)) {
        headlineEntities.add(lower);
        entities.add(lower);
      }
      if (clean.length >= 3 && !GENERIC_WORDS.has(lower)) {
        keyTerms.add(lower);
      }
    }

    for (const raw of rawAllTokens) {
      const clean = raw.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9]+$/g, '');
      if (!clean) continue;
      const lower = clean.toLowerCase();

      if (/^\d+(\.\d+)?%?$/.test(clean)) {
        numbers.add(clean);
      }

      if (clean.length >= 3 && /^[A-Z][a-z0-9]/.test(clean) && !GENERIC_WORDS.has(lower)) {
        entities.add(lower);
      }
      if (clean.length >= 3 && !GENERIC_WORDS.has(lower)) {
        keyTerms.add(lower);
      }
    }

    return { entities, headlineEntities, keyTerms, numbers };
  }

  // Determines whether two articles report on the exact same core event
  private isRelated(a: NewsItem, b: NewsItem): boolean {
    // 1. Time window constraint: events must be within 72 hours
    const hoursDiff = Math.abs(new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()) / (1000 * 3600);
    if (hoursDiff > 72) return false;

    // 2. Cross-domain barrier: Sports articles never mix with political, health, or environmental events
    const isASports = a.category === 'sports';
    const isBSports = b.category === 'sports';
    if (isASports !== isBSports) return false;

    const fA = this.extractFeatures(a.title, a.summary);
    const fB = this.extractFeatures(b.title, b.summary);

    // Matching headline entities (strongest deterministic signal)
    const matchingHeadlineEntities: string[] = [];
    for (const ent of fA.headlineEntities) {
      if (fB.headlineEntities.has(ent) || fB.entities.has(ent)) {
        matchingHeadlineEntities.push(ent);
      }
    }

    // Matching general entities
    const matchingEntities: string[] = [];
    for (const ent of fA.entities) {
      if (fB.entities.has(ent)) {
        matchingEntities.push(ent);
      }
    }

    // Matching key terms
    let matchingKeyTerms = 0;
    for (const kt of fA.keyTerms) {
      if (fB.keyTerms.has(kt)) {
        matchingKeyTerms++;
      }
    }

    // High confidence clustering rules:
    // Rule A: Both headlines share at least 1 specific proper noun (e.g. Boelo, Machado, Carrick, Vucic, Stansted)
    // AND share at least 2 key terms or numbers
    if (matchingHeadlineEntities.length >= 1 && (matchingKeyTerms >= 2 || (fA.numbers.size > 0 && Array.from(fA.numbers).some(n => fB.numbers.has(n))))) {
      return true;
    }

    // Rule B: Share 2+ proper entities across headline/summary AND at least 3 key terms
    if (matchingEntities.length >= 2 && matchingKeyTerms >= 3) {
      return true;
    }

    // Rule C: Very high lexical term overlap in title (>= 4 distinctive words)
    if (matchingKeyTerms >= 4) {
      return true;
    }

    return false;
  }

  // Synthesize a clean story headline from the member articles
  private synthesizeTitle(articles: NewsItem[]): string {
    // Find the cleanest, most comprehensive title (shortest without conversational prefixes)
    const sortedByLength = [...articles].sort((a, b) => a.title.length - b.title.length);
    const best = sortedByLength.find(a => !a.title.includes('– live') && !a.title.includes('as it happened')) || articles[0];
    return best.title.replace(/\s*–\s*live.*$/i, '').replace(/\s*-\s*as it happened.*$/i, '').trim();
  }

  // Synthesizes a factual, source-transparent overview purely from member articles
  private synthesizeOverview(articles: NewsItem[]): string {
    const publishers = Array.from(new Set(articles.map(a => a.publisher))).join(', ');
    const first = articles[0];
    const latest = articles[articles.length - 1];

    if (articles.length === 1) {
      return first.summary || `Initial wire dispatch reported by ${first.publisher}.`;
    }

    return `${first.summary} As the situation developed, subsequent reports from ${publishers} provided additional operational data and confirmation, leading to the latest dispatch: "${latest.title}".`;
  }

  // Analyzes what is genuinely new in the latest update compared to earlier updates
  private computeWhatChanged(articles: NewsItem[]): string {
    if (articles.length <= 1) {
      const single = articles[0];
      return `Initial dispatch filed by ${single.publisher}. Monitoring for developing updates and corroborating reports across wire services.`;
    }

    const latest = articles[articles.length - 1];
    const prior = articles.slice(0, -1);

    const latestFeatures = this.extractFeatures(latest.title, latest.summary);
    const priorFeatures = prior.map(p => this.extractFeatures(p.title, p.summary));

    const allPriorTerms = new Set<string>();
    const allPriorNumbers = new Set<string>();
    for (const pf of priorFeatures) {
      pf.keyTerms.forEach(t => allPriorTerms.add(t));
      pf.numbers.forEach(n => allPriorNumbers.add(n));
    }

    // Find new statistics, numbers, or key event words introduced in latest update
    const newNumbers = Array.from(latestFeatures.numbers).filter(n => !allPriorNumbers.has(n));
    const newTerms = Array.from(latestFeatures.keyTerms).filter(t => !allPriorTerms.has(t));

    const timeAgoMs = Date.now() - new Date(latest.publishedAt).getTime();
    const timeAgoMinutes = Math.max(1, Math.round(timeAgoMs / (1000 * 60)));
    const timeAgoStr = timeAgoMinutes < 60 ? `${timeAgoMinutes}m ago` : `${Math.round(timeAgoMinutes / 60)}h ago`;

    let changeDetail = `Newest report from ${latest.publisher} (${timeAgoStr}) reports: "${latest.title}".`;

    if (newNumbers.length > 0) {
      changeDetail += ` Adds new quantified developments: ${newNumbers.slice(0, 3).join(', ')}.`;
    } else if (newTerms.length > 0) {
      const topTerms = newTerms.slice(0, 4).join(', ');
      changeDetail += ` Introduces new details regarding ${topTerms}.`;
    } else {
      changeDetail += ` Provides direct continuation and corroborating analysis following earlier reports from ${prior[0].publisher}.`;
    }

    return changeDetail;
  }

  // Generates developing/unconfirmed considerations
  private computeUnconfirmed(articles: NewsItem[]): string[] {
    const unconfirmed: string[] = [];
    const publishersCount = new Set(articles.map(a => a.publisher)).size;

    if (publishersCount === 1) {
      unconfirmed.push(`Currently reported by a single source (${articles[0].publisher}). Independent secondary corroboration from other international agencies is still pending.`);
    }

    const combinedText = articles.map(a => `${a.title} ${a.summary}`).join(' ').toLowerCase();

    if (combinedText.includes('death') || combinedText.includes('killed') || combinedText.includes('casualt') || combinedText.includes('toll')) {
      unconfirmed.push('Exact casualty figures, injury counts, and rescue assessments remain active and subject to subsequent institutional verification.');
    }

    if (combinedText.includes('power') || combinedText.includes('outage') || combinedText.includes('disruption')) {
      unconfirmed.push('Infrastructure restoration timetables and comprehensive utility status reports are developing.');
    }

    if (combinedText.includes('election') || combinedText.includes('vote') || combinedText.includes('poll')) {
      unconfirmed.push('Preliminary exit poll data and partial vote tallies are developing; final certified tallies await electoral authority sign-off.');
    }

    if (combinedText.includes('investigation') || combinedText.includes('inquiry') || combinedText.includes('probe')) {
      unconfirmed.push('Official findings, regulatory inquiries, and judicial proceedings are ongoing with no final verdict released.');
    }

    if (unconfirmed.length === 0) {
      unconfirmed.push('Broader long-term geopolitical, economic, and institutional impacts remain developing as subsequent reporting unfolds.');
    }

    return unconfirmed;
  }

  // Computes the comprehensive list of FactTrails from all active news articles
  async buildFactTrails(forceRefresh = false): Promise<FactTrail[]> {
    if (!forceRefresh) {
      const cached = memoryCache.get<FactTrail[]>(this.CACHE_KEY);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    const allArticles = await newsService.getAllNews();
    if (!allArticles || allArticles.length === 0) {
      return [];
    }

    // Anchor-based deterministic clustering
    const clusters: NewsItem[][] = [];
    const assignedIds = new Set<string>();

    for (let i = 0; i < allArticles.length; i++) {
      const anchor = allArticles[i];
      if (assignedIds.has(anchor.id)) continue;

      const members: NewsItem[] = [anchor];
      assignedIds.add(anchor.id);

      for (let j = i + 1; j < allArticles.length; j++) {
        const candidate = allArticles[j];
        if (assignedIds.has(candidate.id)) continue;

        if (this.isRelated(anchor, candidate)) {
          members.push(candidate);
          assignedIds.add(candidate.id);
        }
      }

      clusters.push(members);
    }

    // Filter clusters: prioritize multi-update stories (2+ articles) or high-impact developing wire leads
    const validClusters = clusters.filter(c => c.length >= 2 || (c.length === 1 && c[0].isBreaking));

    const trails: FactTrail[] = validClusters.map(members => {
      // Sort member updates chronologically (oldest to newest)
      const sorted = [...members].sort(
        (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
      );

      const firstArticle = sorted[0];
      const latestArticle = sorted[sorted.length - 1];
      const title = this.synthesizeTitle(sorted);

      const publishers = Array.from(new Set(sorted.map(m => m.publisher)));
      const id = 'trail-' + crypto.createHash('sha256').update(`${title}::${firstArticle.publishedAt}`).digest('hex').slice(0, 16);
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 60);

      // Build timeline entries
      const timeline: FactTrailUpdate[] = sorted.map((item, idx) => {
        const isLatest = idx === sorted.length - 1;
        const isOfficial =
          item.sourceType === 'institutional' ||
          item.sourceType === 'press_release' ||
          item.publisher.includes('NASA') ||
          item.publisher.includes('WHO') ||
          /\b(official statement|communique|press release|ministry|spokesperson confirmed)\b/i.test(`${item.title} ${item.summary}`);

        return {
          id: `upd-${item.id}`,
          articleId: item.id,
          title: item.title,
          summary: item.summary,
          publisher: item.publisher,
          author: item.author,
          publishedAt: item.publishedAt,
          url: item.url,
          category: item.category,
          sourceType: item.sourceType,
          isOfficialStatement: isOfficial,
          isLatest,
          imageUrl: item.imageUrl,
          imageAttribution: item.imageAttribution,
        };
      });

      // Build publisher source matrix
      const sourceMap = new Map<string, FactTrailSource>();
      for (const item of sorted) {
        const existing = sourceMap.get(item.publisher);
        if (existing) {
          existing.articlesCount += 1;
          existing.urls.push(item.url);
          if (new Date(item.publishedAt).getTime() > new Date(existing.latestReportAt).getTime()) {
            existing.latestReportAt = item.publishedAt;
          }
        } else {
          sourceMap.set(item.publisher, {
            publisher: item.publisher,
            articlesCount: 1,
            latestReportAt: item.publishedAt,
            sourceType: item.sourceType,
            urls: [item.url],
          });
        }
      }

      const sources = Array.from(sourceMap.values()).sort(
        (a, b) => b.articlesCount - a.articlesCount
      );

      const officialStatements = timeline.filter(t => t.isOfficialStatement);
      const whatChanged = this.computeWhatChanged(sorted);
      const overview = this.synthesizeOverview(sorted);
      const unconfirmedOrDeveloping = this.computeUnconfirmed(sorted);

      const imageUrl = sorted.find(a => a.imageUrl)?.imageUrl;
      const imageAttribution = sorted.find(a => a.imageAttribution)?.imageAttribution;

      return {
        id,
        slug,
        title,
        category: firstArticle.category,
        overview,
        firstReportedAt: firstArticle.publishedAt,
        latestUpdateAt: latestArticle.publishedAt,
        articlesCount: sorted.length,
        publishersCount: publishers.length,
        publishers,
        sources,
        timeline,
        latestUpdateSummary: latestArticle.summary,
        whatChanged,
        officialStatements,
        unconfirmedOrDeveloping,
        imageUrl,
        imageAttribution,
      };
    });

    // Sort trails by latestUpdateAt descending so the freshest stories appear first
    trails.sort((a, b) => new Date(b.latestUpdateAt).getTime() - new Date(a.latestUpdateAt).getTime());

    memoryCache.set(this.CACHE_KEY, trails, this.CACHE_TTL);
    return trails;
  }

  // Get summary list of trails with optional category and search filters
  async getAllTrails(category?: string, search?: string, publisher?: string): Promise<FactTrailSummary[]> {
    const trails = await this.buildFactTrails();
    let filtered = trails;

    if (category && category !== 'all') {
      const catLower = category.toLowerCase();
      filtered = filtered.filter(t => t.category.toLowerCase() === catLower);
    }

    if (publisher) {
      const pubLower = publisher.toLowerCase();
      filtered = filtered.filter(t => t.publishers.some(p => p.toLowerCase().includes(pubLower)));
    }

    if (search && search.trim()) {
      const q = search.toLowerCase().trim();
      filtered = filtered.filter(t =>
        t.title.toLowerCase().includes(q) ||
        t.overview.toLowerCase().includes(q) ||
        t.whatChanged.toLowerCase().includes(q) ||
        t.publishers.some(p => p.toLowerCase().includes(q))
      );
    }

    return filtered.map(t => {
      const latestUpdate = t.timeline[t.timeline.length - 1];
      return {
        id: t.id,
        slug: t.slug,
        title: t.title,
        category: t.category,
        overview: t.overview,
        firstReportedAt: t.firstReportedAt,
        latestUpdateAt: t.latestUpdateAt,
        articlesCount: t.articlesCount,
        publishersCount: t.publishersCount,
        publishers: t.publishers,
        latestPublisher: latestUpdate?.publisher || t.publishers[0],
        latestHeadline: latestUpdate?.title || t.title,
        whatChangedPreview: t.whatChanged,
        imageUrl: t.imageUrl,
        hasOfficialStatement: t.officialStatements.length > 0,
      };
    });
  }

  // Get a single FactTrail by ID or slug
  async getTrailById(idOrSlug: string): Promise<FactTrail | null> {
    const trails = await this.buildFactTrails();
    return trails.find(t => t.id === idOrSlug || t.slug === idOrSlug) || null;
  }

  // Check which followed trails have newer updates than the client's last seen timestamp
  async checkUpdates(
    followed: Array<{ trailId: string; lastSeenTimestamp?: string; lastSeenUpdateAt?: string }>
  ): Promise<
    Array<{
      trailId: string;
      hasNewUpdates: boolean;
      newUpdatesCount: number;
      latestUpdateAt: string;
      latestHeadline: string;
      whatChangedPreview: string;
    }>
  > {
    const trails = await this.buildFactTrails();
    const trailMap = new Map<string, FactTrail>(trails.map(t => [t.id, t]));

    return followed.map(f => {
      const trail = trailMap.get(f.trailId);
      const rawTimestamp = f.lastSeenTimestamp || f.lastSeenUpdateAt || '';
      if (!trail) {
        return {
          trailId: f.trailId,
          hasNewUpdates: false,
          newUpdatesCount: 0,
          latestUpdateAt: rawTimestamp,
          latestHeadline: '',
          whatChangedPreview: '',
        };
      }

      const lastSeenTime = rawTimestamp ? new Date(rawTimestamp).getTime() : 0;
      const latestUpdateTime = new Date(trail.latestUpdateAt).getTime();
      const hasNewUpdates = !isNaN(lastSeenTime) && latestUpdateTime > lastSeenTime;

      const newUpdatesCount = trail.timeline.filter(
        upd => new Date(upd.publishedAt).getTime() > lastSeenTime
      ).length;

      const latestUpdate = trail.timeline[trail.timeline.length - 1];

      return {
        trailId: f.trailId,
        hasNewUpdates,
        newUpdatesCount,
        latestUpdateAt: trail.latestUpdateAt,
        latestHeadline: latestUpdate?.title || trail.title,
        whatChangedPreview: trail.whatChanged,
      };
    });
  }

  // Finds if an existing article belongs to a tracked FactTrail
  async findTrailForArticle(articleId: string): Promise<{
    trailId: string;
    title: string;
    updatesCount: number;
    publishersCount: number;
  } | null> {
    const trails = await this.buildFactTrails();
    for (const trail of trails) {
      if (trail.timeline.some(u => u.articleId === articleId)) {
        return {
          trailId: trail.id,
          title: trail.title,
          updatesCount: trail.articlesCount,
          publishersCount: trail.publishersCount,
        };
      }
    }
    return null;
  }
}

export const factTrailService = new FactTrailService();
