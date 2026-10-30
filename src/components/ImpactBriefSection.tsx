import React, { useEffect, useState, useRef } from 'react';
import {
  Compass,
  Bookmark,
  BookmarkCheck,
  Bell,
  BellRing,
  Share2,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  RefreshCw,
  Sparkles,
  ShieldAlert,
  HelpCircle,
  Clock,
  Eye,
  CheckCircle2,
  GitFork,
  SplitSquareVertical,
  FlaskConical,
  Trophy,
  Cpu,
  HeartPulse,
  Globe2,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  ImpactBriefItem,
  ImpactBriefCategory,
  ImpactBriefRegion,
  ImpactBriefPreference,
  FollowedStoryRecord,
  NewsItem
} from '../../server/services/types.ts';
import { SupportedLanguage } from '../i18n/translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface ImpactBriefSectionProps {
  currentLanguage: SupportedLanguage;
  onOpenFactTrail?: (trailId: string) => void;
  onCompareCoverage?: (story: NewsItem) => void;
  onOpenArticle?: (item: NewsItem) => void;
}

const CATEGORY_CONFIG: Record<
  ImpactBriefCategory,
  { label: string; icon: React.FC<{ className?: string }>; color: string }
> = {
  world: { label: 'World Affairs', icon: Globe2, color: 'text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 border-sky-200 dark:border-sky-800' },
  technology: { label: 'Tech & AI', icon: Cpu, color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 border-indigo-200 dark:border-indigo-800' },
  science: { label: 'Science & Environment', icon: FlaskConical, color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 border-teal-200 dark:border-teal-800' },
  health: { label: 'Health & Medicine', icon: HeartPulse, color: 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800' },
  business: { label: 'Economy & Business', icon: Layers, color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800' },
  sports: { label: 'Sports', icon: Trophy, color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800' },
  politics: { label: 'Politics & Policy', icon: Globe2, color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/60 border-violet-200 dark:border-violet-800' },
  guides: { label: 'Digital Guides', icon: Compass, color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 border-blue-200 dark:border-blue-800' },
};

const REGIONS: { id: ImpactBriefRegion; label: string }[] = [
  { id: 'global', label: 'Global Overview' },
  { id: 'eu', label: 'Europe & UK' },
  { id: 'na', label: 'North America' },
  { id: 'asia', label: 'Asia-Pacific' },
  { id: 'me-africa', label: 'Middle East & Africa' },
  { id: 'latam', label: 'Latin America' },
];

const PREFS_KEY = 'fil_impact_brief_prefs';
const SAVED_BRIEFS_KEY = 'fil_saved_briefs';
const FOLLOWED_STORIES_KEY = 'fil_followed_stories';

export const ImpactBriefSection: React.FC<ImpactBriefSectionProps> = ({
  currentLanguage,
  onOpenFactTrail,
  onCompareCoverage,
  onOpenArticle,
}) => {
  // 1. Preferences in browser-local storage
  const [preferences, setPreferences] = useState<ImpactBriefPreference>(() => {
    try {
      const saved = localStorage.getItem(PREFS_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {}
    return {
      categories: ['world', 'technology', 'science', 'business', 'sports'],
      region: 'global',
      language: currentLanguage,
    };
  });

  // 2. Saved and Followed items in browser-local storage
  const [savedBriefIds, setSavedBriefIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(SAVED_BRIEFS_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [followedStories, setFollowedStories] = useState<FollowedStoryRecord[]>(() => {
    try {
      const followed = localStorage.getItem(FOLLOWED_STORIES_KEY);
      return followed ? JSON.parse(followed) : [];
    } catch {
      return [];
    }
  });

  // 3. UI states
  const [activeTab, setActiveTab] = useState<'daily' | 'followed' | 'saved'>('daily');
  const [showPreferences, setShowPreferences] = useState(false);
  const [briefs, setBriefs] = useState<ImpactBriefItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [followedUpdatesCount, setFollowedUpdatesCount] = useState<number>(0);
  const [expandedPillars, setExpandedPillars] = useState<Record<string, boolean>>({});
  const [copyToast, setCopyToast] = useState<string | null>(null);
  const [highlightedBriefId, setHighlightedBriefId] = useState<string | null>(null);

  const cardRefs = useRef<Record<string, HTMLElement | null>>({});

  // Deep-link check: if ?brief=id exists, highlight and scroll
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const briefParam = params.get('brief');
    if (briefParam) {
      setHighlightedBriefId(briefParam);
      setTimeout(() => {
        const el = cardRefs.current[briefParam];
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    }
  }, [briefs]);

  // Persist preferences
  const savePreferences = (newPrefs: ImpactBriefPreference) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(newPrefs));
    } catch {}
  };

  // Toggle individual category
  const toggleCategory = (cat: ImpactBriefCategory) => {
    const exists = preferences.categories.includes(cat);
    let updated: ImpactBriefCategory[];
    if (exists) {
      if (preferences.categories.length === 1) return; // Keep at least one
      updated = preferences.categories.filter((c) => c !== cat);
    } else {
      updated = [...preferences.categories, cat];
    }
    const newPrefs = { ...preferences, categories: updated };
    savePreferences(newPrefs);
  };

  // Toggle region
  const selectRegion = (region: ImpactBriefRegion) => {
    const newPrefs = { ...preferences, region };
    savePreferences(newPrefs);
  };

  // Fetch briefs from backend with grounding
  const fetchBriefs = async (isManualRefresh = false) => {
    if (isManualRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const catsQuery = preferences.categories.join(',');
      const regionQuery = preferences.region;
      const followedPayload = encodeURIComponent(JSON.stringify(followedStories));

      const res = await safeFetchJson<{
        briefs: ImpactBriefItem[];
        lastUpdated: string;
        followedUpdatesCount: number;
      }>(
        `/api/impact-briefs?categories=${catsQuery}&region=${regionQuery}&limit=5&followed=${followedPayload}&language=${currentLanguage}`
      );

      if (res.ok && res.data) {
        setBriefs(res.data.briefs);
        setLastUpdated(res.data.lastUpdated);
        setFollowedUpdatesCount(res.data.followedUpdatesCount);

        // Update lastVisitedAt on followed stories
        const now = new Date().toISOString();
        const updatedFollowed = followedStories.map((f) => ({
          ...f,
          lastVisitedAt: now,
        }));
        setFollowedStories(updatedFollowed);
        try {
          localStorage.setItem(FOLLOWED_STORIES_KEY, JSON.stringify(updatedFollowed));
        } catch {}
      }
    } catch (err) {
      console.warn('Notice loading Impact Briefs:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBriefs();
  }, [preferences.categories, preferences.region, currentLanguage]);

  // Save / Bookmark toggle
  const toggleSaveBrief = (briefId: string) => {
    let updated: string[];
    if (savedBriefIds.includes(briefId)) {
      updated = savedBriefIds.filter((id) => id !== briefId);
    } else {
      updated = [...savedBriefIds, briefId];
    }
    setSavedBriefIds(updated);
    try {
      localStorage.setItem(SAVED_BRIEFS_KEY, JSON.stringify(updated));
    } catch {}
  };

  // Follow / Unfollow storyline
  const toggleFollowStory = (brief: ImpactBriefItem) => {
    const isFollowed = followedStories.some((f) => f.storyId === brief.storyId);
    let updated: FollowedStoryRecord[];

    if (isFollowed) {
      updated = followedStories.filter((f) => f.storyId !== brief.storyId);
      setCopyToast('Storyline removed from your followed updates');
    } else {
      const newFollow: FollowedStoryRecord = {
        storyId: brief.storyId,
        factTrailId: brief.factTrailId,
        title: brief.title,
        followedAt: new Date().toISOString(),
        lastVisitedAt: new Date().toISOString(),
        lastKnownUpdateAt: brief.publishedAt,
      };
      updated = [newFollow, ...followedStories];
      setCopyToast('Storyline followed! We will highlight what changes since your visit');
    }

    setFollowedStories(updated);
    try {
      localStorage.setItem(FOLLOWED_STORIES_KEY, JSON.stringify(updated));
    } catch {}

    setTimeout(() => setCopyToast(null), 3500);
  };

  // Share Brief with clean deep-link
  const handleShareBrief = async (brief: ImpactBriefItem) => {
    const url = new URL(window.location.href);
    url.searchParams.set('brief', brief.storyId);
    const shareUrl = url.toString();

    if (navigator.share && window.isSecureContext) {
      try {
        await navigator.share({
          title: `FactInfoLive Impact Brief: ${brief.title}`,
          text: `${brief.title} — Why This Matters: ${brief.whyItMatters.slice(0, 140)}...`,
          url: shareUrl,
        });
        return;
      } catch (e: any) {
        if (e.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopyToast('Direct brief link copied to clipboard!');
      setTimeout(() => setCopyToast(null), 3000);
    } catch {
      setCopyToast(`Link: ${shareUrl}`);
      setTimeout(() => setCopyToast(null), 5000);
    }
  };

  const togglePillars = (briefId: string) => {
    setExpandedPillars((prev) => ({
      ...prev,
      [briefId]: !prev[briefId],
    }));
  };

  // Filtered view by active tab
  const displayedBriefs = () => {
    if (activeTab === 'saved') {
      return briefs.filter((b) => savedBriefIds.includes(b.id));
    }
    if (activeTab === 'followed') {
      return briefs.filter((b) =>
        followedStories.some((f) => f.storyId === b.storyId || (b.factTrailId && f.factTrailId === b.factTrailId))
      );
    }
    return briefs;
  };

  const currentDisplayBriefs = displayedBriefs();

  return (
    <section className="bg-gradient-to-b from-stone-50 via-white to-stone-50 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-950 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:p-7 shadow-sm transition-all duration-300">
      {/* Toast Alert */}
      {copyToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-950 text-white dark:bg-white dark:text-slate-900 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-xl border border-stone-700 flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{copyToast}</span>
        </div>
      )}

      {/* Flagship Header */}
      <div className="pb-5 border-b border-stone-200 dark:border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
              Daily Intelligence Synthesis · FactInfoLive Flagship
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold font-editorial text-slate-950 dark:text-white tracking-tight">
              Impact Brief — <span className="italic font-serif font-normal text-slate-700 dark:text-slate-300">Why This Matters</span>
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl leading-relaxed">
              Don’t just read what happened. Understand why it matters, who is affected, what remains uncertain, and what official records to monitor next.
            </p>
          </div>

          {/* Quick Actions & Customize Button */}
          <div className="flex items-center gap-2 sm:self-start">
            <button
              onClick={() => fetchBriefs(true)}
              disabled={refreshing}
              title="Refresh briefings"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-stone-300 dark:border-slate-700 hover:bg-stone-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin text-blue-600' : ''}`} />
              <span className="hidden sm:inline">Refresh</span>
            </button>

            <button
              onClick={() => setShowPreferences(!showPreferences)}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg border flex items-center gap-1.5 cursor-pointer transition-colors ${
                showPreferences
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white dark:bg-slate-800 border-stone-300 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-stone-50 dark:hover:bg-slate-700'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Personalize Interests</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showPreferences ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-stone-200/60 dark:border-slate-800/80 overflow-x-auto text-xs font-semibold">
          <button
            onClick={() => setActiveTab('daily')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'daily'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Today’s Briefing ({briefs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('followed')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'followed'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Followed Storylines</span>
            {followedUpdatesCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white animate-pulse">
                {followedUpdatesCount} new
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('saved')}
            className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'saved'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved Briefs ({savedBriefIds.length})</span>
          </button>
        </div>
      </div>

      {/* Preferences Panel (Collapsible with zero-registration notice) */}
      {showPreferences && (
        <div className="my-5 p-5 bg-stone-100/80 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 rounded-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-600" />
                Select Your Editorial Focus Areas
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Choose the beats you care about. We prioritize verified reporting and official updates matching these categories.
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 self-start">
              <CheckCircle2 className="w-3 h-3" />
              <span>Stored locally on this browser · No registration required</span>
            </div>
          </div>

          {/* Category Chips */}
          <div className="flex flex-wrap gap-2 pt-1">
            {(Object.keys(CATEGORY_CONFIG) as ImpactBriefCategory[]).map((cat) => {
              const cfg = CATEGORY_CONFIG[cat];
              const isSelected = preferences.categories.includes(cat);
              const Icon = cfg.icon;
              return (
                <button
                  key={cat}
                  onClick={() => toggleCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                    isSelected
                      ? `${cfg.color} shadow-xs font-bold`
                      : 'bg-white dark:bg-slate-900 border-stone-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 opacity-60 hover:opacity-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cfg.label}</span>
                  {isSelected && <span className="ml-1 text-[10px]">✓</span>}
                </button>
              );
            })}
          </div>

          {/* Region Selector */}
          <div className="pt-3 border-t border-stone-200 dark:border-slate-800">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
              Focus Geographic Scope:
            </label>
            <div className="flex flex-wrap gap-1.5">
              {REGIONS.map((r) => (
                <button
                  key={r.id}
                  onClick={() => selectRegion(r.id)}
                  className={`px-3 py-1 rounded-md text-xs font-medium border cursor-pointer transition-colors ${
                    preferences.region === r.id
                      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-transparent font-semibold shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border-stone-200 dark:border-slate-800 hover:border-stone-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-slate-500 mt-2 italic">
              Note: Preferences remain in your current browser session and will not synchronize automatically across devices.
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="mt-5 space-y-5">
        {loading ? (
          <div className="p-12 text-center space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Synthesizing today's grounded Impact Briefs across multi-wire feeds...
            </p>
            <p className="text-xs text-slate-500">
              Cross-referencing confirmed developments with official research and timeline archives.
            </p>
          </div>
        ) : currentDisplayBriefs.length === 0 ? (
          <div className="p-8 text-center bg-stone-100/60 dark:bg-slate-950/50 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3">
            <HelpCircle className="w-8 h-8 text-slate-400 mx-auto" />
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              {activeTab === 'saved'
                ? 'No Saved Briefs Yet'
                : activeTab === 'followed'
                ? 'No Followed Storylines Yet'
                : 'No Briefs Matching Current Interests'}
            </h4>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {activeTab === 'saved'
                ? 'Click "Save Brief" on any story below to keep it accessible for future reference.'
                : activeTab === 'followed'
                ? 'Click "Follow Story" on any developing event to receive alerts whenever new updates are published.'
                : 'Try enabling more categories or setting geographic scope to Global Overview.'}
            </p>
            {activeTab !== 'daily' && (
              <button
                onClick={() => setActiveTab('daily')}
                className="mt-2 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700"
              >
                Return to Today's Briefing
              </button>
            )}
          </div>
        ) : (
          currentDisplayBriefs.map((brief) => {
            const isSaved = savedBriefIds.includes(brief.id);
            const isFollowed = followedStories.some((f) => f.storyId === brief.storyId);
            const isExpanded = expandedPillars[brief.id] ?? false;
            const isHighlighted = highlightedBriefId === brief.storyId;
            const categoryConfig = CATEGORY_CONFIG[brief.category] || CATEGORY_CONFIG.world;
            const CategoryIcon = categoryConfig.icon;

            return (
              <article
                key={brief.id}
                ref={(el) => {
                  cardRefs.current[brief.storyId] = el;
                }}
                className={`bg-white dark:bg-slate-900 border rounded-xl p-5 sm:p-6 transition-all duration-300 ${
                  isHighlighted
                    ? 'border-blue-500 ring-2 ring-blue-500/20 shadow-lg'
                    : brief.hasNewUpdate
                    ? 'border-amber-400 dark:border-amber-500 shadow-md'
                    : 'border-stone-200 dark:border-slate-800 hover:border-stone-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Update Pulse Banner for Followed Stories */}
                {brief.hasNewUpdate && (
                  <div className="mb-4 -mt-1 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping mt-1 shrink-0"></span>
                    <div className="text-xs">
                      <span className="font-bold text-amber-900 dark:text-amber-200 uppercase tracking-wide">
                        What Changed Since Your Last Visit:
                      </span>{' '}
                      <span className="text-amber-800 dark:text-amber-300">
                        {brief.newUpdateSummary || 'New verified dispatch logged into the FactTrail storyline.'}
                      </span>
                      {brief.newUpdatePublisher && (
                        <span className="text-[11px] text-amber-700 dark:text-amber-400 block mt-0.5">
                          Reported by {brief.newUpdatePublisher}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Card Top Meta */}
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-stone-100 dark:border-slate-800 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] border ${categoryConfig.color}`}
                    >
                      <CategoryIcon className="w-3 h-3" />
                      {categoryConfig.label}
                    </span>

                    <span className="text-slate-500 dark:text-slate-400 font-medium">
                      {brief.publisher}
                    </span>

                    <span className="text-slate-400">·</span>

                    <span className="text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(brief.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>

                    {brief.factTrailId && (
                      <button
                        onClick={() => onOpenFactTrail && onOpenFactTrail(brief.factTrailId!)}
                        className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer bg-blue-50 dark:bg-blue-950/50 px-2 py-0.5 rounded border border-blue-200 dark:border-blue-800"
                      >
                        <GitFork className="w-3 h-3" />
                        FactTrail Tracking
                      </button>
                    )}
                  </div>

                  {/* Single Source / Verified Transparency Badge */}
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    {brief.transparency.isSingleSource ? (
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/60 font-medium">
                        <ShieldAlert className="w-3 h-3" />
                        Single Publisher
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-900/60 font-medium">
                        <CheckCircle2 className="w-3 h-3" />
                        Multi-Source Corroborated
                      </span>
                    )}
                  </div>
                </div>

                {/* Headline */}
                <h3 className="text-lg sm:text-xl font-bold font-editorial text-slate-950 dark:text-white mt-3 mb-3 leading-snug">
                  <a
                    href={brief.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    {brief.title}
                  </a>
                </h3>

                {/* Pillar A: What Happened? (Factual Reporting) */}
                <div className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-sans mb-4">
                  <span className="font-bold text-slate-900 dark:text-white block uppercase tracking-wider text-[11px] text-slate-500 mb-1">
                    What Happened:
                  </span>
                  {brief.whatHappened}
                </div>

                {/* Pillar B: Why Might This Matter? (Grounded Practical Significance) */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200/80 dark:border-blue-900/50 space-y-1 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                      Why This Matters
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-blue-600/80 dark:text-blue-400/80 bg-blue-100/80 dark:bg-blue-900/40 px-2 py-0.5 rounded">
                      Context &amp; Practical Significance
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                    {brief.whyItMatters}
                  </p>
                </div>

                {/* Domain-Specific Grounded Callout */}
                {brief.domainDetails && (
                  <div className="mb-4">
                    {brief.templateType === 'science' && brief.domainDetails.science && (
                      <div className="p-3.5 rounded-lg bg-teal-50/60 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/50 text-xs space-y-1.5">
                        <div className="font-bold text-teal-900 dark:text-teal-300 flex items-center gap-1.5">
                          <FlaskConical className="w-3.5 h-3.5 text-teal-600" />
                          Scientific Finding Distinction
                        </div>
                        <div>
                          <span className="font-semibold text-teal-800 dark:text-teal-300">What the reporting establishes:</span>{' '}
                          <span className="text-slate-700 dark:text-slate-300">{brief.domainDetails.science.whatStudyFound}</span>
                        </div>
                        <div>
                          <span className="font-semibold text-teal-800 dark:text-teal-300">What remains unproven / not established:</span>{' '}
                          <span className="text-slate-600 dark:text-slate-400">{brief.domainDetails.science.whatItDidNotEstablish}</span>
                        </div>
                      </div>
                    )}

                    {brief.templateType === 'sports' && brief.domainDetails.sports && (
                      <div className="p-3.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 text-xs space-y-1">
                        <div className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                          <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                          Tournament &amp; Table Standings Impact
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-medium">
                          {brief.domainDetails.sports.tableOrFixtureImpact}
                        </p>
                      </div>
                    )}

                    {brief.templateType === 'technology' && brief.domainDetails.techPolicy && (
                      <div className="p-3.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/50 text-xs space-y-1">
                        <div className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-1.5">
                          <Cpu className="w-3.5 h-3.5 text-indigo-600" />
                          Technical Scope &amp; Target Systems
                        </div>
                        <p className="text-slate-700 dark:text-slate-300">
                          {brief.domainDetails.techPolicy.announcement}
                        </p>
                        {brief.domainDetails.techPolicy.affectedAudience && (
                          <p className="text-slate-500 text-[11px]">
                            Affected: {brief.domainDetails.techPolicy.affectedAudience}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Pillars C, D, E: Accordion Expansion */}
                {isExpanded && (
                  <div className="space-y-3 pt-3 border-t border-stone-200 dark:border-slate-800 text-xs sm:text-sm animate-fadeIn">
                    {/* Pillar C: Who May Be Affected */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="p-3 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          Who May Be Affected
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {brief.whoIsAffected}
                        </p>
                      </div>

                      {/* Pillar D: What Should The Reader Check Next */}
                      <div className="p-3 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          What To Check Next
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {brief.whatToCheckNext}
                        </p>
                      </div>

                      {/* Pillar E: What Remains Uncertain */}
                      <div className="p-3 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-1">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                          What Remains Uncertain
                        </span>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          {brief.whatRemainsUncertain}
                        </p>
                      </div>
                    </div>

                    {/* Sourced Reference Links */}
                    {brief.sources.length > 0 && (
                      <div className="pt-2 text-[11px] text-slate-500">
                        <span className="font-semibold uppercase tracking-wider mr-2">Verified Sources:</span>
                        <div className="inline-flex flex-wrap gap-2 mt-1">
                          {brief.sources.map((s, idx) => (
                            <a
                              key={idx}
                              href={s.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium bg-stone-100 dark:bg-slate-800 px-2 py-0.5 rounded"
                            >
                              <span>{s.publisher}</span>
                              <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Card Bottom Actions */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-3 mt-3 border-t border-stone-100 dark:border-slate-800 text-xs">
                  <button
                    onClick={() => togglePillars(brief.id)}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Hide Key Pillars' : 'Inspect All 5 Pillars'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-2">
                    {/* Follow Story */}
                    <button
                      onClick={() => toggleFollowStory(brief)}
                      className={`px-2.5 py-1 rounded-md border font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        isFollowed
                          ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                          : 'border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                      }`}
                      title={isFollowed ? 'Unfollow Story' : 'Follow Story for Updates'}
                    >
                      {isFollowed ? <BellRing className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                      <span>{isFollowed ? 'Following' : 'Follow Story'}</span>
                    </button>

                    {/* Save Brief */}
                    <button
                      onClick={() => toggleSaveBrief(brief.id)}
                      className={`px-2.5 py-1 rounded-md border font-medium flex items-center gap-1 cursor-pointer transition-colors ${
                        isSaved
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800'
                      }`}
                      title={isSaved ? 'Remove from Saved' : 'Save Brief'}
                    >
                      {isSaved ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
                      <span>{isSaved ? 'Saved' : 'Save'}</span>
                    </button>

                    {/* Share */}
                    <button
                      onClick={() => handleShareBrief(brief)}
                      className="px-2.5 py-1 rounded-md border border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 font-medium flex items-center gap-1 cursor-pointer"
                      title="Share this Impact Brief"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                      <span>Share</span>
                    </button>

                    {/* Compare Coverage */}
                    {brief.compareCoverageAvailable && onCompareCoverage && (
                      <button
                        onClick={() =>
                          onCompareCoverage({
                            id: brief.storyId,
                            title: brief.title,
                            publisher: brief.publisher,
                            url: brief.url,
                            publishedAt: brief.publishedAt,
                            category: brief.category,
                            summary: brief.whatHappened,
                            content: brief.whatHappened,
                            sourceType: 'wire',
                            factCheckStatus: 'developing',
                            retrievedAt: new Date().toISOString(),
                            language: 'en',
                            tags: [brief.category],
                          })
                        }
                        className="px-2.5 py-1 rounded-md border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 font-medium flex items-center gap-1 cursor-pointer"
                        title="Compare Coverage Across Publishers"
                      >
                        <SplitSquareVertical className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Compare</span>
                      </button>
                    )}

                    {/* Direct Source Link */}
                    <a
                      href={brief.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-2.5 py-1 rounded-md bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900 hover:bg-stone-800 font-medium flex items-center gap-1"
                    >
                      <span>Original Report</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })
        )}
      </div>
    </section>
  );
};
