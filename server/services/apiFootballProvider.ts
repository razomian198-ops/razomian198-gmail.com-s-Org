import { memoryCache } from './cache.ts';
import { SportsFixture, SportsStanding, MatchEvent } from './types.ts';

export interface ApiFootballQuotaStatus {
  isConfigured: boolean;
  dailyLimit: number;
  requestsUsedToday: number;
  remainingToday: number;
  lastChecked: string;
  source: 'local_tracker' | 'api_sports_status';
  account?: {
    firstname?: string;
    email?: string;
  };
  subscription?: {
    plan?: string;
    active?: boolean;
  };
}

export class ApiFootballProvider {
  private readonly baseUrl = 'https://v3.football.api-sports.io';
  private readonly DAILY_LIMIT = 100;
  private readonly SAFETY_THRESHOLD = 85; // Leave buffer before hitting 100 limit
  private dailyCounter = 0;
  private currentUtcDate = '';
  private lastRequestTimes: number[] = []; // For 10 req/min burst limiter

  private getApiKey(): string | undefined {
    return process.env.API_FOOTBALL_KEY?.trim() || undefined;
  }

  isConfigured(): boolean {
    return Boolean(this.getApiKey());
  }

  private resetDailyCounterIfNeeded(): void {
    const today = new Date().toISOString().split('T')[0];
    if (this.currentUtcDate !== today) {
      this.currentUtcDate = today;
      this.dailyCounter = 0;
    }
  }

  private canMakeRequest(): boolean {
    if (!this.isConfigured()) return false;
    this.resetDailyCounterIfNeeded();

    // Check daily ceiling
    if (this.dailyCounter >= this.SAFETY_THRESHOLD) {
      return false;
    }

    // Check 10 requests per minute burst limit
    const now = Date.now();
    this.lastRequestTimes = this.lastRequestTimes.filter((t) => now - t < 60000);
    if (this.lastRequestTimes.length >= 10) {
      return false;
    }

    return true;
  }

  private recordRequest(): void {
    this.dailyCounter += 1;
    this.lastRequestTimes.push(Date.now());
  }

  // Check quota status without consuming quota (/status is free)
  async getQuotaStatus(): Promise<ApiFootballQuotaStatus> {
    const apiKey = this.getApiKey();
    this.resetDailyCounterIfNeeded();

    const localStatus: ApiFootballQuotaStatus = {
      isConfigured: Boolean(apiKey),
      dailyLimit: this.DAILY_LIMIT,
      requestsUsedToday: this.dailyCounter,
      remainingToday: Math.max(0, this.DAILY_LIMIT - this.dailyCounter),
      lastChecked: new Date().toISOString(),
      source: 'local_tracker',
    };

    if (!apiKey) {
      return localStatus;
    }

    const cachedStatus = memoryCache.get<ApiFootballQuotaStatus>('api_football_status_check');
    if (cachedStatus) return cachedStatus;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`${this.baseUrl}/status`, {
        headers: { 'x-apisports-key': apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        const account = data.response?.account;
        const subscription = data.response?.subscription;
        const requests = data.response?.requests;

        const currentRequests = requests?.current ?? this.dailyCounter;
        const limitDay = requests?.limit_day ?? this.DAILY_LIMIT;

        const result: ApiFootballQuotaStatus = {
          isConfigured: true,
          dailyLimit: limitDay,
          requestsUsedToday: currentRequests,
          remainingToday: Math.max(0, limitDay - currentRequests),
          lastChecked: new Date().toISOString(),
          source: 'api_sports_status',
          account: account ? { firstname: account.firstname, email: account.email } : undefined,
          subscription: subscription ? { plan: subscription.plan, active: subscription.active } : undefined,
        };

        memoryCache.set('api_football_status_check', result, 600); // 10 minutes cache
        return result;
      }
    } catch {
      // Fallback to local tracker
    }

    return localStatus;
  }

  // Fetch live fixtures (/fixtures?live=all)
  async getLiveFixtures(): Promise<SportsFixture[]> {
    if (!this.canMakeRequest()) return [];

    const cacheKey = 'apifootball_live_fixtures';
    const cached = memoryCache.get<SportsFixture[]>(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    try {
      this.recordRequest();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/fixtures?live=all`, {
        headers: { 'x-apisports-key': apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const json = await res.json();
      const fixtures = this.mapFixtures(json.response || []);

      // Cache live fixtures for 60 seconds (shared server-wide cache)
      memoryCache.set(cacheKey, fixtures, 60);
      return fixtures;
    } catch {
      return [];
    }
  }

  // Fetch today's fixtures
  async getTodayFixtures(dateStr?: string): Promise<SportsFixture[]> {
    if (!this.canMakeRequest()) return [];

    const targetDate = dateStr || new Date().toISOString().split('T')[0];
    const cacheKey = `apifootball_fixtures_${targetDate}`;
    const cached = memoryCache.get<SportsFixture[]>(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    try {
      this.recordRequest();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(`${this.baseUrl}/fixtures?date=${targetDate}`, {
        headers: { 'x-apisports-key': apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const json = await res.json();
      const fixtures = this.mapFixtures(json.response || []);

      // Cache today's fixtures for 15 minutes (900 seconds)
      memoryCache.set(cacheKey, fixtures, 900);
      return fixtures;
    } catch {
      return [];
    }
  }

  // Fetch event timeline for a match (/fixtures/events?fixture={id})
  async getFixtureEvents(fixtureId: string | number): Promise<MatchEvent[]> {
    if (!this.canMakeRequest()) return [];

    const cacheKey = `apifootball_events_${fixtureId}`;
    const cached = memoryCache.get<MatchEvent[]>(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    try {
      this.recordRequest();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/fixtures/events?fixture=${fixtureId}`, {
        headers: { 'x-apisports-key': apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const json = await res.json();
      const events: any[] = json.response || [];

      const mappedEvents: MatchEvent[] = events.map((ev, idx) => ({
        id: `apifb-ev-${fixtureId}-${idx}`,
        type: ev.type || 'Event',
        detail: ev.detail || undefined,
        text: `${ev.type}: ${ev.player?.name || 'Player'} (${ev.detail || ''}) ${ev.assist?.name ? `[Assist: ${ev.assist.name}]` : ''}`.trim(),
        shortText: ev.detail || ev.type,
        clock: `${ev.time?.elapsed || 0}'${ev.time?.extra ? `+${ev.time.extra}` : ''}`,
        period: ev.time?.elapsed > 45 ? '2nd Half' : '1st Half',
        scoringPlay: ev.type?.toLowerCase() === 'goal',
        teamName: ev.team?.name,
        player: ev.player?.name,
        assist: ev.assist?.name,
      }));

      // Cache events: 60s for live matches, 1 hour for completed
      memoryCache.set(cacheKey, mappedEvents, 120);
      return mappedEvents;
    } catch {
      return [];
    }
  }

  // Fetch standings for key leagues
  async getStandings(leagueId: number, seasonYear: number = 2025): Promise<SportsStanding[]> {
    if (!this.canMakeRequest()) return [];

    const cacheKey = `apifootball_standings_${leagueId}_${seasonYear}`;
    const cached = memoryCache.get<SportsStanding[]>(cacheKey);
    if (cached) return cached;

    const apiKey = this.getApiKey();
    if (!apiKey) return [];

    try {
      this.recordRequest();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${this.baseUrl}/standings?league=${leagueId}&season=${seasonYear}`, {
        headers: { 'x-apisports-key': apiKey },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) return [];
      const json = await res.json();
      const leagueData = json.response?.[0]?.league;
      const standingsTable = leagueData?.standings?.[0] || [];

      const mapped: SportsStanding[] = standingsTable.map((item: any) => ({
        position: item.rank,
        team: item.team?.name || 'Team',
        logo: item.team?.logo,
        played: item.all?.played ?? 0,
        won: item.all?.win ?? 0,
        drawn: item.all?.draw ?? 0,
        lost: item.all?.lose ?? 0,
        points: item.points ?? 0,
        goalsFor: item.all?.goals?.for ?? 0,
        goalsAgainst: item.all?.goals?.against ?? 0,
        goalDifference: item.goalsDiff ?? 0,
        competition: leagueData?.name || 'Football League',
        sport: 'football',
      }));

      // Cache standings for 1 hour (3600 seconds)
      memoryCache.set(cacheKey, mapped, 3600);
      return mapped;
    } catch {
      return [];
    }
  }

  private mapFixtures(fixtures: any[]): SportsFixture[] {
    return fixtures.map((f: any): SportsFixture => {
      const fixtureInfo = f.fixture || {};
      const statusObj = fixtureInfo.status || {};
      const league = f.league || {};
      const teams = f.teams || {};
      const goals = f.goals || {};

      const shortStatus = (statusObj.short || '').toUpperCase();
      let status: SportsFixture['status'] = 'upcoming';
      let statusDisplay = statusObj.long || 'Scheduled';

      if (['1H', '2H', 'ET'].includes(shortStatus)) {
        status = 'live';
        statusDisplay = `${statusObj.elapsed || 0}'`;
      } else if (shortStatus === 'HT') {
        status = 'live';
        statusDisplay = 'Halftime';
      } else if (shortStatus === 'P') {
        status = 'paused';
        statusDisplay = 'Penalties';
      } else if (['FT', 'AET', 'PEN'].includes(shortStatus)) {
        status = 'completed';
        statusDisplay = shortStatus === 'PEN' ? 'Final (Penalties)' : 'Final';
      } else if (['PST'].includes(shortStatus)) {
        status = 'postponed';
        statusDisplay = 'Postponed';
      } else if (['CANC', 'ABD'].includes(shortStatus)) {
        status = 'cancelled';
        statusDisplay = 'Cancelled';
      } else if (['TBD', 'NS'].includes(shortStatus)) {
        status = 'upcoming';
        statusDisplay = fixtureInfo.date
          ? new Date(fixtureInfo.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : 'Upcoming';
      }

      return {
        id: `apifootball-${fixtureInfo.id}`,
        sport: 'football',
        competition: league.name || 'Football',
        season: String(league.season || '2025-2026'),
        round: league.round || undefined,
        homeTeam: {
          name: teams.home?.name || 'Home Team',
          score: status !== 'upcoming' ? (goals.home ?? 0) : undefined,
          logo: teams.home?.logo,
          badge: teams.home?.logo,
        },
        awayTeam: {
          name: teams.away?.name || 'Away Team',
          score: status !== 'upcoming' ? (goals.away ?? 0) : undefined,
          logo: teams.away?.logo,
          badge: teams.away?.logo,
        },
        status,
        statusDisplay,
        minute: status === 'live' ? `${statusObj.elapsed || 0}'` : undefined,
        period: statusObj.long,
        startTime: fixtureInfo.date || new Date().toISOString(),
        venue: fixtureInfo.venue?.name ? `${fixtureInfo.venue.name}, ${fixtureInfo.venue.city || ''}`.trim() : 'Stadium',
        provider: 'API-Football (API-Sports)',
        lastUpdated: new Date().toISOString(),
        isToday: true,
        officialSourceUrl: `https://www.api-football.com/fixtures/${fixtureInfo.id}`,
      };
    });
  }
}

export const apiFootballProvider = new ApiFootballProvider();
