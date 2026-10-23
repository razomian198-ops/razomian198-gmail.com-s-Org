import React, { useState } from 'react';
import {
  Trophy,
  Activity,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  MapPin
} from 'lucide-react';
import { SportsFixture, SportsStanding, SportType } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface LiveSportsCenterProps {
  currentLanguage: SupportedLanguage;
  fixtures: SportsFixture[];
  standings: SportsStanding[];
  onOpenArticleByTopic?: (topic: string) => void;
}

export const LiveSportsCenter: React.FC<LiveSportsCenterProps> = ({
  currentLanguage,
  fixtures,
  standings,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'results' | 'standings'>('live');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');

  const sportsList: { id: SportType | 'all'; label: string }[] = [
    { id: 'all', label: 'All Sports' },
    { id: 'football', label: 'Football' },
    { id: 'cricket', label: 'Cricket' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'f1', label: 'Formula 1' },
    { id: 'baseball', label: 'Baseball' },
  ];

  const filteredFixtures = fixtures.filter((f) => {
    const matchesSport = selectedSport === 'all' || f.sport === selectedSport;
    if (activeTab === 'live') return matchesSport && f.status === 'live';
    if (activeTab === 'upcoming') return matchesSport && f.status === 'upcoming';
    if (activeTab === 'results') return matchesSport && f.status === 'completed';
    return matchesSport;
  });

  const filteredStandings = standings.filter((s) => {
    return selectedSport === 'all' || s.sport === selectedSport;
  });

  const liveCount = fixtures.filter((f) => f.status === 'live').length;

  return (
    <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 lg:p-7 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Trophy className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xl font-bold font-editorial text-slate-950 dark:text-white flex items-center gap-2">
              <span>{t.liveSportsCenter}</span>
              {liveCount > 0 && (
                <span className="text-xs font-sans font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
                  {liveCount} Live
                </span>
              )}
            </h2>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5">
              <span>Real-time feeds</span>
              <span aria-hidden="true">·</span>
              <span>TheSportsDB & Federation Open Platforms</span>
            </div>
          </div>
        </div>

        {/* Interactive Filter Tabs (Buttons with click handlers) */}
        <div className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-slate-800 rounded-lg self-start sm:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'live'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Activity className="w-3.5 h-3.5 text-blue-500" />
            <span>{t.liveMatches} ({liveCount})</span>
          </button>
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'upcoming'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>{t.upcomingFixtures}</span>
          </button>
          <button
            onClick={() => setActiveTab('results')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>{t.recentResults}</span>
          </button>
          <button
            onClick={() => setActiveTab('standings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'standings'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>{t.standings}</span>
          </button>
        </div>
      </div>

      {/* Sport Category Pills/Filters */}
      <div className="flex items-center gap-2 py-3 overflow-x-auto scrollbar-none border-b border-stone-100 dark:border-slate-800/80">
        <span className="text-xs text-slate-500 font-medium shrink-0 mr-1">{t.selectSport}:</span>
        {sportsList.map((sport) => (
          <button
            key={sport.id}
            onClick={() => setSelectedSport(sport.id)}
            className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              selectedSport === sport.id
                ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 font-medium'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
          >
            {sport.label}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="pt-4">
        {activeTab !== 'standings' ? (
          filteredFixtures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  className="p-4 rounded-lg border border-stone-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-stone-50/50 dark:bg-slate-950/40 transition-colors flex flex-col justify-between"
                >
                  <div>
                    {/* Fixture Header */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px]">
                          {fixture.sport}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[160px]">{fixture.competition}</span>
                        {fixture.round && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400">{fixture.round}</span>
                          </>
                        )}
                      </div>

                      {/* Status / Clock */}
                      {fixture.status === 'live' && (
                        <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold font-tabular">
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 animate-pulse" />
                          <span>{fixture.minute || 'LIVE'}</span>
                          {fixture.period && <span className="text-[10px] text-slate-400 font-normal">({fixture.period})</span>}
                        </div>
                      )}
                      {fixture.status === 'upcoming' && (
                        <span className="font-tabular text-slate-600 dark:text-slate-400">
                          {new Date(fixture.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} ·{' '}
                          {new Date(fixture.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                      {fixture.status === 'completed' && (
                        <span className="text-slate-500 font-medium">Final</span>
                      )}
                    </div>

                    {/* Teams & Scores */}
                    <div className="space-y-2 mb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-stone-100 text-sm">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span>{fixture.homeTeam.name}</span>
                        </div>
                        <span className="font-bold text-base font-tabular text-slate-900 dark:text-white">
                          {fixture.homeTeam.score ?? '-'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-medium text-slate-900 dark:text-stone-100 text-sm">
                          <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-700" />
                          <span>{fixture.awayTeam.name}</span>
                        </div>
                        <span className="font-bold text-base font-tabular text-slate-900 dark:text-white">
                          {fixture.awayTeam.score ?? '-'}
                        </span>
                      </div>
                    </div>

                    {/* Stats summary if provided */}
                    {fixture.stats && (
                      <div className="pt-2 border-t border-stone-200/60 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between font-tabular">
                        {Object.entries(fixture.stats).slice(0, 2).map(([key, val]) => (
                          <span key={key} className="capitalize">
                            {key}: <strong className="text-slate-700 dark:text-slate-300 font-semibold">{val}</strong>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Footer / Venue */}
                  <div className="pt-3 mt-2 border-t border-stone-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1 truncate max-w-[200px]">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{fixture.venue || 'Confirmed Venue'}</span>
                    </div>
                    {fixture.officialSourceUrl && (
                      <a
                        href={fixture.officialSourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-0.5 shrink-0"
                      >
                        <span>Official Match Center</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 bg-stone-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-stone-200 dark:border-slate-800">
              <Trophy className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.noData}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeTab === 'live'
                  ? 'There are currently no active live matches in progress for this sport filter. Check Upcoming Fixtures for today’s schedule.'
                  : t.noDataDesc}
              </p>
              {activeTab === 'live' && (
                <button
                  onClick={() => setActiveTab('upcoming')}
                  className="mt-3 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 rounded-md hover:bg-blue-100 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View Upcoming Schedule</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )
        ) : (
          /* Standings Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-stone-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Team / Competitor</th>
                  <th className="py-2.5 px-3">Competition</th>
                  <th className="py-2.5 px-3 text-right">P</th>
                  <th className="py-2.5 px-3 text-right">W</th>
                  <th className="py-2.5 px-3 text-right">L</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-tabular">
                {filteredStandings.map((item) => (
                  <tr key={`${item.competition}-${item.position}-${item.team}`} className="hover:bg-stone-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{item.position}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-stone-100">{item.team}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.competition}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{item.played}</td>
                    <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{item.won}</td>
                    <td className="py-2.5 px-3 text-right text-slate-500">{item.lost}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-950 dark:text-white">{item.points}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  );
};
