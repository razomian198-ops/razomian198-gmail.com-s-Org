import React, { useState } from 'react';
import { ExternalLink, Radio, CheckCircle2, ChevronRight, Image as ImageIcon } from 'lucide-react';
import { NewsItem } from '../../server/services/types.ts';

interface LeadStoryProps {
  story: NewsItem;
  onOpenArticle: (story: NewsItem) => void;
  onOpenSummary?: (story: NewsItem) => void;
  leadImageOverride?: string;
}

export const LeadStory: React.FC<LeadStoryProps> = ({ story, onOpenArticle, onOpenSummary, leadImageOverride }) => {
  const [imageFailed, setImageFailed] = useState(false);

  const imageUrl = leadImageOverride || story.imageUrl || '/src/assets/images/hero_editorial_world_1792529244145.jpg';

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
              <span>{story.publisher}</span>
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
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" /> Sourced
                  </span>
                </>
              )}
            </div>

            {/* Headline */}
            <h1
              onClick={() => onOpenArticle(story)}
              className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-slate-950 dark:text-white hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer transition-colors leading-tight mb-4"
            >
              {story.title}
            </h1>

            {/* Factual Summary */}
            <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 leading-relaxed font-sans mb-6">
              {story.summary}
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
            // Zero-broken-image fallback container
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
