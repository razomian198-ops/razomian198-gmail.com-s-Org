import React, { useEffect, useState } from 'react';
import { ArrowLeft, Newspaper, Trophy, ExternalLink, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { CATEGORIES, CategoryDef } from '../data/categories.ts';
import { NewsItem, SportsFixture, SportsStanding } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface CategoryViewProps {
  currentLanguage: SupportedLanguage;
  categoryId: string;
  onBackToHome: () => void;
  onOpenArticle: (item: NewsItem) => void;
  allFixtures: SportsFixture[];
  allStandings: SportsStanding[];
}

export const CategoryView: React.FC<CategoryViewProps> = ({
  currentLanguage,
  categoryId,
  onBackToHome,
  onOpenArticle,
  allFixtures,
  allStandings,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);

  const categoryDef: CategoryDef =
    CATEGORIES.find((c) => c.id === categoryId) || {
      id: categoryId,
      name: categoryId.replace(/-/g, ' ').toUpperCase(),
      slug: categoryId,
      group: 'news',
      description: 'Departmental reporting and verified intelligence stream.',
    };

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    fetch(`/api/news?category=${encodeURIComponent(categoryDef.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setNews(data.items || []);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [categoryId]);

  // Translate category news items when a non-English language is active
  useEffect(() => {
    if (currentLanguage === 'en' || news.length === 0) return;
    let isMounted = true;

    const needsTranslation = news.some(
      (n) => !n.isTranslated || n.translationLanguage !== currentLanguage
    );
    if (!needsTranslation) return;

    fetch('/api/news/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: news.slice(0, 20).map((n) => ({ id: n.id, title: n.title, summary: n.summary })),
        targetLanguage: currentLanguage,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (!isMounted || !Array.isArray(data.items)) return;
        const map = new Map<string, any>(data.items.map((it: any) => [it.id, it]));
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
      })
      .catch((err) => console.warn('Category news translation skipped:', err));

    return () => {
      isMounted = false;
    };
  }, [currentLanguage, news.length, categoryId]);

  // If this is a sports category, filter relevant fixtures and standings
  const relevantFixtures = categoryDef.sportKey
    ? allFixtures.filter((f) => f.sport === categoryDef.sportKey)
    : [];

  const relevantStandings = categoryDef.sportKey
    ? allStandings.filter((s) => s.sport === categoryDef.sportKey)
    : [];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Back to Home */}
      <div>
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Front Page</span>
        </button>
      </div>

      {/* Category Header */}
      <div className="border-b border-stone-200 dark:border-slate-800 pb-6">
        <div className="text-xs uppercase font-semibold text-blue-600 dark:text-blue-400 tracking-wider mb-2">
          Departmental Intelligence · {categoryDef.group.toUpperCase()}
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-slate-950 dark:text-white mb-3">
          {categoryDef.name}
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl font-sans leading-relaxed">
          {categoryDef.description}
        </p>
      </div>

      {/* Relevant Sports Center Integration for Sports Categories */}
      {categoryDef.sportKey && (relevantFixtures.length > 0 || relevantStandings.length > 0) && (
        <div className="p-6 bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-lg font-bold font-editorial text-slate-900 dark:text-white">
              Official {categoryDef.name} Fixtures & Standings Telemetry
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {relevantFixtures.map((fix) => (
              <div
                key={fix.id}
                className="p-4 rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs flex justify-between items-center"
              >
                <div>
                  <div className="text-slate-400 mb-1 text-[11px] uppercase tracking-wide">
                    {fix.competition} · {fix.status.toUpperCase()}
                  </div>
                  <div className="font-semibold text-sm text-slate-900 dark:text-white">
                    {fix.homeTeam.name} {fix.homeTeam.score !== undefined ? `(${fix.homeTeam.score})` : ''} vs{' '}
                    {fix.awayTeam.name} {fix.awayTeam.score !== undefined ? `(${fix.awayTeam.score})` : ''}
                  </div>
                  <div className="text-slate-500 text-[11px] mt-1">{fix.venue}</div>
                </div>
                {fix.officialSourceUrl && (
                  <a
                    href={fix.officialSourceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] shrink-0"
                  >
                    <span>Match Center</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dispatches Feed */}
      <div>
        <h2 className="text-xl font-bold font-editorial text-slate-950 dark:text-white mb-4">
          Latest Verified Coverage
        </h2>

        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : news.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {news.map((item, idx) => (
              <article
                key={`${item.id}-${idx}`}
                className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{item.publisher}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-tabular">
                      {new Date(item.publishedAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  <h3
                    onClick={() => onOpenArticle(item)}
                    className="text-base sm:text-lg font-bold font-editorial text-slate-950 dark:text-white leading-snug hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors mb-3"
                  >
                    {item.isTranslated && item.translationLanguage === currentLanguage && item.translatedTitle
                      ? item.translatedTitle
                      : item.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans line-clamp-3">
                    {item.isTranslated && item.translationLanguage === currentLanguage && item.translatedSummary
                      ? item.translatedSummary
                      : item.summary}
                  </p>
                </div>

                <div className="pt-4 mt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    onClick={() => onOpenArticle(item)}
                    className="text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer inline-flex items-center gap-1"
                  >
                    <span>Read Analysis</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 flex items-center gap-1"
                  >
                    <span>Original</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </article>
            ))}
          </div>
        ) : (
          /* Empty / limitation explanation */
          <div className="p-8 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
            <AlertCircle className="w-8 h-8 text-slate-400 mx-auto opacity-60" />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              No Direct Real-Time Dispatches for this Department Currently
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto leading-relaxed">
              In accordance with our anti-fabrication editorial policy, FactInfoLive does not generate synthetic reports when primary feeds are unavailable. Please check the global wire feed or use our Compare Coverage section to examine multi-source reporting.
            </p>
            <div className="pt-2">
              <button
                onClick={onBackToHome}
                className="px-4 py-2 bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Return to World Wire
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
