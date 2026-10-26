import React, { useState } from 'react';
import { ExternalLink, CheckCircle2, ChevronRight, Newspaper, ArrowRight } from 'lucide-react';
import { NewsItem } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface NewsGridProps {
  currentLanguage: SupportedLanguage;
  news: NewsItem[];
  activeCategoryFilter: string;
  onFilterChange: (cat: string) => void;
  onOpenArticle: (item: NewsItem) => void;
  onOpenSummary?: (item: NewsItem) => void;
}

export const NewsGrid: React.FC<NewsGridProps> = ({
  currentLanguage,
  news,
  activeCategoryFilter,
  onFilterChange,
  onOpenArticle,
  onOpenSummary,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [displayCount, setDisplayCount] = useState(9);
  const [brokenImages, setBrokenImages] = useState<Record<string, boolean>>({});

  const filterOptions = [
    { id: 'all', label: 'All News' },
    { id: 'world', label: 'World' },
    { id: 'politics', label: 'Politics' },
    { id: 'business', label: 'Economy' },
    { id: 'technology', label: 'Tech & AI' },
    { id: 'science', label: 'Science & Space' },
    { id: 'health', label: 'Health' },
    { id: 'environment', label: 'Climate' },
    { id: 'sports', label: 'Sports Wire' },
    { id: 'fact-checks', label: 'Fact Checks' },
  ];

  const handleImageError = (id: string) => {
    setBrokenImages((prev) => ({ ...prev, [id]: true }));
  };

  const filteredNews = news.filter((item) => {
    if (activeCategoryFilter === 'all') return true;
    return item.category === activeCategoryFilter;
  });

  const visibleNews = filteredNews.slice(0, displayCount);

  return (
    <section className="space-y-6">
      {/* Section Header with Category Filter Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-stone-200 dark:border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-editorial text-slate-950 dark:text-white">
            {t.latestWorldNews}
          </h2>
          <div className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
            <span>Verified chronological feed</span>
            <span aria-hidden="true">·</span>
            <span>Independent wire syndication</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-none py-1 max-w-full">
          {filterOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => {
                onFilterChange(opt.id);
                setDisplayCount(9);
              }}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer ${
                activeCategoryFilter === opt.id
                  ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 font-semibold shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Articles */}
      {visibleNews.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleNews.map((item, idx) => {
            const isImageBroken = brokenImages[item.id] || !item.imageUrl;

            return (
              <article
                key={`${item.id}-${idx}`}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-all duration-200 group"
              >
                <div>
                  {/* Visual slot with Zero-Broken-Image fallback container */}
                  <div
                    onClick={() => onOpenArticle(item)}
                    className="relative aspect-video sm:aspect-16/10 bg-stone-100 dark:bg-slate-950 overflow-hidden cursor-pointer"
                  >
                    {!isImageBroken ? (
                      <img
                        src={item.imageUrl}
                        alt={item.title}
                        onError={() => handleImageError(item.id)}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-stone-100 dark:bg-slate-950 text-slate-400">
                        <Newspaper className="w-8 h-8 mb-2 stroke-1 opacity-70" />
                        <span className="text-xs font-serif italic text-slate-500 dark:text-slate-400 text-center line-clamp-1">
                          {item.publisher}
                        </span>
                      </div>
                    )}

                    {/* Category Overlay Tag */}
                    <div className="absolute top-3 left-3 bg-slate-900/80 backdrop-blur-xs text-white text-[11px] font-semibold px-2 py-0.5 rounded uppercase tracking-wider">
                      {item.category}
                    </div>
                  </div>

                  {/* Text Content */}
                  <div className="p-5">
                    {/* Unboxed Metadata Line */}
                    <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-2.5">
                      <span className="font-medium text-slate-700 dark:text-slate-300">{item.publisher}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-tabular">
                        {new Date(item.publishedAt).toLocaleDateString([], {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                      {item.isTranslated && item.translationLanguage === currentLanguage ? (
                        <span className="text-[10px] bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300 font-semibold px-1.5 py-0.5 rounded">
                          {currentLanguage.toUpperCase()}
                        </span>
                      ) : currentLanguage !== 'en' ? (
                        <span className="text-[10px] text-slate-400">
                          (EN)
                        </span>
                      ) : null}
                    </div>

                    {/* Headline */}
                    <h3
                      onClick={() => onOpenArticle(item)}
                      className="text-base sm:text-lg font-bold font-editorial text-slate-950 dark:text-white leading-snug hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors mb-2.5 line-clamp-3"
                    >
                      {item.isTranslated && item.translationLanguage === currentLanguage && item.translatedTitle
                        ? item.translatedTitle
                        : item.title}
                    </h3>

                    {/* Summary */}
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-3 mb-4">
                      {item.isTranslated && item.translationLanguage === currentLanguage && item.translatedSummary
                        ? item.translatedSummary
                        : item.summary}
                    </p>
                  </div>
                </div>

                {/* Footer action */}
                <div className="px-5 py-3 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => onOpenArticle(item)}
                      className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-semibold cursor-pointer inline-flex items-center gap-1"
                    >
                      <span>Read Analysis</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    {onOpenSummary && (
                      <button
                        onClick={() => onOpenSummary(item)}
                        className="text-slate-500 hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                        title="View 10-Point 30-Second Summary"
                      >
                        <span>30s Summary</span>
                      </button>
                    )}
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <span>Source</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-slate-900 rounded-xl border border-dashed border-stone-200 dark:border-slate-800 p-8">
          <Newspaper className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">{t.noData}</h3>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-md mx-auto">{t.noDataDesc}</p>
        </div>
      )}

      {/* Load More Button */}
      {visibleNews.length < filteredNews.length && (
        <div className="text-center pt-4">
          <button
            onClick={() => setDisplayCount((prev) => prev + 6)}
            className="px-5 py-2.5 bg-white dark:bg-slate-900 border border-stone-300 dark:border-slate-700 text-slate-800 dark:text-stone-200 text-xs sm:text-sm font-semibold rounded-lg hover:bg-stone-50 dark:hover:bg-slate-800 transition-colors shadow-xs cursor-pointer inline-flex items-center gap-2"
          >
            <span>Load More Dispatches ({filteredNews.length - visibleNews.length} remaining)</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </section>
  );
};
