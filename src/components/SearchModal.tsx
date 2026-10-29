import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Loader2,
  ArrowRight,
  Newspaper,
  Trophy,
  BookOpen,
  Sparkles,
  GitFork,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { NewsItem, SportsFixture, EditorialArticle, FactTrail, AiTool } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface SearchModalProps {
  currentLanguage: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
  onOpenArticle: (item: NewsItem) => void;
  onOpenArticleBySlug?: (slug: string) => void;
  onOpenTrail?: (trailId: string) => void;
  onOpenTool?: (slug: string) => void;
}

type SearchTab = 'all' | 'news' | 'guides' | 'tools' | 'sports' | 'facttrail';

export const SearchModal: React.FC<SearchModalProps> = ({
  currentLanguage,
  isOpen,
  onClose,
  onOpenArticle,
  onOpenArticleBySlug,
  onOpenTrail,
  onOpenTool,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<SearchTab>('all');
  const [suggestions, setSuggestions] = useState<string[]>([]);

  // Result buckets
  const [newsResults, setNewsResults] = useState<NewsItem[]>([]);
  const [sportsResults, setSportsResults] = useState<SportsFixture[]>([]);
  const [articleResults, setArticleResults] = useState<EditorialArticle[]>([]);
  const [trailResults, setTrailResults] = useState<FactTrail[]>([]);
  const [toolResults, setToolResults] = useState<AiTool[]>([]);
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

  const executeSearch = React.useCallback(async (searchQuery: string, type: SearchTab = activeTab) => {
    const q = searchQuery.trim();
    if (!q) {
      setNewsResults([]);
      setSportsResults([]);
      setArticleResults([]);
      setTrailResults([]);
      setToolResults([]);
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(q)}&type=${type}`);
      if (res.ok) {
        const data = await res.json();
        setNewsResults(data.news || []);
        setSportsResults(data.sports || []);
        setArticleResults(data.articles || []);
        setTrailResults(data.factTrails || []);
        setToolResults(data.tools || []);
        setSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Search request failed', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  // Debounced search trigger (220ms debounce prevents excessive keystroke requests)
  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      setNewsResults([]);
      setSportsResults([]);
      setArticleResults([]);
      setTrailResults([]);
      setToolResults([]);
      setSuggestions([]);
      setHasSearched(false);
      return;
    }

    const timer = setTimeout(() => {
      executeSearch(query, activeTab);
    }, 220);

    return () => clearTimeout(timer);
  }, [query, activeTab, isOpen, executeSearch]);

  const handleTabChange = (tab: SearchTab) => {
    setActiveTab(tab);
  };

  if (!isOpen) return null;

  const totalResultsCount =
    newsResults.length +
    sportsResults.length +
    articleResults.length +
    trailResults.length +
    toolResults.length;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative mt-10 sm:mt-16 flex flex-col max-h-[85vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 flex items-center gap-3 shrink-0">
          <Search className="w-5 h-5 text-blue-500 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search news, guides, AI tools, FactTrail, sports..."
            className="w-full bg-transparent text-base sm:text-lg text-slate-900 dark:text-stone-100 placeholder:text-slate-400 outline-none"
          />
          {loading && <Loader2 className="w-5 h-5 animate-spin text-blue-500 shrink-0" />}
          {query && (
            <button
              onClick={() => {
                setQuery('');
              }}
              className="text-xs text-slate-400 hover:text-slate-600 px-1"
            >
              Clear
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 rounded-md transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Suggestion Chips */}
        {suggestions.length > 0 && (
          <div className="px-4 py-2 bg-stone-50 dark:bg-slate-950/80 border-b border-stone-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">
              Suggestions:
            </span>
            {suggestions.map((sug, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setQuery(sug);
                  executeSearch(sug, activeTab);
                }}
                className="px-2.5 py-1 rounded-full bg-white dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 whitespace-nowrap transition-colors cursor-pointer shrink-0"
              >
                {sug}
              </button>
            ))}
          </div>
        )}

        {/* Filter Category Tabs */}
        <div className="px-4 py-2 bg-stone-50/60 dark:bg-slate-950/40 border-b border-stone-200 dark:border-slate-800 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0 text-xs font-medium">
          <button
            onClick={() => handleTabChange('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap ${
              activeTab === 'all'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-800'
            }`}
          >
            All Results
          </button>
          <button
            onClick={() => handleTabChange('news')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'news'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-800'
            }`}
          >
            <Newspaper className="w-3.5 h-3.5" />
            <span>News ({newsResults.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('guides')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'guides'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-800'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Guides & Analysis ({articleResults.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('tools')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'tools'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-800'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Tools ({toolResults.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('facttrail')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'facttrail'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-800'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>FactTrail ({trailResults.length})</span>
          </button>
          <button
            onClick={() => handleTabChange('sports')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'sports'
                ? 'bg-blue-600 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-200 dark:hover:bg-slate-800'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Sports ({sportsResults.length})</span>
          </button>
        </div>

        {/* Results Scroll Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {hasSearched ? (
            totalResultsCount > 0 ? (
              <div className="space-y-6">
                {/* 1. AI Tools Matches */}
                {(activeTab === 'all' || activeTab === 'tools') && toolResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Verified AI Tools Directory ({toolResults.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {toolResults.map((tool) => (
                        <div
                          key={tool.id}
                          onClick={() => {
                            onClose();
                            if (onOpenTool) onOpenTool(tool.slug);
                          }}
                          className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 hover:border-blue-500/60 dark:hover:border-blue-400/60 bg-stone-50/50 dark:bg-slate-950/40 hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                                {tool.name}
                              </span>
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                {tool.pricing}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {tool.summary}
                            </p>
                          </div>
                          <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 shrink-0">
                            <span>Open</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. FactTrail Storylines Matches */}
                {(activeTab === 'all' || activeTab === 'facttrail') && trailResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-3 flex items-center gap-1.5">
                      <GitFork className="w-3.5 h-3.5" />
                      <span>FactTrail Story Timelines ({trailResults.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {trailResults.map((trail) => (
                        <div
                          key={trail.id}
                          onClick={() => {
                            onClose();
                            if (onOpenTrail) onOpenTrail(trail.id);
                          }}
                          className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 hover:border-purple-500/60 bg-stone-50/50 dark:bg-slate-950/40 hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-purple-600 transition-colors">
                                {trail.title}
                              </span>
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                                {trail.articlesCount} updates · {trail.publishersCount} outlets
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {trail.overview}
                            </p>
                          </div>
                          <span className="text-xs text-purple-600 dark:text-purple-400 font-semibold flex items-center gap-1 shrink-0">
                            <span>Timeline</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Guides & Editorial Articles Matches */}
                {(activeTab === 'all' || activeTab === 'guides') && articleResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Guides, Explainers & Tutorials ({articleResults.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {articleResults.map((art) => (
                        <div
                          key={art.id}
                          onClick={() => {
                            onClose();
                            if (onOpenArticleBySlug) onOpenArticleBySlug(art.slug);
                          }}
                          className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 hover:border-emerald-500/60 bg-stone-50/50 dark:bg-slate-950/40 hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-emerald-600 transition-colors">
                                {art.title}
                              </span>
                              <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                                {art.type}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {art.subtitle || art.content.slice(0, 100)}
                            </p>
                          </div>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1 shrink-0">
                            <span>Read</span>
                            <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 4. News Wire Dispatches */}
                {(activeTab === 'all' || activeTab === 'news') && newsResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                      <Newspaper className="w-3.5 h-3.5" />
                      <span>News Wire Dispatches ({newsResults.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {newsResults.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            onClose();
                            onOpenArticle(item);
                          }}
                          className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 hover:border-blue-500/60 bg-stone-50/50 dark:bg-slate-950/40 hover:bg-stone-100 dark:hover:bg-slate-800/60 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                        >
                          <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                {item.title}
                              </span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-stone-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                                {item.publisher}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                              {item.summary}
                            </p>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 shrink-0 group-hover:translate-x-1 transition-transform" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Sports Fixtures */}
                {(activeTab === 'all' || activeTab === 'sports') && sportsResults.length > 0 && (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-1.5">
                      <Trophy className="w-3.5 h-3.5" />
                      <span>Sports Fixtures & Live Matches ({sportsResults.length})</span>
                    </h3>
                    <div className="space-y-2">
                      {sportsResults.map((fix) => (
                        <div
                          key={fix.id}
                          className="p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/40 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold uppercase text-slate-400">
                              {fix.competition}
                            </span>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">
                              {fix.homeTeam.name} vs {fix.awayTeam.name}
                            </div>
                            <div className="text-[11px] text-slate-500">
                              Status: {fix.status.toUpperCase()} · Score: {fix.homeTeam.score ?? '-'} : {fix.awayTeam.score ?? '-'}
                            </div>
                          </div>
                          {fix.officialSourceUrl && (
                            <a
                              href={fix.officialSourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="px-2.5 py-1 rounded bg-stone-200 dark:bg-slate-800 hover:text-blue-500 text-[11px] font-medium flex items-center gap-1"
                            >
                              <span>Official Feed</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs space-y-2">
                <Search className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-stone-300">
                  No matching results found across our verified index
                </p>
                <p className="text-[11px] max-w-sm mx-auto">
                  Try searching for general keywords such as "Ollama", "ocean", "preprints", "xG", or "NASA".
                </p>
              </div>
            )
          ) : (
            <div className="py-10 text-center text-slate-400 text-xs space-y-3">
              <Search className="w-8 h-8 text-blue-500/60 mx-auto" />
              <p className="text-slate-600 dark:text-slate-300 font-medium">
                Search across verified global news wires, AI tools, step-by-step guides, sports telemetry, and FactTrail timelines.
              </p>
              <div className="flex flex-wrap justify-center gap-2 pt-2 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setQuery('Ollama');
                    executeSearch('Ollama', activeTab);
                  }}
                  className="px-2.5 py-1 rounded bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🔍 Try "Ollama"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('OSINT');
                    executeSearch('OSINT', activeTab);
                  }}
                  className="px-2.5 py-1 rounded bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🔍 Try "OSINT"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('xG');
                    executeSearch('xG', activeTab);
                  }}
                  className="px-2.5 py-1 rounded bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🔍 Try "xG"
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setQuery('Space');
                    executeSearch('Space', activeTab);
                  }}
                  className="px-2.5 py-1 rounded bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  🔍 Try "Space"
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
