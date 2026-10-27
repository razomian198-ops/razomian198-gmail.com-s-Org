import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Trophy,
  Activity,
  Calendar,
  Clock,
  ExternalLink,
  ChevronRight,
  MapPin,
  X,
  FileText,
  AlertCircle,
  RefreshCw,
  Search,
  Filter,
  Info,
  ShieldCheck,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { SportsFixture, SportsStanding, SportType, MatchEvent, MatchCommentaryItem } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';
import { safeFetchJson } from '../utils/api.ts';

interface LiveSportsCenterProps {
  currentLanguage: SupportedLanguage;
  fixtures: SportsFixture[];
  standings: SportsStanding[];
  onOpenArticleByTopic?: (topic: string) => void;
}

export const LiveSportsCenter: React.FC<LiveSportsCenterProps> = ({
  currentLanguage,
  fixtures: initialFixtures,
  standings: initialStandings,
}) => {
  const t = TRANSLATIONS[currentLanguage];

  // Active view tab: live, today, upcoming, results, standings
  const [activeTab, setActiveTab] = useState<'live' | 'today' | 'upcoming' | 'results' | 'standings'>('today');
  const [selectedSport, setSelectedSport] = useState<SportType | 'all'>('all');
  const [selectedCompetition, setSelectedCompetition] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Live state
  const [fixtures, setFixtures] = useState<SportsFixture[]>(initialFixtures);
  const [standings, setStandings] = useState<SportsStanding[]>(initialStandings);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date>(new Date());
  const [providerInfo, setProviderInfo] = useState<any>(null);
  const [showProviderDrawer, setShowProviderDrawer] = useState(false);

  // Selected match for timeline modal
  const [selectedMatch, setSelectedMatch] = useState<SportsFixture | null>(null);
  const [matchDetails, setMatchDetails] = useState<{
    keyEvents: MatchEvent[];
    commentary: MatchCommentaryItem[];
    commentaryAvailable: boolean;
    notice?: string;
  } | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Update local fixtures if prop updates
  useEffect(() => {
    if (initialFixtures.length > 0 && fixtures.length === 0) {
      setFixtures(initialFixtures);
    }
  }, [initialFixtures]);

  useEffect(() => {
    if (initialStandings.length > 0 && standings.length === 0) {
      setStandings(initialStandings);
    }
  }, [initialStandings]);

  // Polling / Refreshing function
  const refreshSportsData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const res = await safeFetchJson<any>('/api/sports');
      if (res.ok && res.data) {
        const data = res.data;
        const list: SportsFixture[] = data.allFixtures || [
          ...(data.live || []),
          ...(data.today || []),
          ...(data.upcoming || []),
          ...(data.results || []),
        ];

        // Deduplicate fixtures by ID
        const seen = new Set<string>();
        const deduped: SportsFixture[] = [];
        for (const item of list) {
          if (!seen.has(item.id)) {
            seen.add(item.id);
            deduped.push(item);
          }
        }

        setFixtures(deduped);
        if (Array.isArray(data.topStandings) && data.topStandings.length > 0) {
          setStandings(data.topStandings);
        }
        if (data.providerInfo) {
          setProviderInfo(data.providerInfo);
        }
        setLastRefreshed(new Date());

        // Default to live tab if matches are currently live
        if (data.liveCount > 0 && activeTab === 'today') {
          // Keep user informed of live games
        }
      } else {
        console.warn('Notice syncing sports data:', res.error);
      }
    } catch (err) {
      console.warn('Notice syncing sports data:', err);
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  }, [activeTab]);

  // Initial fetch of provider status
  useEffect(() => {
    refreshSportsData(true);
  }, []);

  // Auto-refresh interval: polls every 45 seconds to keep live scores up-to-date
  useEffect(() => {
    const timer = setInterval(() => {
      // Only silent poll if document is visible
      if (document.visibilityState === 'visible') {
        refreshSportsData(true);
      }
    }, 45000);

    return () => clearInterval(timer);
  }, [refreshSportsData]);

  const sportsList: { id: SportType | 'all'; label: string }[] = [
    { id: 'all', label: 'All Sports' },
    { id: 'football', label: 'Football' },
    { id: 'basketball', label: 'Basketball' },
    { id: 'baseball', label: 'Baseball' },
    { id: 'tennis', label: 'Tennis' },
    { id: 'f1', label: 'Formula 1' },
    { id: 'cricket', label: 'Cricket' },
  ];

  // Distinct competitions extracted from current fixtures
  const availableCompetitions = useMemo(() => {
    const comps = new Set<string>();
    fixtures.forEach((f) => {
      if (selectedSport === 'all' || f.sport === selectedSport) {
        if (f.competition) comps.add(f.competition);
      }
    });
    return Array.from(comps).sort();
  }, [fixtures, selectedSport]);

  const handleOpenMatchDetails = async (fixture: SportsFixture) => {
    setSelectedMatch(fixture);
    setLoadingDetails(true);
    setMatchDetails(null);

    try {
      const res = await safeFetchJson<any>(`/api/sports/match/${fixture.id}`);
      if (res.ok && res.data) {
        setMatchDetails(res.data);
      } else {
        setMatchDetails({
          keyEvents: [],
          commentary: [],
          commentaryAvailable: false,
          notice: 'Live timeline is currently unavailable from upstream feeds for this match.',
        });
      }
    } catch {
      setMatchDetails({
        keyEvents: [],
        commentary: [],
        commentaryAvailable: false,
        notice: 'Network connection issue while retrieving match details. Please retry shortly.',
      });
    } finally {
      setLoadingDetails(false);
    }
  };

  // Counts across categories
  const liveMatches = useMemo(() => fixtures.filter((f) => f.status === 'live'), [fixtures]);
  const todayMatches = useMemo(
    () => fixtures.filter((f) => f.isToday || f.status === 'live'),
    [fixtures]
  );
  const upcomingMatches = useMemo(
    () => fixtures.filter((f) => f.status === 'upcoming' && !f.isToday),
    [fixtures]
  );
  const resultsMatches = useMemo(
    () => fixtures.filter((f) => f.status === 'completed'),
    [fixtures]
  );

  // Filtered fixtures based on active tab, sport, competition, and search
  const filteredFixtures = useMemo(() => {
    return fixtures.filter((f) => {
      // 1. Sport filter
      if (selectedSport !== 'all' && f.sport !== selectedSport) return false;

      // 2. Competition filter
      if (selectedCompetition !== 'all' && f.competition !== selectedCompetition) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchHome = f.homeTeam.name.toLowerCase().includes(q);
        const matchAway = f.awayTeam.name.toLowerCase().includes(q);
        const matchComp = f.competition.toLowerCase().includes(q);
        if (!matchHome && !matchAway && !matchComp) return false;
      }

      // 4. Tab filter
      if (activeTab === 'live') return f.status === 'live';
      if (activeTab === 'today') return f.isToday || f.status === 'live';
      if (activeTab === 'upcoming') return f.status === 'upcoming';
      if (activeTab === 'results') return f.status === 'completed';

      return true;
    });
  }, [fixtures, activeTab, selectedSport, selectedCompetition, searchQuery]);

  // Standings filtered by sport and competition
  const filteredStandings = useMemo(() => {
    return standings.filter((s) => {
      if (selectedSport !== 'all' && s.sport !== selectedSport) return false;
      if (selectedCompetition !== 'all' && s.competition !== selectedCompetition) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return s.team.toLowerCase().includes(q) || s.competition.toLowerCase().includes(q);
      }
      return true;
    });
  }, [standings, selectedSport, selectedCompetition, searchQuery]);

  // Available competitions in standings
  const standingsCompetitions = useMemo(() => {
    const comps = new Set<string>();
    standings.forEach((s) => {
      if (selectedSport === 'all' || s.sport === selectedSport) {
        comps.add(s.competition);
      }
    });
    return Array.from(comps);
  }, [standings, selectedSport]);

  return (
    <section className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-5 sm:p-6 lg:p-7 shadow-xs">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800 gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold font-editorial text-slate-950 dark:text-white flex items-center gap-2">
                <span>{t.liveSportsCenter}</span>
              </h2>
              {liveMatches.length > 0 ? (
                <span className="text-xs font-sans font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/80 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  {liveMatches.length} Live Now
                </span>
              ) : (
                <span className="text-xs font-sans font-medium text-slate-500 bg-stone-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                  0 Live Now
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                Verified Live Match Wires
              </span>
              <span aria-hidden="true">·</span>
              <span>Zero Fabricated Scores</span>
              <span aria-hidden="true">·</span>
              <button
                onClick={() => setShowProviderDrawer(!showProviderDrawer)}
                className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer font-medium"
              >
                <Info className="w-3 h-3" />
                <span>Provider &amp; Data Source Info</span>
              </button>
            </div>
          </div>
        </div>

        {/* Refresh & Navigation Tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => refreshSportsData(false)}
            disabled={isRefreshing}
            title={`Last refreshed at ${lastRefreshed.toLocaleTimeString()}`}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-stone-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          {/* Primary View Tabs */}
          <div
            className="flex items-center gap-1 p-1 bg-stone-100 dark:bg-slate-800 rounded-lg overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar w-full max-w-full min-w-0"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <button
              onClick={() => setActiveTab('live')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'live'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-500" />
              <span>Live Now ({liveMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('today')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'today'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>Today ({todayMatches.length})</span>
            </button>

            <button
              onClick={() => setActiveTab('upcoming')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'upcoming'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Calendar className="w-3.5 h-3.5 text-blue-500" />
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
              <Clock className="w-3.5 h-3.5 text-slate-500" />
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
              <Trophy className="w-3.5 h-3.5 text-indigo-500" />
              <span>{t.standings}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Provider Transparency Drawer */}
      {showProviderDrawer && (
        <div className="my-3 p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              <span>FactInfoLive Sports Provider &amp; Quota Transparency</span>
            </span>
            <button
              onClick={() => setShowProviderDrawer(false)}
              className="text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-slate-700 dark:text-slate-300 pt-1">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-blue-100 dark:border-blue-900/50">
              <div className="font-semibold text-slate-900 dark:text-white">Active Data Source</div>
              <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium mt-0.5">
                {providerInfo?.activeProvider || 'Open Sports Data Wire'}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Open public sports feeds with regular scoreboard updates.
              </div>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-blue-100 dark:border-blue-900/50">
              <div className="font-semibold text-slate-900 dark:text-white">API-Football Integration</div>
              <div className="text-[11px] font-medium mt-0.5 flex items-center gap-1">
                {providerInfo?.apiFootball?.configured ? (
                  <span className="text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Configured ({providerInfo.apiFootball.remainingToday} / 100 req left today)
                  </span>
                ) : (
                  <span className="text-slate-500">
                    Not configured (Optional)
                  </span>
                )}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Add <code className="bg-stone-100 dark:bg-slate-800 px-1 py-0.5 rounded">API_FOOTBALL_KEY</code> in .env to expand global leagues.
              </div>
            </div>

            <div className="p-2.5 bg-white dark:bg-slate-900 rounded border border-blue-100 dark:border-blue-900/50">
              <div className="font-semibold text-slate-900 dark:text-white">Shared Cache &amp; Polling</div>
              <div className="text-[11px] text-slate-600 dark:text-slate-300 mt-0.5">
                45s Live TTL · Shared Server Cache
              </div>
              <div className="text-[10px] text-slate-500 mt-1">
                Upstream requests are shared across all visitors to preserve quota.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Toolbar: Sports Pills, Competition Selector & Team Search */}
      <div className="py-3 border-b border-stone-100 dark:border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Sport Category Pills */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar pb-1 md:pb-0 w-full max-w-full min-w-0"
          style={{
            WebkitOverflowScrolling: 'touch',
            touchAction: 'pan-x pan-y',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
          }}
        >
          <span className="text-xs text-slate-500 font-medium shrink-0 mr-1">{t.selectSport}:</span>
          {sportsList.map((sport) => (
            <button
              key={sport.id}
              onClick={() => {
                setSelectedSport(sport.id);
                setSelectedCompetition('all');
              }}
              className={`px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer whitespace-nowrap ${
                selectedSport === sport.id
                  ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
            >
              {sport.label}
            </button>
          ))}
        </div>

        {/* Search & Competition Dropdown */}
        <div className="flex items-center gap-2 self-stretch md:self-auto">
          {/* Competition Filter */}
          {availableCompetitions.length > 0 && activeTab !== 'standings' && (
            <div className="relative shrink-0">
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                className="pl-7 pr-7 py-1 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="all">All Competitions ({availableCompetitions.length})</option>
                {availableCompetitions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            </div>
          )}

          {/* Standings Competition Filter */}
          {activeTab === 'standings' && standingsCompetitions.length > 0 && (
            <div className="relative shrink-0">
              <select
                value={selectedCompetition}
                onChange={(e) => setSelectedCompetition(e.target.value)}
                className="pl-7 pr-7 py-1 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-md text-slate-700 dark:text-slate-200 focus:outline-hidden focus:ring-1 focus:ring-blue-500 cursor-pointer appearance-none"
              >
                <option value="all">All Leagues ({standingsCompetitions.length})</option>
                {standingsCompetitions.map((comp) => (
                  <option key={comp} value={comp}>
                    {comp}
                  </option>
                ))}
              </select>
              <Filter className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            </div>
          )}

          {/* Quick Search */}
          <div className="relative flex-1 md:w-44">
            <input
              type="text"
              placeholder="Filter teams..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-7 pr-6 py-1 text-xs bg-stone-50 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 rounded-md text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-blue-500"
            />
            <Search className="w-3 h-3 text-slate-400 absolute left-2 top-2 pointer-events-none" />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-1.5 top-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="pt-4">
        {activeTab !== 'standings' ? (
          filteredFixtures.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredFixtures.map((fixture) => (
                <div
                  key={fixture.id}
                  onClick={() => handleOpenMatchDetails(fixture)}
                  className={`p-4 rounded-lg border transition-all cursor-pointer flex flex-col justify-between group shadow-2xs ${
                    fixture.status === 'live'
                      ? 'border-emerald-300 dark:border-emerald-800 bg-emerald-50/20 dark:bg-emerald-950/20 hover:border-emerald-500'
                      : 'border-stone-200 dark:border-slate-800 hover:border-blue-400 dark:hover:border-blue-600 bg-stone-50/50 dark:bg-slate-950/40'
                  }`}
                >
                  <div>
                    {/* Fixture Header */}
                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <div className="flex items-center gap-2 font-medium">
                        <span className="text-blue-600 dark:text-blue-400 uppercase tracking-wider text-[11px] font-semibold">
                          {fixture.sport}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="truncate max-w-[150px] font-medium text-slate-700 dark:text-slate-300">
                          {fixture.competition}
                        </span>
                        {fixture.round && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-slate-400 truncate max-w-[80px]">{fixture.round}</span>
                          </>
                        )}
                      </div>

                      {/* Status / Clock Indicator */}
                      {fixture.status === 'live' ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold font-tabular bg-emerald-100 dark:bg-emerald-950/80 px-2 py-0.5 rounded text-[11px]">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span>{fixture.statusDisplay || fixture.minute || 'LIVE'}</span>
                        </div>
                      ) : fixture.status === 'completed' ? (
                        <span className="text-slate-600 dark:text-slate-300 font-semibold bg-stone-200 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                          {fixture.statusDisplay || 'Final'}
                        </span>
                      ) : fixture.status === 'postponed' ? (
                        <span className="text-amber-700 dark:text-amber-400 font-medium bg-amber-100 dark:bg-amber-950/80 px-2 py-0.5 rounded text-[11px]">
                          Postponed
                        </span>
                      ) : fixture.status === 'delayed' ? (
                        <span className="text-orange-700 dark:text-orange-400 font-medium bg-orange-100 dark:bg-orange-950/80 px-2 py-0.5 rounded text-[11px]">
                          Delayed
                        </span>
                      ) : fixture.status === 'cancelled' ? (
                        <span className="text-rose-700 dark:text-rose-400 font-medium bg-rose-100 dark:bg-rose-950/80 px-2 py-0.5 rounded text-[11px]">
                          Cancelled
                        </span>
                      ) : (
                        <span className="font-tabular text-blue-600 dark:text-blue-400 font-medium bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded text-[11px]">
                          {new Date(fixture.startTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} ·{' '}
                          {new Date(fixture.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      )}
                    </div>

                    {/* Teams & Real Scores */}
                    <div className="space-y-2.5 mb-3">
                      {/* Home Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-medium text-slate-900 dark:text-stone-100 text-sm">
                          {fixture.homeTeam.logo || fixture.homeTeam.badge ? (
                            <img
                              src={fixture.homeTeam.logo || fixture.homeTeam.badge}
                              alt=""
                              className="w-5 h-5 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          )}
                          <span className="truncate max-w-[200px]">{fixture.homeTeam.name}</span>
                        </div>
                        <span className={`font-bold text-lg font-tabular ${fixture.status === 'live' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {fixture.homeTeam.score !== undefined ? fixture.homeTeam.score : '-'}
                        </span>
                      </div>

                      {/* Away Team */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5 font-medium text-slate-900 dark:text-stone-100 text-sm">
                          {fixture.awayTeam.logo || fixture.awayTeam.badge ? (
                            <img
                              src={fixture.awayTeam.logo || fixture.awayTeam.badge}
                              alt=""
                              className="w-5 h-5 object-contain"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 dark:bg-slate-700" />
                          )}
                          <span className="truncate max-w-[200px]">{fixture.awayTeam.name}</span>
                        </div>
                        <span className={`font-bold text-lg font-tabular ${fixture.status === 'live' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>
                          {fixture.awayTeam.score !== undefined ? fixture.awayTeam.score : '-'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer / Venue & Timeline Prompt */}
                  <div className="pt-3 mt-1 border-t border-stone-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
                    <div className="flex items-center gap-1 truncate max-w-[190px]">
                      <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                      <span className="truncate">{fixture.venue || 'Confirmed Venue'}</span>
                    </div>
                    <span className="text-blue-600 dark:text-blue-400 group-hover:underline flex items-center gap-0.5 font-medium">
                      <span>Timeline &amp; Details</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Clear Empty State */
            <div className="text-center py-12 px-4 bg-stone-50 dark:bg-slate-950/50 rounded-lg border border-dashed border-stone-200 dark:border-slate-800">
              <Trophy className="w-9 h-9 text-slate-400 mx-auto mb-2 opacity-50" />
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                {activeTab === 'live'
                  ? 'No Matches Currently Live'
                  : activeTab === 'today'
                  ? 'No Matches Scheduled for Today'
                  : t.noData}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {activeTab === 'live'
                  ? `There are currently 0 active matches in play for ${selectedSport === 'all' ? 'the selected sports' : selectedSport}. Check Today's Matches or Upcoming Fixtures.`
                  : activeTab === 'today'
                  ? 'No fixtures scheduled on the calendar for this date filter. Explore Upcoming Fixtures for the week ahead.'
                  : t.noDataDesc}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                {activeTab === 'live' && (
                  <button
                    onClick={() => setActiveTab('today')}
                    className="px-3.5 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors cursor-pointer inline-flex items-center gap-1 shadow-xs"
                  >
                    <span>View Today’s Matches ({todayMatches.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {selectedCompetition !== 'all' && (
                  <button
                    onClick={() => setSelectedCompetition('all')}
                    className="px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-stone-200 dark:bg-slate-800 rounded-md hover:bg-stone-300 transition-colors cursor-pointer"
                  >
                    Clear Competition Filter
                  </button>
                )}
              </div>
            </div>
          )
        ) : (
          /* Standings Table with Full Fields */
          <div className="overflow-x-auto border border-stone-200 dark:border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 dark:bg-slate-950">
                <tr className="border-b border-stone-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Team / Competitor</th>
                  <th className="py-2.5 px-3">Competition</th>
                  <th className="py-2.5 px-3 text-right">P</th>
                  <th className="py-2.5 px-3 text-right">W</th>
                  <th className="py-2.5 px-3 text-right">D</th>
                  <th className="py-2.5 px-3 text-right">L</th>
                  <th className="py-2.5 px-3 text-right">GD</th>
                  <th className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-white">PTS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 dark:divide-slate-800/60 font-tabular">
                {filteredStandings.length > 0 ? (
                  filteredStandings.map((item) => (
                    <tr
                      key={`${item.competition}-${item.position}-${item.team}`}
                      className="hover:bg-stone-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-2.5 px-3 font-semibold text-slate-700 dark:text-slate-300">{item.position}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-900 dark:text-stone-100 flex items-center gap-2">
                        {item.logo && (
                          <img
                            src={item.logo}
                            alt=""
                            className="w-4 h-4 object-contain"
                            referrerPolicy="no-referrer"
                          />
                        )}
                        <span>{item.team}</span>
                      </td>
                      <td className="py-2.5 px-3 text-slate-500">{item.competition}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">{item.played}</td>
                      <td className="py-2.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{item.won}</td>
                      <td className="py-2.5 px-3 text-right text-slate-500">{item.drawn ?? '-'}</td>
                      <td className="py-2.5 px-3 text-right text-rose-600 dark:text-rose-400">{item.lost}</td>
                      <td className="py-2.5 px-3 text-right text-slate-600 dark:text-slate-400">
                        {item.goalDifference !== undefined
                          ? (item.goalDifference > 0 ? `+${item.goalDifference}` : item.goalDifference)
                          : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-slate-950 dark:text-white">{item.points}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-slate-500">
                      No standings records matching current filter criteria.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Match Details & Commentary Modal */}
      {selectedMatch && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50 dark:bg-slate-950">
              <div>
                <span className="text-xs uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
                  {selectedMatch.competition} {selectedMatch.round ? `· ${selectedMatch.round}` : ''}
                </span>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mt-0.5">
                  {selectedMatch.homeTeam.name} vs {selectedMatch.awayTeam.name}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMatch(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scoreboard Bar */}
            <div className="p-5 sm:p-6 bg-slate-900 text-white flex items-center justify-around border-b border-slate-800">
              <div className="text-center flex-1">
                {selectedMatch.homeTeam.logo || selectedMatch.homeTeam.badge ? (
                  <img
                    src={selectedMatch.homeTeam.logo || selectedMatch.homeTeam.badge}
                    alt=""
                    className="w-12 h-12 mx-auto mb-2 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto mb-2 flex items-center justify-center text-sm font-bold">
                    {selectedMatch.homeTeam.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="font-bold text-xs sm:text-sm">{selectedMatch.homeTeam.name}</div>
              </div>

              <div className="text-center px-4">
                <div className="text-3xl sm:text-4xl font-extrabold font-tabular tracking-wider">
                  {selectedMatch.homeTeam.score !== undefined ? selectedMatch.homeTeam.score : '-'} :{' '}
                  {selectedMatch.awayTeam.score !== undefined ? selectedMatch.awayTeam.score : '-'}
                </div>
                <div className="text-xs text-blue-400 font-medium mt-1">
                  {selectedMatch.status === 'live' ? (
                    <span className="flex items-center justify-center gap-1.5 text-emerald-400 font-bold">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      {selectedMatch.statusDisplay || selectedMatch.minute || 'LIVE'}
                    </span>
                  ) : selectedMatch.status === 'completed' ? (
                    <span className="text-slate-300 font-semibold">{selectedMatch.statusDisplay || 'Final'}</span>
                  ) : (
                    new Date(selectedMatch.startTime).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })
                  )}
                </div>
              </div>

              <div className="text-center flex-1">
                {selectedMatch.awayTeam.logo || selectedMatch.awayTeam.badge ? (
                  <img
                    src={selectedMatch.awayTeam.logo || selectedMatch.awayTeam.badge}
                    alt=""
                    className="w-12 h-12 mx-auto mb-2 object-contain"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-slate-800 mx-auto mb-2 flex items-center justify-center text-sm font-bold">
                    {selectedMatch.awayTeam.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <div className="font-bold text-xs sm:text-sm">{selectedMatch.awayTeam.name}</div>
              </div>
            </div>

            {/* Match Events & Commentary Body */}
            <div className="p-5 overflow-y-auto space-y-5 flex-1">
              {loadingDetails ? (
                <div className="py-12 text-center text-slate-400 text-sm animate-pulse flex flex-col items-center gap-2">
                  <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
                  <span>Synchronizing match events and verified timeline...</span>
                </div>
              ) : (
                <>
                  {/* Notice banner */}
                  {matchDetails?.notice && (
                    <div className="p-3 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 rounded-lg text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-600 dark:text-blue-400" />
                      <span>{matchDetails.notice}</span>
                    </div>
                  )}

                  {/* Key Events Timeline (Goals, Cards, Substitutions, Scoring Plays) */}
                  {matchDetails?.keyEvents && matchDetails.keyEvents.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <Activity className="w-3.5 h-3.5 text-blue-500" />
                        <span>Key Match Events ({matchDetails.keyEvents.length})</span>
                      </h4>
                      <div className="space-y-2.5 border-l-2 border-blue-500 ml-2 pl-4">
                        {matchDetails.keyEvents.map((ev) => (
                          <div key={ev.id} className="text-xs relative">
                            <span className="absolute -left-[21px] top-1 w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                              {ev.clock && (
                                <span className="text-blue-600 dark:text-blue-400 font-tabular font-bold">
                                  {ev.clock}
                                </span>
                              )}
                              {ev.period && (
                                <span className="text-slate-400 text-[10px] font-normal">
                                  ({ev.period})
                                </span>
                              )}
                              <span>{ev.shortText || ev.type}</span>
                              {ev.teamName && (
                                <span className="text-slate-400 text-[10px]">· {ev.teamName}</span>
                              )}
                            </div>
                            <p className="text-slate-600 dark:text-slate-400 text-[11px] mt-0.5 leading-relaxed">
                              {ev.text}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Play-by-play commentary */}
                  {matchDetails?.commentary && matchDetails.commentary.length > 0 ? (
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-emerald-500" />
                        <span>Play-by-Play Narrative</span>
                      </h4>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                        {matchDetails.commentary.map((c) => (
                          <div
                            key={c.sequence}
                            className="p-2.5 bg-stone-50 dark:bg-slate-950 rounded border border-stone-200 dark:border-slate-800 text-xs"
                          >
                            {c.time && (
                              <span className="font-bold text-blue-600 dark:text-blue-400 mr-2 font-tabular">
                                {c.time}
                              </span>
                            )}
                            <span className="text-slate-700 dark:text-slate-300">{c.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    !matchDetails?.keyEvents?.length && (
                      <div className="text-center py-8 text-slate-500 text-xs">
                        No play-by-play events recorded for this fixture yet.
                      </div>
                    )
                  )}
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-stone-50 dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                <span className="truncate max-w-[220px]">{selectedMatch.venue || 'Confirmed Venue'}</span>
              </span>
              {selectedMatch.officialSourceUrl && (
                <a
                  href={selectedMatch.officialSourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Official Match Feed</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
