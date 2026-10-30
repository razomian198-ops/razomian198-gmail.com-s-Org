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
  translatedTitle?: string;
  translatedSummary?: string;
  translatedContent?: string;
  isTranslated?: boolean;
  translationLanguage?: string;
}

export interface FactTrailUpdate {
  id: string;
  articleId: string;
  title: string;
  summary: string;
  publisher: string;
  author?: string;
  publishedAt: string;
  url: string;
  category: string;
  sourceType: 'wire' | 'broadcast' | 'press_release' | 'institutional' | 'academic';
  isOfficialStatement: boolean;
  isLatest: boolean;
  imageUrl?: string;
  imageAttribution?: string;
}

export interface FactTrailSource {
  publisher: string;
  articlesCount: number;
  latestReportAt: string;
  sourceType: string;
  urls: string[];
}

export interface FactTrail {
  id: string;
  slug: string;
  title: string;
  category: string;
  overview: string;
  firstReportedAt: string;
  latestUpdateAt: string;
  articlesCount: number;
  publishersCount: number;
  publishers: string[];
  sources: FactTrailSource[];
  timeline: FactTrailUpdate[];
  latestUpdateSummary: string;
  whatChanged: string;
  officialStatements: FactTrailUpdate[];
  unconfirmedOrDeveloping: string[];
  imageUrl?: string;
  imageAttribution?: string;
}

export interface FactTrailSummary {
  id: string;
  slug: string;
  title: string;
  category: string;
  overview: string;
  firstReportedAt: string;
  latestUpdateAt: string;
  articlesCount: number;
  publishersCount: number;
  publishers: string[];
  latestPublisher: string;
  latestHeadline: string;
  whatChangedPreview: string;
  imageUrl?: string;
  hasOfficialStatement: boolean;
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
  status: 'live' | 'upcoming' | 'completed' | 'postponed' | 'delayed' | 'cancelled' | 'paused';
  statusDisplay?: string;
  minute?: string;
  period?: string;
  startTime: string;
  venue?: string;
  provider: string;
  lastUpdated: string;
  isToday?: boolean;
  summaryUrl?: string;
  stats?: Record<string, string | number>;
  officialSourceUrl?: string;
  keyEvents?: MatchEvent[];
  commentary?: MatchCommentaryItem[];
}

export interface MatchEvent {
  id: string;
  type: string;
  detail?: string;
  text: string;
  shortText?: string;
  clock?: string;
  period?: string;
  scoringPlay?: boolean;
  wallclock?: string;
  teamName?: string;
  player?: string;
  assist?: string;
}

export interface MatchCommentaryItem {
  sequence: number;
  time?: string;
  text: string;
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
  lastSuccess?: string;
  lastError?: string;
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
  | 'guide'
  | 'review'
  | 'recommendation';

export type GuideTemplateType =
  | 'how-to'
  | 'tutorial'
  | 'comparison'
  | 'feature-comparison'
  | 'troubleshooting'
  | 'checklist'
  | 'faq';


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
  guideTemplate?: {
    templateType: GuideTemplateType;
    difficulty?: 'beginner' | 'intermediate' | 'advanced';
    estimatedMinutes?: number;
    prerequisites?: string[];
    steps?: Array<{
      stepNumber: number;
      title: string;
      description: string;
      codeSnippet?: string;
      warningOrTip?: string;
    }>;
    comparisonItems?: Array<{
      name: string;
      pricing: string;
      pros: string[];
      cons: string[];
      bestFor: string;
      officialUrl: string;
      affiliateUrl?: string;
    }>;
    checklistItems?: Array<{
      id: string;
      text: string;
      category: string;
      critical: boolean;
    }>;
    faqs?: Array<{
      question: string;
      answer: string;
    }>;
  };
  affiliateDisclosure?: string;
  hasAffiliateLinks?: boolean;
  isPremium?: boolean;
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

// Compare Coverage Interfaces: One story. Different sources. Original reporting.
export interface SourceReport {
  id: string;
  articleId: string;
  headline: string;
  publisher: string;
  publishedAt: string;
  url: string;
  summary: string;
  sourceType: 'wire' | 'broadcast' | 'press_release' | 'institutional' | 'academic' | string;
  author?: string;
  imageUrl?: string;
  isOfficialStatement?: boolean;
}

export interface CoverageComparison {
  storyId: string;
  storyTitle: string;
  category: string;
  leadArticleId: string;
  factTrailId?: string;
  factTrailSlug?: string;
  publishersCount: number;
  publishers: string[];
  articlesCount: number;
  sources: SourceReport[];
  isSingleSource: boolean;
  firstReportedAt: string;
  latestReportAt: string;
  singleSourceNotice?: string;
}

// AI Tools Directory & Authentic Reviews Interfaces
export type AiToolCategory =
  | 'writing'
  | 'coding'
  | 'research'
  | 'image-editing'
  | 'productivity'
  | 'education'
  | 'automation';

export type AiToolPricing = 'free' | 'freemium' | 'trial' | 'paid';

export interface AiToolReview {
  id: string;
  toolId: string;
  authorName: string;
  rating: number; // 1 to 5
  comment: string;
  useCase?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  isEditorialAssessment?: boolean;
}

export interface AiTool {
  id: string;
  slug: string;
  name: string;
  websiteUrl: string;
  category: AiToolCategory;
  pricing: AiToolPricing;
  pricingDetails: string;
  requiresAccount: boolean;
  requiresApiKey: boolean;
  summary: string;
  practicalUseCases: string[];
  importantRestrictions: string[];
  officialSourceUrl: string;
  lastReviewedDate: string;
  affiliateUrl?: string;
  affiliateDisclosure?: string;
  editorialRating?: number; // e.g. 4.8
  status: 'published' | 'pending_review' | 'rejected';
  submittedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// E-Commerce Readiness Product Catalog Interface
export interface ProductItem {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
  merchant: string;
  price: number;
  currency: string;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  purchaseUrl: string;
  isAffiliate: boolean;
  enabled: boolean;
}

// ==========================================
// IMPACT BRIEF — WHY THIS MATTERS INTERFACES
// ==========================================

export type ImpactBriefCategory =
  | 'world'
  | 'technology'
  | 'science'
  | 'health'
  | 'business'
  | 'sports'
  | 'politics'
  | 'guides';

export type ImpactBriefRegion = 'global' | 'eu' | 'na' | 'asia' | 'me-africa' | 'latam';

export interface ImpactBriefPreference {
  categories: ImpactBriefCategory[];
  region: ImpactBriefRegion;
  language: string;
  autoRefresh?: boolean;
}

export interface ImpactBriefDomainDetails {
  science?: {
    whatStudyFound: string;
    whatItDidNotEstablish: string;
    peerReviewed?: boolean;
    primarySourceUrl?: string;
  };
  sports?: {
    resultOrEvent: string;
    tableOrFixtureImpact: string;
    qualificationNote?: string;
  };
  techPolicy?: {
    announcement: string;
    affectedAudience: string;
    effectiveDateOrTimeline?: string;
    officialDocUrl?: string;
  };
  health?: {
    clinicalContext: string;
    cautionaryGuidance: string;
    advisoryAuthority?: string;
  };
  worldEcon?: {
    backgroundContext: string;
    keyParties: string[];
    unresolvedPoints: string[];
  };
}

export interface ImpactBriefItem {
  id: string;
  storyId: string;
  title: string;
  category: ImpactBriefCategory;
  region?: ImpactBriefRegion;
  publishedAt: string;
  imageUrl?: string;
  imageAttribution?: string;
  publisher: string;
  url: string;
  factTrailId?: string;
  factTrailSlug?: string;
  compareCoverageAvailable?: boolean;

  // Update indicator for followed storylines
  hasNewUpdate?: boolean;
  newUpdateSummary?: string;
  newUpdatePublisher?: string;
  newUpdatePublishedAt?: string;

  // The 5 Flagship Pillars
  whatHappened: string;
  whyItMatters: string;
  whoIsAffected: string;
  whatToCheckNext: string;
  whatRemainsUncertain: string;

  // Domain-Specific Grounding
  templateType: 'science' | 'sports' | 'technology' | 'health' | 'world' | 'standard';
  domainDetails?: ImpactBriefDomainDetails;

  // Sourced Citations & Transparency
  sources: {
    publisher: string;
    headline?: string;
    url: string;
    publishedAt?: string;
    sourceType?: string;
  }[];
  transparency: {
    isSingleSource?: boolean;
    hasOfficialConfirmation?: boolean;
    identifiedLimitations?: string[];
    corroboratingSourcesCount?: number;
  };
}

export interface FollowedStoryRecord {
  storyId: string;
  factTrailId?: string;
  title: string;
  followedAt: string;
  lastVisitedAt: string;
  lastKnownUpdateAt: string;
}



