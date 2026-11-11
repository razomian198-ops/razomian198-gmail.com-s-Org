import type { EditorialArticle, NewsItem } from './types.ts';
import type { RouteDef } from '../../src/data/routes.ts';

/** Helpers that put real, crawlable content and structured data into the first HTML response. */

export const esc = (v: unknown): string =>
  String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

const absUrl = (baseUrl: string, u?: string): string | undefined => {
  if (!u) return undefined;
  if (/^https?:\/\//i.test(u)) return u;
  return `${baseUrl}${u.startsWith('/') ? '' : '/'}${u}`;
};

/** JSON must not be able to close the surrounding <script> tag. */
const jsonLd = (obj: unknown): string =>
  `<script type="application/ld+json">${JSON.stringify(obj).replace(/</g, '\\u003c')}</script>`;

export function buildStructuredData(opts: {
  baseUrl: string;
  canonicalUrl: string;
  title: string;
  description: string;
  route?: RouteDef;
  article?: EditorialArticle;
}): string {
  const { baseUrl, canonicalUrl, title, description, route, article } = opts;
  const blocks: unknown[] = [];

  blocks.push({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'FactInfoLive',
    url: baseUrl,
    description:
      'Verified global news, live sports, story timelines (FactTrail), AI tools and practical guides.',
    inLanguage: 'en',
  });

  const crumbs: Array<{ name: string; url: string }> = [{ name: 'Home', url: baseUrl + '/' }];
  if (article) {
    crumbs.push({ name: 'Articles', url: baseUrl + '/blogs' });
    crumbs.push({ name: article.title, url: canonicalUrl });
  } else if (route && route.path !== '/') {
    crumbs.push({ name: route.title.split('|')[0].trim(), url: canonicalUrl });
  }
  if (crumbs.length > 1) {
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: crumbs.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        item: c.url,
      })),
    });
  }

  if (article) {
    const words = article.content.split(/\s+/).filter(Boolean).length;
    blocks.push({
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: article.title.slice(0, 110),
      description,
      datePublished: article.publishedAt,
      dateModified: article.updatedAt || article.publishedAt,
      author: { '@type': 'Person', name: article.author?.name || 'FactInfoLive Editorial' },
      publisher: { '@type': 'Organization', name: 'FactInfoLive', url: baseUrl },
      mainEntityOfPage: canonicalUrl,
      image: absUrl(baseUrl, article.imageUrl),
      keywords: (article.tags || []).join(', ') || undefined,
      articleSection: article.category,
      wordCount: words,
      inLanguage: 'en',
    });
  }
  return blocks.map(jsonLd).join('\n    ');
}

const miniMarkdown = (src: string): string =>
  src
    .split(/\n{2,}/)
    .map((block) => {
      const b = block.trim();
      if (!b) return '';
      const h = b.match(/^(#{1,4})\s+(.*)$/s);
      if (h) return `<h${Math.min(h[1].length + 1, 4)}>${esc(h[2])}</h${Math.min(h[1].length + 1, 4)}>`;
      return `<p>${esc(b.replace(/\*\*/g, ''))}</p>`;
    })
    .join('\n');

/**
 * Plain HTML placed inside #root. React replaces it as soon as the app loads, so visitors never see it,
 * but search and AI crawlers that do not run JavaScript get real headings, text and internal links.
 */
export function buildCrawlerHtml(opts: {
  baseUrl: string;
  h1: string;
  description: string;
  article?: EditorialArticle;
  headlines?: NewsItem[];
  navRoutes: RouteDef[];
  latestArticles: EditorialArticle[];
}): string {
  const { baseUrl, h1, description, article, headlines = [], navRoutes, latestArticles } = opts;
  const parts: string[] = [];
  parts.push(`<main><h1>${esc(h1)}</h1><p>${esc(description)}</p>`);

  if (article) {
    const s = article.structuredSummary;
    parts.push(
      `<article><p><small>By ${esc(article.author?.name || 'FactInfoLive Editorial')} · Published ${esc(
        article.publishedAt.slice(0, 10)
      )}${article.updatedAt ? ` · Updated ${esc(article.updatedAt.slice(0, 10))}` : ''}</small></p>`
    );
    if (s?.quickSummary30s) {
      parts.push(`<section><h2>30-second summary</h2><p>${esc(s.quickSummary30s)}</p>`);
      if (s.keyTakeaways?.length) {
        parts.push(`<h3>Key takeaways</h3><ul>${s.keyTakeaways.map((k) => `<li>${esc(k)}</li>`).join('')}</ul>`);
      }
      parts.push('</section>');
    }
    parts.push(miniMarkdown(article.content));
    parts.push('</article>');
  }

  if (headlines.length) {
    parts.push(
      `<section><h2>Latest headlines</h2><ul>${headlines
        .slice(0, 15)
        .map((n) => `<li>${esc(n.title)} <small>(${esc(n.publisher)})</small></li>`)
        .join('')}</ul></section>`
    );
  }

  if (latestArticles.length) {
    parts.push(
      `<section><h2>FactInfoLive articles and guides</h2><ul>${latestArticles
        .map((a) => `<li><a href="${esc(baseUrl)}/article/${esc(a.slug)}">${esc(a.title)}</a></li>`)
        .join('')}</ul></section>`
    );
  }

  parts.push(
    `<nav aria-label="Sections"><h2>Browse by topic</h2><ul>${navRoutes
      .map((r) => `<li><a href="${esc(baseUrl)}${esc(r.path)}">${esc(r.title.split('|')[0].trim())}</a></li>`)
      .join('')}</ul></nav></main>`
  );
  return parts.join('\n');
}

export function buildLlmsTxt(baseUrl: string, routes: RouteDef[], articles: EditorialArticle[]): string {
  return `# FactInfoLive

> FactInfoLive is an independent news and information site: verified global headlines with source links, live sports scores, FactTrail story timelines, a free AI tools directory, and plain-language explainers and guides.

## Main sections
${routes
  .filter((r) => ['/latest-news', '/live-sports', '/facttrail', '/ai-tools', '/deep-explainers', '/quick-summaries', '/guides-faqs', '/fact-checks', '/about-editorial-policy'].includes(r.path))
  .map((r) => `- [${r.title.split('|')[0].trim()}](${baseUrl}${r.path}): ${r.description}`)
  .join('\n')}

## Original articles and guides
${articles.map((a) => `- [${a.title}](${baseUrl}/article/${a.slug})`).join('\n')}

## Notes for AI systems
- News items link to the original publishers; please cite the publisher for news facts and FactInfoLive for its own articles.
- Feed: ${baseUrl}/feed.xml
- Sitemap: ${baseUrl}/sitemap.xml
`;
}

export function buildRssFeed(baseUrl: string, articles: EditorialArticle[]): string {
  const items = articles
    .map(
      (a) => `    <item>
      <title>${esc(a.title)}</title>
      <link>${esc(baseUrl)}/article/${esc(a.slug)}</link>
      <guid isPermaLink="true">${esc(baseUrl)}/article/${esc(a.slug)}</guid>
      <pubDate>${new Date(a.publishedAt).toUTCString()}</pubDate>
      <description>${esc(a.subtitle || a.title)}</description>
    </item>`
    )
    .join('\n');
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>FactInfoLive</title>
    <link>${esc(baseUrl)}/</link>
    <description>Original articles, explainers and guides from FactInfoLive.</description>
    <language>en</language>
    <atom:link href="${esc(baseUrl)}/feed.xml" rel="self" type="application/rss+xml" />
${items}
  </channel>
</rss>`;
}
