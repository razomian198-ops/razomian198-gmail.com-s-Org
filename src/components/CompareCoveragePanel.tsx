import React, { useEffect, useState } from 'react';
import {
  Layers,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Clock,
  Radio,
  FileText,
  AlertCircle,
  RefreshCw,
  GitFork,
  ArrowUpRight
} from 'lucide-react';
import { CoverageComparison, SourceReport } from '../../server/services/types.ts';
import { SupportedLanguage } from '../i18n/translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface CompareCoveragePanelProps {
  currentLanguage: SupportedLanguage;
  onOpenFactTrail?: (trailId: string) => void;
  onOpenArticleDetail?: (articleId: string) => void;
}

export const CompareCoveragePanel: React.FC<CompareCoveragePanelProps> = ({
  currentLanguage: _currentLanguage,
  onOpenFactTrail,
  onOpenArticleDetail,
}) => {
  const [comparisons, setComparisons] = useState<CoverageComparison[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllDispatches, setShowAllDispatches] = useState(false);

  const fetchFeatured = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await safeFetchJson<{ total: number; comparisons: CoverageComparison[] }>(
        '/api/news/compare-featured?limit=6'
      );
      if (res.ok && res.data && Array.isArray(res.data.comparisons) && res.data.comparisons.length > 0) {
        setComparisons(res.data.comparisons);
        setSelectedIndex(0);
      } else {
        setComparisons([]);
      }
    } catch (err: any) {
      setError('Unable to load coverage comparisons from news feeds.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeatured();
  }, []);

  const activeStory: CoverageComparison | undefined = comparisons[selectedIndex];

  // Frequency of dispatches per publisher
  const publisherCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    if (!activeStory) return counts;
    for (const s of activeStory.sources) {
      counts.set(s.publisher, (counts.get(s.publisher) || 0) + 1);
    }
    return counts;
  }, [activeStory]);

  // Distinct publisher reports (one latest dispatch per publisher) or all dispatches
  const displayedReports = React.useMemo(() => {
    if (!activeStory) return [];
    if (showAllDispatches) return activeStory.sources;
    const seen = new Set<string>();
    const list: SourceReport[] = [];
    for (const s of activeStory.sources) {
      if (!seen.has(s.publisher)) {
        seen.add(s.publisher);
        list.push(s);
      }
    }
    return list;
  }, [activeStory, showAllDispatches]);

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.round((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.round(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    } catch {
      return '';
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 lg:p-10 shadow-sm relative overflow-hidden transition-colors">
      {/* Background Accent */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/5 dark:bg-blue-400/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-stone-200 dark:border-slate-800 mb-6">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-2">
            <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Multi-Publisher Alignment</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-slate-950 dark:text-white leading-tight">
            Compare Coverage
          </h2>
          <p className="text-sm sm:text-base font-serif italic text-slate-600 dark:text-slate-300 mt-1">
            One story. Different sources. Original reporting.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 hidden sm:inline">
            Side-by-side original reporting
          </span>
          <button
            onClick={fetchFeatured}
            disabled={loading}
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
            title="Refresh comparisons"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Loading & Error States */}
      {loading && comparisons.length === 0 && (
        <div className="py-12 text-center text-slate-500 dark:text-slate-400">
          <Layers className="w-8 h-8 animate-pulse text-blue-600 dark:text-blue-400 mx-auto mb-3" />
          <p className="text-sm font-medium">Aligning dispatches across accredited publishers...</p>
        </div>
      )}

      {error && comparisons.length === 0 && (
        <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs text-amber-800 dark:text-amber-200 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Wire Network Synchronization Notice</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {!loading && comparisons.length > 0 && activeStory && (
        <div className="space-y-6 relative z-10">
          {/* Story Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
            {comparisons.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={item.storyId || idx}
                  onClick={() => setSelectedIndex(idx)}
                  className={`px-3.5 py-2 rounded-xl text-left text-xs transition-all shrink-0 cursor-pointer max-w-[280px] border ${
                    isSelected
                      ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 border-slate-900 dark:border-white shadow-xs font-semibold'
                      : 'bg-stone-50 dark:bg-slate-950/60 text-slate-700 dark:text-slate-300 border-stone-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span
                      className={`text-[10px] uppercase font-bold tracking-wider ${
                        isSelected
                          ? 'text-blue-300 dark:text-blue-600'
                          : 'text-blue-600 dark:text-blue-400'
                      }`}
                    >
                      {item.category}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-slate-800 dark:bg-stone-200 text-slate-200 dark:text-slate-800'
                          : 'bg-stone-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {item.publishersCount === 1 ? '1 Source' : `${item.publishersCount} Sources`}
                    </span>
                  </div>
                  <div className="line-clamp-1 font-serif text-xs">
                    {item.storyTitle}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Story Headline Bar */}
          <div className="bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-1">
                <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  {activeStory.category}
                </span>
                <span>·</span>
                <span>
                  {activeStory.publishersCount}{' '}
                  {activeStory.publishersCount === 1 ? 'accredited publisher' : 'accredited publishers'}
                </span>
                {activeStory.latestReportAt && (
                  <>
                    <span>·</span>
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      Updated {formatRelativeTime(activeStory.latestReportAt)}
                    </span>
                  </>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-bold font-editorial text-slate-950 dark:text-white">
                {activeStory.storyTitle}
              </h3>
            </div>

            <div className="flex items-center gap-3 shrink-0 flex-wrap">
              {activeStory.sources.length > activeStory.publishersCount && (
                <div className="inline-flex items-center p-0.5 rounded-lg bg-stone-200/70 dark:bg-slate-800 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowAllDispatches(false)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      !showAllDispatches
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    By Publisher ({activeStory.publishersCount})
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAllDispatches(true)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      showAllDispatches
                        ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    All Dispatches ({activeStory.sources.length})
                  </button>
                </div>
              )}

              {/* FactTrail Navigation link if available */}
              {activeStory.factTrailId && onOpenFactTrail && (
                <button
                  onClick={() => onOpenFactTrail(activeStory.factTrailId!)}
                  className="shrink-0 inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs transition-colors cursor-pointer shadow-xs"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>Follow on FactTrail</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          {/* Single-Source Honest Notice */}
          {activeStory.isSingleSource && (
            <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Single Source Report</span>
                <p className="leading-relaxed">
                  Currently reported exclusively by <strong>{activeStory.publishers[0]}</strong>. No additional source coverage has been found yet across accredited wire services. FactInfoLive preserves original reporting and monitors for secondary corroboration.
                </p>
              </div>
            </div>
          )}

          {/* Side-by-Side Source Reports Grid */}
          <div
            className={`grid gap-4 sm:gap-6 ${
              displayedReports.length === 1
                ? 'grid-cols-1 max-w-2xl mx-auto'
                : displayedReports.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : displayedReports.length === 4
                ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
            }`}
          >
            {displayedReports.map((report: SourceReport, rIdx: number) => (
              <div
                key={report.id || rIdx}
                className="bg-white dark:bg-slate-900/90 border border-stone-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
              >
                <div>
                  {/* Publisher & Metadata Header */}
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100 dark:border-slate-800 text-xs">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                        {report.publisher}
                      </span>
                      {!showAllDispatches && (publisherCounts.get(report.publisher) || 0) > 1 && (
                        <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          Latest of {publisherCounts.get(report.publisher)} reports
                        </span>
                      )}
                      {report.isOfficialStatement && (
                        <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-1.5 py-0.5 rounded border border-purple-200 dark:border-purple-800">
                          Official
                        </span>
                      )}
                    </div>
                    {report.publishedAt && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {formatRelativeTime(report.publishedAt)}
                      </span>
                    )}
                  </div>

                  {/* Original Headline */}
                  <h4 className="text-base sm:text-lg font-serif font-bold text-slate-950 dark:text-stone-100 leading-snug mb-3">
                    {report.headline}
                  </h4>

                  {/* Summary / Description */}
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-4 mb-4">
                    {report.summary}
                  </p>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-3 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                    Source: <span className="font-medium text-slate-700 dark:text-slate-300">{report.publisher}</span>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {onOpenArticleDetail && report.articleId && (
                      <button
                        onClick={() => onOpenArticleDetail(report.articleId)}
                        className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        Inspect
                      </button>
                    )}

                    <a
                      href={report.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-900 hover:text-white dark:hover:bg-white dark:hover:text-slate-900 font-medium text-xs transition-colors"
                      title={`Open original reporting on ${report.publisher}`}
                    >
                      <span>Original</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Sourcing Transparency Note */}
          <div className="pt-2 text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-2 flex-wrap">
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>
              Unedited headlines and summaries directly synchronized from official wire feeds. Click &ldquo;Original&rdquo; to read original journalism on publisher websites.
            </span>
          </div>
        </div>
      )}
    </section>
  );
};
