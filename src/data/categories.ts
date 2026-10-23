export interface CategoryDef {
  id: string;
  name: string;
  slug: string;
  group: 'news' | 'sports' | 'science' | 'society' | 'special';
  description: string;
  sportKey?: string;
}

export const CATEGORIES: CategoryDef[] = [
  { id: 'home', name: 'Home', slug: 'home', group: 'news', description: 'Real-time global news, live sports scoreboard, and science intelligence.' },
  { id: 'breaking', name: 'Breaking News', slug: 'breaking-news', group: 'news', description: 'Verified rapid-developing international events and breaking dispatches.' },
  { id: 'world', name: 'World', slug: 'world', group: 'news', description: 'International diplomacy, cross-border affairs, and geopolitical updates.' },
  { id: 'politics', name: 'Politics & Government', slug: 'politics-government', group: 'news', description: 'State governance, legislative agendas, and official policy developments.' },
  { id: 'elections', name: 'Elections & Public Policy', slug: 'elections-public-policy', group: 'news', description: 'Democratic processes, electoral telemetry, and policy analysis.' },
  { id: 'business', name: 'Business & Economy', slug: 'business-economy', group: 'news', description: 'Macroeconomic trends, corporate reporting, and central banking.' },
  { id: 'finance', name: 'Finance & Markets', slug: 'finance-markets', group: 'news', description: 'Sovereign bonds, commodities, currency markets, and equities.' },
  { id: 'tech', name: 'Technology & AI', slug: 'technology-ai', group: 'science', description: 'Artificial intelligence, cybersecurity, silicon manufacturing, and software.' },
  { id: 'science', name: 'Science & Space', slug: 'science-space', group: 'science', description: 'Astrophysics, planetary science, quantum physics, and space exploration.' },
  { id: 'health', name: 'Health & Medicine', slug: 'health-medicine', group: 'science', description: 'Peer-reviewed clinical research, epidemiology, and public health guidance.' },
  { id: 'climate', name: 'Environment & Climate', slug: 'environment-climate', group: 'science', description: 'Atmospheric telemetry, clean energy transitions, and conservation science.' },
  
  // Sports
  { id: 'sports', name: 'Live Sports Center', slug: 'live-sports', group: 'sports', description: 'Confirmed live scores, schedules, and standings across 20+ sports.' },
  { id: 'football', name: 'Football / Soccer', slug: 'football', group: 'sports', description: 'Premier League, Champions League, La Liga, Serie A, and international tournaments.', sportKey: 'football' },
  { id: 'cricket', name: 'Cricket', slug: 'cricket', group: 'sports', description: 'ICC Test Championships, ODI, T20 leagues, and bilateral series.', sportKey: 'cricket' },
  { id: 'basketball', name: 'Basketball', slug: 'basketball', group: 'sports', description: 'NBA, EuroLeague, FIBA World Cup, and college basketball.', sportKey: 'basketball' },
  { id: 'tennis', name: 'Tennis', slug: 'tennis', group: 'sports', description: 'ATP, WTA Tour, Grand Slam tournaments, and live game telemetry.', sportKey: 'tennis' },
  { id: 'f1', name: 'Formula 1 & Motorsport', slug: 'formula-1', group: 'sports', description: 'Grand Prix schedule, driver standings, telemetry, and qualifying results.', sportKey: 'f1' },
  { id: 'rugby', name: 'Rugby', slug: 'rugby', group: 'sports', description: 'Six Nations, Rugby Championship, and club leagues.', sportKey: 'rugby' },
  { id: 'baseball', name: 'Baseball', slug: 'baseball', group: 'sports', description: 'MLB schedules, team records, and standings.', sportKey: 'baseball' },
  { id: 'american-football', name: 'American Football', slug: 'american-football', group: 'sports', description: 'NFL games, playoffs, and college football results.', sportKey: 'american-football' },
  { id: 'ice-hockey', name: 'Ice Hockey', slug: 'ice-hockey', group: 'sports', description: 'NHL scores, Stanley Cup playoffs, and international hockey.', sportKey: 'ice-hockey' },
  { id: 'golf', name: 'Golf', slug: 'golf', group: 'sports', description: 'PGA Tour, European Tour, Major Championships, and leaderboards.', sportKey: 'golf' },
  { id: 'athletics', name: 'Athletics & Olympics', slug: 'athletics-olympics', group: 'sports', description: 'World Athletics championships, track and field, and Olympic telemetry.', sportKey: 'athletics' },
  { id: 'boxing-mma', name: 'Boxing & MMA', slug: 'boxing-mma', group: 'sports', description: 'Title fight cards, UFC events, and boxing records.', sportKey: 'boxing-mma' },
  { id: 'volleyball', name: 'Volleyball', slug: 'volleyball', group: 'sports', description: 'FIVB World Tour, Nations League, and Olympic qualifications.', sportKey: 'volleyball' },
  { id: 'badminton', name: 'Badminton', slug: 'badminton', group: 'sports', description: 'BWF World Tour, All England, and Thomas Cup.', sportKey: 'badminton' },
  { id: 'table-tennis', name: 'Table Tennis', slug: 'table-tennis', group: 'sports', description: 'ITTF World Championships and WTT Contender series.', sportKey: 'table-tennis' },
  { id: 'cycling', name: 'Cycling', slug: 'cycling', group: 'sports', description: 'Tour de France, Giro d’Italia, Vuelta a España, and UCI Classics.', sportKey: 'cycling' },
  { id: 'swimming', name: 'Swimming', slug: 'swimming', group: 'sports', description: 'World Aquatics championships and Olympic trials.', sportKey: 'swimming' },
  { id: 'esports', name: 'Esports', slug: 'esports', group: 'sports', description: 'League of Legends Worlds, CS2 Majors, Dota 2 The International, and Valorant.', sportKey: 'esports' },
  { id: 'other-sports', name: 'Other Sports', slug: 'other-sports', group: 'sports', description: 'Sailing, equestrian, archery, handball, and winter disciplines.', sportKey: 'other' },

  // Society & Culture
  { id: 'society', name: 'Society & Social Issues', slug: 'society-social-issues', group: 'society', description: 'Demographic shifts, human rights, labor markets, and community developments.' },
  { id: 'education', name: 'Education', slug: 'education', group: 'society', description: 'Higher education research, educational technology, and literacy trends.' },
  { id: 'crime', name: 'Crime & Public Safety', slug: 'crime-public-safety', group: 'society', description: 'Justice system statistics, law enforcement policy, and community safety.' },
  { id: 'international-relations', name: 'International Relations', slug: 'international-relations', group: 'society', description: 'Treaties, multilateral organizations, and global diplomatic summits.' },
  { id: 'culture', name: 'Culture & Entertainment', slug: 'culture-entertainment', group: 'society', description: 'Cinema, literature, architecture, cultural heritage, and music.' },
  { id: 'travel', name: 'Travel & Lifestyle', slug: 'travel-lifestyle', group: 'society', description: 'Sustainable travel, geography, urban design, and global architecture.' },
  { id: 'weather', name: 'Weather & Natural Disasters', slug: 'weather-natural-disasters', group: 'science', description: 'Severe weather alerts, meteorological tracking, seismic activity, and safety notices.' },

  // Special Intelligence
  { id: 'fact-checks', name: 'Fact Checks', slug: 'fact-checks', group: 'special', description: 'Independent verification of viral claims, policy statements, and scientific misconceptions.' },
  { id: 'explainers', name: 'Explainers & Research', slug: 'explainers-research', group: 'special', description: 'In-depth contextual breakdowns of complex geopolitical and scientific subjects.' },
  { id: 'trending', name: 'Trending Topics', slug: 'trending-topics', group: 'special', description: 'Statistically calculated trending themes across verified wire feeds.' },
  { id: 'about', name: 'About & Editorial Policy', slug: 'about-editorial-policy', group: 'special', description: 'Our transparent verification charter, source standards, and AI methodology.' },
];
