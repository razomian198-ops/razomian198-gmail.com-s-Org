import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Header } from './components/Header.tsx';
import { LeadStory } from './components/LeadStory.tsx';
import { LiveSportsCenter } from './components/LiveSportsCenter.tsx';
import { NewsGrid } from './components/NewsGrid.tsx';
import { CompareCoveragePanel } from './components/CompareCoveragePanel.tsx';
import { AdBanner } from './components/AdBanner.tsx';
import { Footer } from './components/Footer.tsx';
import { NeonlytechBar } from './components/NeonlytechPromo.tsx';
import { FactTrailSection } from './components/FactTrailSection.tsx';
import { ImpactBriefSection } from './components/ImpactBriefSection.tsx';
import { ConsentBanner } from './components/ConsentBanner.tsx';
import { LazyVisible } from './components/LazyVisible.tsx';
import { TopicTiles } from './components/TopicTiles.tsx';
import {
  NewsItem,
  SportsFixture,
  SportsStanding,
  EditorialArticle
} from '../server/services/types.ts';
import { SupportedLanguage } from './i18n/translations.ts';
import { Loader2 } from 'lucide-react';
import { safeFetchJson } from './utils/api.ts';
import { applyPageMeta } from './utils/pageMeta.ts';
import {
  HOME_ROUTE,
  routeForPath,
  routeForId,
  pathForCategoryId,
  articleSlugFromPath,
  isAdminPath,
  normalizePath,
} from './data/routes.ts';

const EDITORIAL_SECTIONS = [
  'latest-news',
  'blogs',
  'quick-summaries',
  'deep-explainers',
  'research-studies',
  'sports-analysis',
  'opinion-editorial',
  'fact-checks',
  'guides-faqs',
];

// Heavy views and modals are split into separate chunks and fetched on demand.
const CompareCoverageModal = lazy(() => import('./components/CompareCoverageModal.tsx').then((m) => ({ default: m.CompareCoverageModal })));
const ArticleModal = lazy(() => import('./components/ArticleModal.tsx').then((m) => ({ default: m.ArticleModal })));
const SearchModal = lazy(() => import('./components/SearchModal.tsx').then((m) => ({ default: m.SearchModal })));
const ProviderStatusModal = lazy(() => import('./components/ProviderStatusModal.tsx').then((m) => ({ default: m.ProviderStatusModal })));
const ContactView = lazy(() => import('./components/ContactView.tsx').then((m) => ({ default: m.ContactView })));
const EditorialPolicyView = lazy(() => import('./components/EditorialPolicyView.tsx').then((m) => ({ default: m.EditorialPolicyView })));
const CategoryView = lazy(() => import('./components/CategoryView.tsx').then((m) => ({ default: m.CategoryView })));
const AllTopicsModal = lazy(() => import('./components/AllTopicsModal.tsx').then((m) => ({ default: m.AllTopicsModal })));
const EditorialSectionView = lazy(() => import('./components/EditorialSectionView.tsx').then((m) => ({ default: m.EditorialSectionView })));
const BlogDetailView = lazy(() => import('./components/BlogDetailView.tsx').then((m) => ({ default: m.BlogDetailView })));
const StructuredSummaryModal = lazy(() => import('./components/StructuredSummaryModal.tsx').then((m) => ({ default: m.StructuredSummaryModal })));
const EditorialAdminModal = lazy(() => import('./components/EditorialAdminModal.tsx').then((m) => ({ default: m.EditorialAdminModal })));
const AdminDashboard = lazy(() => import('./components/AdminDashboard.tsx').then((m) => ({ default: m.AdminDashboard })));
const SupporterModal = lazy(() => import('./components/SupporterModal.tsx').then((m) => ({ default: m.SupporterModal })));
const SponsorshipModal = lazy(() => import('./components/SponsorshipModal.tsx').then((m) => ({ default: m.SponsorshipModal })));
const FactTrailView = lazy(() => import('./components/FactTrailView.tsx').then((m) => ({ default: m.FactTrailView })));
const FactTrailDetailView = lazy(() => import('./components/FactTrailDetailView.tsx').then((m) => ({ default: m.FactTrailDetailView })));
const AiToolsDirectory = lazy(() => import('./components/AiToolsDirectory.tsx').then((m) => ({ default: m.AiToolsDirectory })));

/** Mounts children the first time `when` is true and keeps them mounted afterwards (so exit animations still work). */
function MountOnDemand({ when, children }: { when: boolean; children: React.ReactNode }) {
  const [seen, setSeen] = useState(when);
  useEffect(() => {
    if (when) setSeen(true);
  }, [when]);
  if (!when && !seen) return null;
  return <Suspense fallback={null}>{children}</Suspense>;
}

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  // The URL is the source of truth for which section is open (e.g. /ai-tools, /blogs)
  const [activeCategory, setActiveCategory] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return routeForPath(window.location.pathname)?.id || 'home';
    }
    return 'home';
  });
  const [news, setNews] = useState<NewsItem[]>([]);
  const [breakingNews, setBreakingNews] = useState<NewsItem[]>([]);
  const [fixtures, setFixtures] = useState<SportsFixture[]>([]);
  const [standings, setStandings] = useState<SportsStanding[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeCategoryFilter, setActiveCategoryFilter] = useState<string>('all');
  const [selectedArticle, setSelectedArticle] = useState<NewsItem | null>(null);
  const [selectedCompareStory, setSelectedCompareStory] = useState<NewsItem | null>(null);

  // Dedicated Route: /admin Full Dashboard State
  const [isAdminRoute, setIsAdminRoute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.location.pathname.startsWith('/admin');
    }
    return false;
  });

  // Editorial & CMS state
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return articleSlugFromPath(window.location.pathname);
    }
    return null;
  });
  const [activeBlogArticle, setActiveBlogArticle] = useState<EditorialArticle | null>(null);
  const [loadingBlogArticle, setLoadingBlogArticle] = useState(false);
  const [relatedBlogArticles, setRelatedBlogArticles] = useState<EditorialArticle[]>([]);
  const [selectedSummaryStory, setSelectedSummaryStory] = useState<NewsItem | null>(null);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Monetization Modals state
  const [isSupporterModalOpen, setIsSupporterModalOpen] = useState(false);
  const [isSponsorshipModalOpen, setIsSponsorshipModalOpen] = useState(false);

  // Navigation Modals state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isAllTopicsOpen, setIsAllTopicsOpen] = useState(false);

  // FactTrail storyline tracking state (synced with ?story= URL param)
  const [selectedTrailId, setSelectedTrailId] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('story');
    }
    return null;
  });

  // Sync /admin URL path and ?story= / ?tool= query param with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
      const params = new URLSearchParams(window.location.search);
      setSelectedTrailId(params.get('story'));
      // Keep the open section / article in step with the address bar (back/forward buttons)
      const slugFromUrl = articleSlugFromPath(window.location.pathname);
      setSelectedBlogSlug(slugFromUrl);
      if (!slugFromUrl) {
        setActiveCategory(routeForPath(window.location.pathname)?.id || 'home');
      }
      if (params.get('tool')) {
        setActiveCategory('ai-tools');
      }
      if (params.get('brief')) {
        setActiveCategory('home');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Give every section its own URL, <title> and description (the server does the same for crawlers)
  const isFirstUrlSync = React.useRef(true);
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const current = normalizePath(window.location.pathname);
    if (isAdminPath(current) || articleSlugFromPath(current)) return;

    // First render: never rewrite the address (an unknown URL must stay as typed, the
    // server already answered it with a 404 status).
    if (isFirstUrlSync.current) {
      isFirstUrlSync.current = false;
      if (!routeForPath(current)) return;
    }

    const route = routeForId(activeCategory) || HOME_ROUTE;
    if (routeForPath(current)?.id !== route.id) {
      window.history.pushState({}, '', route.path);
    }
    applyPageMeta(route.title, route.description, route.path);
  }, [activeCategory]);

  const handleOpenTrail = (trailId: string) => {
    setSelectedTrailId(trailId);
    setSelectedBlogSlug(null);
    const url = new URL(window.location.href);
    url.searchParams.set('story', trailId);
    window.history.pushState({}, '', url.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBackFromTrail = () => {
    setSelectedTrailId(null);
    const url = new URL(window.location.href);
    url.searchParams.delete('story');
    window.history.pushState({}, '', url.pathname + (url.search || ''));
  };

  // Sync dark class on root document element
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Initial Data Fetch
  const loadInitialData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [newsRes, breakingRes, sportsRes, standingsRes] = await Promise.allSettled([
        safeFetchJson<{ items: NewsItem[] }>('/api/news'),
        safeFetchJson<NewsItem[]>('/api/news/breaking'),
        safeFetchJson<any>('/api/sports'),
        safeFetchJson<SportsStanding[]>('/api/sports/standings'),
      ]);

      if (newsRes.status === 'fulfilled' && newsRes.value?.ok && newsRes.value.data?.items) {
        setNews(newsRes.value.data.items);
      }
      if (breakingRes.status === 'fulfilled' && breakingRes.value?.ok && Array.isArray(breakingRes.value.data)) {
        setBreakingNews(breakingRes.value.data);
      }
      if (sportsRes.status === 'fulfilled' && sportsRes.value?.ok && sportsRes.value.data) {
        const sVal = sportsRes.value.data;
        const fixtureList = Array.isArray(sVal)
          ? sVal
          : (sVal.allFixtures || [...(sVal.live || []), ...(sVal.today || []), ...(sVal.upcoming || []), ...(sVal.results || [])]);
        setFixtures(fixtureList);
        if (sVal.topStandings && Array.isArray(sVal.topStandings)) {
          setStandings(sVal.topStandings);
        }
      }
      if (standingsRes.status === 'fulfilled' && standingsRes.value?.ok && Array.isArray(standingsRes.value.data)) {
        setStandings((prev) => (prev.length > 0 ? prev : standingsRes.value.data!));
      }
    } catch (err) {
      console.warn('Initial platform data synchronization notice:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // News & Breaking news translation effect: Translates headlines and summaries when non-English is selected
  useEffect(() => {
    let isMounted = true;

    async function translateNews() {
      if (currentLanguage === 'en') {
        // When returning to English, ensure original content is restored
        setNews((prev) =>
          prev.map((n) => ({
            ...n,
            isTranslated: false,
            translationLanguage: 'en',
          }))
        );
        setBreakingNews((prev) =>
          prev.map((b) => ({
            ...b,
            isTranslated: false,
            translationLanguage: 'en',
          }))
        );
        return;
      }

      if (news.length === 0 && breakingNews.length === 0) return;

      try {
        // 1. Translate news items (up to 30 items)
        if (news.length > 0) {
          const targetNews = news.slice(0, 30);
          const res = await safeFetchJson<{ items: any[] }>('/api/news/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: targetNews.map((n) => ({ id: n.id, title: n.title, summary: n.summary })),
              targetLanguage: currentLanguage,
            }),
          });

          if (res.ok && res.data && isMounted) {
            const data = res.data;
            if (Array.isArray(data.items)) {
              const map = new Map<string, any>();
              for (const item of data.items) {
                map.set(item.id, item);
              }

              setNews((prev) =>
                prev.map((n) => {
                  const tr = map.get(n.id);
                  if (tr && tr.isTranslated) {
                    return {
                      ...n,
                      translatedTitle: tr.translatedTitle,
                      translatedSummary: tr.translatedSummary,
                      isTranslated: true,
                      translationLanguage: currentLanguage,
                    };
                  }
                  return n;
                })
              );
            }
          }
        }

        // 2. Translate breaking news ticker
        if (breakingNews.length > 0) {
          const bRes = await safeFetchJson<{ items: any[] }>('/api/news/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              items: breakingNews.map((b) => ({ id: b.id, title: b.title, summary: b.summary })),
              targetLanguage: currentLanguage,
            }),
          });

          if (bRes.ok && bRes.data && isMounted) {
            const bData = bRes.data;
            if (Array.isArray(bData.items)) {
              const bMap = new Map<string, any>(bData.items.map((it: any) => [it.id, it]));
              setBreakingNews((prev) =>
                prev.map((b) => {
                  const tr = bMap.get(b.id);
                  if (tr && tr.isTranslated) {
                    return {
                      ...b,
                      translatedTitle: tr.translatedTitle,
                      translatedSummary: tr.translatedSummary,
                      isTranslated: true,
                      translationLanguage: currentLanguage,
                    };
                  }
                  return b;
                })
              );
            }
          }
        }
      } catch (err) {
        console.warn('News translation skipped:', err);
      }
    }

    translateNews();
    return () => {
      isMounted = false;
    };
  }, [currentLanguage, news.length, breakingNews.length]);

  // Fetch individual blog/explainer article when selectedBlogSlug changes
  useEffect(() => {
    if (!selectedBlogSlug) {
      setActiveBlogArticle(null);
      return;
    }

    setLoadingBlogArticle(true);
    safeFetchJson<EditorialArticle>(`/api/editorial/articles/${selectedBlogSlug}`)
      .then((res) => {
        if (!res.ok || !res.data) throw new Error('Not found');
        return res.data;
      })
      .then((data: EditorialArticle) => {
        setActiveBlogArticle(data);
        setLoadingBlogArticle(false);
        // Also fetch related articles in same department
        safeFetchJson<{ items: EditorialArticle[] }>(`/api/editorial/articles?category=${data.category}&limit=4`)
          .then((relRes) => {
            if (relRes.ok && relRes.data?.items) {
              setRelatedBlogArticles(relRes.data.items.filter((a: EditorialArticle) => a.id !== data.id));
            }
          })
          .catch(() => {});
      })
      .catch(() => {
        setLoadingBlogArticle(false);
      });
  }, [selectedBlogSlug]);

  // If user navigated to /admin, render the full Admin Dashboard
  if (isAdminRoute) {
    return (
      <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200 w-full max-w-full min-w-0">
        <Suspense fallback={<div className="flex items-center justify-center py-32 text-blue-600"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        <AdminDashboard
          currentLanguage={currentLanguage}
          onBackToHome={() => {
            window.history.pushState({}, '', '/');
            setIsAdminRoute(false);
            setActiveCategory('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenArticleBySlug={(slug) => {
            window.history.pushState({}, '', `/article/${slug}`);
            setSelectedBlogSlug(slug);
            setIsAdminRoute(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />
        </Suspense>
      </div>
    );
  }

  // Select lead story: prioritize first news item with image and title, fallback to news[0], then breakingNews[0]
  const leadStory =
    news.find((n) => n.imageUrl && n.title) ||
    (news.length > 0 ? news[0] : null) ||
    (breakingNews.length > 0 ? breakingNews[0] : null);

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-stone-100 flex flex-col font-sans transition-colors duration-200 w-full max-w-full min-w-0">
      {/* Primary Masthead & Navigation */}
      <Header
        currentLanguage={currentLanguage}
        onLanguageChange={setCurrentLanguage}
        isDarkMode={isDarkMode}
        onThemeToggle={() => setIsDarkMode(!isDarkMode)}
        breakingNews={breakingNews}
        activeCategory={activeCategory}
        onSelectCategory={(cat) => {
          setSelectedBlogSlug(null);
          setSelectedTrailId(null);
          if (cat === 'all-topics') {
            const url = new URL(window.location.href);
            url.searchParams.delete('story');
            window.history.replaceState({}, '', url.pathname + (url.search || ''));
            setIsAllTopicsOpen(true);
          } else {
            // Navigate to the section's own URL (also leaves /article/... and clears ?story=)
            window.history.pushState({}, '', pathForCategoryId(cat));
            setActiveCategory(cat);
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenSearch={() => setIsSearchOpen(true)}
        onOpenStatusModal={() => setIsStatusModalOpen(true)}
        onOpenArticle={(item) => setSelectedArticle(item)}
        onOpenAdminModal={() => setIsAdminModalOpen(true)}
        onOpenAdminDashboard={() => {
          window.history.pushState({}, '', '/admin');
          setIsAdminRoute(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSupporterModal={() => setIsSupporterModalOpen(true)}
      />

      <NeonlytechBar />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 sm:space-y-12">
        {/* Ethical Ad Banner: Header Billboard (Renders only if enabled by admin in Revenue settings) */}
        <AdBanner slot="headerBillboard" className="w-full" />

        <Suspense fallback={<div className="flex items-center justify-center py-24 text-blue-600"><Loader2 className="w-8 h-8 animate-spin" /></div>}>
        {selectedBlogSlug ? (
          /* View Individual Blog / Deep Explainer / Research Article */
          loadingBlogArticle ? (
            <div className="flex items-center justify-center py-32 text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : activeBlogArticle ? (
            <BlogDetailView
              currentLanguage={currentLanguage}
              article={activeBlogArticle}
              onBack={() => setSelectedBlogSlug(null)}
              onOpenArticleBySlug={(slug) => {
                setSelectedBlogSlug(slug);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              relatedArticles={relatedBlogArticles}
            />
          ) : (
            <div className="text-center py-20 text-slate-500">
              Article not found or pending editorial review.
            </div>
          )
        ) : selectedTrailId ? (
          /* Dedicated FactTrail Story Timeline & Source Matrix View */
          <FactTrailDetailView
            trailId={selectedTrailId}
            onBack={handleBackFromTrail}
            onOpenArticleByUrl={(url) => window.open(url, '_blank')}
          />
        ) : activeCategory === 'facttrail' ? (
          /* Dedicated FactTrail Story Tracker Directory */
          <FactTrailView
            onBackToHome={() => {
              setActiveCategory('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenTrail={handleOpenTrail}
          />
        ) : activeCategory === 'ai-tools' || activeCategory === 'reviews' ? (
          /* Dedicated AI Tools Directory & Authentic Reviews Benchmark Hub */
          <AiToolsDirectory
            currentLanguage={currentLanguage}
            onBackToHome={() => {
              setActiveCategory('home');
              const url = new URL(window.location.href);
              url.searchParams.delete('tool');
              window.history.pushState({}, '', url.pathname + (url.search || ''));
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        ) : EDITORIAL_SECTIONS.includes(activeCategory) ? (
          /* Dedicated View for the 9 Editorial Channels (Blogs, Quick Summaries, Deep Explainers, etc.) */
          <EditorialSectionView
            currentLanguage={currentLanguage}
            sectionType={activeCategory}
            onBackToHome={() => setActiveCategory('home')}
            onOpenArticleBySlug={(slug) => {
              setSelectedBlogSlug(slug);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenNewsArticle={(item) => setSelectedArticle(item)}
            onOpenNewsSummary={(item) => setSelectedSummaryStory(item)}
            onOpenSummaryModal={(art) => {
              setSelectedSummaryStory({
                id: art.id,
                title: art.title,
                summary: art.subtitle || art.content.slice(0, 200),
                content: art.content,
                publisher: `FactInfoLive / ${art.author.name}`,
                author: art.author.name,
                url: `${window.location.origin}/article/${art.slug}`,
                publishedAt: art.publishedAt || art.updatedAt,
                retrievedAt: new Date().toISOString(),
                category: art.category,
                language: 'en',
                tags: art.tags,
                sourceType: 'academic',
              });
            }}
          />
        ) : activeCategory === 'contact' ? (
          <ContactView onBackToHome={() => setActiveCategory('home')} />
        ) : activeCategory === 'about' ? (
          /* Editorial Policy & Standards View */
          <EditorialPolicyView
            currentLanguage={currentLanguage}
            onBackToHome={() => setActiveCategory('home')}
          />
        ) : activeCategory !== 'home' ? (
          /* Reusable Category Page for any of the 42 categories */
          <CategoryView
            currentLanguage={currentLanguage}
            categoryId={activeCategory}
            onBackToHome={() => setActiveCategory('home')}
            onOpenArticle={(item) => setSelectedArticle(item)}
            allFixtures={fixtures}
            allStandings={standings}
          />
        ) : (
          /* Home Page Experience */
          <>
            {/* A. Lead Story */}
            <LeadStory
              story={leadStory}
              loading={loading}
              onRetry={loadInitialData}
              onOpenArticle={(story) => setSelectedArticle(story)}
              onOpenSummary={(story) => setSelectedSummaryStory(story)}
              onCompareCoverage={(story) => setSelectedCompareStory(story)}
              currentLanguage={currentLanguage}
            />

            {/* Browse by topic */}
            <TopicTiles
              onSelectCategory={(id) => {
                setSelectedBlogSlug(null);
                setActiveCategory(id);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* D. Latest World News Feed Grid */}
            <NewsGrid
              currentLanguage={currentLanguage}
              news={news}
              activeCategoryFilter={activeCategoryFilter}
              onFilterChange={setActiveCategoryFilter}
              onOpenArticle={(item) => setSelectedArticle(item)}
              onOpenSummary={(item) => setSelectedSummaryStory(item)}
              onCompareCoverage={(item) => setSelectedCompareStory(item)}
            />

            {/* Deeper features load only when scrolled near */}
            <LazyVisible minHeight={320}>
            <ImpactBriefSection
              currentLanguage={currentLanguage}
              onOpenFactTrail={handleOpenTrail}
              onCompareCoverage={(story) => setSelectedCompareStory(story)}
              onOpenArticle={(item) => setSelectedArticle(item)}
            />
            </LazyVisible>

            <LazyVisible minHeight={420}>
            <LiveSportsCenter
              currentLanguage={currentLanguage}
              fixtures={fixtures}
              standings={standings}
            />
            </LazyVisible>

            <LazyVisible minHeight={320}>
            <FactTrailSection
              onOpenTrail={handleOpenTrail}
              onViewAllTrails={() => {
                setActiveCategory('facttrail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
            </LazyVisible>

            <AdBanner slot="inArticle" />

            <LazyVisible minHeight={320}>
            <CompareCoveragePanel
              currentLanguage={currentLanguage}
              onOpenFactTrail={handleOpenTrail}
              onOpenArticleDetail={(artId) => {
                const found = news.find((n) => n.id === artId);
                if (found) setSelectedArticle(found);
              }}
            />
            </LazyVisible>
          </>
        )}
        </Suspense>
      </main>

      {/* Broadsheet Footer */}
      <Footer
        currentLanguage={currentLanguage}
        onSelectCategory={(cat) => {
          setSelectedBlogSlug(null);
          setActiveCategory(cat);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenStatusModal={() => setIsStatusModalOpen(true)}
        onOpenAdminDashboard={() => {
          window.history.pushState({}, '', '/admin');
          setIsAdminRoute(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenSupporterModal={() => setIsSupporterModalOpen(true)}
        onOpenSponsorshipModal={() => setIsSponsorshipModalOpen(true)}
      />

      {/* Modals */}
      <MountOnDemand when={!!selectedArticle}>
      <ArticleModal
        currentLanguage={currentLanguage}
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onOpenFactTrail={handleOpenTrail}
        onCompareCoverage={(story) => setSelectedCompareStory(story)}
      />
      </MountOnDemand>

      <MountOnDemand when={!!selectedCompareStory}>
      <CompareCoverageModal
        currentLanguage={currentLanguage}
        article={selectedCompareStory}
        onClose={() => setSelectedCompareStory(null)}
        onOpenFactTrail={handleOpenTrail}
      />
      </MountOnDemand>

      <MountOnDemand when={!!selectedSummaryStory}>
      <StructuredSummaryModal
        currentLanguage={currentLanguage}
        story={selectedSummaryStory}
        onClose={() => setSelectedSummaryStory(null)}
      />
      </MountOnDemand>

      <MountOnDemand when={isSearchOpen}>
      <SearchModal
        currentLanguage={currentLanguage}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenArticle={(item) => setSelectedArticle(item)}
        onOpenArticleBySlug={(slug) => {
          setSelectedBlogSlug(slug);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenTrail={(trailId) => {
          handleOpenTrail(trailId);
        }}
        onOpenTool={(toolSlug) => {
          setActiveCategory('ai-tools');
          const url = new URL(window.location.href);
          url.searchParams.set('tool', toolSlug);
          window.history.pushState({}, '', url.toString());
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      </MountOnDemand>

      <MountOnDemand when={isStatusModalOpen}>
      <ProviderStatusModal
        currentLanguage={currentLanguage}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />
      </MountOnDemand>

      <MountOnDemand when={isAllTopicsOpen}>
      <AllTopicsModal
        currentLanguage={currentLanguage}
        isOpen={isAllTopicsOpen}
        onClose={() => setIsAllTopicsOpen(false)}
        onSelectCategory={(catId) => {
          setSelectedBlogSlug(null);
          setActiveCategory(catId);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
      </MountOnDemand>

      <MountOnDemand when={isAdminModalOpen}>
      <EditorialAdminModal
        currentLanguage={currentLanguage}
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onArticlePublished={(art) => {
          setSelectedBlogSlug(art.slug);
        }}
      />
      </MountOnDemand>

      <MountOnDemand when={isSupporterModalOpen}>
      <SupporterModal
        currentLanguage={currentLanguage}
        isOpen={isSupporterModalOpen}
        onClose={() => setIsSupporterModalOpen(false)}
      />
      </MountOnDemand>

      <MountOnDemand when={isSponsorshipModalOpen}>
      <SponsorshipModal
        currentLanguage={currentLanguage}
        isOpen={isSponsorshipModalOpen}
        onClose={() => setIsSponsorshipModalOpen(false)}
      />
      </MountOnDemand>

      {/* GDPR / ePrivacy Cookie & Privacy Consent Banner */}
      <ConsentBanner />
    </div>
  );
}
