import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Search,
  Clock,
  User,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  BookOpen,
  Scale,
  ShieldCheck,
  FileText,
  HelpCircle,
  Trophy,
  Loader2,
  ChevronLeft,
  Radio,
  AlertTriangle
} from 'lucide-react';
import { EditorialArticle, EditorialPostType, NewsItem } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';
import { NewsletterBanner } from './NewsletterBanner.tsx';

interface EditorialSectionViewProps {
  currentLanguage: SupportedLanguage;
  sectionType: string;
  onBackToHome: () => void;
  onOpenArticleBySlug: (slug: string) => void;
  onOpenSummaryModal?: (article: EditorialArticle) => void;
  onOpenNewsArticle?: (news: NewsItem) => void;
  onOpenNewsSummary?: (news: NewsItem) => void;
}

export const EditorialSectionView: React.FC<EditorialSectionViewProps> = ({
  currentLanguage,
  sectionType,
  onBackToHome,
  onOpenArticleBySlug,
  onOpenSummaryModal,
  onOpenNewsArticle,
  onOpenNewsSummary,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Map route slug to EditorialPostType
  const typeMapping: Record<
    string,
    { type?: EditorialPostType; title: string; desc: string; icon: any; isWire?: boolean }
  > = {
    'latest-news': {
      title: t.latestNews,
      desc: 'Chronological wire reporting, real-time dispatches, and breaking events verified through accredited international newsrooms.',
      icon: Radio,
      isWire: true,
    },
    blogs: {
      type: 'blog',
      title: t.blogs,
      desc: 'Original essays, technical analyses, and investigative monographs authored by our editorial fellows and domain researchers.',
      icon: BookOpen,
    },
    'quick-summaries': {
      type: 'summary',
      title: t.quickSummaries,
      desc: '30-second verified intelligence summaries providing 5 key takeaways, confirmed empirical facts, and what remains uncertain.',
      icon: Sparkles,
    },
    'deep-explainers': {
      type: 'explainer',
      title: t.deepExplainers,
      desc: 'Long-form structural breakdowns featuring timelines, conceptual glossaries, source perspectives, and practical implications.',
      icon: FileText,
    },
    'research-studies': {
      type: 'research',
      title: t.researchStudies,
      desc: 'Systematic reviews, meta-analyses, and peer-reviewed preprint assessments across physical, medical, and computational sciences.',
      icon: ShieldCheck,
    },
    'sports-analysis': {
      type: 'sports-analysis',
      title: t.sportsAnalysis,
      desc: 'Tactical telemetry, tracking data, expected goal models, and biomechanical studies of elite global athletics.',
      icon: Trophy,
    },
    'opinion-editorial': {
      type: 'opinion',
      title: t.opinionEditorial,
      desc: 'Perspective pieces, media ethics critiques, and policy columns distinguished strictly from unvarnished news reporting.',
      icon: Scale,
    },
    'fact-checks': {
      type: 'fact-check',
      title: t.factChecksNav,
      desc: 'Rigorous empirical rebuttals of viral claims using satellite telemetry, institutional datasets, and primary public filings.',
      icon: CheckCircle2,
    },
    'guides-faqs': {
      type: 'guide',
      title: t.guidesFaqs,
      desc: 'Educational frameworks and frequently asked questions for decoding scientific literature and geopolitical affairs.',
      icon: HelpCircle,
    },
  };

  const currentSection = typeMapping[sectionType] || {
    title: sectionType.replace(/-/g, ' ').toUpperCase(),
    desc: 'Editorial publications and intelligence archives.',
    icon: BookOpen,
  };

  const SectionIcon = currentSection.icon;
  const isWireSection = currentSection.isWire || false;

  // Reset pagination when category, search, or sectionType changes
  useEffect(() => {
    setPage(1);
  }, [sectionType, selectedCategory, search]);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    if (isWireSection) {
      // Fetch wire news items
      const params = new URLSearchParams();
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (search.trim()) params.append('q', search.trim());
      params.append('page', String(page));
      params.append('limit', '12');

      const endpoint = search.trim() ? `/api/search?${params.toString()}` : `/api/news?${params.toString()}`;

      fetch(endpoint)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          if (search.trim()) {
            const items = data.news || [];
            setNewsItems(items);
            setTotalCount(items.length);
            setTotalPages(Math.max(1, Math.ceil(items.length / 12)));
          } else {
            setNewsItems(data.items || []);
            setTotalCount(data.total || 0);
            setTotalPages(data.totalPages || 1);
          }
          setLoading(false);
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    } else {
      // Fetch editorial articles
      const params = new URLSearchParams();
      if (currentSection.type) params.append('type', currentSection.type);
      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (search.trim()) params.append('search', search.trim());
      params.append('page', String(page));
      params.append('limit', '9');

      fetch(`/api/editorial/articles?${params.toString()}`)
        .then((res) => res.json())
        .then((data) => {
          if (!isMounted) return;
          setArticles(data.items || []);
          setTotalCount(data.total || 0);
          setTotalPages(data.totalPages || 1);
          setLoading(false);
        })
        .catch(() => {
          if (isMounted) setLoading(false);
        });
    }

    return () => {
      isMounted = false;
    };
  }, [sectionType, selectedCategory, search, page, isWireSection, currentSection.type]);

  const categories = ['all', 'world', 'science', 'technology', 'sports', 'business', 'health', 'society'];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Front Page</span>
        </button>
      </div>

      {/* Section Header */}
      <div className="border-b border-stone-200 dark:border-slate-800 pb-6">
        <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 mb-2">
          <SectionIcon className="w-4 h-4" />
          <span>{isWireSection ? 'Global Wire Syndication' : 'Editorial Department'}</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-slate-950 dark:text-white mb-3">
          {currentSection.title}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl font-sans leading-relaxed">
          {currentSection.desc}
        </p>

        {/* Search & Topic Filters */}
        <div className="pt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${currentSection.title.toLowerCase()}...`}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-lg bg-stone-100 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 focus:border-blue-500 outline-none text-slate-900 dark:text-white"
            />
          </div>

          <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors capitalize cursor-pointer whitespace-nowrap ${
                  selectedCategory === cat
                    ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main List Content */}
      <div>
        {loading ? (
          <div className="flex items-center justify-center py-24 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : isWireSection ? (
          /* WIRE NEWS VIEW FOR LATEST-NEWS */
          newsItems.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {newsItems.map((item, idx) => (
                  <article
                    key={`${item.id}-${idx}`}
                    className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
                  >
                    <div>
                      {item.imageUrl && (
                        <div
                          onClick={() => onOpenNewsArticle && onOpenNewsArticle(item)}
                          className="aspect-video relative overflow-hidden bg-stone-100 dark:bg-slate-950 cursor-pointer"
                        >
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            {item.category}
                          </div>
                        </div>
                      )}

                      <div className="p-5">
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{item.publisher}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-tabular">
                            {new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                          </span>
                          {item.isDeveloping && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px] flex items-center gap-0.5">
                                <Radio className="w-3 h-3 text-amber-500 animate-pulse" />
                                Developing
                              </span>
                            </>
                          )}
                        </div>

                        <h2
                          onClick={() => onOpenNewsArticle && onOpenNewsArticle(item)}
                          className="text-base sm:text-lg font-bold font-editorial text-slate-950 dark:text-white leading-snug hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors mb-2.5 line-clamp-3"
                        >
                          {item.title}
                        </h2>

                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-3">
                          {item.summary}
                        </p>
                      </div>
                    </div>

                    <div className="px-5 py-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => onOpenNewsArticle && onOpenNewsArticle(item)}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Read Wire Dispatch</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {onOpenNewsSummary && (
                        <button
                          onClick={() => onOpenNewsSummary(item)}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          <span>30s Summary</span>
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
              <Radio className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Wire Dispatches Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                No news items match your current filter or search criteria.
              </p>
            </div>
          )
        ) : (
          /* EDITORIAL ARTICLES VIEW */
          articles.length > 0 ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((art) => (
                  <article
                    key={art.id}
                    className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
                  >
                    <div>
                      {/* Article Thumbnail */}
                      {art.imageUrl && (
                        <div
                          onClick={() => onOpenArticleBySlug(art.slug)}
                          className="aspect-video relative overflow-hidden bg-stone-100 dark:bg-slate-950 cursor-pointer"
                        >
                          <img
                            src={art.imageUrl}
                            alt={art.title}
                            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                            loading="lazy"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                            {art.category}
                          </div>
                          {art.type === 'fact-check' && (
                            <div className="absolute top-3 right-3 bg-red-600/90 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" />
                              <span>Fact Check Audit</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Body Content */}
                      <div className="p-5">
                        {/* Unboxed Metadata */}
                        <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{art.author.name}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-tabular">{art.readingTimeMinutes} {t.readingTime}</span>
                          {art.isAiAssisted && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="text-amber-600 dark:text-amber-400 font-semibold text-[11px]">AI-Assisted</span>
                            </>
                          )}
                        </div>

                        {/* Title */}
                        <h2
                          onClick={() => onOpenArticleBySlug(art.slug)}
                          className="text-base sm:text-lg font-bold font-editorial text-slate-950 dark:text-white leading-snug hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors mb-2.5 line-clamp-3"
                        >
                          {art.title}
                        </h2>

                        {/* Subtitle / Excerpt */}
                        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-3">
                          {art.subtitle || art.content.slice(0, 160) + '...'}
                        </p>
                      </div>
                    </div>

                    {/* Footer Controls */}
                    <div className="px-5 py-3 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs">
                      <button
                        onClick={() => onOpenArticleBySlug(art.slug)}
                        className="text-blue-600 dark:text-blue-400 font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
                      >
                        <span>Read Full Dossier</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>

                      {art.structuredSummary && onOpenSummaryModal && (
                        <button
                          onClick={() => onOpenSummaryModal(art)}
                          className="text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                        >
                          <Sparkles className="w-3 h-3 text-blue-500" />
                          <span>30s Summary</span>
                        </button>
                      )}
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-10 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
              <BookOpen className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                No Published Articles Found
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                No editorial articles match your current search or category filter. Check back shortly as our editorial desk reviews incoming dispatches.
              </p>
            </div>
          )
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-stone-200 dark:border-slate-800 pt-6">
          <div className="text-xs text-slate-500">
            Showing Page <span className="font-semibold text-slate-900 dark:text-white">{page}</span> of{' '}
            <span className="font-semibold text-slate-900 dark:text-white">{totalPages}</span>
            {totalCount > 0 && <span> ({totalCount} items total)</span>}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={page <= 1}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 dark:border-slate-800 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                window.scrollTo({ top: 300, behavior: 'smooth' });
              }}
              disabled={page >= totalPages}
              className="px-3 py-1.5 text-xs font-semibold rounded-lg border border-stone-200 dark:border-slate-800 disabled:opacity-40 hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors flex items-center gap-1 cursor-pointer disabled:cursor-not-allowed"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Newsletter Signup in Section */}
      <NewsletterBanner currentLanguage={currentLanguage} />
    </div>
  );
};
