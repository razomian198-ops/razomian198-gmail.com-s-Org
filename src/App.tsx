import React, { useEffect, useState } from 'react';
import { Header } from './components/Header.tsx';
import { LeadStory } from './components/LeadStory.tsx';
import { LiveSportsCenter } from './components/LiveSportsCenter.tsx';
import { NewsGrid } from './components/NewsGrid.tsx';
import { CompareCoveragePanel } from './components/CompareCoveragePanel.tsx';
import { CompareCoverageModal } from './components/CompareCoverageModal.tsx';
import { ArticleModal } from './components/ArticleModal.tsx';
import { SearchModal } from './components/SearchModal.tsx';
import { ProviderStatusModal } from './components/ProviderStatusModal.tsx';
import { EditorialPolicyView } from './components/EditorialPolicyView.tsx';
import { CategoryView } from './components/CategoryView.tsx';
import { AllTopicsModal } from './components/AllTopicsModal.tsx';
import { EditorialSectionView } from './components/EditorialSectionView.tsx';
import { BlogDetailView } from './components/BlogDetailView.tsx';
import { StructuredSummaryModal } from './components/StructuredSummaryModal.tsx';
import { EditorialAdminModal } from './components/EditorialAdminModal.tsx';
import { AdminDashboard } from './components/AdminDashboard.tsx';
import { SupporterModal } from './components/SupporterModal.tsx';
import { SponsorshipModal } from './components/SponsorshipModal.tsx';
import { AdBanner } from './components/AdBanner.tsx';
import { Footer } from './components/Footer.tsx';
import { FactTrailSection } from './components/FactTrailSection.tsx';
import { FactTrailView } from './components/FactTrailView.tsx';
import { FactTrailDetailView } from './components/FactTrailDetailView.tsx';
import {
  NewsItem,
  SportsFixture,
  SportsStanding,
  EditorialArticle
} from '../server/services/types.ts';
import { SupportedLanguage } from './i18n/translations.ts';
import { Loader2 } from 'lucide-react';
import { safeFetchJson } from './utils/api.ts';

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

export default function App() {
  const [currentLanguage, setCurrentLanguage] = useState<SupportedLanguage>('en');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true);
  const [activeCategory, setActiveCategory] = useState<string>('home');
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
  const [selectedBlogSlug, setSelectedBlogSlug] = useState<string | null>(null);
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

  // Sync /admin URL path and ?story= query param with browser navigation
  useEffect(() => {
    const handlePopState = () => {
      setIsAdminRoute(window.location.pathname.startsWith('/admin'));
      const params = new URLSearchParams(window.location.search);
      setSelectedTrailId(params.get('story'));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
          const url = new URL(window.location.href);
          url.searchParams.delete('story');
          window.history.pushState({}, '', url.pathname + (url.search || ''));
          if (cat === 'all-topics') {
            setIsAllTopicsOpen(true);
          } else {
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

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-10 sm:space-y-12">
        {/* Ethical Ad Banner: Header Billboard (Renders only if enabled by admin in Revenue settings) */}
        <AdBanner slot="headerBillboard" className="w-full" />

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

            {/* B. FactTrail Story Tracker Showcase — Follow the Story, Not Just the Headline */}
            <FactTrailSection
              onOpenTrail={handleOpenTrail}
              onViewAllTrails={() => {
                setActiveCategory('facttrail');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />

            {/* C. Live Sports Center */}
            <LiveSportsCenter
              currentLanguage={currentLanguage}
              fixtures={fixtures}
              standings={standings}
            />

            {/* In-Article Contextual Ad Banner */}
            <AdBanner slot="inArticle" />

            {/* C. Compare Coverage — One story. Different sources. Original reporting. */}
            <CompareCoveragePanel
              currentLanguage={currentLanguage}
              onOpenFactTrail={handleOpenTrail}
              onOpenArticleDetail={(artId) => {
                const found = news.find((n) => n.id === artId);
                if (found) setSelectedArticle(found);
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

            {/* E. Departmental Focus: Science & Space Highlights */}
            <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-6 sm:p-8">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800 mb-6">
                <div>
                  <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                    Scientific Discovery Desk
                  </div>
                  <h2 className="text-xl sm:text-2xl font-bold font-editorial text-slate-950 dark:text-white mt-1">
                    Astrophysics, Space &amp; Deep Tech Verification
                  </h2>
                </div>
                <button
                  onClick={() => setActiveCategory('deep-explainers')}
                  className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  Explore Deep Explainers →
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="rounded-lg overflow-hidden aspect-video bg-stone-100 dark:bg-slate-950 relative">
                  <img
                    src="/images/science_discovery_lab_1792529244932.jpg"
                    alt="Science Discovery Telemetry"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-[11px] text-stone-200">
                    Observatory telemetry workspace · James Webb Space Telescope Analysis
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="text-xs text-slate-500 font-medium">NASA / ESA Astrophysical Database · Peer-Reviewed</div>
                  <h3 className="text-lg sm:text-xl font-bold font-editorial text-slate-900 dark:text-white">
                    Spectroscopic Telemetry Confirms Atmospheric Water Vapor Signatures on Sub-Neptune Exoplanet
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                    Astronomers cross-referencing NIRSpec data confirm distinct methane and water molecular absorption bands in the habitable zone. FactInfoLive verifies raw observational data directly against open astrophysics repositories.
                  </p>
                  <div className="pt-2 flex items-center gap-3">
                    <button
                      onClick={() => setSelectedBlogSlug('jwst-k2-18b-atmospheric-water-vapor-summary')}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      Read Full Exoplanet Dossier →
                    </button>
                    <button
                      onClick={() => {
                        const sciStory = news.find((n) => n.category === 'science') || leadStory;
                        if (sciStory) setSelectedSummaryStory(sciStory);
                      }}
                      className="text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                    >
                      30s Intelligence Summary
                    </button>
                  </div>
                </div>
              </div>
            </section>
          </>
        )}
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
      <ArticleModal
        currentLanguage={currentLanguage}
        article={selectedArticle}
        onClose={() => setSelectedArticle(null)}
        onOpenFactTrail={handleOpenTrail}
        onCompareCoverage={(story) => setSelectedCompareStory(story)}
      />

      <CompareCoverageModal
        currentLanguage={currentLanguage}
        article={selectedCompareStory}
        onClose={() => setSelectedCompareStory(null)}
        onOpenFactTrail={handleOpenTrail}
      />

      <StructuredSummaryModal
        currentLanguage={currentLanguage}
        story={selectedSummaryStory}
        onClose={() => setSelectedSummaryStory(null)}
      />

      <SearchModal
        currentLanguage={currentLanguage}
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onOpenArticle={(item) => setSelectedArticle(item)}
      />

      <ProviderStatusModal
        currentLanguage={currentLanguage}
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      />

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

      <EditorialAdminModal
        currentLanguage={currentLanguage}
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onArticlePublished={(art) => {
          setSelectedBlogSlug(art.slug);
        }}
      />

      <SupporterModal
        currentLanguage={currentLanguage}
        isOpen={isSupporterModalOpen}
        onClose={() => setIsSupporterModalOpen(false)}
      />

      <SponsorshipModal
        currentLanguage={currentLanguage}
        isOpen={isSponsorshipModalOpen}
        onClose={() => setIsSponsorshipModalOpen(false)}
      />
    </div>
  );
}
