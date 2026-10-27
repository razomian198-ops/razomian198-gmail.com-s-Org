import { memoryCache } from './cache.ts';
import { newsService, cleanHtml } from './newsService.ts';
import { factTrailService } from './factTrailService.ts';
import {
  NewsItem,
  SourceReport,
  CoverageComparison,
  FactTrail,
} from './types.ts';

export class CompareCoverageService {
  private readonly CACHE_KEY_FEATURED = 'compare_coverage_featured';
  private readonly CACHE_TTL = 300; // 5 minutes cache synchronized with news fetch cycle

  /**
   * Converts a NewsItem into a clean SourceReport.
   */
  private toSourceReport(item: NewsItem): SourceReport {
    return {
      id: `rep_${item.id}`,
      articleId: item.id,
      headline: cleanHtml(item.title),
      publisher: item.publisher,
      publishedAt: item.publishedAt,
      url: item.url,
      summary:
        item.summary && item.summary.trim()
          ? cleanHtml(item.summary.trim())
          : 'Original wire dispatch description unavailable in feed; full report accessible via publisher link.',
      sourceType: item.sourceType || 'wire',
      author: item.author,
      imageUrl: item.imageUrl,
      isOfficialStatement: item.factCheckStatus === 'official_statement',
    };
  }

  /**
   * Builds a CoverageComparison object from a FactTrail storyline.
   */
  private buildComparisonFromTrail(trail: FactTrail): CoverageComparison {
    // Collect all timeline updates as source reports
    const sources: SourceReport[] = trail.timeline.map((update) => ({
      id: `rep_${update.id}`,
      articleId: update.articleId,
      headline: cleanHtml(update.title),
      publisher: update.publisher,
      publishedAt: update.publishedAt,
      url: update.url,
      summary:
        update.summary && update.summary.trim()
          ? cleanHtml(update.summary.trim())
          : 'Original wire dispatch description unavailable in feed; full report accessible via publisher link.',
      sourceType: update.sourceType || 'wire',
      author: update.author,
      imageUrl: update.imageUrl,
      isOfficialStatement: update.isOfficialStatement,
    }));

    // Deduplicate by URL or articleId just in case
    const uniqueSources: SourceReport[] = [];
    const seenUrls = new Set<string>();
    for (const s of sources) {
      if (!seenUrls.has(s.url)) {
        seenUrls.add(s.url);
        uniqueSources.push(s);
      }
    }

    const publishers = Array.from(new Set(uniqueSources.map((s) => s.publisher)));
    const isSingleSource = publishers.length <= 1;

    return {
      storyId: trail.id,
      storyTitle: cleanHtml(trail.title),
      category: trail.category,
      leadArticleId: trail.timeline[0]?.articleId || trail.id,
      factTrailId: trail.id,
      factTrailSlug: trail.slug,
      publishersCount: publishers.length,
      publishers,
      articlesCount: uniqueSources.length,
      sources: uniqueSources,
      isSingleSource,
      firstReportedAt: trail.firstReportedAt,
      latestReportAt: trail.latestUpdateAt,
      singleSourceNotice: isSingleSource
        ? `Single Source Report: Currently reported exclusively by ${publishers[0] || 'one source'}. No additional source coverage has been found yet across accredited wire services. FactInfoLive monitors secondary corroboration continuously.`
        : undefined,
    };
  }

  /**
   * Retrieves coverage comparison for a specific article.
   * If the article belongs to a multi-publisher FactTrail, returns all related dispatches.
   * If only one publisher has reported it, returns the single-source comparison honestly.
   */
  async getCoverageForArticle(articleId: string): Promise<CoverageComparison | null> {
    const article = await newsService.getNewsById(articleId);
    if (!article) {
      return null;
    }

    // Check if it belongs to an established FactTrail
    const trails = await factTrailService.buildFactTrails();
    const matchingTrail = trails.find((t) =>
      t.timeline.some((u) => u.articleId === articleId)
    );

    if (matchingTrail) {
      return this.buildComparisonFromTrail(matchingTrail);
    }

    // If not in a trail, check if any other news articles in memory match using clustering rules
    const allArticles = await newsService.getAllNews();
    const relatedArticles: NewsItem[] = [article];

    // Check simple lexical / entity match with other articles in same category within 72h
    const articleTime = new Date(article.publishedAt).getTime();
    for (const candidate of allArticles) {
      if (candidate.id === article.id) continue;
      const hoursDiff = Math.abs(articleTime - new Date(candidate.publishedAt).getTime()) / (1000 * 3600);
      if (hoursDiff > 72) continue;
      if (article.category !== candidate.category) continue;

      // Check key title terms (3+ common words of length >= 4)
      const wordsA = new Set(
        article.title
          .toLowerCase()
          .split(/\W+/)
          .filter((w) => w.length >= 4)
      );
      const wordsB = candidate.title
        .toLowerCase()
        .split(/\W+/)
        .filter((w) => w.length >= 4);
      let matchCount = 0;
      for (const w of wordsB) {
        if (wordsA.has(w)) matchCount++;
      }

      if (matchCount >= 3) {
        relatedArticles.push(candidate);
      }
    }

    // Sort chronologically
    relatedArticles.sort(
      (a, b) => new Date(a.publishedAt).getTime() - new Date(b.publishedAt).getTime()
    );

    const sources = relatedArticles.map((a) => this.toSourceReport(a));
    const publishers = Array.from(new Set(sources.map((s) => s.publisher)));
    const isSingleSource = publishers.length <= 1;

    return {
      storyId: `story_${article.id}`,
      storyTitle: cleanHtml(article.title),
      category: article.category,
      leadArticleId: article.id,
      publishersCount: publishers.length,
      publishers,
      articlesCount: sources.length,
      sources,
      isSingleSource,
      firstReportedAt: relatedArticles[0].publishedAt,
      latestReportAt: relatedArticles[relatedArticles.length - 1].publishedAt,
      singleSourceNotice: isSingleSource
        ? `Single Source Report: Currently reported exclusively by ${publishers[0]}. No additional source coverage has been found yet across accredited wire services. FactInfoLive monitors secondary corroboration continuously.`
        : undefined,
    };
  }

  /**
   * Retrieves featured coverage comparisons for the homepage and comparison tools.
   * Prioritizes multi-source stories across major news and sports categories.
   */
  async getFeaturedComparisons(limit = 6): Promise<CoverageComparison[]> {
    const cached = memoryCache.get<CoverageComparison[]>(this.CACHE_KEY_FEATURED);
    if (cached && cached.length > 0) {
      return cached.slice(0, limit);
    }

    const trails = await factTrailService.buildFactTrails();

    // Map all trails to CoverageComparison objects
    const comparisons: CoverageComparison[] = trails.map((t) =>
      this.buildComparisonFromTrail(t)
    );

    // Prioritize multi-source stories first (publishersCount >= 2), sorted by newest report
    const multiSource = comparisons
      .filter((c) => c.publishersCount >= 2)
      .sort((a, b) => new Date(b.latestReportAt).getTime() - new Date(a.latestReportAt).getTime());

    const singleSource = comparisons
      .filter((c) => c.publishersCount < 2)
      .sort((a, b) => new Date(b.latestReportAt).getTime() - new Date(a.latestReportAt).getTime());

    // Combine: fill with multiSource first, then singleSource if needed
    const combined = [...multiSource, ...singleSource].slice(0, limit);

    // If still empty (e.g. initial cache population before feeds complete), pull from top news
    if (combined.length === 0) {
      const topNews = await newsService.getAllNews();
      const fallbackItems = topNews.slice(0, limit).map((n) => ({
        storyId: `story_${n.id}`,
        storyTitle: cleanHtml(n.title),
        category: n.category,
        leadArticleId: n.id,
        publishersCount: 1,
        publishers: [n.publisher],
        articlesCount: 1,
        sources: [this.toSourceReport(n)],
        isSingleSource: true,
        firstReportedAt: n.publishedAt,
        latestReportAt: n.publishedAt,
        singleSourceNotice: `Single Source Report: Currently reported exclusively by ${n.publisher}. No additional source coverage has been found yet across accredited wire services.`,
      }));
      return fallbackItems;
    }

    memoryCache.set(this.CACHE_KEY_FEATURED, combined, this.CACHE_TTL);
    return combined;
  }
}

export const compareCoverageService = new CompareCoverageService();
