import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Clock,
  Bookmark,
  BookmarkCheck,
  Share2,
  Check,
  ExternalLink,
  ShieldCheck,
  Radio,
  Sparkles,
  ArrowUpDown,
  FileText,
  AlertTriangle,
  Loader2,
  Info
} from 'lucide-react';
import { FactTrail, FactTrailUpdate } from '../../server/services/types.ts';
import { factTrailStorage } from '../services/factTrailStorage.ts';
import { safeFetchJson } from '../utils/api.ts';

interface FactTrailDetailViewProps {
  trailId: string;
  onBack: () => void;
  onOpenArticleByUrl?: (url: string) => void;
}

export const FactTrailDetailView: React.FC<FactTrailDetailViewProps> = ({
  trailId,
  onBack,
}) => {
  const [trail, setTrail] = useState<FactTrail | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isFollowed, setIsFollowed] = useState(false);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // asc = chronological oldest first

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    safeFetchJson<FactTrail>(`/api/facttrail/${trailId}`)
      .then((res) => {
        if (!isMounted) return;
        if (res.ok && res.data) {
          setTrail(res.data);
          setIsFollowed(factTrailStorage.isFollowed(res.data.id));
          // Mark story viewed in local storage
          factTrailStorage.markViewed(res.data.id, res.data.latestUpdateAt);
        } else {
          console.warn('Notice loading FactTrail detail:', res.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Notice loading FactTrail detail:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [trailId]);

  const handleToggleFollow = () => {
    if (!trail) return;
    if (isFollowed) {
      factTrailStorage.unfollowStory(trail.id);
      setIsFollowed(false);
    } else {
      factTrailStorage.followStory(trail);
      setIsFollowed(true);
    }
  };

  const handleShare = () => {
    const url = window.location.origin + `?story=${trailId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-24 px-4 text-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
          Synthesizing Chronological Story Trail...
        </h3>
        <p className="text-xs text-slate-500">
          Auditing member articles, source timestamps, and publisher attributions across wire feeds.
        </p>
      </div>
    );
  }

  if (!trail) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-4 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">
          FactTrail Story Not Found
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          The requested storyline may have expired from current wire archives or does not match an active trail.
        </p>
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg text-sm cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to All Storylines</span>
        </button>
      </div>
    );
  }

  // Sort timeline according to selected sortOrder
  const timeline = [...trail.timeline].sort((a, b) => {
    const timeA = new Date(a.publishedAt).getTime();
    const timeB = new Date(b.publishedAt).getTime();
    return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
  });

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10 animate-fade-in">
      {/* Top Navigation & Breadcrumbs */}
      <div className="flex items-center justify-between gap-4 flex-wrap pb-4 border-b border-stone-200 dark:border-slate-800">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to All Story Trails</span>
        </button>

        <div className="flex items-center gap-2">
          {/* Follow Button */}
          <button
            onClick={handleToggleFollow}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
              isFollowed
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-stone-200 dark:hover:bg-slate-700'
            }`}
          >
            {isFollowed ? (
              <>
                <BookmarkCheck className="w-4 h-4" />
                <span>Following Story</span>
              </>
            ) : (
              <>
                <Bookmark className="w-4 h-4" />
                <span>Follow This Story</span>
              </>
            )}
          </button>

          {/* Share Button */}
          <button
            onClick={handleShare}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 dark:hover:text-white bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            title="Share direct link to this story"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Story Header */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
            {trail.category}
          </span>
          <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded font-medium">
            <Radio className="w-3 h-3 text-emerald-600 dark:text-emerald-400 animate-pulse" />
            <span>Active Storyline · {trail.publishersCount} {trail.publishersCount === 1 ? 'Publisher' : 'Publishers'}</span>
          </span>
          <span className="text-slate-400">
            {trail.articlesCount} updates recorded
          </span>
        </div>

        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-editorial text-slate-950 dark:text-white leading-tight">
          {trail.title}
        </h1>

        {/* Overview Banner */}
        <p className="text-base sm:text-lg text-slate-700 dark:text-slate-300 font-sans leading-relaxed max-w-4xl">
          {trail.overview}
        </p>

        {/* Provenance & Telemetry Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">First Reported</span>
            <span className="font-semibold text-slate-900 dark:text-white font-tabular">
              {new Date(trail.firstReportedAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Latest Update</span>
            <span className="font-semibold text-slate-900 dark:text-white font-tabular">
              {new Date(trail.latestUpdateAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Updates In Trail</span>
            <span className="font-semibold text-slate-900 dark:text-white font-tabular">
              {trail.articlesCount} reports
            </span>
          </div>
          <div>
            <span className="block text-[11px] text-slate-400 uppercase tracking-wider mb-0.5">Publishers</span>
            <span className="font-semibold text-slate-900 dark:text-white">
              {trail.publishers.length} accredited
            </span>
          </div>
        </div>
      </div>

      {/* SECTION 1: WHAT CHANGED IN THE LATEST UPDATE? */}
      <section className="p-6 rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50/50 dark:from-slate-900 dark:to-blue-950/40 border-2 border-blue-200 dark:border-blue-900/60 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-300">
          <Sparkles className="w-4 h-4 text-blue-600" />
          <span>What Changed in the Latest Update?</span>
        </div>
        <p className="text-sm sm:text-base text-slate-800 dark:text-slate-200 leading-relaxed font-sans font-medium">
          {trail.whatChanged}
        </p>
        <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 pt-1">
          <span>Latest wire dispatch:</span>
          <strong className="font-semibold text-slate-700 dark:text-slate-300">
            {trail.timeline[trail.timeline.length - 1]?.title}
          </strong>
        </div>
      </section>

      {/* SECTION 2: OFFICIAL STATEMENTS & PRIMARY DOCUMENTS (if any) */}
      {trail.officialStatements.length > 0 && (
        <section className="p-6 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-amber-800 dark:text-amber-300">
            <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Official Statements &amp; Primary Communiques ({trail.officialStatements.length})</span>
          </div>
          <div className="space-y-3">
            {trail.officialStatements.map((stmt) => (
              <div
                key={stmt.id}
                className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-400 font-semibold mb-1">
                    <span>{stmt.publisher}</span>
                    <span aria-hidden="true">·</span>
                    <span className="font-tabular">{new Date(stmt.publishedAt).toLocaleString()}</span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {stmt.title}
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2">
                    {stmt.summary}
                  </p>
                </div>
                <a
                  href={stmt.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold hover:underline shrink-0"
                >
                  <span>View Primary Source</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* SECTION 3: CHRONOLOGICAL TIMELINE OF UPDATES */}
      <section className="space-y-6">
        <div className="flex items-center justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial text-slate-950 dark:text-white">
              Chronological Story Timeline
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Every filed dispatch in chronological sequence with verified source links.
            </p>
          </div>

          <button
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-800 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-stone-50 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer transition-colors"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            <span>{sortOrder === 'asc' ? 'Oldest First (Chronological)' : 'Newest First'}</span>
          </button>
        </div>

        {/* Timeline Stack */}
        <div className="relative pl-6 sm:pl-8 border-l-2 border-stone-200 dark:border-slate-800 space-y-8">
          {timeline.map((update, idx) => (
            <div key={update.id} className="relative group">
              {/* Timeline Node Dot */}
              <div
                className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full border-2 ${
                  update.isLatest
                    ? 'bg-blue-600 border-blue-200 dark:border-blue-900 ring-4 ring-blue-100 dark:ring-blue-950 animate-pulse'
                    : 'bg-stone-300 dark:bg-slate-700 border-white dark:border-slate-900'
                }`}
              />

              {/* Card Container */}
              <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 space-y-3 hover:border-slate-300 dark:hover:border-slate-700 transition-all">
                {/* Meta line */}
                <div className="flex items-center justify-between gap-2 flex-wrap text-xs">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {update.publisher}
                    </span>
                    <span className="text-[10px] uppercase font-semibold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                      {update.sourceType}
                    </span>
                    <span className="text-slate-400 font-tabular">
                      {new Date(update.publishedAt).toLocaleString([], {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {update.isLatest && (
                    <span className="text-[11px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded flex items-center gap-1">
                      <Radio className="w-3 h-3 text-blue-500 animate-pulse" />
                      <span>Latest Update</span>
                    </span>
                  )}
                </div>

                {/* Headline */}
                <h3 className="text-base sm:text-lg font-bold font-editorial text-slate-950 dark:text-white leading-snug">
                  {update.title}
                </h3>

                {/* Factual Summary */}
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
                  {update.summary}
                </p>

                {/* Link to original article */}
                <div className="pt-2 border-t border-stone-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">
                    Attributed to {update.publisher}
                  </span>
                  <a
                    href={update.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline font-semibold cursor-pointer"
                  >
                    <span>Read Full Report on {update.publisher}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 4: PUBLISHER COVERAGE MATRIX */}
      <section className="bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
        <h3 className="text-lg font-bold font-editorial text-slate-950 dark:text-white">
          Publisher Coverage &amp; Source Attribution Matrix
        </h3>
        <p className="text-xs text-slate-500">
          FactInfoLive links directly to each accredited publisher reporting this storyline.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {trail.sources.map((src) => (
            <div
              key={src.publisher}
              className="p-4 rounded-xl bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-2 text-xs"
            >
              <div className="flex items-center justify-between font-semibold text-slate-900 dark:text-white">
                <span>{src.publisher}</span>
                <span className="text-[11px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded">
                  {src.articlesCount} {src.articlesCount === 1 ? 'Dispatch' : 'Dispatches'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 font-tabular">
                Latest file: {new Date(src.latestReportAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
              <div className="pt-2 border-t border-stone-100 dark:border-slate-800">
                <a
                  href={src.urls[0]}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <span>Open reporting</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* SECTION 5: UNCONFIRMED OR DEVELOPING INFORMATION */}
      <section className="p-6 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3 text-xs">
        <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider text-[11px]">
          <Info className="w-4 h-4 text-blue-500" />
          <span>Factual Transparency: What Remains Developing or Unconfirmed</span>
        </div>
        <ul className="space-y-1.5 pl-5 list-disc text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
          {trail.unconfirmedOrDeveloping.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </section>

      {/* Transparency & Local Privacy Note */}
      <div className="text-center text-xs text-slate-400 py-4 border-t border-stone-200 dark:border-slate-800 space-y-1">
        <p>
          FactTrail synthesizes reporting exclusively from public RSS syndication feeds. Followed storylines are stored in your browser’s local storage.
        </p>
        <p>
          No account registration or background tracking required.
        </p>
      </div>
    </div>
  );
};
