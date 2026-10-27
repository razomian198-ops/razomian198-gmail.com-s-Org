import React, { useState } from 'react';
import { ExternalLink, Radio, CheckCircle2, ChevronRight, Image as ImageIcon, Languages, Layers } from 'lucide-react';
import { NewsItem } from '../../server/services/types.ts';
import { SupportedLanguage } from '../i18n/translations.ts';

interface LeadStoryProps {
  story?: NewsItem | null;
  loading?: boolean;
  onRetry?: () => void;
  onOpenArticle: (story: NewsItem) => void;
  onOpenSummary?: (story: NewsItem) => void;
  onCompareCoverage?: (story: NewsItem) => void;
  leadImageOverride?: string;
  currentLanguage?: SupportedLanguage;
}

export const LeadStory: React.FC<LeadStoryProps> = ({
  story,
  loading = false,
  onRetry,
  onOpenArticle,
  onOpenSummary,
  onCompareCoverage,
  leadImageOverride,
  currentLanguage = 'en'
}) => {
  const [imageFailed, setImageFailed] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);

  if (!story) {
    if (loading) {
      return (
        <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
            <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="h-4 w-24 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-20 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
                <div className="h-8 w-11/12 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="h-8 w-4/5 bg-slate-200 dark:bg-slate-800 rounded"></div>
                <div className="space-y-2 pt-2">
                  <div className="h-4 w-full bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-5/6 bg-slate-200 dark:bg-slate-800 rounded"></div>
                  <div className="h-4 w-2/3 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
              </div>
              <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between">
                <div className="h-8 w-44 bg-slate-200 dark:bg-slate-800 rounded-lg"></div>
                <div className="h-4 w-36 bg-slate-200 dark:bg-slate-800 rounded"></div>
              </div>
            </div>
            <div className="lg:col-span-5 bg-stone-100 dark:bg-slate-950 min-h-[260px] sm:min-h-[340px] flex flex-col items-center justify-center p-8 text-slate-400">
              <ImageIcon className="w-12 h-12 mb-2 stroke-1 opacity-50" />
              <span className="text-xs font-serif italic text-center max-w-xs text-slate-500">
                Synchronizing primary headline photography &amp; wire dispatches...
              </span>
            </div>
          </div>
        </section>
      );
    }

    return (
      <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
                <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                  EDITORIAL WIRE
                </span>
                <span aria-hidden="true">·</span>
                <span className="font-medium text-slate-700 dark:text-slate-300">Global Newsdesk</span>
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-950 dark:text-white leading-tight mb-4">
                Synchronizing Global Dispatches &amp; Breaking Headlines
              </h1>
              <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-sans mb-6">
                Verified wire feeds are currently reconnecting to international sources. Live coverage will populate automatically as soon as feeds complete handshake.
              </p>
            </div>
            {onRetry && (
              <div className="pt-4 border-t border-stone-200 dark:border-slate-800">
                <button
                  onClick={onRetry}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs sm:text-sm font-semibold rounded-lg transition-colors cursor-pointer inline-flex items-center gap-2"
                >
                  <span>Reconnect Wire Feeds</span>
                </button>
              </div>
            )}
          </div>
          <div className="lg:col-span-5 bg-stone-100 dark:bg-slate-950 min-h-[260px] sm:min-h-[340px] flex flex-col items-center justify-center p-8 text-slate-400">
            <Radio className="w-10 h-10 mb-2 text-blue-600 dark:text-blue-400 animate-pulse" />
            <span className="text-xs font-serif italic text-center max-w-xs text-slate-500">
              Accredited International Wire Network
            </span>
          </div>
        </div>
      </section>
    );
  }

  const imageUrl = leadImageOverride || story.imageUrl || '/images/hero_editorial_world_1792529244145.jpg';

  const isTranslated = Boolean(story.isTranslated && story.translationLanguage === currentLanguage && !showOriginal);
  const title = isTranslated && story.translatedTitle ? story.translatedTitle : story.title;
  const summary = isTranslated && story.translatedSummary ? story.translatedSummary : story.summary;

  const formatTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    } catch {
      return isoString;
    }
  };

  return (
    <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden transition-all duration-200 hover:border-slate-300 dark:hover:border-slate-700">
      <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
        {/* Left Column: Editorial Content (7 cols) */}
        <div className="lg:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
          <div>
            {/* Unboxed Metadata Header */}
            <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400 mb-4">
              <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                {story.category.toUpperCase()}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">{story.publisher}</span>
              <span aria-hidden="true">·</span>
              <span className="font-tabular">{formatTime(story.publishedAt)}</span>
              {story.isDeveloping && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                    <Radio className="w-3 h-3 text-amber-500" /> Developing
                  </span>
                </>
              )}
              {story.factCheckStatus === 'verified' && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 dark:text-emerald-400 font-medium flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Verified
                  </span>
                </>
              )}
              {story.isTranslated && currentLanguage !== 'en' && (
                <>
                  <span aria-hidden="true">·</span>
                  <button
                    onClick={() => setShowOriginal(!showOriginal)}
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 text-[11px] font-medium bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded cursor-pointer"
                  >
                    <Languages className="w-3 h-3" />
                    <span>{showOriginal ? 'Show Translation' : 'View Original (EN)'}</span>
                  </button>
                </>
              )}
            </div>

            {/* Headline */}
            <h1
              onClick={() => onOpenArticle(story)}
              className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-tight mb-4"
            >
              {title}
            </h1>

            {/* Factual Summary */}
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-sans mb-6">
              {summary}
            </p>
          </div>

          {/* Action Row */}
          <div className="pt-4 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs font-medium">
            <div className="flex items-center gap-3">
              <button
                onClick={() => onOpenArticle(story)}
                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 cursor-pointer text-sm font-semibold"
              >
                <span>Read Full Intelligence Dossier</span>
                <ChevronRight className="w-4 h-4" />
              </button>

              {onOpenSummary && (
                <button
                  onClick={() => onOpenSummary(story)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/60 font-semibold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>30s Summary</span>
                </button>
              )}

              {onCompareCoverage && (
                <button
                  onClick={() => onCompareCoverage(story)}
                  className="px-3 py-1.5 rounded-lg bg-stone-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-700 font-semibold text-xs flex items-center gap-1.5 cursor-pointer transition-colors"
                  title="Compare how different publishers report this story"
                >
                  <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Compare Coverage</span>
                </button>
              )}
            </div>

            <a
              href={story.url}
              target="_blank"
              rel="noreferrer"
              className="text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Original Wire Source: {story.publisher}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Right Column: Visual Presentation (5 cols) */}
        <div className="lg:col-span-5 relative bg-stone-100 dark:bg-slate-950 min-h-[260px] sm:min-h-[340px] flex items-center justify-center overflow-hidden">
          {!imageFailed ? (
            <img
              src={imageUrl}
              alt={story.title}
              onError={() => setImageFailed(true)}
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover min-h-full"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-100 to-stone-200 dark:from-slate-900 dark:to-slate-950 text-slate-400">
              <ImageIcon className="w-12 h-12 mb-2 stroke-1" />
              <span className="text-xs font-serif italic text-center max-w-xs text-slate-500">
                Editorial wire photography: {story.publisher}
              </span>
            </div>
          )}

          {/* Image Attribution Scrim */}
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-3 text-[11px] text-stone-200 flex items-center justify-between pointer-events-none">
            <span className="truncate">{story.imageAttribution || `Sourced by ${story.publisher}`}</span>
            <span className="font-tabular shrink-0 text-stone-400 uppercase text-[10px] tracking-wider ml-2">Documentary Archive</span>
          </div>
        </div>
      </div>
    </section>
  );
};
