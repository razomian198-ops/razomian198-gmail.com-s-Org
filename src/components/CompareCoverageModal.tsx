import React, { useEffect, useState } from 'react';
import {
  X,
  Layers,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertCircle,
  GitFork,
  ChevronRight,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { NewsItem, CoverageComparison, SourceReport } from '../../server/services/types.ts';
import { SupportedLanguage } from '../i18n/translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface CompareCoverageModalProps {
  article: NewsItem | null;
  onClose: () => void;
  onOpenFactTrail?: (trailId: string) => void;
  currentLanguage: SupportedLanguage;
}

export const CompareCoverageModal: React.FC<CompareCoverageModalProps> = ({
  article,
  onClose,
  onOpenFactTrail,
  currentLanguage: _currentLanguage,
}) => {
  const [comparison, setComparison] = useState<CoverageComparison | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAllDispatches, setShowAllDispatches] = useState(false);

  // Frequency of dispatches per publisher
  const publisherCounts = React.useMemo(() => {
    const counts = new Map<string, number>();
    if (!comparison) return counts;
    for (const s of comparison.sources) {
      counts.set(s.publisher, (counts.get(s.publisher) || 0) + 1);
    }
    return counts;
  }, [comparison]);

  // One report per publisher or all dispatches
  const displayedReports = React.useMemo(() => {
    if (!comparison) return [];
    if (showAllDispatches) return comparison.sources;
    const seen = new Set<string>();
    const list: SourceReport[] = [];
    for (const s of comparison.sources) {
      if (!seen.has(s.publisher)) {
        seen.add(s.publisher);
        list.push(s);
      }
    }
    return list;
  }, [comparison, showAllDispatches]);

  useEffect(() => {
    if (!article?.id) return;
    setShowAllDispatches(false);

    let isMounted = true;
    setLoading(true);
    setError(null);

    safeFetchJson<CoverageComparison>(`/api/news/compare?id=${encodeURIComponent(article.id)}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.ok && res.data) {
          setComparison(res.data);
        } else {
          // Fallback comparison object if API returned empty
          setComparison({
            storyId: `story_${article.id}`,
            storyTitle: article.title,
            category: article.category,
            leadArticleId: article.id,
            publishersCount: 1,
            publishers: [article.publisher],
            articlesCount: 1,
            sources: [
              {
                id: `rep_${article.id}`,
                articleId: article.id,
                headline: article.title,
                publisher: article.publisher,
                publishedAt: article.publishedAt,
                url: article.url,
                summary: article.summary || 'Summary unavailable.',
                sourceType: article.sourceType || 'wire',
              },
            ],
            isSingleSource: true,
            firstReportedAt: article.publishedAt,
            latestReportAt: article.publishedAt,
            singleSourceNotice: `Single Source Report: Currently reported exclusively by ${article.publisher}. No additional source coverage has been found yet across accredited wire services.`,
          });
        }
      })
      .catch((err: any) => {
        if (!isMounted) return;
        setError(err?.message || 'Failed to retrieve comparative source data.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [article?.id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const formatRelativeTime = (isoString?: string) => {
    if (!isoString) return '';
    try {
      const date = new Date(isoString);
      const diffMinutes = Math.round((Date.now() - date.getTime()) / (1000 * 60));
      if (diffMinutes < 1) return 'Just now';
      if (diffMinutes < 60) return `${diffMinutes}m ago`;
      const diffHours = Math.round(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl my-auto shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-stone-200 dark:border-slate-800 flex items-start justify-between gap-4 bg-stone-50/60 dark:bg-slate-950/60">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1.5">
              <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Multi-Source Alignment & Attribution</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial text-slate-950 dark:text-white leading-tight">
              Compare Coverage
            </h2>
            <p className="text-xs sm:text-sm font-serif italic text-slate-600 dark:text-slate-300 mt-0.5">
              One story. Different sources. Original reporting.
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-lg bg-stone-100 hover:bg-stone-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer shrink-0"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Summary Bar */}
        <div className="px-5 sm:px-6 py-3.5 bg-stone-100/70 dark:bg-slate-950/40 border-b border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="min-w-0 flex-1">
            <span className="text-slate-500 dark:text-slate-400">Comparing coverage for: </span>
            <strong className="text-slate-900 dark:text-white font-medium truncate block sm:inline">
              {article.title}
            </strong>
          </div>

          {comparison?.factTrailId && onOpenFactTrail && (
            <button
              onClick={() => {
                onClose();
                onOpenFactTrail(comparison.factTrailId!);
              }}
              className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:underline font-semibold shrink-0 cursor-pointer"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>Follow on FactTrail</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {loading && (
            <div className="py-16 text-center text-slate-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 dark:text-blue-400 mx-auto mb-3" />
              <p className="text-sm font-medium">Checking accredited wire feeds for matching dispatches...</p>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-800 dark:text-red-200 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block mb-0.5">Coverage Retrieval Error</span>
                <span>{error}</span>
              </div>
            </div>
          )}

          {!loading && comparison && (
            <>
              {/* Single-Source Notice */}
              {comparison.isSingleSource && (
                <div className="p-4 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/50 flex items-start gap-3 text-xs text-amber-900 dark:text-amber-200">
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block mb-0.5">Single Source Report</span>
                    <p className="leading-relaxed">
                      Currently reported exclusively by <strong>{comparison.publishers[0]}</strong>. No additional source coverage has been found yet across accredited wire services. FactInfoLive monitors secondary corroboration continuously.
                    </p>
                  </div>
                </div>
              )}

              {/* Publisher Count & Multi-Source Stats */}
              {!comparison.isSingleSource && (
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pb-2 border-b border-stone-200 dark:border-slate-800 flex-wrap gap-2">
                  <span>
                    Identified <strong>{comparison.sources.length}</strong> dispatches from{' '}
                    <strong>{comparison.publishersCount}</strong> accredited publishers
                  </span>

                  {comparison.sources.length > comparison.publishersCount && (
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
                        By Publisher ({comparison.publishersCount})
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
                        All Dispatches ({comparison.sources.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Side-by-Side Sources Grid */}
              <div
                className={`grid gap-4 sm:gap-6 ${
                  displayedReports.length === 1
                    ? 'grid-cols-1 max-w-xl mx-auto'
                    : displayedReports.length === 2
                    ? 'grid-cols-1 md:grid-cols-2'
                    : displayedReports.length === 4
                    ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
                    : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
                }`}
              >
                {displayedReports.map((report: SourceReport, idx: number) => (
                  <div
                    key={report.id || idx}
                    className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-5 flex flex-col justify-between hover:border-slate-300 dark:hover:border-slate-700 transition-colors shadow-xs"
                  >
                    <div>
                      {/* Publisher badge and time */}
                      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-stone-100 dark:border-slate-800 text-xs">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 dark:text-white text-sm">
                            {report.publisher}
                          </span>
                          {!showAllDispatches && (publisherCounts.get(report.publisher) || 0) > 1 && (
                            <span className="text-[10px] text-slate-500 dark:text-slate-400 bg-stone-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                              Latest of {publisherCounts.get(report.publisher)} reports
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
                      <h4 className="text-base font-serif font-bold text-slate-950 dark:text-white leading-snug mb-3">
                        {report.headline}
                      </h4>

                      {/* Summary */}
                      <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-sans leading-relaxed line-clamp-5 mb-4">
                        {report.summary}
                      </p>
                    </div>

                    {/* Footer */}
                    <div className="pt-3 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between gap-3 text-xs">
                      <span className="text-[11px] text-slate-500 truncate">
                        Wire: {report.publisher}
                      </span>

                      <a
                        href={report.url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-white font-semibold text-xs transition-colors shadow-xs"
                      >
                        <span>View Original</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
            <ShieldCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>Preserves authentic publisher attribution and unedited wire summaries</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
