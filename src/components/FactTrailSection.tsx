import React, { useEffect, useState } from 'react';
import { GitFork, ArrowRight, Sparkles, Radio, Loader2 } from 'lucide-react';
import { FactTrailSummary } from '../../server/services/types.ts';
import { FactTrailCard } from './FactTrailCard.tsx';
import { safeFetchJson } from '../utils/api.ts';

interface FactTrailSectionProps {
  onOpenTrail: (trailId: string) => void;
  onViewAllTrails: () => void;
}

export const FactTrailSection: React.FC<FactTrailSectionProps> = ({
  onOpenTrail,
  onViewAllTrails,
}) => {
  const [trails, setTrails] = useState<FactTrailSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    safeFetchJson<{ total: number; trails: FactTrailSummary[] }>('/api/facttrail')
      .then((res) => {
        if (!isMounted) return;
        if (res.ok && res.data?.trails) {
          setTrails(res.data.trails);
        } else {
          console.warn('Notice loading FactTrails for homepage:', res.error);
        }
        setLoading(false);
      })
      .catch((err) => {
        console.warn('Notice loading FactTrails for homepage:', err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-8 flex items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
        <span className="text-sm font-medium">Tracking active multi-publisher storylines...</span>
      </div>
    );
  }

  if (trails.length === 0) {
    return null;
  }

  // Display top 3 multi-update storylines on the homepage
  const topTrails = trails.slice(0, 3);

  return (
    <section className="bg-gradient-to-br from-blue-50/50 via-white to-stone-50 dark:from-slate-900/80 dark:via-slate-900 dark:to-slate-950 border border-blue-200/70 dark:border-slate-800 rounded-2xl p-6 sm:p-8 space-y-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-stone-200/80 dark:border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
            <GitFork className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>FactTrail Intelligence</span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-500 font-medium">Follow the Story, Not Just the Headline</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold font-editorial text-slate-950 dark:text-white">
            Developing Storylines &amp; Chronological Timelines
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-2xl mt-1 leading-relaxed">
            Continuously linked dispatches from accredited international newsrooms. See what changed in the latest update, which publishers reported, and what remains developing.
          </p>
        </div>

        <button
          onClick={onViewAllTrails}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer shrink-0 self-start sm:self-center"
        >
          <span>Explore All Story Trails ({trails.length})</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {topTrails.map((trail) => (
          <FactTrailCard
            key={trail.id}
            trail={trail}
            onOpenTrail={onOpenTrail}
          />
        ))}
      </div>
    </section>
  );
};
