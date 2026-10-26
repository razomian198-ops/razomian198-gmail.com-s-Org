import React, { useState } from 'react';
import {
  Clock,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Radio,
  FileText
} from 'lucide-react';
import { FactTrailSummary } from '../../server/services/types.ts';
import { factTrailStorage } from '../services/factTrailStorage.ts';

interface FactTrailCardProps {
  trail: FactTrailSummary;
  onOpenTrail: (trailId: string) => void;
  isFollowed?: boolean;
  onFollowToggle?: () => void;
  showCategoryBadge?: boolean;
}

export const FactTrailCard: React.FC<FactTrailCardProps> = ({
  trail,
  onOpenTrail,
  isFollowed: propIsFollowed,
  onFollowToggle,
  showCategoryBadge = true,
}) => {
  const [isFollowedState, setIsFollowedState] = useState(
    propIsFollowed !== undefined ? propIsFollowed : factTrailStorage.isFollowed(trail.id)
  );

  const handleToggleFollow = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isFollowedState) {
      factTrailStorage.unfollowStory(trail.id);
      setIsFollowedState(false);
    } else {
      factTrailStorage.followStory(trail);
      setIsFollowedState(true);
    }
    if (onFollowToggle) onFollowToggle();
  };

  const timeAgo = (dateStr: string) => {
    try {
      const ms = Date.now() - new Date(dateStr).getTime();
      const mins = Math.max(1, Math.round(ms / (1000 * 60)));
      if (mins < 60) return `${mins}m ago`;
      const hours = Math.round(mins / 60);
      if (hours < 24) return `${hours}h ago`;
      return `${Math.round(hours / 24)}d ago`;
    } catch {
      return dateStr;
    }
  };

  return (
    <article
      onClick={() => onOpenTrail(trail.id)}
      className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-200 shadow-xs hover:shadow-md cursor-pointer flex flex-col justify-between group"
    >
      <div className="p-5 sm:p-6 space-y-4">
        {/* Header Metadata */}
        <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            {showCategoryBadge && (
              <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 text-[11px] bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                {trail.category}
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded">
              <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
              <span>{trail.publishersCount} {trail.publishersCount === 1 ? 'Publisher' : 'Publishers'} Reporting</span>
            </span>
            <span className="text-slate-400 font-medium text-[11px]">
              {trail.articlesCount} updates
            </span>
          </div>

          {/* Follow / Bookmark Button */}
          <button
            onClick={handleToggleFollow}
            className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1 text-xs font-medium ${
              isFollowedState
                ? 'bg-blue-50 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400'
                : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
            title={isFollowedState ? 'Following this story (Click to unfollow)' : 'Follow this story for new updates'}
          >
            {isFollowedState ? (
              <>
                <BookmarkCheck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span className="hidden sm:inline">Following</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span className="hidden sm:inline">Follow</span>
              </>
            )}
          </button>
        </div>

        {/* Story Title */}
        <h3 className="text-lg sm:text-xl font-bold font-editorial text-slate-950 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors leading-snug">
          {trail.title}
        </h3>

        {/* Compact "What Changed in Latest Update?" Preview Box */}
        <div className="bg-stone-50 dark:bg-slate-950/70 border-l-3 border-blue-500 p-3 rounded-r-lg space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>What Changed:</span>
            <span className="text-slate-400 font-normal">({trail.latestPublisher})</span>
          </div>
          <p className="text-xs text-slate-700 dark:text-slate-300 font-sans leading-relaxed line-clamp-2">
            {trail.whatChangedPreview}
          </p>
        </div>

        {/* Reporting Publishers Tags */}
        <div className="flex items-center flex-wrap gap-1.5 pt-1">
          <span className="text-[11px] text-slate-400 font-medium">Covered by:</span>
          {trail.publishers.map((pub) => (
            <span
              key={pub}
              className="text-[10px] font-medium bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded"
            >
              {pub}
            </span>
          ))}
        </div>
      </div>

      {/* Footer Action Bar */}
      <div className="px-5 py-3.5 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs bg-stone-50/40 dark:bg-slate-950/30">
        <div className="flex items-center gap-1.5 text-slate-500 font-tabular">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>Latest update: {timeAgo(trail.latestUpdateAt)}</span>
        </div>

        <span className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold group-hover:translate-x-0.5 transition-transform">
          <span>Follow Story Timeline</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
    </article>
  );
};
