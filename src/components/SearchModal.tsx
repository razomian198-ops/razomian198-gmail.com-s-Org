import React, { useState, useEffect } from 'react';
import { Search, X, Loader2, ArrowRight, Newspaper, Trophy } from 'lucide-react';
import { NewsItem, SportsFixture } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface SearchModalProps {
  currentLanguage: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
  onOpenArticle: (item: NewsItem) => void;
}

export const SearchModal: React.FC<SearchModalProps> = ({
  currentLanguage,
  isOpen,
  onClose,
  onOpenArticle,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [newsResults, setNewsResults] = useState<NewsItem[]>([]);
  const [sportsResults, setSportsResults] = useState<SportsFixture[]>([]);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSearch = async (searchQuery: string) => {
    const q = searchQuery.trim();
    if (!q) {
      setNewsResults([]);
      setSportsResults([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        setNewsResults(data.news || []);
        setSportsResults(data.sports || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative mt-12 sm:mt-20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 flex items-center gap-3">
          <Search className="w-5 h-5 text-slate-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              handleSearch(e.target.value);
            }}
            placeholder={t.searchPlaceholder}
            className="w-full bg-transparent text-base sm:text-lg text-slate-900 dark:text-stone-100 placeholder:text-slate-400 outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-500 shrink-0" />}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Results Area */}
        <div className="p-4 sm:p-6 max-h-[60vh] overflow-y-auto space-y-6">
          {hasSearched ? (
            newsResults.length > 0 || sportsResults.length > 0 ? (
              <div className="space-y-6">
                {/* News matches */}
                {newsResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>News & Research Dispatches ({newsResults.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {newsResults.map((item, idx) => (
                        <div
                          key={`${item.id}-${idx}`}
                          onClick={() => {
                            onOpenArticle(item);
                            onClose();
                          }}
                          className="p-3 rounded-lg border border-stone-200 dark:border-slate-800 hover:border-blue-500/50 hover:bg-stone-50 dark:hover:bg-slate-800/50 transition-all cursor-pointer flex items-center justify-between group"
                        >
                          <div className="pr-3">
                            <div className="flex items-center gap-2 text-[11px] text-slate-500 mb-1">
                              <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                                {item.category}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span>{item.publisher}</span>
                            </div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2">
                              {item.title}
                            </h4>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Sports matches */}
                {sportsResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Sports & Fixtures ({sportsResults.length})</span>
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {sportsResults.map((s, idx) => (
                        <div
                          key={`${s.id}-${idx}`}
                          className="p-3 rounded-lg border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950/40 text-xs"
                        >
                          <div className="flex justify-between text-slate-500 mb-1.5 text-[11px]">
                            <span className="font-semibold uppercase text-blue-500">{s.sport}</span>
                            <span className="capitalize">{s.status}</span>
                          </div>
                          <div className="font-semibold text-slate-900 dark:text-stone-100">
                            {s.homeTeam.name} {s.homeTeam.score !== undefined ? `(${s.homeTeam.score})` : ''} vs{' '}
                            {s.awayTeam.name} {s.awayTeam.score !== undefined ? `(${s.awayTeam.score})` : ''}
                          </div>
                          <div className="text-[11px] text-slate-400 mt-1">{s.competition}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <h4 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.noData}</h4>
                <p className="text-xs text-slate-500 mt-1">
                  No verified records match &ldquo;{query}&rdquo;. Try another term.
                </p>
              </div>
            )
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              <span>Type keywords above to search news, sports fixtures, research papers, and geopolitical topics.</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
