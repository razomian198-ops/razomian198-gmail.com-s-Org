import express, { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { newsService } from './server/services/newsService.ts';
import { sportsService } from './server/services/sportsService.ts';
import { aiService } from './server/services/aiService.ts';
import { statusService } from './server/services/statusService.ts';
import { SportType } from './server/services/types.ts';
import { editorialStore } from './server/services/editorialStore.ts';
import { editorialAiService } from './server/services/editorialAiService.ts';
import { factTrailService } from './server/services/factTrailService.ts';
import { compareCoverageService } from './server/services/compareCoverageService.ts';

import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// In-Memory Token Bucket Rate Limiter
interface RateLimitBucket {
  tokens: number;
  lastRefill: number;
}
const rateLimits = new Map<string, RateLimitBucket>();

function createRateLimiter(limit: number, windowMs: number, keyPrefix: string = '') {
  return (req: Request, res: Response, next: () => void) => {
    // Use validated req.ip with express trust proxy
    const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
    const key = `${keyPrefix}:${ip}`;
    const now = Date.now();
    const bucket = rateLimits.get(key) || { tokens: limit, lastRefill: now };

    const elapsed = now - bucket.lastRefill;
    if (elapsed > windowMs) {
      bucket.tokens = limit;
      bucket.lastRefill = now;
    }

    if (bucket.tokens <= 0) {
      const waitSeconds = Math.max(1, Math.ceil((windowMs - elapsed) / 1000));
      return res.status(429).json({
        error: `Rate limit exceeded. Too many requests. Please retry in ${waitSeconds}s.`,
      });
    }

    bucket.tokens -= 1;
    rateLimits.set(key, bucket);
    next();
  };
}

const authRateLimiter = createRateLimiter(5, 15 * 60 * 1000, 'auth'); // 5 attempts per 15 min
const aiRateLimiter = createRateLimiter(
  parseInt(process.env.AI_RPM_LIMIT || '20', 10),
  60 * 1000,
  'ai'
); // Configurable AI requests per minute
const translationRateLimiter = createRateLimiter(120, 60 * 1000, 'tr'); // 120 translation requests per minute
const apiRateLimiter = createRateLimiter(200, 60 * 1000, 'api'); // 200 requests per minute

async function startServer() {
  const app = express();

  // Configure Express proxy trust for Render, Cloudflare, and cloud web services
  app.set('trust proxy', 1);

  // Security Headers
  app.use((_req: Request, res: Response, next: () => void) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'SAMEORIGIN');
    res.setHeader('X-XSS-Protection', '1; mode=block');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Parse command line arguments (--port 3000, --host 0.0.0.0)
  const portArgIdx = process.argv.indexOf('--port');
  const cliPort = portArgIdx !== -1 && process.argv[portArgIdx + 1] ? parseInt(process.argv[portArgIdx + 1], 10) : undefined;
  const hostArgIdx = process.argv.indexOf('--host');
  const cliHost = hostArgIdx !== -1 && process.argv[hostArgIdx + 1] ? process.argv[hostArgIdx + 1] : undefined;

  // Determine port:
  // 1. Explicit CLI argument (--port 3000) passed by dev supervisor has top priority.
  // 2. In AI Studio container, DEFAULT_APP_PORT is 3000 while NGINX runs on 8080.
  // 3. In production deployments (Render/Fly/Railway), use assigned process.env.PORT.
  const isProd = process.env.NODE_ENV === 'production';
  let PORT = 3000;
  if (cliPort && !isNaN(cliPort)) {
    PORT = cliPort;
  } else if (process.env.DEFAULT_APP_PORT && !isNaN(parseInt(process.env.DEFAULT_APP_PORT, 10))) {
    PORT = parseInt(process.env.DEFAULT_APP_PORT, 10);
  } else if (isProd && process.env.PORT && !isNaN(parseInt(process.env.PORT, 10))) {
    PORT = parseInt(process.env.PORT, 10);
  } else if (process.env.PORT && process.env.PORT !== '8080' && !isNaN(parseInt(process.env.PORT, 10))) {
    PORT = parseInt(process.env.PORT, 10);
  }

  const HOST = cliHost || '0.0.0.0';

  // Capture raw body for webhook HMAC signature verification
  app.use(
    express.json({
      verify: (req: any, _res, buf) => {
        req.rawBody = buf;
      },
    })
  );

  // CORS Middleware: supports unified full-stack (same-origin) and split (e.g. GitHub Pages) architectures
  const rawCorsOrigin = process.env.CORS_ORIGIN?.trim();
  const allowedOrigins =
    rawCorsOrigin && rawCorsOrigin !== '*'
      ? rawCorsOrigin.split(',').map((o) => o.trim().replace(/\/$/, ''))
      : null;

  app.use((req: Request, res: Response, next) => {
    const origin = req.headers.origin;

    if (!allowedOrigins) {
      // Default: unified deployment or open development
      res.header('Access-Control-Allow-Origin', origin || '*');
    } else if (origin && allowedOrigins.includes(origin)) {
      // Explicit allowed origin match
      res.header('Access-Control-Allow-Origin', origin);
      res.header('Vary', 'Origin');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.header(
      'Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept, Authorization, stripe-signature, x-setup-token'
    );
    if (req.method === 'OPTIONS') {
      return res.sendStatus(200);
    }
    next();
  });

  // Apply general API rate limiter to all /api/ routes
  app.use('/api/', apiRateLimiter);

  // Helper: Resolve base URL dynamically from APP_URL or validated request host
  function getBaseUrl(req: Request): string {
    const envUrl = process.env.APP_URL?.trim().replace(/\/+$/, '');
    if (envUrl && envUrl.startsWith('http')) return envUrl;
    const protocol = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
    const host = (req.headers['x-forwarded-host'] as string) || req.headers.host || 'localhost:3000';
    return `${protocol}://${host}`;
  }

  // SEO: robots.txt
  app.get('/robots.txt', (req: Request, res: Response) => {
    res.type('text/plain');
    const baseUrl = getBaseUrl(req);
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/

Sitemap: ${baseUrl}/sitemap.xml
`);
  });

  // SEO: sitemap.xml
  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    res.type('application/xml');
    const baseUrl = getBaseUrl(req);
    const categories = [
      '',
      'latest-news',
      'blogs',
      'quick-summaries',
      'deep-explainers',
      'research-studies',
      'sports-analysis',
      'opinion-editorial',
      'fact-checks',
      'guides-faqs',
      'breaking-news',
      'world',
      'politics-government',
      'elections-public-policy',
      'business-economy',
      'finance-markets',
      'technology-ai',
      'science-space',
      'health-medicine',
      'environment-climate',
      'live-sports',
      'football',
      'cricket',
      'basketball',
      'tennis',
      'formula-1',
      'trending',
      'about-editorial-policy',
    ];

    const { items: publishedArticles } = editorialStore.getArticles({ status: 'published', limit: 200 });

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${categories
  .map(
    (cat) => `  <url>
    <loc>${baseUrl}/${cat}</loc>
    <changefreq>hourly</changefreq>
    <priority>${cat === '' ? '1.0' : '0.8'}</priority>
  </url>`
  )
  .join('\n')}
${publishedArticles
  .map(
    (art) => `  <url>
    <loc>${baseUrl}/article/${art.slug}</loc>
    <lastmod>${new Date(art.updatedAt || art.publishedAt).toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`
  )
  .join('\n')}
</urlset>`;
    res.send(xml);
  });


  // Health check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json(statusService.getHealth());
  });

  // Provider transparency and operational status
  app.get('/api/sources/status', (_req: Request, res: Response) => {
    res.json({
      providers: statusService.getProvidersStatus(),
      summary: statusService.getSummary(),
      lastChecked: new Date().toISOString(),
    });
  });

  // News routes
  app.get('/api/news', async (req: Request, res: Response) => {
    try {
      const category = (req.query.category as string) || '';
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);

      const items = await newsService.getNewsByCategory(category);
      const startIndex = (page - 1) * limit;
      const paginated = items.slice(startIndex, startIndex + limit);

      res.json({
        total: items.length,
        page,
        limit,
        totalPages: Math.ceil(items.length / limit),
        items: paginated,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve news items', details: err.message });
    }
  });

  app.get('/api/news/breaking', async (_req: Request, res: Response) => {
    try {
      const items = await newsService.getBreakingNews();
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve breaking news', details: err.message });
    }
  });

  // Compare Coverage Routes: One story. Different sources. Original reporting.
  app.get('/api/news/compare-featured', async (req: Request, res: Response) => {
    try {
      const limit = parseInt((req.query.limit as string) || '6', 10);
      const comparisons = await compareCoverageService.getFeaturedComparisons(limit);
      res.json({ total: comparisons.length, comparisons });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve featured coverage comparisons', details: err.message });
    }
  });

  app.get('/api/news/compare', async (req: Request, res: Response) => {
    try {
      const articleId = (req.query.id as string) || '';
      if (!articleId) {
        return res.status(400).json({ error: 'Missing article ID parameter (?id=...)' });
      }
      const comparison = await compareCoverageService.getCoverageForArticle(articleId);
      if (!comparison) {
        return res.status(404).json({ error: 'No coverage data available for article' });
      }
      res.json(comparison);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compare coverage', details: err.message });
    }
  });

  app.get('/api/news/:id/compare', async (req: Request, res: Response) => {
    try {
      const comparison = await compareCoverageService.getCoverageForArticle(req.params.id);
      if (!comparison) {
        return res.status(404).json({ error: 'No coverage data available for article' });
      }
      res.json(comparison);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to compare coverage', details: err.message });
    }
  });

  app.get('/api/news/:id', async (req: Request, res: Response) => {
    try {
      const item = await newsService.getNewsById(req.params.id);
      if (!item) {
        return res.status(404).json({ error: 'Article not found' });
      }
      res.json(item);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve article', details: err.message });
    }
  });

  // FactTrail Routes (Continuously tracked news storylines with chronological timelines)
  app.get('/api/facttrail', async (req: Request, res: Response) => {
    try {
      const category = (req.query.category as string) || undefined;
      const search = (req.query.search as string) || (req.query.q as string) || undefined;
      const publisher = (req.query.publisher as string) || undefined;

      const trails = await factTrailService.getAllTrails(category, search, publisher);
      res.json({
        total: trails.length,
        trails,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve FactTrails', details: err.message });
    }
  });

  app.get('/api/facttrail/:id', async (req: Request, res: Response) => {
    try {
      const trail = await factTrailService.getTrailById(req.params.id);
      if (!trail) {
        return res.status(404).json({ error: 'FactTrail story not found' });
      }
      res.json(trail);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve FactTrail detail', details: err.message });
    }
  });

  app.post('/api/facttrail/check-updates', async (req: Request, res: Response) => {
    try {
      const { followed } = req.body;
      const updates = await factTrailService.checkUpdates(Array.isArray(followed) ? followed : []);
      res.json({ updates });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to check FactTrail updates', details: err.message });
    }
  });

  app.get('/api/facttrail/article/:articleId', async (req: Request, res: Response) => {
    try {
      const match = await factTrailService.findTrailForArticle(req.params.articleId);
      res.json({ match });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to query FactTrail for article', details: err.message });
    }
  });

  // Sports routes
  app.get('/api/sports', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const competition = (req.query.competition as string) || undefined;

      const [allFixtures, live, today, upcoming, results, standings, competitions, providerInfo] = await Promise.all([
        sportsService.getFixtures({ sport, competition }),
        sportsService.getLiveScoreboard(sport),
        sportsService.getTodayMatches(sport),
        sportsService.getUpcomingFixtures(sport),
        sportsService.getRecentResults(sport),
        sportsService.getStandings(competition, sport),
        sportsService.getCompetitions(sport),
        sportsService.getProviderStatus(),
      ]);

      res.json({
        liveCount: live.length,
        todayCount: today.length,
        upcomingCount: upcoming.length,
        resultsCount: results.length,
        live,
        today,
        upcoming,
        results,
        allFixtures,
        topStandings: standings,
        competitions,
        providerInfo,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve sports data', details: err.message });
    }
  });

  app.get('/api/sports/all', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const status = (req.query.status as any) || undefined;
      const competition = (req.query.competition as string) || undefined;
      const items = await sportsService.getFixtures({ sport, status, competition });
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve all sports fixtures', details: err.message });
    }
  });

  app.get('/api/sports/live', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const items = await sportsService.getLiveScoreboard(sport);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve live scores', details: err.message });
    }
  });

  app.get('/api/sports/today', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const items = await sportsService.getTodayMatches(sport);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve today’s matches', details: err.message });
    }
  });

  app.get('/api/sports/fixtures', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const items = await sportsService.getUpcomingFixtures(sport);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve fixtures', details: err.message });
    }
  });

  app.get('/api/sports/results', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const items = await sportsService.getRecentResults(sport);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve match results', details: err.message });
    }
  });

  app.get('/api/sports/standings', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const competition = (req.query.competition as string) || undefined;
      const items = await sportsService.getStandings(competition, sport);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve standings', details: err.message });
    }
  });

  app.get('/api/sports/competitions', async (req: Request, res: Response) => {
    try {
      const sport = (req.query.sport as SportType) || undefined;
      const items = await sportsService.getCompetitions(sport);
      res.json(items);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve competitions', details: err.message });
    }
  });

  app.get('/api/sports/provider-status', async (_req: Request, res: Response) => {
    try {
      const status = await sportsService.getProviderStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve sports provider status', details: err.message });
    }
  });

  // Global search
  // Global smart search across News, Sports, FactTrail, Guides, and AI Tools
  app.get('/api/search', async (req: Request, res: Response) => {
    try {
      const rawQuery = (req.query.q as string) || '';
      const category = (req.query.category as string) || undefined;
      const typeFilter = (req.query.type as string) || 'all'; // 'all' | 'news' | 'sports' | 'guides' | 'tools' | 'facttrail'
      const query = rawQuery.trim().toLowerCase();

      if (!query) {
        return res.json({
          query: '',
          total: 0,
          news: [],
          sports: [],
          articles: [],
          factTrails: [],
          tools: [],
          suggestions: [],
        });
      }

      const queryTokens = query.split(/\s+/).filter(Boolean);

      // 1. News items
      const allNews = await newsService.searchNews(rawQuery, category);
      const newsResults = typeFilter === 'all' || typeFilter === 'news' ? allNews : [];

      // 2. Sports fixtures
      const sportsFixtures = await sportsService.getFixtures();
      const matchedSports =
        typeFilter === 'all' || typeFilter === 'sports'
          ? sportsFixtures.filter(
              (f) =>
                f.homeTeam.name.toLowerCase().includes(query) ||
                f.awayTeam.name.toLowerCase().includes(query) ||
                f.competition.toLowerCase().includes(query) ||
                f.sport.toLowerCase().includes(query)
            )
          : [];

      // 3. Editorial Articles, Deep Explainers & Guides
      const allArticles = editorialStore.getArticles({ limit: 100 }).items;
      const matchedArticles =
        typeFilter === 'all' || typeFilter === 'guides'
          ? allArticles.filter((art: any) => {
              const text = `${art.title} ${art.subtitle || ''} ${art.tags.join(' ')} ${art.category} ${art.content}`.toLowerCase();
              return queryTokens.every((tok) => text.includes(tok)) || text.includes(query);
            })
          : [];

      // 4. FactTrail Storylines
      const allTrails = await factTrailService.getAllTrails();
      const matchedTrails =
        typeFilter === 'all' || typeFilter === 'facttrail'
          ? allTrails.filter((tr) => {
              const text = `${tr.title} ${tr.overview} ${tr.category} ${tr.publishers.join(' ')}`.toLowerCase();
              return queryTokens.every((tok) => text.includes(tok)) || text.includes(query);
            })
          : [];

      // 5. AI Tools Directory entries
      const allTools = editorialStore.getTools();
      const matchedTools =
        typeFilter === 'all' || typeFilter === 'tools'
          ? allTools.filter((tl) => {
              const text = `${tl.name} ${tl.summary} ${tl.category} ${tl.pricing} ${tl.practicalUseCases.join(' ')}`.toLowerCase();
              return queryTokens.every((tok) => text.includes(tok)) || text.includes(query);
            })
          : [];

      // Autocomplete suggestions for typeahead
      const suggestions: string[] = [];
      matchedTools.forEach((t) => suggestions.push(t.name));
      matchedTrails.slice(0, 3).forEach((tr) => suggestions.push(tr.title));
      matchedArticles.slice(0, 3).forEach((a: any) => suggestions.push(a.title));
      newsResults.slice(0, 3).forEach((n) => suggestions.push(n.title));
      const uniqueSuggestions = Array.from(new Set(suggestions)).slice(0, 6);

      res.json({
        query: rawQuery,
        total:
          newsResults.length +
          matchedSports.length +
          matchedArticles.length +
          matchedTrails.length +
          matchedTools.length,
        news: newsResults,
        sports: matchedSports,
        articles: matchedArticles,
        factTrails: matchedTrails,
        tools: matchedTools,
        suggestions: uniqueSuggestions,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Search failed', details: err.message });
    }
  });

  app.get('/api/sports/match/:id', async (req: Request, res: Response) => {
    try {
      const details = await sportsService.getMatchDetails(req.params.id);
      res.json(details);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve match details', details: err.message });
    }
  });

  // Ask FactInfoLive AI Assistant (Protected with server-side rate-limiting)
  app.post('/api/assistant/ask', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const { query, categoryFilter, language } = req.body;
      if (!query || typeof query !== 'string') {
        return res.status(400).json({ error: 'Query is required' });
      }

      const answer = await aiService.askAssistant({
        query,
        categoryFilter,
        language,
      });

      res.json(answer);
    } catch (err: any) {
      res.status(500).json({ error: 'AI Assistant query failed', details: err.message });
    }
  });

  // News translation endpoint (Translates news headlines & summaries with multi-tier caching)
  app.post('/api/news/translate', translationRateLimiter, async (req: Request, res: Response) => {
    try {
      const { items, targetLanguage } = req.body;
      if (!Array.isArray(items) || !targetLanguage || targetLanguage === 'en') {
        return res.json({ items: items || [], targetLanguage: targetLanguage || 'en' });
      }

      const translatedItems = await Promise.all(
        items.slice(0, 30).map(async (item: any) => {
          if (!item.title) return item;
          const tr = await aiService.translateNewsItem(item.title, item.summary || '', targetLanguage);
          return {
            ...item,
            translatedTitle: tr.translated ? tr.title : undefined,
            translatedSummary: tr.translated ? tr.summary : undefined,
            isTranslated: tr.translated,
            translationLanguage: tr.translated ? targetLanguage : undefined,
          };
        })
      );

      res.json({ items: translatedItems, targetLanguage });
    } catch (err: any) {
      res.status(500).json({ error: 'News translation error', details: err?.message });
    }
  });

  // Single article full translation (Headline, summary, and article body content)
  app.post('/api/news/translate-article', translationRateLimiter, async (req: Request, res: Response) => {
    try {
      const { id, title, summary, content, targetLanguage } = req.body;
      if (!title || !targetLanguage || targetLanguage === 'en') {
        return res.json({ id, title, summary, content, translated: false, targetLanguage: 'en' });
      }

      const tr = await aiService.translateArticle(title, summary || '', content, targetLanguage);
      res.json({
        id,
        translatedTitle: tr.translated ? tr.title : title,
        translatedSummary: tr.translated ? tr.summary : summary,
        translatedContent: tr.translated ? tr.content : content,
        isTranslated: tr.translated,
        translationLanguage: tr.translated ? targetLanguage : undefined,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Article translation error', details: err?.message });
    }
  });

  // ==========================================
  // EDITORIAL, BLOGS & EXPLAINERS MODULE
  // ==========================================

  // RSS Feed for Published Articles
  app.get(['/rss.xml', '/feed.xml'], (req: Request, res: Response) => {
    res.type('application/xml');
    const baseUrl = getBaseUrl(req);
    const { items } = editorialStore.getArticles({ status: 'published', limit: 25 });

    const rssXml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FactInfoLive Editorial Intelligence &amp; Research</title>
    <link>${baseUrl}</link>
    <description>Verified deep explainers, research reviews, tactical sports analysis, and investigative dispatches.</description>
    <language>en-us</language>
    <atom:link href="${baseUrl}/feed.xml" rel="self" type="application/rss+xml" />
    ${items
      .map(
        (art) => `
    <item>
      <title><![CDATA[${art.title}]]></title>
      <link>${baseUrl}/article/${art.slug}</link>
      <guid isPermaLink="true">${baseUrl}/article/${art.slug}</guid>
      <pubDate>${new Date(art.publishedAt || art.updatedAt).toUTCString()}</pubDate>
      <author>${art.author.name}</author>
      <description><![CDATA[${art.subtitle || art.content.slice(0, 200)}]]></description>
      <category>${art.category}</category>
    </item>`
      )
      .join('')}
  </channel>
</rss>`;
    res.send(rssXml);
  });

  // ==========================================
  // SECURE AUTHENTICATION & ACCESS CONTROL
  // ==========================================

  // Auth: Setup Status (Checks whether master admin has been initialized)
  app.get('/api/auth/setup-status', (_req: Request, res: Response) => {
    res.json(editorialStore.getSetupStatus());
  });

  // Auth: First-Time Master Admin Setup (Locked permanently once created)
  app.post('/api/auth/setup-admin', authRateLimiter, (req: Request, res: Response) => {
    try {
      const { username, name, email, password, setupToken } = req.body;
      if (!username || !name || !email || !password) {
        return res.status(400).json({ error: 'Username, full name, email, and password are required' });
      }

      const result = editorialStore.setupAdmin({
        username,
        name,
        email,
        password,
        setupToken,
      });

      if (!result.success) {
        return res.status(403).json({ error: result.error || 'Setup failed' });
      }

      res.status(201).json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'First-time setup encountered a server error', details: err.message });
    }
  });

  // Auth: Login with scrypt, timingSafeEqual, and rate-limiting
  app.post('/api/auth/login', authRateLimiter, (req: Request, res: Response) => {
    const { username, identifier, password } = req.body;
    const userIdentifier = identifier || username;
    if (!userIdentifier || !password) {
      return res.status(400).json({ error: 'Username/email and password are required' });
    }

    const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.socket.remoteAddress || '127.0.0.1';
    const result = editorialStore.login(userIdentifier, password, clientIp);

    if (!result.success) {
      return res.status(401).json({ error: result.error || 'Invalid credentials' });
    }

    res.json(result);
  });


  // Auth: Verify session token
  app.get('/api/auth/verify', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ authenticated: false });
    }
    res.json({ authenticated: true, user });
  });

  // Auth: Logout
  app.post('/api/auth/logout', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    editorialStore.logout(authHeader);
    res.json({ success: true, message: 'Logged out successfully' });
  });

  // Overview Metrics Dashboard
  app.get('/api/admin/overview', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Session invalid or expired' });
    }
    const overview = editorialStore.getDashboardOverview();
    res.json(overview);
  });

  // User Management (Administrator Only)
  app.get('/api/admin/users', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    }
    res.json(editorialStore.getUsers());
  });

  app.post('/api/admin/users', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    }
    const { username, name, email, role, password } = req.body;
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, name, and password are required' });
    }
    const newUser = editorialStore.createUser({ username, name, email: email || '', role: role || 'author', password });
    res.status(201).json(newUser);
  });

  app.put('/api/admin/users/:id/password', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    }
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'New password is required' });
    }
    const success = editorialStore.updateUserPassword(req.params.id, password);
    if (!success) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ success: true, message: 'Password updated successfully' });
  });

  // ==========================================
  // EDITORIAL WORKFLOW & CONTENT OPERATIONS
  // ==========================================

  // List articles (Public: published only; Admin/Editor/Author: with requested status)
  app.get('/api/editorial/articles', (req: Request, res: Response) => {
    try {
      const type = (req.query.type as any) || undefined;
      const category = (req.query.category as string) || undefined;
      const search = (req.query.search as string) || undefined;
      const requestedStatus = (req.query.status as any) || undefined;
      const page = parseInt((req.query.page as string) || '1', 10);
      const limit = parseInt((req.query.limit as string) || '20', 10);

      const authHeader = req.headers.authorization;
      const user = editorialStore.verifySession(authHeader);

      let statusFilter = requestedStatus;
      if (!user && requestedStatus && requestedStatus !== 'published') {
        // Public visitors can ONLY view published articles
        statusFilter = 'published';
      }

      const result = editorialStore.getArticles({
        type,
        category,
        search,
        status: statusFilter,
        page,
        limit,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve editorial articles', details: err.message });
    }
  });

  // Get article by slug or ID
  app.get('/api/editorial/articles/:slug', (req: Request, res: Response) => {
    try {
      const slug = req.params.slug;
      const article = editorialStore.getArticleBySlug(slug);
      if (!article) {
        return res.status(404).json({ error: 'Editorial article not found' });
      }

      // If non-published, require authenticated user
      if (article.status !== 'published') {
        const authHeader = req.headers.authorization;
        const user = editorialStore.verifySession(authHeader);
        if (!user) {
          return res.status(403).json({ error: 'This article is pending editorial verification' });
        }
      }

      res.json(article);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to load article', details: err.message });
    }
  });

  // Create article (Authenticated authors, editors, administrators)
  app.post('/api/editorial/articles', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Active editorial session required' });
    }

    try {
      const articleData = req.body;
      // Authors cannot publish directly without review
      if (user.role === 'author' && articleData.status === 'published') {
        articleData.status = 'needs_review';
      }

      const created = editorialStore.createArticle(articleData, user.name);
      res.status(201).json(created);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to create article', details: err.message });
    }
  });

  // Update article / advance editorial status
  app.put('/api/editorial/articles/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Active editorial session required' });
    }

    try {
      const id = req.params.id;
      const updates = req.body;

      // Authors cannot publish directly; can only submit for review
      if (user.role === 'author' && updates.status === 'published') {
        updates.status = 'needs_review';
      }

      const updated = editorialStore.updateArticle(id, updates, user.name);
      if (!updated) {
        return res.status(404).json({ error: 'Article not found' });
      }
      res.json(updated);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to update article', details: err.message });
    }
  });

  // Add correction note to article (Editors & Administrators)
  app.post('/api/editorial/articles/:id/corrections', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') {
      return res.status(403).json({ error: 'Forbidden: Editor or Administrator role required for corrections' });
    }

    const { note } = req.body;
    if (!note) {
      return res.status(400).json({ error: 'Correction note text required' });
    }

    const success = editorialStore.addCorrectionNote(req.params.id, note, user.name);
    if (!success) {
      return res.status(404).json({ error: 'Article not found' });
    }
    res.json({ success: true, message: 'Correction note affixed to public record' });
  });

  // Delete / Archive article (Editors & Administrators)
  app.delete('/api/editorial/articles/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') {
      return res.status(403).json({ error: 'Forbidden: Editor or Administrator role required' });
    }

    try {
      const id = req.params.id;
      const success = editorialStore.deleteArticle(id);
      if (!success) {
        return res.status(404).json({ error: 'Article not found' });
      }
      res.json({ success: true, message: 'Article removed' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to delete article', details: err.message });
    }
  });

  // ==========================================
  // AI WRITING & RESEARCH ASSISTANT
  // ==========================================

  // AI Workflow: Generates 10-step draft saved into `ai_draft` for human review
  app.post('/api/editorial/ai-workflow', aiRateLimiter, async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Active editorial session required' });
    }

    try {
      const { topic, type, category } = req.body;
      if (!topic) {
        return res.status(400).json({ error: 'Topic or headline prompt required' });
      }

      const result = await editorialAiService.runAiWorkflow({
        topic,
        type: type || 'explainer',
        category,
      });

      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: 'AI editorial workflow failed', details: err.message });
    }
  });

  // Suggest real developments for editorial coverage (Editorial session required)
  app.get('/api/editorial/suggest-ideas', aiRateLimiter, async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Active editorial session required' });
    }

    try {
      const ideas = await editorialAiService.suggestIdeas();
      res.json(ideas);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to suggest ideas', details: err.message });
    }
  });


  // Multilingual translation helper (en, it, fr, es, de, ur, ar)
  app.post('/api/editorial/translate', aiRateLimiter, async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Active editorial session required' });
    }

    try {
      const { content, targetLanguage } = req.body;
      if (!content || !targetLanguage) {
        return res.status(400).json({ error: 'Content and targetLanguage required' });
      }

      const translation = await editorialAiService.translateContent(content, targetLanguage);
      res.json(translation);
    } catch (err: any) {
      res.status(500).json({ error: 'Translation failed', details: err.message });
    }
  });

  // Claims and citations auditor
  app.post('/api/editorial/audit-claims', aiRateLimiter, async (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Active editorial session required' });
    }

    try {
      const { content } = req.body;
      if (!content) {
        return res.status(400).json({ error: 'Content required for audit' });
      }
      const audit = await editorialAiService.auditArticleClaims(content);
      res.json(audit);
    } catch (err: any) {
      res.status(500).json({ error: 'Claims audit failed', details: err.message });
    }
  });

  // Generate 10-point structured summary for any news story (with language translation support)
  app.post('/api/editorial/summarize-story', aiRateLimiter, async (req: Request, res: Response) => {
    try {
      const { story, language } = req.body;
      if (!story || !story.title) {
        return res.status(400).json({ error: 'Valid story object required' });
      }

      const summary = await editorialAiService.generateStorySummary(story, language || 'en');
      res.json(summary);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to generate structured summary', details: err.message });
    }
  });

  // ==========================================
  // MONETIZATION & GROWTH CONTROL CENTER
  // ==========================================

  // Monetization Settings
  app.get('/api/monetization/settings', (_req: Request, res: Response) => {
    res.json(editorialStore.getMonetizationSettings());
  });

  app.put('/api/monetization/settings', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    }

    const updated = editorialStore.updateMonetizationSettings(req.body);
    res.json(updated);
  });

  // Affiliate Links Manager
  app.get('/api/monetization/affiliate-links', (_req: Request, res: Response) => {
    res.json(editorialStore.getAffiliateLinks());
  });

  app.post('/api/monetization/affiliate-links', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') {
      return res.status(403).json({ error: 'Forbidden: Editor or Administrator role required' });
    }

    const { title, targetUrl, disclosureLabel, category, campaignTag } = req.body;
    if (!title || !targetUrl) {
      return res.status(400).json({ error: 'Title and targetUrl required' });
    }

    const created = editorialStore.createAffiliateLink({
      title,
      targetUrl,
      disclosureLabel: disclosureLabel || 'FactInfoLive may earn an ethical affiliate commission on qualifying purchases.',
      category: category || 'general',
      campaignTag: campaignTag || '',
      active: true,
    });
    res.status(201).json(created);
  });

  app.put('/api/monetization/affiliate-links/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') {
      return res.status(403).json({ error: 'Forbidden: Editor or Administrator role required' });
    }

    const updated = editorialStore.updateAffiliateLink(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Affiliate link not found' });
    res.json(updated);
  });

  app.delete('/api/monetization/affiliate-links/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') {
      return res.status(403).json({ error: 'Forbidden: Administrator role required' });
    }

    const success = editorialStore.deleteAffiliateLink(req.params.id);
    if (!success) return res.status(404).json({ error: 'Affiliate link not found' });
    res.json({ success: true });
  });

  // Track affiliate click safely
  app.post('/api/monetization/track-affiliate-click', (req: Request, res: Response) => {
    const { id } = req.body;
    if (id) {
      editorialStore.trackAffiliateClick(id);
    }
    res.json({ tracked: true });
  });

  // Direct Sponsorships: Public Inquiry with Anti-Spam Honeypot
  app.post('/api/sponsorship/inquire', (req: Request, res: Response) => {
    try {
      const { companyName, contactEmail, packageType, message, budgetRange, websiteHoneypot } = req.body;
      // Spam honeypot detection: if honeypot field is filled by bot, silently discard
      if (websiteHoneypot) {
        return res.json({ success: true, message: 'Inquiry received for verification.' });
      }

      if (!companyName || !contactEmail || !message) {
        return res.status(400).json({ error: 'Company name, contact email, and message are required' });
      }

      const inquiry = editorialStore.submitSponsorshipInquiry({
        companyName,
        contactEmail,
        packageType: packageType || 'newsletter',
        message,
        budgetRange,
      });

      res.status(201).json({
        success: true,
        message: 'Sponsorship inquiry submitted to Editorial Partnerships Desk. Our team will review your proposal.',
        inquiryId: inquiry.id,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit sponsorship inquiry', details: err.message });
    }
  });

  // Sponsorship inquiries management (Admin/Editor)
  app.get('/api/sponsorship/inquiries', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Session invalid' });
    }
    res.json(editorialStore.getSponsorshipInquiries());
  });

  app.put('/api/sponsorship/inquiries/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Session invalid' });
    }

    const { status } = req.body;
    const success = editorialStore.updateSponsorshipStatus(req.params.id, status);
    if (!success) return res.status(404).json({ error: 'Inquiry not found' });
    res.json({ success: true });
  });

  // Patronage & Voluntary Supporter Contributions
  app.get('/api/patronage/patrons', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    res.json(editorialStore.getPatrons(Boolean(user)));
  });

  // Patronage: Record demonstration / offline pledge in local ledger
  app.post('/api/patronage/contribute', (req: Request, res: Response) => {
    try {
      const { patronName, patronEmail, amount, currency, interval, tierName, anonymous } = req.body;
      if (!patronEmail || !amount || Number(amount) <= 0) {
        return res.status(400).json({ error: 'Valid email and contribution amount required' });
      }

      const receipt = editorialStore.recordPatronContribution({
        patronName: (patronName || '').trim() || 'Anonymous Supporter',
        patronEmail: (patronEmail || '').trim().toLowerCase(),
        amount: Number(amount),
        currency: currency || 'EUR',
        interval: interval || 'one-time',
        tierName: tierName || 'Reader Supporter',
        anonymous: Boolean(anonymous),
        paymentMethod: 'Demonstration Mode / Local Ledger Entry (No Real Payment Charged)',
      });

      res.status(201).json({
        success: true,
        message: 'Offline pledge / test entry recorded into local ledger.',
        receipt,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to record contribution', details: err.message });
    }
  });

  // ==========================================
  // REAL PAYMENT WEBHOOKS (Stripe HMAC-SHA256)
  // ==========================================
  app.post('/api/webhooks/stripe', (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim();

    if (!webhookSecret) {
      return res.status(503).json({
        error:
          'Stripe webhook integration not configured. To verify real transactions, configure STRIPE_WEBHOOK_SECRET in server environment.',
      });
    }

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    const rawBody = (req as any).rawBody;
    if (!rawBody) {
      return res.status(400).json({ error: 'Raw body required for HMAC verification' });
    }

    try {
      // Signature format: t=timestamp,v1=signature
      const parts = signature.split(',');
      const timestampPart = parts.find((p) => p.startsWith('t='));
      const sigPart = parts.find((p) => p.startsWith('v1='));

      if (!timestampPart || !sigPart) {
        return res.status(400).json({ error: 'Malformed stripe-signature header' });
      }

      const timestamp = timestampPart.slice(2);
      const receivedSignature = sigPart.slice(3);

      // Verify timestamp is within 300 seconds to prevent replay attacks
      const eventTime = parseInt(timestamp, 10);
      if (Math.abs(Math.floor(Date.now() / 1000) - eventTime) > 300) {
        return res.status(400).json({ error: 'Stripe webhook timestamp is outside tolerance window' });
      }

      const signedPayload = `${timestamp}.${rawBody.toString('utf-8')}`;
      const computedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(signedPayload)
        .digest('hex');

      const bufReceived = Buffer.from(receivedSignature, 'hex');
      const bufComputed = Buffer.from(computedSignature, 'hex');

      if (bufReceived.length !== bufComputed.length || !crypto.timingSafeEqual(bufReceived, bufComputed)) {
        return res.status(400).json({ error: 'Stripe webhook signature HMAC verification failed' });
      }

      const event = JSON.parse(rawBody.toString('utf-8'));

      if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const patronName = session.customer_details?.name || 'Verified Patron';
        const patronEmail = session.customer_details?.email || 'patron@domain.com';
        const amount = (session.amount_total || 0) / 100;
        const currency = (session.currency || 'EUR').toUpperCase();
        const interval = session.mode === 'subscription' ? 'monthly' : 'one-time';

        editorialStore.recordPatronContribution({
          patronName,
          patronEmail,
          amount,
          currency,
          interval,
          tierName: amount >= 25 ? 'Founding Patron' : amount >= 9 ? 'Sustaining Fellow' : 'Reader Supporter',
          anonymous: false,
          paymentMethod: 'Stripe Verified Gateway',
        });
      }

      res.json({ received: true });
    } catch (err: any) {
      res.status(400).json({ error: 'Webhook processing error', details: err.message });
    }
  });


  // Newsletter Subscribers (Admin)
  app.get('/api/newsletter/subscribers', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Session invalid' });
    }
    res.json(editorialStore.getSubscribers());
  });

  // Newsletter Unsubscribe Endpoint
  app.get('/api/newsletter/unsubscribe', (req: Request, res: Response) => {
    const token = req.query.token as string;
    if (!token) {
      return res.status(400).send('Invalid unsubscribe token.');
    }
    const success = editorialStore.unsubscribeNewsletter(token);
    if (success) {
      res.send(`
        <!doctype html>
        <html>
          <head><title>Unsubscribed - FactInfoLive</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #0f172a; color: #f8fafc;">
            <div style="max-width: 450px; text-align: center; padding: 32px; background: #1e293b; border-radius: 16px; border: 1px solid #334155;">
              <h2 style="margin-top: 0; color: #38bdf8;">Unsubscribed Successfully</h2>
              <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">You have been removed from the FactInfoLive Research Dispatches mailing list. You can re-subscribe at any time on the website.</p>
              <a href="/" style="display: inline-block; margin-top: 16px; padding: 10px 20px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 14px;">Return to Front Page</a>
            </div>
          </body>
        </html>
      `);
    } else {
      res.status(404).send('Subscription record not found or already unsubscribed.');
    }
  });

  // Newsletter Subscription
  app.post('/api/newsletter/subscribe', (req: Request, res: Response) => {
    try {
      const { email, categories } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email address is required' });
      }

      const result = editorialStore.subscribeNewsletter(email, categories);
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ success: false, message: err.message });
    }
  });

  // ==========================================
  // SEO & ORGANIC GROWTH CENTER
  // ==========================================

  // Content Health Audit
  app.get('/api/seo/audit', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Session invalid' });
    }
    res.json(editorialStore.getSeoAudit());
  });

  // ==========================================
  // PRIVACY-CONSCIOUS FIRST-PARTY ANALYTICS
  // ==========================================

  // Ingest analytics event
  app.post('/api/analytics/event', (req: Request, res: Response) => {
    try {
      const { type, path: eventPath, articleSlug, category, metadata } = req.body;
      if (!type) return res.status(400).json({ error: 'Event type required' });

      editorialStore.logAnalyticsEvent({
        type,
        path: eventPath,
        articleSlug,
        category,
        metadata,
        timestamp: new Date().toISOString(),
      });
      res.json({ recorded: true });
    } catch {
      res.status(200).json({ recorded: false });
    }
  });

  // Analytics summary for Admin Dashboard
  app.get('/api/analytics/summary', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: Session invalid' });
    }
    res.json(editorialStore.getAnalyticsSummary());
  });

  // ==========================================
  // AI TOOLS DIRECTORY & AUTHENTIC REVIEWS
  // ==========================================

  // Public: List verified AI tools
  app.get('/api/tools', (req: Request, res: Response) => {
    try {
      const category = (req.query.category as string) || undefined;
      const pricing = (req.query.pricing as string) || undefined;
      const search = (req.query.search as string) || undefined;
      const tools = editorialStore.getTools({ category, pricing, search, status: 'published' });
      res.json(tools);
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve AI tools', details: err.message });
    }
  });

  // Public: Get single AI tool by slug with approved reviews
  app.get('/api/tools/:slug', (req: Request, res: Response) => {
    try {
      const tool = editorialStore.getToolBySlug(req.params.slug);
      if (!tool) return res.status(404).json({ error: 'AI tool not found' });
      const reviews = editorialStore.getToolReviews(tool.id, false);
      res.json({ ...tool, reviews });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to retrieve AI tool', details: err.message });
    }
  });

  // Public: Suggest a Tool (submitted to moderation queue)
  app.post('/api/tools/submit', (req: Request, res: Response) => {
    try {
      const { name, websiteUrl, category, pricing, summary, practicalUseCases, importantRestrictions, submittedBy } = req.body;
      if (!name || !websiteUrl) {
        return res.status(400).json({ error: 'Tool name and official website URL are required' });
      }
      const newTool = editorialStore.suggestTool({
        name,
        websiteUrl,
        category: category || 'productivity',
        pricing: pricing || 'freemium',
        summary: summary || '',
        practicalUseCases: Array.isArray(practicalUseCases) ? practicalUseCases : [],
        importantRestrictions: Array.isArray(importantRestrictions) ? importantRestrictions : [],
        submittedBy: submittedBy || 'Community Reader',
      });
      res.status(201).json({
        message: 'Thank you for your submission. Our editorial team will audit the tool against our verification guidelines before publishing.',
        tool: newTool,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit tool', details: err.message });
    }
  });

  // Public: Submit authentic user review for an AI tool (submitted to moderation queue)
  app.post('/api/tools/:id/review', (req: Request, res: Response) => {
    try {
      const toolId = req.params.id;
      const tool = editorialStore.getToolById(toolId);
      if (!tool) return res.status(404).json({ error: 'AI tool not found' });

      const { authorName, rating, comment, useCase } = req.body;
      if (!authorName || !rating || !comment) {
        return res.status(400).json({ error: 'Author name, rating (1-5), and written comment are required' });
      }
      const numericRating = Math.max(1, Math.min(5, Math.round(Number(rating))));
      const newReview = editorialStore.addToolReview({
        toolId,
        authorName: String(authorName).slice(0, 50),
        rating: numericRating,
        comment: String(comment).slice(0, 1000),
        useCase: useCase ? String(useCase).slice(0, 100) : undefined,
        status: 'pending',
        isEditorialAssessment: false,
      });
      res.status(201).json({
        message: 'Your review has been submitted to the moderation queue to ensure authenticity and prevent spam.',
        review: newReview,
      });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to submit review', details: err.message });
    }
  });

  // Admin: List all tools (including pending review)
  app.get('/api/admin/tools', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) return res.status(401).json({ error: 'Unauthorized: Session invalid' });
    const status = (req.query.status as string) || undefined;
    res.json(editorialStore.getTools({ status }));
  });

  // Admin: Create tool directly
  app.post('/api/admin/tools', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') {
      return res.status(403).json({ error: 'Forbidden: Editor or Administrator role required' });
    }
    const created = editorialStore.createTool(req.body, user.name);
    res.status(201).json(created);
  });

  // Admin: Update tool
  app.put('/api/admin/tools/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') {
      return res.status(403).json({ error: 'Forbidden: Editor or Administrator role required' });
    }
    const updated = editorialStore.updateTool(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Tool not found' });
    res.json(updated);
  });

  // Admin: Delete tool
  app.delete('/api/admin/tools/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') {
      return res.status(403).json({ error: 'Forbidden: Administrator privileges required' });
    }
    const success = editorialStore.deleteTool(req.params.id);
    if (!success) return res.status(404).json({ error: 'Tool not found' });
    res.json({ success: true });
  });

  // Admin: Moderation Queues (Submissions & Reviews)
  app.get('/api/admin/tools/submissions', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(editorialStore.getToolSubmissions());
  });

  const handleApproveSub = (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') return res.status(403).json({ error: 'Forbidden' });
    const approved = editorialStore.approveToolSubmission(req.params.id);
    if (!approved) return res.status(404).json({ error: 'Submission not found' });
    res.json(approved);
  };
  app.put('/api/admin/tools/submissions/:id/approve', handleApproveSub);
  app.post('/api/admin/tools/submissions/:id/approve', handleApproveSub);

  const handleRejectSub = (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') return res.status(403).json({ error: 'Forbidden' });
    const rejected = editorialStore.rejectToolSubmission(req.params.id);
    if (!rejected) return res.status(404).json({ error: 'Submission not found' });
    res.json(rejected);
  };
  app.put('/api/admin/tools/submissions/:id/reject', handleRejectSub);
  app.post('/api/admin/tools/submissions/:id/reject', handleRejectSub);

  app.get('/api/admin/reviews/pending', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(editorialStore.getPendingReviews());
  });

  const handleApproveRev = (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') return res.status(403).json({ error: 'Forbidden' });
    const approved = editorialStore.approveReview(req.params.id);
    if (!approved) return res.status(404).json({ error: 'Review not found' });
    res.json(approved);
  };
  app.put('/api/admin/reviews/:id/approve', handleApproveRev);
  app.post('/api/admin/reviews/:id/approve', handleApproveRev);

  const handleRejectRev = (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role === 'author') return res.status(403).json({ error: 'Forbidden' });
    const rejected = editorialStore.rejectReview(req.params.id);
    if (!rejected) return res.status(404).json({ error: 'Review not found' });
    res.json(rejected);
  };
  app.put('/api/admin/reviews/:id/reject', handleRejectRev);
  app.post('/api/admin/reviews/:id/reject', handleRejectRev);

  // ==========================================
  // E-COMMERCE READINESS PRODUCT CATALOG
  // ==========================================

  // Public: Products (only if enabled)
  app.get('/api/products', (_req: Request, res: Response) => {
    res.json(editorialStore.getProducts(false));
  });

  // Admin: All products
  app.get('/api/admin/products', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user) return res.status(401).json({ error: 'Unauthorized' });
    res.json(editorialStore.getProducts(true));
  });

  app.post('/api/admin/products', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') return res.status(403).json({ error: 'Forbidden' });
    const created = editorialStore.createProduct(req.body);
    res.status(201).json(created);
  });

  app.put('/api/admin/products/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') return res.status(403).json({ error: 'Forbidden' });
    const updated = editorialStore.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  });

  app.delete('/api/admin/products/:id', (req: Request, res: Response) => {
    const authHeader = req.headers.authorization;
    const user = editorialStore.verifySession(authHeader);
    if (!user || user.role !== 'administrator') return res.status(403).json({ error: 'Forbidden' });
    const success = editorialStore.deleteProduct(req.params.id);
    if (!success) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true });
  });

  // ==========================================
  // SEO ENDPOINTS (SITEMAP & ROBOTS.TXT)
  // ==========================================

  app.get('/robots.txt', (_req: Request, res: Response) => {
    res.type('text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin
Disallow: /api/
Sitemap: /sitemap.xml
`);
  });

  app.get('/sitemap.xml', async (req: Request, res: Response) => {
    try {
      const host = req.get('host') || 'factinfolive.org';
      const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
      const baseUrl = `${protocol}://${host}`;

      const articles = editorialStore.getArticles({ limit: 500 }).items;
      const tools = editorialStore.getTools();
      const trails = await factTrailService.getAllTrails();

      let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
      xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;

      // Static routes
      const staticRoutes = [
        { loc: '/', changefreq: 'hourly', priority: '1.0' },
        { loc: '/editorial-policy', changefreq: 'monthly', priority: '0.6' },
        { loc: '/corrections', changefreq: 'weekly', priority: '0.6' },
      ];

      for (const r of staticRoutes) {
        xml += `  <url>\n    <loc>${baseUrl}${r.loc}</loc>\n    <changefreq>${r.changefreq}</changefreq>\n    <priority>${r.priority}</priority>\n  </url>\n`;
      }

      // Editorial Articles & Guides
      for (const a of articles) {
        xml += `  <url>\n    <loc>${baseUrl}/?article=${encodeURIComponent(a.slug)}</loc>\n    <lastmod>${(a.updatedAt || a.publishedAt).split('T')[0]}</lastmod>\n    <changefreq>weekly</changefreq>\n    <priority>0.8</priority>\n  </url>\n`;
      }

      // AI Tools
      for (const t of tools) {
        xml += `  <url>\n    <loc>${baseUrl}/?tool=${encodeURIComponent(t.slug)}</loc>\n    <lastmod>${(t.updatedAt || t.createdAt).split('T')[0]}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.7</priority>\n  </url>\n`;
      }

      // FactTrail Storylines
      for (const tr of trails) {
        xml += `  <url>\n    <loc>${baseUrl}/?story=${encodeURIComponent(tr.id)}</loc>\n    <lastmod>${tr.latestUpdateAt.split('T')[0]}</lastmod>\n    <changefreq>daily</changefreq>\n    <priority>0.9</priority>\n  </url>\n`;
      }

      xml += `</urlset>`;
      res.type('application/xml');
      res.send(xml);
    } catch (err: any) {
      res.status(500).type('text/plain').send('Error generating sitemap: ' + err.message);
    }
  });

  // Downloadable Verified Project Archive for GitHub / Deployment Backup
  app.get('/factinfolive-release-backup.zip', (_req: Request, res: Response) => {
    const zipPath = path.resolve(__dirname, 'public/factinfolive-release-backup.zip');
    if (fs.existsSync(zipPath)) {
      res.download(zipPath, 'factinfolive-release-backup.zip');
    } else {
      res.status(404).send('Backup archive not found');
    }
  });

  // Return clean JSON 404 for unmatched API routes to prevent SPA HTML interception
  app.all(['/api', '/api/*'], (_req: Request, res: Response) => {
    res.status(404).json({ error: 'API endpoint not found' });
  });

  // Global API error handler ensuring JSON responses on unexpected exceptions
  app.use('/api', (err: any, _req: Request, res: Response, _next: any) => {
    console.error('API Error handler:', err);
    res.status(500).json({ error: 'Internal API error', details: err?.message || 'Unknown error' });
  });

  // Vite middleware in dev or static files in prod
  if (!isProd) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR === 'true' ? false : undefined,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(__dirname, 'dist/index.html'));
    });
  }

  const server = app.listen(PORT, HOST, () => {
    console.log(`FactInfoLive server listening on http://${HOST}:${PORT} (${isProd ? 'production' : 'development'})`);
  });

  server.on('error', (err: any) => {
    console.error(`Server error on ${HOST}:${PORT}:`, err.message || err);
  });
}

startServer().catch((err) => {
  console.error('Fatal server error:', err);
  process.exit(1);
});
