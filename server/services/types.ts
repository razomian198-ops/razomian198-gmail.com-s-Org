export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content?: string;
  publisher: string;
  author?: string;
  url: string;
  publishedAt: string;
  retrievedAt: string;
  category: string;
  subcategory?: string;
  language: string;
  imageUrl?: string;
  imageAttribution?: string;
  tags: string[];
  isBreaking?: boolean;
  isDeveloping?: boolean;
  factCheckStatus?: 'verified' | 'developing' | 'official_statement' | 'analysis' | 'opinion';
  verificationDetails?: string;
  sourceType: 'wire' | 'press_release' | 'academic' | 'broadcast' | 'institutional';
}

export type SportType =
  | 'football'
  | 'cricket'
  | 'basketball'
  | 'tennis'
  | 'f1'
  | 'rugby'
  | 'baseball'
  | 'american-football'
  | 'ice-hockey'
  | 'golf'
  | 'athletics'
  | 'boxing-mma'
  | 'volleyball'
  | 'badminton'
  | 'table-tennis'
  | 'cycling'
  | 'swimming'
  | 'esports'
  | 'other';

export interface SportsFixture {
  id: string;
  sport: SportType;
  competition: string;
  season?: string;
  round?: string;
  homeTeam: {
    name: string;
    score?: number | string;
    logo?: string;
    badge?: string;
  };
  awayTeam: {
    name: string;
    score?: number | string;
    logo?: string;
    badge?: string;
  };
  status: 'live' | 'upcoming' | 'completed' | 'postponed' | 'delayed';
  minute?: string;
  period?: string;
  startTime: string;
  venue?: string;
  provider: string;
  lastUpdated: string;
  stats?: Record<string, string | number>;
  officialSourceUrl?: string;
}

export interface SportsStanding {
  position: number;
  team: string;
  logo?: string;
  played: number;
  won: number;
  drawn?: number;
  lost: number;
  points: number;
  goalsFor?: number;
  goalsAgainst?: number;
  goalDifference?: number;
  competition: string;
  sport: SportType;
}

export interface ProviderStatus {
  id: string;
  name: string;
  category: 'news' | 'sports' | 'science' | 'ai' | 'health';
  type: 'api' | 'rss' | 'llm';
  status: 'active' | 'degraded' | 'key_missing' | 'rate_limited' | 'offline';
  lastPing: string;
  latencyMs: number;
  cachedRecordsCount: number;
  details: string;
  freeTier: boolean;
  requiresKey: boolean;
  hasKeyConfigured: boolean;
}

export interface AskAssistantRequest {
  query: string;
  categoryFilter?: string;
  language?: string;
}

export interface Citation {
  title: string;
  url: string;
  publisher: string;
  publishedAt?: string;
}

export interface AskAssistantResponse {
  answer: string;
  citations: Citation[];
  perspectives?: {
    perspectiveA?: string;
    perspectiveB?: string;
    neutralSummary?: string;
  };
  confidence: 'high' | 'moderate' | 'developing_story' | 'low';
  limitations: string;
  suggestedFollowUps: string[];
  generatedAt: string;
  modelUsed: string;
}

export type EditorialPostType =
  | 'blog'
  | 'summary'
  | 'explainer'
  | 'research'
  | 'sports-analysis'
  | 'opinion'
  | 'fact-check'
  | 'guide';

// 7-Stage Editorial Workflow: Idea → Researching → AI Draft → Needs Review → Approved → Published → Archived
export type ContentStatus =
  | 'idea'
  | 'researching'
  | 'ai_draft'
  | 'needs_review'
  | 'approved'
  | 'published'
  | 'archived'
  | 'draft'
  | 'review';

export interface StructuredSummary {
  headline: string;
  quickSummary30s: string;
  keyTakeaways: string[];
  whatHappened: string;
  whyItMatters: string;
  confirmedVsUncertain: {
    confirmed: string[];
    uncertain: string[];
  };
  context: {
    dates: string[];
    locations: string[];
    background: string;
  };
  originalSource: {
    publisher: string;
    url: string;
    publishedAt: string;
    updatedAt?: string;
  };
  relatedCoverage: Array<{
    publisher: string;
    url: string;
    title: string;
  }>;
  timestamps: {
    publishedAt: string;
    updatedAt: string;
  };
}

export interface DeepExplainer {
  overview: string;
  timeline: Array<{ date: string; event: string }>;
  keyConcepts: Array<{ term: string; explanation: string }>;
  verifiedFacts: string[];
  sourcePerspectives: Array<{ source: string; stance: string; url?: string }>;
  disagreementsAndLimitations: string[];
  whyItMatters: string;
  practicalImplications: string[];
  faqs: Array<{ question: string; answer: string }>;
  references: Citation[];
  lastReviewedDate: string;
}

export interface EditorialAuthor {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  bio?: string;
}

export interface CorrectionNote {
  id: string;
  date: string;
  text: string;
  editorName: string;
}

export interface ArticleSeoMetadata {
  seoTitle?: string;
  metaDescription?: string;
  canonicalUrl?: string;
  focusKeyword?: string;
  schemaType?: 'NewsArticle' | 'BlogPosting' | 'TechArticle' | 'FAQPage';
  ogImage?: string;
  noIndex?: boolean;
  slug?: string;
}

export interface EditorialArticle {
  id: string;
  slug: string;
  type: EditorialPostType;
  title: string;
  subtitle?: string;
  content: string;
  author: EditorialAuthor;
  category: string;
  tags: string[];
  status: ContentStatus;
  publishedAt: string;
  updatedAt: string;
  scheduledPublishAt?: string;
  readingTimeMinutes: number;
  imageUrl?: string;
  imageAttribution?: string;
  isAiAssisted: boolean;
  editorialReviewLog?: Array<{
    action: string;
    reviewer: string;
    timestamp: string;
    notes?: string;
  }>;
  correctionNotes?: CorrectionNote[];
  seoMetadata?: ArticleSeoMetadata;
  structuredSummary?: StructuredSummary;
  deepExplainer?: DeepExplainer;
  claimsToVerify?: Array<{
    claim: string;
    sourceUrl?: string;
    verified: boolean;
    notes?: string;
  }>;
  tableOfContents?: Array<{
    id: string;
    title: string;
    level: number;
  }>;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  categories?: string[];
  consentGiven: boolean;
  unsubscribeToken: string;
  active: boolean;
}

export type UserRole = 'administrator' | 'editor' | 'author';

export interface AdminUser {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  email?: string;
  passwordHash?: string;
  salt?: string;
  createdAt: string;
  lastLogin?: string;
}

// Monetization Settings & Types
export interface DisplayAdSettings {
  enabled: boolean;
  provider: 'adsense' | 'ethical_ads';
  adClient: string; // e.g. "ca-pub-XXXXXXXXXXXXX"
  consentEnabled: boolean;
  testMode: boolean;
  slots: {
    headerBillboard: boolean;
    inArticle: boolean;
    sidebarRail: boolean;
    footerSticky: boolean;
  };
}

export interface AffiliateLink {
  id: string;
  title: string;
  targetUrl: string;
  disclosureLabel: string;
  category: string;
  campaignTag?: string;
  active: boolean;
  clickCount: number;
  createdAt: string;
}

export interface SponsorshipInquiry {
  id: string;
  companyName: string;
  contactEmail: string;
  packageType: 'newsletter' | 'sponsored_article' | 'billboard_banner';
  message: string;
  budgetRange?: string;
  status: 'new' | 'contacted' | 'booked' | 'declined';
  submittedAt: string;
}

export interface PatronContribution {
  id: string;
  patronName: string;
  patronEmail: string;
  amount: number;
  currency: string;
  interval: 'one-time' | 'monthly' | 'yearly';
  tierName: string;
  createdAt: string;
  anonymous: boolean;
  paymentMethod: string;
  receiptNumber: string;
}

export interface PatronageSettings {
  enabled: boolean;
  headline: string;
  description: string;
  goalMonthlyEuro: number;
  currentMonthlyEuro: number;
  stripePaymentLink?: string;
  kofiUrl?: string;
  buyMeACoffeeUrl?: string;
  patronRegistryPublic: boolean;
}

export interface MonetizationSettings {
  displayAds: DisplayAdSettings;
  affiliateDisclosuresEnabled: boolean;
  sponsorInquiriesActive: boolean;
  premiumContentWaitlistEnabled: boolean;
  patronage: PatronageSettings;
}

export interface AnalyticsEvent {
  type: 'page_view' | 'citation_click' | 'affiliate_click' | 'search' | 'newsletter_signup' | 'patron_support';
  path?: string;
  articleSlug?: string;
  category?: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

