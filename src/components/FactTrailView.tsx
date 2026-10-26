import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Search,
  Bookmark,
  GitFork,
  Radio,
  Filter,
  Loader2,
  AlertCircle,
  Sparkles,
  Info
} from 'lucide-react';
import { FactTrailSummary } from '../../server/services/types.ts';
import { FactTrailCard } from './FactTrailCard.tsx';
import { factTrailStorage, FollowedStoryRecord } from '../services/factTrailStorage.ts';
import { safeFetchJson } from '../utils/api.ts';

interface FactTrailViewProps {
  onBackToHome: () => void;
  onOpenTrail: (trailId: string) => void;
}

export const FactTrailView: React.FC<FactTrailViewProps> = ({
  onBackToHome,
  onOpenTrail,
}) => {
  const [trails, setTrails] = useState<FactTrailSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [viewTab, setViewTab] = useState<'all' | 'followed'>('all');
  const [followedStories, setFollowedStories] = useState<FollowedStoryRecord[]>([]);

  const loadTrails = () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (selectedCategory !== 'all') params.append('category', selectedCategory);
    if (search.trim()) params.append('search', search.trim());

    safeFetchJson<{ total: number; trails: FactTrailSummary[] }>(`/api/facttrail?${params.toString()}`)
      .then((res) => {
        if (res.ok && res.data?.trails) {
          setTrails(res.data.trails);
        } else {
          console.warn('Notice loading FactTrails in directory view:', res.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Notice loading FactTrails in directory view:', err);
        setLoading(false);
      });
  };

  const refreshFollowed = () => {
    setFollowedStories(factTrailStorage.getFollowedStories());
  };

  useEffect(() => {
    loadTrails();
    refreshFollowed();

    // Check for background updates to followed stories
    factTrailStorage.checkBackgroundUpdates().then(() => {
      refreshFollowed();
    });

    const handleStorageChange = () => {
      refreshFollowed();
    };

    window.addEventListener('facttrail-followed-changed', handleStorageChange);
    return () => {
      window.removeEventListener('facttrail-followed-changed', handleStorageChange);
    };
  }, [selectedCategory, search]);

  const categories = [
    { id: 'all', label: 'All Stories' },
    { id: 'world', label: 'World' },
    { id: 'politics', label: 'Politics' },
    { id: 'business', label: 'Economy' },
    { id: 'technology', label: 'Technology' },
    { id: 'science', label: 'Science & Space' },
    { id: 'sports', label: 'Sports' },
    { id: 'health', label: 'Health' },
    { id: 'environment', label: 'Climate' },
  ];

  const followedIds = new Set(followedStories.map((f) => f.trailId));
  const unreadCount = followedStories.filter((f) => f.hasUnreadUpdate).length;

  const displayTrails = viewTab === 'followed'
    ? trails.filter((t) => followedIds.has(t.id))
    : trails;

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-8 animate-fade-in">
      {/* Top Breadcrumb */}
      <div>
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Front Page</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="border-b border-stone-200 dark:border-slate-800 pb-6 space-y-3">
        <div className="flex items-center gap-2 text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
          <GitFork className="w-4 h-4" />
          <span>FactTrail Story Intelligence Engine</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-slate-950 dark:text-white">
          Follow the Story, Not Just the Headline
        </h1>
        <p className="text-base text-slate-600 dark:text-slate-300 max-w-3xl font-sans leading-relaxed">
          News stories don’t stop at one headline. FactTrail clusters related wire dispatches across accredited international publishers into living, chronological timelines—so you can understand what happened, what changed in the latest update, and what remains unconfirmed.
        </p>

        {/* View Tabs: All Stories vs Followed Stories */}
        <div className="pt-4 flex items-center gap-3 border-t border-stone-100 dark:border-slate-800/80">
          <button
            onClick={() => setViewTab('all')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
              viewTab === 'all'
                ? 'bg-slate-900 text-white dark:bg-stone-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
          >
            All Developing Stories ({trails.length})
          </button>

          <button
            onClick={() => setViewTab('followed')}
            className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
              viewTab === 'followed'
                ? 'bg-slate-900 text-white dark:bg-stone-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Stories You Follow</span>
            {followedStories.length > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-blue-500 text-white text-[10px] rounded-full">
                {followedStories.length}
              </span>
            )}
            {unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 bg-emerald-500 text-white text-[10px] font-bold rounded-full animate-pulse">
                {unreadCount} new
              </span>
            )}
          </button>
        </div>

        {/* Search & Topic Filters */}
        <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap cursor-pointer transition-colors ${
                  selectedCategory === cat.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72 shrink-0">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search storylines..."
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white placeholder:text-slate-400 outline-none focus:border-blue-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
          <p className="text-sm font-medium text-slate-500">
            Updating active FactTrails from accredited RSS feeds...
          </p>
        </div>
      ) : displayTrails.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayTrails.map((trail) => (
            <FactTrailCard
              key={trail.id}
              trail={trail}
              onOpenTrail={onOpenTrail}
              isFollowed={followedIds.has(trail.id)}
              onFollowToggle={refreshFollowed}
            />
          ))}
        </div>
      ) : viewTab === 'followed' ? (
        <div className="p-12 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-4 max-w-xl mx-auto">
          <Bookmark className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Followed Storylines Yet
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
            Click the <strong className="text-slate-700 dark:text-slate-300">Follow</strong> bookmark button on any developing story card. Your browser will automatically monitor the story and alert you when new wire dispatches arrive.
          </p>
          <button
            onClick={() => setViewTab('all')}
            className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg hover:bg-blue-700 cursor-pointer"
          >
            Browse All Stories
          </button>
        </div>
      ) : (
        <div className="p-12 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-center space-y-3">
          <AlertCircle className="w-10 h-10 text-slate-400 mx-auto opacity-60" />
          <h3 className="text-lg font-bold text-slate-900 dark:text-white">
            No Storylines Found
          </h3>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
            No active multi-publisher storylines match your current search or topic filter.
          </p>
        </div>
      )}

      {/* Honest Privacy & Storage Banner */}
      <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-slate-900 border border-blue-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="text-slate-900 dark:text-white block">
            Browser-Local Story Bookmarking:
          </strong>
          <p className="leading-relaxed">
            Stories you follow are saved directly inside your browser’s local storage. We do not require account registration, passwords, or cloud database storage. Note that bookmarks do not automatically sync across different devices or browsers.
          </p>
        </div>
      </div>
    </div>
  );
};
