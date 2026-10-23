import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Clock,
  MapPin,
  Calendar,
  Share2,
  Check,
  Loader2,
  Sparkles
} from 'lucide-react';
import { NewsItem, StructuredSummary } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface StructuredSummaryModalProps {
  currentLanguage: SupportedLanguage;
  story: NewsItem | null;
  onClose: () => void;
}

export const StructuredSummaryModal: React.FC<StructuredSummaryModalProps> = ({
  currentLanguage,
  story,
  onClose,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [summary, setSummary] = useState<StructuredSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    if (!story) {
      setSummary(null);
      return;
    }

    setLoading(true);
    fetch('/api/editorial/summarize-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ story }),
    })
      .then((res) => res.json())
      .then((data: StructuredSummary) => {
        setSummary(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, [story]);

  if (!story) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(story.url || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/75 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold font-editorial text-slate-900 dark:text-white">
                {t.summary10Point}
              </h2>
              <span className="text-[11px] text-slate-500 font-sans">
                Verified 10-Point Intelligence Breakdown
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
              title="Share summary link"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs text-slate-500 font-medium">
                Synthesizing 10-point verified summary from {story.publisher} wire...
              </p>
            </div>
          ) : summary ? (
            <>
              {/* 1. Original Headline */}
              <div className="border-b border-stone-200 dark:border-slate-800 pb-4">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
                  Point 01 · Original Headline
                </span>
                <h1 className="text-xl sm:text-2xl font-bold font-editorial text-slate-950 dark:text-white mt-1 leading-snug">
                  {summary.headline}
                </h1>
                <div className="flex items-center gap-2 text-xs text-slate-500 mt-2 font-tabular">
                  <span>{story.publisher}</span>
                  <span aria-hidden="true">·</span>
                  <span>Published: {new Date(summary.timestamps.publishedAt).toLocaleString()}</span>
                </div>
              </div>

              {/* 2. Concise 30-Second Summary */}
              <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60">
                <span className="text-[10px] uppercase font-bold tracking-wider text-blue-800 dark:text-blue-300 block mb-1">
                  Point 02 · 30-Second Summary
                </span>
                <p className="text-sm font-medium text-slate-900 dark:text-blue-100 leading-relaxed font-sans">
                  {summary.quickSummary30s}
                </p>
              </div>

              {/* 3. Five Key Takeaways */}
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-2">
                  Point 03 · {t.keyTakeawaysTitle}
                </span>
                <div className="space-y-2">
                  {summary.keyTakeaways.slice(0, 5).map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-700 dark:text-slate-300 p-2.5 rounded-lg bg-stone-50 dark:bg-slate-950/60 border border-stone-200/80 dark:border-slate-800"
                    >
                      <CheckCircle2 className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                      <span>{point}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4 & 5. What Happened & Why It Matters */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                    Point 04 · {t.whatHappenedTitle}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {summary.whatHappened}
                  </p>
                </div>
                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-950">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                    Point 05 · {t.whyItMattersTitle}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                    {summary.whyItMatters}
                  </p>
                </div>
              </div>

              {/* 6. Confirmed vs. What Remains Uncertain */}
              <div className="border border-stone-200 dark:border-slate-800 rounded-xl p-4 bg-stone-50/50 dark:bg-slate-950/40 space-y-3">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Point 06 · {t.confirmedUncertainTitle}
                </span>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="font-semibold text-emerald-700 dark:text-emerald-400 flex items-center gap-1 mb-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Confirmed Empirical Facts:
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400 leading-relaxed">
                      {summary.confirmedVsUncertain.confirmed.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <span className="font-semibold text-amber-600 dark:text-amber-400 flex items-center gap-1 mb-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> What Remains Uncertain / Developing:
                    </span>
                    <ul className="space-y-1 list-disc list-inside text-slate-600 dark:text-slate-400 leading-relaxed">
                      {summary.confirmedVsUncertain.uncertain.map((item, i) => (
                        <li key={i}>{item}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              {/* 7. Relevant Dates, Locations, and Context */}
              <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                  Point 07 · Timeline & Geopolitical Context
                </span>
                <div className="flex flex-wrap items-center gap-4 text-[11px] font-tabular">
                  {summary.context.dates.length > 0 && (
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{summary.context.dates.join(' · ')}</span>
                    </div>
                  )}
                  {summary.context.locations.length > 0 && (
                    <div className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{summary.context.locations.join(' · ')}</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed pt-1">
                  {summary.context.background}
                </p>
              </div>

              {/* 8, 9, 10. Source, Related Coverage, Timestamps */}
              <div className="p-4 rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">
                      Point 08 & 10 · Original Publisher & Timestamps
                    </span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {summary.originalSource.publisher}
                    </span>{' '}
                    <span className="text-slate-400 font-tabular">
                      (Sourced: {new Date(summary.timestamps.publishedAt).toLocaleDateString()})
                    </span>
                  </div>
                  <a
                    href={summary.originalSource.url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <span>Open Direct Wire Reporting</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                {summary.relatedCoverage.length > 0 && (
                  <div className="pt-2 border-t border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block mb-1">
                      Point 09 · Related Cross-Publisher Coverage
                    </span>
                    <div className="space-y-1">
                      {summary.relatedCoverage.map((rel, idx) => (
                        <a
                          key={idx}
                          href={rel.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px]"
                        >
                          <span>{rel.publisher}: {rel.title}</span>
                          <ExternalLink className="w-2.5 h-2.5" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-xs text-slate-500">
              Failed to load summary. Please check your network connection.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
