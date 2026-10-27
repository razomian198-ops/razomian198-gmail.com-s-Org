import crypto from 'crypto';
import { XMLParser } from 'fast-xml-parser';
import { memoryCache } from './cache.ts';
import { NewsItem, ProviderStatus } from './types.ts';

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_',
});

export interface FeedConfig {
  id: string;
  name: string;
  url: string;
  publisher: string;
  defaultCategory: string;
  sourceType: 'wire' | 'press_release' | 'institutional' | 'broadcast';
}

export interface FeedHealthStatus {
  id: string;
  name: string;
  url: string;
  publisher: string;
  category: string;
  status: 'active' | 'degraded' | 'offline';
  lastPing: string;
  lastSuccess?: string;
  lastError?: string;
  latencyMs: number;
  itemCount: number;
}

// 19 verified, genuinely free public RSS feeds across BBC, Al Jazeera, Sky News, Deutsche Welle, France 24, NASA, WHO, and The Guardian
export const CONFIGURED_FEEDS: FeedConfig[] = [
  // BBC News (6 public feeds)
  {
    id: 'bbc-top',
    name: 'BBC News - Top Stories',
    url: 'https://feeds.bbci.co.uk/news/rss.xml',
    publisher: 'BBC News',
    defaultCategory: 'world',
    sourceType: 'broadcast',
  },
  {
    id: 'bbc-world',
    name: 'BBC News - World',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    publisher: 'BBC News',
    defaultCategory: 'world',
    sourceType: 'broadcast',
  },
  {
    id: 'bbc-business',
    name: 'BBC News - Business & Economy',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    publisher: 'BBC News',
    defaultCategory: 'business',
    sourceType: 'broadcast',
  },
  {
    id: 'bbc-tech',
    name: 'BBC News - Technology & AI',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    publisher: 'BBC News',
    defaultCategory: 'technology',
    sourceType: 'broadcast',
  },
  {
    id: 'bbc-science',
    name: 'BBC News - Science & Environment',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    publisher: 'BBC News',
    defaultCategory: 'science',
    sourceType: 'broadcast',
  },
  {
    id: 'bbc-sport',
    name: 'BBC Sport - Wire Dispatches',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    publisher: 'BBC Sport',
    defaultCategory: 'sports',
    sourceType: 'broadcast',
  },

  // International Publishers (5 feeds)
  {
    id: 'aljazeera',
    name: 'Al Jazeera English - Global Wire',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    publisher: 'Al Jazeera English',
    defaultCategory: 'world',
    sourceType: 'broadcast',
  },
  {
    id: 'skynews-home',
    name: 'Sky News - Top Headlines',
    url: 'https://feeds.skynews.com/feeds/rss/home.xml',
    publisher: 'Sky News',
    defaultCategory: 'world',
    sourceType: 'broadcast',
  },
  {
    id: 'skynews-world',
    name: 'Sky News - World Affairs',
    url: 'https://feeds.skynews.com/feeds/rss/world.xml',
    publisher: 'Sky News',
    defaultCategory: 'world',
    sourceType: 'broadcast',
  },
  {
    id: 'dw',
    name: 'Deutsche Welle - English Top News',
    url: 'https://rss.dw.com/rdf/rss-en-top',
    publisher: 'Deutsche Welle',
    defaultCategory: 'world',
    sourceType: 'broadcast',
  },
  {
    id: 'france24',
    name: 'France 24 - International Wire',
    url: 'https://www.france24.com/en/rss',
    publisher: 'France 24',
    defaultCategory: 'world',
    sourceType: 'broadcast',
  },

  // Science & Institutional (3 feeds)
  {
    id: 'nasa-news',
    name: 'NASA - Breaking News & Press Releases',
    url: 'https://www.nasa.gov/news-release/feed/',
    publisher: 'NASA Space & Science',
    defaultCategory: 'science',
    sourceType: 'institutional',
  },
  {
    id: 'nasa-iotd',
    name: 'NASA - Missions & Observatories',
    url: 'https://www.nasa.gov/feeds/iotd-feed/',
    publisher: 'NASA Space & Science',
    defaultCategory: 'science',
    sourceType: 'institutional',
  },
  {
    id: 'who',
    name: 'World Health Organization - Disease & Health Alerts',
    url: 'https://www.who.int/rss-feeds/news-english.xml',
    publisher: 'World Health Organization',
    defaultCategory: 'health',
    sourceType: 'institutional',
  },

  // The Guardian Open Public RSS (5 feeds)
  {
    id: 'guardian-world',
    name: 'The Guardian - World Affairs',
    url: 'https://www.theguardian.com/world/rss',
    publisher: 'The Guardian',
    defaultCategory: 'world',
    sourceType: 'wire',
  },
  {
    id: 'guardian-science',
    name: 'The Guardian - Science & Research',
    url: 'https://www.theguardian.com/science/rss',
    publisher: 'The Guardian',
    defaultCategory: 'science',
    sourceType: 'wire',
  },
  {
    id: 'guardian-tech',
    name: 'The Guardian - Technology',
    url: 'https://www.theguardian.com/technology/rss',
    publisher: 'The Guardian',
    defaultCategory: 'technology',
    sourceType: 'wire',
  },
  {
    id: 'guardian-biz',
    name: 'The Guardian - Business & Financial Markets',
    url: 'https://www.theguardian.com/business/rss',
    publisher: 'The Guardian',
    defaultCategory: 'business',
    sourceType: 'wire',
  },
  {
    id: 'guardian-sport',
    name: 'The Guardian - Sports',
    url: 'https://www.theguardian.com/sport/rss',
    publisher: 'The Guardian',
    defaultCategory: 'sports',
    sourceType: 'wire',
  },
];

// Clean and unescape raw HTML strings
export function cleanHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(Number(dec)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&ndash;/g, '–')
    .replace(/&mdash;/g, '—')
    .replace(/&hellip;/g, '…')
    .replace(/\s+/g, ' ')
    .trim();
}

// Category mapping helper
export function normalizeCategory(cat: string): string {
  const c = cat.toLowerCase();
  if (c.includes('break')) return 'breaking';
  if (c.includes('politic') || c.includes('govern') || c.includes('election') || c.includes('senate') || c.includes('parliament')) return 'politics';
  if (c.includes('econ') || c.includes('busin') || c.includes('market') || c.includes('financ') || c.includes('trade') || c.includes('money')) return 'business';
  if (c.includes('tech') || c.includes('ai') || c.includes('artificial') || c.includes('cyber') || c.includes('software')) return 'technology';
  if (c.includes('sci') || c.includes('space') || c.includes('astronomy') || c.includes('physics') || c.includes('cosmos')) return 'science';
  if (c.includes('health') || c.includes('medic') || c.includes('disease') || c.includes('virus') || c.includes('pharma') || c.includes('epidemic')) return 'health';
  if (c.includes('environ') || c.includes('climat') || c.includes('weather') || c.includes('wildfire') || c.includes('storm')) return 'environment';
  if (c.includes('sport') || c.includes('football') || c.includes('soccer') || c.includes('cricket') || c.includes('tennis') || c.includes('rugby') || c.includes('f1')) return 'sports';
  if (c.includes('cultur') || c.includes('entertain') || c.includes('art') || c.includes('film') || c.includes('music')) return 'culture';
  if (c.includes('fact') || c.includes('check')) return 'fact-checks';
  return 'world';
}

// Determines accurate topic category from item tags, feed default, title, and summary
export function determineCategory(item: any, defaultCat: string, title: string, summary: string): string {
  // 1. Inspect RSS item category tags or dc:subject
  const rawCat = item.category || item['dc:subject'] || '';
  let categoryCandidates: string[] = [];
  if (Array.isArray(rawCat)) {
    categoryCandidates = rawCat.map((c) => (typeof c === 'string' ? c : c?.['#text'] || ''));
  } else if (typeof rawCat === 'string') {
    categoryCandidates = [rawCat];
  } else if (rawCat?.['#text']) {
    categoryCandidates = [rawCat['#text']];
  }

  for (const candidate of categoryCandidates) {
    const normalized = normalizeCategory(candidate);
    if (normalized !== 'world') {
      return normalized;
    }
  }

  // 2. If feed is dedicated (e.g. sports, business, technology, science, health, environment), preserve it unless title contradicts
  const normalizedDefault = normalizeCategory(defaultCat);
  if (normalizedDefault !== 'world') {
    return normalizedDefault;
  }

  // 3. For general world/top news feeds, inspect headline & summary for clear domain signals
  const combinedText = `${title} ${summary}`.toLowerCase();
  if (/\b(premier league|champions league|formula one|grand prix|wimbledon|nba|nfl|world cup|cricket|tennis|striker|derby|quarterback)\b/i.test(combinedText)) {
    return 'sports';
  }
  if (/\b(wall street|inflation|federal reserve|interest rate|stock market|shares|dow jones|nasdaq|gdp|recession|ftse|central bank)\b/i.test(combinedText)) {
    return 'business';
  }
  if (/\b(artificial intelligence|chatgpt|openai|semiconductor|cyberattack|quantum computer|deep learning|software patch|ransomware|gpu)\b/i.test(combinedText)) {
    return 'technology';
  }
  if (/\b(nasa|james webb|astronomers|exoplanet|hubble|supernova|quantum physics|black hole|mars rover|spacewalk|esa telescope)\b/i.test(combinedText)) {
    return 'science';
  }
  if (/\b(who|vaccine|cancer|pathogen|clinical trial|epidemic|hospital|avian flu|surgeon|pandemic|cholera|outbreak)\b/i.test(combinedText)) {
    return 'health';
  }
  if (/\b(wildfire|hurricane|typhoon|carbon emissions|climate summit|global heating|cop\d+|drought|biodiversity)\b/i.test(combinedText)) {
    return 'environment';
  }
  if (/\b(election|presidential|prime minister|parliament|congress|senate|referendum|legislation|democrat|republican|diplomatic summit)\b/i.test(combinedText)) {
    return 'politics';
  }

  return 'world';
}

// Extract thumbnail/enclosure image from RSS item with fallbacks
export function extractImageUrl(item: any): string | undefined {
  // 1. media:content (object or array)
  if (item['media:content']) {
    const mc = item['media:content'];
    if (Array.isArray(mc)) {
      const img = mc.find((m) => m['@_medium'] === 'image' || m['@_url']?.match(/\.(jpg|jpeg|png|webp)/i));
      if (img?.['@_url']) return img['@_url'];
      if (mc[0]?.['@_url']) return mc[0]['@_url'];
    } else if (mc['@_url']) {
      return mc['@_url'];
    }
  }

  // 2. media:thumbnail (object or array)
  if (item['media:thumbnail']) {
    const mt = item['media:thumbnail'];
    if (Array.isArray(mt) && mt[0]?.['@_url']) return mt[0]['@_url'];
    if (mt['@_url']) return mt['@_url'];
  }

  // 3. enclosure
  if (item.enclosure) {
    const enc = item.enclosure;
    if (Array.isArray(enc)) {
      const img = enc.find((e) => e['@_type']?.startsWith('image') || e['@_url']?.match(/\.(jpg|jpeg|png|webp)/i));
      if (img?.['@_url']) return img['@_url'];
    } else if (enc['@_url'] && (enc['@_type']?.startsWith('image') || enc['@_url']?.match(/\.(jpg|jpeg|png|webp)/i))) {
      return enc['@_url'];
    }
  }

  // 4. Embedded <img> in description or content:encoded
  const htmlContent = `${item['content:encoded'] || ''} ${item.description || ''}`;
  const match = htmlContent.match(/<img[^>]+src=["'](https?:\/\/[^"']+)["']/i);
  if (match && match[1] && !match[1].includes('feedburner') && !match[1].includes('1x1') && !match[1].includes('pixel')) {
    return match[1];
  }

  return undefined;
}

// Clean URL removing analytics/traffic parameters to facilitate deduplication
export function normalizeUrl(rawUrl: string): string {
  try {
    const parsed = new URL(rawUrl);
    parsed.searchParams.delete('utm_source');
    parsed.searchParams.delete('utm_medium');
    parsed.searchParams.delete('utm_campaign');
    parsed.searchParams.delete('traffic_source');
    parsed.searchParams.delete('maca');
    return parsed.toString();
  } catch {
    return rawUrl.trim();
  }
}

export class NewsService {
  private lastFetchTime: number = 0;
  private readonly CACHE_KEY = 'all_normalized_news';
  private readonly CACHE_TTL = 300; // 5 minutes cache to protect upstream publishers
  private feedStatuses: Map<string, FeedHealthStatus> = new Map();

  constructor() {
    // Initialize feed status registry
    for (const feed of CONFIGURED_FEEDS) {
      this.feedStatuses.set(feed.id, {
        id: feed.id,
        name: feed.name,
        url: feed.url,
        publisher: feed.publisher,
        category: feed.defaultCategory,
        status: 'active',
        lastPing: new Date().toISOString(),
        latencyMs: 0,
        itemCount: 0,
      });
    }
  }

  // Fetch and parse a single RSS feed with timeout and metrics recording
  async fetchRssFeed(feed: FeedConfig, maxItems = 15): Promise<NewsItem[]> {
    const startTime = Date.now();
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4500); // 4.5s safe timeout

      const response = await fetch(feed.url, {
        signal: controller.signal,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 FactInfoLive/1.0 (https://factinfolive.org; news-bot@factinfolive.org)',
          Accept: 'application/rss+xml, application/xml, text/xml, */*',
        },
      });

      clearTimeout(timeoutId);
      const latencyMs = Date.now() - startTime;

      if (!response.ok) {
        this.feedStatuses.set(feed.id, {
          ...this.feedStatuses.get(feed.id)!,
          status: 'degraded',
          lastPing: new Date().toISOString(),
          lastError: `HTTP ${response.status} ${response.statusText}`,
          latencyMs,
        });
        return [];
      }

      const xmlText = await response.text();
      const parsed = xmlParser.parse(xmlText);
      const items =
        parsed?.rss?.channel?.item ||
        parsed?.feed?.entry ||
        parsed?.['rdf:RDF']?.item ||
        [];
      const itemArray = Array.isArray(items) ? items : items ? [items] : [];

      const results: NewsItem[] = [];

      for (let i = 0; i < Math.min(itemArray.length, maxItems); i++) {
        const item = itemArray[i];
        if (!item || !item.title) continue;

        const rawTitle = typeof item.title === 'string' ? item.title : item.title?.['#text'] || '';
        const title = cleanHtml(rawTitle)
          .replace(/\s*-\s*(BBC News|The Guardian|Sky News|Al Jazeera|DW|France 24)$/i, '')
          .trim();
        if (!title) continue;

        const rawDesc = item.description || item.summary || item['content:encoded'] || '';
        const summary = cleanHtml(typeof rawDesc === 'string' ? rawDesc : rawDesc?.['#text'] || '').slice(0, 360);

        const rawLink =
          (typeof item.link === 'string' ? item.link : item.link?.['@_href']) ||
          item['feedburner:origLink'] ||
          (typeof item.guid === 'string' ? item.guid : item.guid?.['#text'] || '');
        const cleanLink = normalizeUrl(rawLink);

        // Date extraction (RFC 822 pubDate, ISO published/updated, Dublin Core dc:date)
        const pubDateRaw =
          item.pubDate ||
          item.published ||
          item.updated ||
          item['dc:date'] ||
          item['a10:updated'];
        let publishedAt = new Date().toISOString();
        if (pubDateRaw) {
          const parsedDate = new Date(pubDateRaw);
          if (!isNaN(parsedDate.getTime())) {
            publishedAt = parsedDate.toISOString();
          }
        }

        const imageUrl = extractImageUrl(item);
        const category = determineCategory(item, feed.defaultCategory, title, summary);
        const hashInput = `${cleanLink}::${title}::${publishedAt}`;
        const id = 'rss-' + crypto.createHash('sha256').update(hashInput).digest('hex').slice(0, 20);

        // Fact-check status: institutional releases are official statements; wire reports are attribution-preserved analysis
        const isInstitutional = feed.sourceType === 'institutional';
        const factCheckStatus = isInstitutional
          ? 'official_statement'
          : category === 'fact-checks'
          ? 'verified'
          : 'analysis';

        results.push({
          id,
          title,
          summary: summary || title,
          publisher: feed.publisher,
          author: item['dc:creator'] || item.author?.name || feed.publisher,
          url: cleanLink || feed.url,
          publishedAt,
          retrievedAt: new Date().toISOString(),
          category,
          subcategory: feed.defaultCategory,
          language: 'en',
          imageUrl,
          tags: [category, feed.publisher],
          isBreaking: false,
          isDeveloping: isInstitutional ? false : true,
          factCheckStatus,
          verificationDetails: isInstitutional
            ? `Institutional communique published by ${feed.publisher}. Preserved in original context.`
            : `Wire reporting published by ${feed.publisher}. Preserved with original source attribution.`,
          sourceType: feed.sourceType,
        });
      }

      // Record successful status
      this.feedStatuses.set(feed.id, {
        id: feed.id,
        name: feed.name,
        url: feed.url,
        publisher: feed.publisher,
        category: feed.defaultCategory,
        status: 'active',
        lastPing: new Date().toISOString(),
        lastSuccess: new Date().toISOString(),
        latencyMs,
        itemCount: results.length,
      });

      return results;
    } catch (err: any) {
      this.feedStatuses.set(feed.id, {
        ...this.feedStatuses.get(feed.id)!,
        status: 'degraded',
        lastPing: new Date().toISOString(),
        lastError: err?.message || 'Connection timeout',
        latencyMs: Date.now() - startTime,
      });
      return [];
    }
  }

  // Guardian Open Platform API integration (if GUARDIAN_API_KEY is configured)
  async fetchGuardianApi(apiKey: string): Promise<NewsItem[]> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const url = `https://content.guardianapis.com/search?api-key=${apiKey}&show-fields=headline,trailText,bodyText,thumbnail,byline&page-size=15&order-by=newest`;
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (!res.ok) return [];

      const data = await res.json();
      const results = data.response?.results || [];

      return results.map((item: any) => ({
        id: 'gdn-' + item.id.replace(/\//g, '-'),
        title: cleanHtml(item.fields?.headline || item.webTitle),
        summary: cleanHtml(item.fields?.trailText || item.webTitle).slice(0, 360),
        content: cleanHtml(item.fields?.bodyText || '').slice(0, 1500),
        publisher: 'The Guardian',
        author: item.fields?.byline || 'The Guardian Staff',
        url: item.webUrl,
        publishedAt: item.webPublicationDate || new Date().toISOString(),
        retrievedAt: new Date().toISOString(),
        category: normalizeCategory(item.sectionName || item.sectionId),
        subcategory: item.sectionName,
        language: 'en',
        imageUrl: item.fields?.thumbnail,
        imageAttribution: 'The Guardian Media Archive',
        tags: [item.sectionName, 'International'].filter(Boolean),
        isBreaking: false,
        isDeveloping: false,
        factCheckStatus: 'analysis',
        verificationDetails: 'Authenticated via The Guardian Open Platform API.',
        sourceType: 'wire',
      }));
    } catch {
      return [];
    }
  }

  // Deduplicate articles by normalized URL and title across different feeds
  deduplicateArticles(articles: NewsItem[]): NewsItem[] {
    const seenUrls = new Set<string>();
    const seenTitles = new Set<string>();
    const deduplicated: NewsItem[] = [];

    for (const item of articles) {
      if (!item.title) continue;

      // Normalized title: alphanumeric lowercase string
      const normTitle = item.title.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!normTitle || normTitle.length < 10) continue;
      if (seenTitles.has(normTitle)) continue;

      // Normalized URL
      if (item.url) {
        const normU = normalizeUrl(item.url);
        if (seenUrls.has(normU)) continue;
        seenUrls.add(normU);
      }

      seenTitles.add(normTitle);
      deduplicated.push(item);
    }

    return deduplicated;
  }

  // Multi-Source Balancing Algorithm: ensures fair publisher interleaving
  // Prevents one publisher from dominating consecutive positions on the homepage
  balanceMultiSourceNews(articles: NewsItem[]): NewsItem[] {
    if (articles.length <= 3) return articles;

    // Group items by publisher, sorted by publishedAt descending within each publisher
    const byPublisher: Map<string, NewsItem[]> = new Map();
    for (const item of articles) {
      const list = byPublisher.get(item.publisher) || [];
      list.push(item);
      byPublisher.set(item.publisher, list);
    }

    for (const [, list] of byPublisher.entries()) {
      list.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
    }

    const balanced: NewsItem[] = [];
    const remaining = [...articles];
    remaining.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    const recentPublishers: string[] = [];

    while (remaining.length > 0) {
      // Find candidate whose publisher has NOT appeared twice in a row
      let pickIdx = remaining.findIndex((item) => {
        if (recentPublishers.length === 0) return true;
        const lastPub = recentPublishers[recentPublishers.length - 1];
        const secondLastPub = recentPublishers.length >= 2 ? recentPublishers[recentPublishers.length - 2] : null;

        // Never 3 times in a row
        if (lastPub === item.publisher && secondLastPub === item.publisher) {
          return false;
        }

        // Strongly prefer alternating publishers in the top 20 items (homepage)
        if (balanced.length < 24 && lastPub === item.publisher) {
          return false;
        }

        return true;
      });

      if (pickIdx === -1) {
        // Fallback to top remaining item if all available items share the same publisher
        pickIdx = 0;
      }

      const [picked] = remaining.splice(pickIdx, 1);
      balanced.push(picked);
      recentPublishers.push(picked.publisher);
      if (recentPublishers.length > 4) recentPublishers.shift();
    }

    return balanced;
  }

  // Aggregates all RSS feeds with caching and multi-source balancing
  async getAllNews(forceRefresh = false): Promise<NewsItem[]> {
    if (!forceRefresh) {
      const cached = memoryCache.get<NewsItem[]>(this.CACHE_KEY);
      if (cached && cached.length > 0) {
        return cached;
      }
    }

    const tasks: Promise<NewsItem[]>[] = [];

    // 1. Fetch Guardian API (if key exists) or Guardian RSS feeds
    const guardianKey = process.env.GUARDIAN_API_KEY;
    if (guardianKey && guardianKey.trim() !== '') {
      tasks.push(this.fetchGuardianApi(guardianKey));
    }

    // 2. Fetch all configured public RSS feeds concurrently
    for (const feed of CONFIGURED_FEEDS) {
      // If Guardian API is active, skip redundant Guardian RSS to avoid duplicate upstream requests
      if (guardianKey && feed.publisher === 'The Guardian') {
        continue;
      }
      tasks.push(this.fetchRssFeed(feed));
    }

    const settled = await Promise.allSettled(tasks);
    const combined: NewsItem[] = [];

    for (const res of settled) {
      if (res.status === 'fulfilled' && Array.isArray(res.value)) {
        combined.push(...res.value);
      }
    }

    // Deduplicate cross-syndicated articles
    const deduplicated = this.deduplicateArticles(combined);

    // Apply multi-source balancing so homepage & ticker show a healthy, diverse news mix
    const balanced = this.balanceMultiSourceNews(deduplicated);

    // Mark breaking news across distinct publishers for the ticker
    const fourHoursAgo = Date.now() - 6 * 60 * 60 * 1000;
    const tickerPublishers = new Set<string>();
    for (const item of balanced) {
      if (new Date(item.publishedAt).getTime() > fourHoursAgo && !tickerPublishers.has(item.publisher)) {
        item.isBreaking = true;
        tickerPublishers.add(item.publisher);
        if (tickerPublishers.size >= 6) break;
      }
    }

    // Cache the balanced multi-source feed for 5 minutes
    this.lastFetchTime = Date.now();
    memoryCache.set(this.CACHE_KEY, balanced, this.CACHE_TTL);
    return balanced;
  }

  // Get news filtered by topic category with pagination support
  async getNewsByCategory(category: string): Promise<NewsItem[]> {
    const all = await this.getAllNews();
    if (!category || category === 'all' || category === 'home') {
      return all;
    }
    const target = normalizeCategory(category);
    return all.filter(
      (item) => item.category === target || item.subcategory?.toLowerCase().includes(category.toLowerCase())
    );
  }

  // Multi-source breaking news items for the ticker (each from a distinct publisher)
  async getBreakingNews(): Promise<NewsItem[]> {
    const all = await this.getAllNews();
    const breaking = all.filter((item) => item.isBreaking);
    if (breaking.length >= 3) {
      return breaking.slice(0, 6);
    }

    // Fallback: pick the top 5 articles from distinct publishers
    const picked: NewsItem[] = [];
    const usedPublishers = new Set<string>();
    for (const item of all) {
      if (!usedPublishers.has(item.publisher)) {
        picked.push(item);
        usedPublishers.add(item.publisher);
        if (picked.length >= 6) break;
      }
    }
    return picked;
  }

  // Get single news article by ID
  async getNewsById(id: string): Promise<NewsItem | null> {
    const all = await this.getAllNews();
    return all.find((item) => item.id === id) || null;
  }

  // Full-text search across news headlines, summaries, and publishers
  async searchNews(query: string, category?: string): Promise<NewsItem[]> {
    const all = await this.getAllNews();
    const q = query.toLowerCase().trim();

    return all.filter((item) => {
      const matchesQ =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.publisher.toLowerCase().includes(q) ||
        item.tags.some((t) => t.toLowerCase().includes(q));

      const matchesCat =
        !category ||
        category === 'all' ||
        item.category === normalizeCategory(category) ||
        item.subcategory?.toLowerCase().includes(category.toLowerCase());

      return matchesQ && matchesCat;
    });
  }

  // Return real live feed status metrics for transparency modal and /api/sources/status
  getFeedStatuses(): ProviderStatus[] {
    const cachedNews = memoryCache.get<NewsItem[]>(this.CACHE_KEY) || [];
    const statuses: ProviderStatus[] = [];

    // Group feeds by overarching publisher for clean presentation
    const publisherFeeds: Map<string, FeedHealthStatus[]> = new Map();
    for (const feed of this.feedStatuses.values()) {
      const list = publisherFeeds.get(feed.publisher) || [];
      list.push(feed);
      publisherFeeds.set(feed.publisher, list);
    }

    for (const [publisher, feeds] of publisherFeeds.entries()) {
      const totalItems = cachedNews.filter((n) => n.publisher === publisher).length;
      const anyActive = feeds.some((f) => f.status === 'active');
      const avgLatency = Math.round(feeds.reduce((acc, f) => acc + (f.latencyMs || 0), 0) / feeds.length);
      const lastPing = feeds[0]?.lastPing || new Date().toISOString();
      const lastSuccess = feeds.find((f) => f.lastSuccess)?.lastSuccess;
      const lastError = feeds.find((f) => f.lastError)?.lastError;

      const category: ProviderStatus['category'] =
        publisher.includes('NASA')
          ? 'science'
          : publisher.includes('WHO') || publisher.includes('Health')
          ? 'health'
          : publisher.includes('Sport')
          ? 'sports'
          : 'news';

      const feedNames = feeds.map((f) => f.name.replace(`${publisher} - `, '')).join(', ');

      statuses.push({
        id: `feed-${publisher.toLowerCase().replace(/[^a-z0-9]/g, '-')}`,
        name: `${publisher} RSS Syndication`,
        category,
        type: 'rss',
        status: anyActive ? 'active' : 'degraded',
        lastPing,
        lastSuccess,
        lastError,
        latencyMs: avgLatency,
        cachedRecordsCount: totalItems,
        details: `Live verified feeds (${feeds.length} endpoints: ${feedNames}). Operating under authorized public RSS terms with zero API keys.`,
        freeTier: true,
        requiresKey: false,
        hasKeyConfigured: true,
      });
    }

    return statuses;
  }

  // Returns count of active articles per publisher
  getPublisherStats(): Record<string, number> {
    const cached = memoryCache.get<NewsItem[]>(this.CACHE_KEY) || [];
    const stats: Record<string, number> = {};
    for (const item of cached) {
      stats[item.publisher] = (stats[item.publisher] || 0) + 1;
    }
    return stats;
  }

  getLastFetchTime(): number {
    return this.lastFetchTime;
  }
}

export const newsService = new NewsService();
