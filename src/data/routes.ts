import { CATEGORIES } from './categories.ts';

/**
 * Single source of truth for public URLs.
 * Used by the React app (history + document.title) and by the Express server
 * (per-page <title>/<meta> injection, sitemap and 404 handling).
 */
export interface RouteDef {
  id: string; // value of App's `activeCategory`
  path: string; // pathname, always starting with "/"
  title: string;
  description: string;
}

const SITE = 'FactInfoLive';

// Sections that are not part of CATEGORIES
const EXTRA_ROUTES: RouteDef[] = [
  { id: 'facttrail', path: '/facttrail', title: `FactTrail — Follow a Story Over Time | ${SITE}`, description: 'Follow developing stories as they change, with every publisher and update on one timeline.' },
  { id: 'ai-tools', path: '/ai-tools', title: `AI Tools Directory & Benchmarks | ${SITE}`, description: 'Independent AI tools directory: free tiers vs paid plans, best use cases and honest limitations. No sponsored rankings.' },
  { id: 'latest-news', path: '/latest-news', title: `Latest News | ${SITE}`, description: 'Latest headlines from international newsrooms, each linked to the original report.' },
  { id: 'blogs', path: '/blogs', title: `Blogs & Essays | ${SITE}`, description: 'Essays and technical analyses on science, technology, sport and society.' },
  { id: 'quick-summaries', path: '/quick-summaries', title: `30-Second Summaries | ${SITE}`, description: 'Short, source-linked summaries of the day\'s biggest stories.' },
  { id: 'deep-explainers', path: '/deep-explainers', title: `Deep Explainers | ${SITE}`, description: 'Long-form explainers that give context to complex news, science and policy.' },
  { id: 'research-studies', path: '/research-studies', title: `Research & Studies | ${SITE}`, description: 'Plain-language reviews of new research and studies, with links to the papers.' },
  { id: 'sports-analysis', path: '/sports-analysis', title: `Sports Analysis | ${SITE}`, description: 'Tactical and statistical analysis of football, basketball and more.' },
  { id: 'opinion-editorial', path: '/opinion-editorial', title: `Opinion & Editorial | ${SITE}`, description: 'Signed opinion pieces, clearly separated from news reporting.' },
  { id: 'guides-faqs', path: '/guides-faqs', title: `Guides & FAQs | ${SITE}`, description: 'Practical guides for verifying news, using AI tools and reading research.' },
];

function buildRoutes(): RouteDef[] {
  const fromCategories: RouteDef[] = CATEGORIES.filter((c) => c.id !== 'home').map((c) => ({
    id: c.id,
    path: `/${c.slug}`,
    title: `${c.name} | ${SITE}`,
    description: c.description,
  }));

  const byPath = new Map<string, RouteDef>();
  // Extra routes win when a path exists in both lists (e.g. fact-checks)
  for (const r of fromCategories) byPath.set(r.path, r);
  for (const r of EXTRA_ROUTES) {
    const existing = byPath.get(r.path);
    byPath.set(r.path, existing && r.id === 'fact-checks' ? existing : r);
  }
  return Array.from(byPath.values());
}

export const ROUTES: RouteDef[] = buildRoutes();

export const HOME_ROUTE: RouteDef = {
  id: 'home',
  path: '/',
  title: `${SITE} — News, Evidence, Context, AI Tools and Useful Guides`,
  description:
    'Global news from several sources side by side, live sports, FactTrail storylines, an independent AI tools directory and practical guides.',
};

const byId = new Map<string, RouteDef>([[HOME_ROUTE.id, HOME_ROUTE], ...ROUTES.map((r) => [r.id, r] as [string, RouteDef])]);
const byPathMap = new Map<string, RouteDef>([[HOME_ROUTE.path, HOME_ROUTE], ...ROUTES.map((r) => [r.path, r] as [string, RouteDef])]);

// Legacy / alias paths kept so old links do not 404
const ALIASES: Record<string, string> = {
  '/editorial-policy': '/about-editorial-policy',
  '/corrections': '/about-editorial-policy',
  '/reviews': '/ai-tools',
};

export function normalizePath(pathname: string): string {
  const clean = (pathname || '/').split('?')[0].split('#')[0].toLowerCase();
  if (clean.length > 1 && clean.endsWith('/')) return clean.slice(0, -1);
  return clean || '/';
}

export function routeForPath(pathname: string): RouteDef | null {
  const p = normalizePath(pathname);
  return byPathMap.get(p) || byPathMap.get(ALIASES[p] || '') || null;
}

export function routeForId(id: string): RouteDef | null {
  return byId.get(id) || null;
}

export function pathForCategoryId(id: string): string {
  return routeForId(id)?.path || '/';
}

export function articleSlugFromPath(pathname: string): string | null {
  const m = normalizePath(pathname).match(/^\/article\/([a-z0-9-]+)$/);
  return m ? m[1] : null;
}

export function isAdminPath(pathname: string): boolean {
  const p = normalizePath(pathname);
  return p === '/admin' || p.startsWith('/admin/');
}
