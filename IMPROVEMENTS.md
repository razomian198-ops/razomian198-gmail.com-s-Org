# FactInfoLive: improvements on branch `perf-seo-fixes`

Date: 2026-11-11. Base: `main` (commit 272b40f). Nothing here changes env vars, secrets, auth, the database or hosting settings. No paid service was added.

## 1. Speed

| Change | Result |
|---|---|
| Admin dashboard, modals and non-home views are lazy-loaded (`React.lazy` + `Suspense`, `MountOnDemand` in `src/App.tsx`) | Main JS bundle 696 KB -> 389 KB (about 107 KB gzipped). Admin (107 KB) loads only on `/admin` |
| gzip compression (`compression` package, free) | JS transfer 388 KB -> about 107 KB |
| Hashed files in `/assets` cached for 1 year (immutable); other images 1 day; HTML shell `no-cache` | Repeat visits load almost instantly, new deploys still show up |
| `/api/news*` and `/api/sports*` GET: `Cache-Control: public, max-age=30, stale-while-revalidate=120` (provider-status excluded) | Fewer upstream calls |
| Images: `loading="lazy"`, `decoding="async"`, top story image `fetchPriority="high"`, width/height on sports logos | Faster first view, less layout jump |
| Sports fixtures: one shared in-flight fetch for simultaneous visitors, and last good data is kept if all feeds fail | No more request pile-up on the free server |

Local Lighthouse (mobile, production build): Performance 92, SEO 100, Accessibility 88. LCP 2.9 s, TBT 170 ms, CLS 0.036. Live numbers will differ because the live server uses real feeds. Re-measure on pagespeed.web.dev after deploy.

"Load more" for the news list already existed (`NewsGrid`), so it was left as is.

## 2. Real URLs and SEO

- Every section now has its own URL (`/world`, `/live-sports`, `/facttrail`, `/article/<slug>` ...). Back/forward buttons work. Route table: `src/data/routes.ts`.
- Each URL gets its own title, description, canonical, og:title/url/image in the first HTML response (and on the client via `src/utils/pageMeta.ts`).
- Unknown URLs and unpublished articles return a real HTTP 404 with `noindex` (before, everything returned 200).
- `/sitemap.xml` lists only real pages. `/admin` is `noindex` and its public footer link was removed.
- JSON-LD uses the real domain; og:image is an absolute URL.

## 3. Bug fix

- FactTrail / Compare Coverage clustering is stricter (headline overlap gate plus entity/number rules in `server/services/factTrailService.ts`) so unrelated stories (for example a sports story and a company story) are less likely to be merged. This is a hardening. The exact live case could not be reproduced because the feed had rolled over.

## 4. Dependencies

- Added `compression` and `@types/compression`. `bun.lock` was already out of step with `package.json` (esbuild, tsx) and was re-synced. Check the first Render build log.

## 5. Not done (needs your decision)

- Homepage re-organisation into categories (design decision).
- Copied RSS content and "original reporting" wording, trust labels such as "Verified", placeholder author, missing Privacy and Contact pages (needs your real text).
- Persistent database for the JSON store (Render free disk is ephemeral).
- Per-image alt text audit; decorative team logos intentionally use empty alt.

## How to test before merging

1. Deploy this branch as a Render preview.
2. Open home, switch sections (URL should change), open an article, open a wrong URL (404 page), view `/sitemap.xml`.
3. Run PageSpeed on mobile and desktop.
4. If all is fine, merge the pull request. To undo, revert the merge.

## Round 2 (branch `home-cleanup-seo`)

- Home page: removed the static "Scientific Discovery Desk" block (large image, fixed text, unverified "Peer-Reviewed" label). Added a "Browse by topic" block with real links. Impact Brief, Live Sports, FactTrail and Compare Coverage now load only when scrolled near (less work and fewer API calls on first load). The deep-explainer article is still reachable from its own pages.
- SEO/AEO: first HTML response now contains real headings, text and internal links (React replaces it on load). Articles include their full text and 30-second summary. JSON-LD added: WebSite, BreadcrumbList, and Article for every article. Organization data points to the real editorial-policy page.
- `robots.txt` explicitly allows Google, Bing and AI search crawlers (GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended, Applebot); `/admin` and `/api/` stay closed.
- New `/llms.txt` (site summary for AI systems) and `/feed.xml` (RSS of original articles), advertised with a `<link rel="alternate">` tag.
- Honest limit: ranking also needs original content, backlinks and time. Code only makes the site easy to crawl and understand.

## Round 3 (contact, trust, growth)
- Contact page (`/contact`) with a public email, plus logo/favicon/RSS autodiscovery.
- Footer cleanup (feeds links removed from public footer; contact link added).
- Article audit; new sourced articles (batches 2 and 3). Every article shows a notice that it may contain mistakes and lists its sources.
- Moderated reader feedback under every article, stored in Supabase (`feedback`, RLS: public can only add pending rows and read approved ones).
- Admin surfaces checked: admin endpoints require login; first-time admin setup needs a setup token.
- Labelled NEONLYTECH "developed by" strip (all pages), article card and footer links, UTM-tagged.
- Durable backup: the editorial store (articles, admin users, settings) is copied to Supabase table `site_state` (RLS on, no public policy) and restored on startup. Needs env `SUPABASE_SECRET_KEY` on Render.
