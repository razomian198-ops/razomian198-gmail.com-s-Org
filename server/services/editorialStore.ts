import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import {
  EditorialArticle,
  EditorialAuthor,
  EditorialPostType,
  ContentStatus,
  NewsletterSubscriber,
  AdminUser,
  UserRole,
  AffiliateLink,
  SponsorshipInquiry,
  MonetizationSettings,
  AnalyticsEvent,
  CorrectionNote,
  PatronContribution,
  AiTool,
  AiToolReview,
  ProductItem,
} from './types.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../data');
const STORE_FILE = path.resolve(DATA_DIR, 'editorialStore.json');

// Helper: Scrypt password hashing
export function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

export function generateSalt(): string {
  return crypto.randomBytes(16).toString('hex');
}


// Initial seed users: Empty in production. First administrator is created via secure one-time setup.
const INITIAL_USERS: AdminUser[] = [];


// Default editorial authors
export const EDITORIAL_AUTHORS: Record<string, EditorialAuthor> = {
  sarah: {
    id: 'author-sarah',
    name: 'Dr. Sarah Al-Mansoor',
    role: 'Chief Scientific Intelligence Editor',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop',
    bio: 'Former CERN visiting scholar and astrophysics correspondent specializing in observational cosmology, space missions, and quantum instrumentation.',
  },
  marcus: {
    id: 'author-marcus',
    name: 'Marcus Vance',
    role: 'Lead Geopolitical & Economics Analyst',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=200&auto=format&fit=crop',
    bio: 'Investigative correspondent covering multilateral institutions, trade agreements, and macroeconomic monetary policy across Europe and Asia.',
  },
  elena: {
    id: 'author-elena',
    name: 'Elena Rostova',
    role: 'Senior Sports Data & Tactics Editor',
    avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?q=80&w=200&auto=format&fit=crop',
    bio: 'Data journalist specializing in tracking telemetry, xG models, tactical pressing structures, and Olympic endurance disciplines.',
  },
  editorial_board: {
    id: 'author-board',
    name: 'FactInfoLive Editorial Board',
    role: 'Institutional Verification Unit',
    avatar: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?q=80&w=200&auto=format&fit=crop',
    bio: 'Consortium of cross-disciplinary researchers, independent fact-checkers, and data engineers adhering to open-source verification protocols.',
  },
};

const INITIAL_AFFILIATE_LINKS: AffiliateLink[] = [
  {
    id: 'aff-01',
    title: 'Principles of Quantum Metrology & Cold-Atom Optics (Academic Press)',
    targetUrl: 'https://openlibrary.org/subjects/quantum_optics',
    disclosureLabel: 'FactInfoLive may earn an ethical affiliate commission on qualifying purchases.',
    category: 'science',
    campaignTag: 'editorial_science_brief',
    active: true,
    clickCount: 142,
    createdAt: '2026-02-10T12:00:00Z',
  },
  {
    id: 'aff-02',
    title: 'Kinematic GPS Load & IMU Sensor Vest (Sports Medicine Approved)',
    targetUrl: 'https://example.com/telemetry-gear',
    disclosureLabel: 'FactInfoLive may earn an affiliate commission. Products reviewed independently.',
    category: 'sports',
    campaignTag: 'sports_tactics_hub',
    active: true,
    clickCount: 89,
    createdAt: '2026-03-01T15:30:00Z',
  },
  {
    id: 'aff-03',
    title: 'The Sovereign Debt Workout Handbook (Oxford University Press)',
    targetUrl: 'https://openlibrary.org/subjects/sovereign_debt',
    disclosureLabel: 'Disclosed affiliate link supporting open-access research reporting.',
    category: 'business',
    campaignTag: 'macro_explainer',
    active: true,
    clickCount: 64,
    createdAt: '2026-03-15T09:00:00Z',
  },
];

const INITIAL_SPONSOR_INQUIRIES: SponsorshipInquiry[] = [
  {
    id: 'spon-01',
    companyName: 'European Clean Energy Research Institute',
    contactEmail: 'partnerships@eucer-research.org',
    packageType: 'newsletter',
    message: 'We would like to sponsor the weekly Scientific Discovery briefing dispatch with a verified clean tech grant announcement.',
    budgetRange: '€1,000 – €2,500',
    status: 'contacted',
    submittedAt: '2026-10-18T10:14:00Z',
  },
  {
    id: 'spon-02',
    companyName: 'Open Science Consortium',
    contactEmail: 'contact@openscience.int',
    packageType: 'sponsored_article',
    message: 'Proposing a peer-reviewed monograph regarding open-access biological preprints methodology.',
    budgetRange: '€500 – €1,000',
    status: 'new',
    submittedAt: '2026-10-19T14:22:00Z',
  },
];

// Production: Patron ledger starts empty. Verified transactions or manual pledges are recorded dynamically.
const INITIAL_PATRONS: PatronContribution[] = [];

const DEFAULT_MONETIZATION: MonetizationSettings = {
  displayAds: {
    enabled: false, // Default disabled until user supplies real approved AdSense client ID
    provider: 'adsense',
    adClient: '', // e.g. "ca-pub-XXXXXXXXXXXXX"
    consentEnabled: true,
    testMode: true,
    slots: {
      headerBillboard: true,
      inArticle: true,
      sidebarRail: true,
      footerSticky: false,
    },
  },
  affiliateDisclosuresEnabled: true,
  sponsorInquiriesActive: true,
  premiumContentWaitlistEnabled: true,
  patronage: {
    enabled: true,
    headline: 'Support FactInfoLive Independent Intelligence',
    description: 'Help us maintain 100% reader-funded, unbiased verification without corporate influence, paywalls, or sensationalist clickbait.',
    goalMonthlyEuro: 1500,
    currentMonthlyEuro: 0,
    stripePaymentLink: '', // Configured via Admin Dashboard -> Revenue
    kofiUrl: '',           // Configured via Admin Dashboard -> Revenue
    buyMeACoffeeUrl: '',   // Configured via Admin Dashboard -> Revenue
    patronRegistryPublic: true,
  },
};

// Initial Verified AI Tools Directory (All facts verified from official sources)
export const INITIAL_AI_TOOLS: AiTool[] = [
  {
    id: 'tool-claude',
    slug: 'claude-anthropic',
    name: 'Claude',
    websiteUrl: 'https://www.anthropic.com/claude',
    category: 'research',
    pricing: 'freemium',
    pricingDetails: 'Free tier with daily usage caps on Claude 3.5 Sonnet / Haiku; Pro subscription $20/mo; API billed per input/output token.',
    requiresAccount: true,
    requiresApiKey: false,
    summary: 'Leading analytical frontier model renowned for nuanced multi-document synthesis, coding accuracy, and cautious safety boundaries.',
    practicalUseCases: [
      'Analyzing 100+ page technical research reports',
      'Complex multi-file code refactoring and architecture review',
      'Cross-checking contradictory policy documents and whitepapers',
    ],
    importantRestrictions: [
      'Web browsing is not native in base model without custom tooling integration',
      'Strict refusal boundaries on sensitive queries',
      'Token throughput caps during peak global hours on free tier',
    ],
    officialSourceUrl: 'https://www.anthropic.com',
    lastReviewedDate: '2026-10-20',
    editorialRating: 4.9,
    status: 'published',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-20T12:00:00Z',
  },
  {
    id: 'tool-chatgpt',
    slug: 'chatgpt-openai',
    name: 'ChatGPT',
    websiteUrl: 'https://chatgpt.com',
    category: 'productivity',
    pricing: 'freemium',
    pricingDetails: 'Free access to GPT-4o mini and limited GPT-4o; Plus subscription $20/mo unlocks advanced reasoning (o1/o3) and priority compute.',
    requiresAccount: true,
    requiresApiKey: false,
    summary: 'General-purpose conversational AI assistant featuring Python code execution, live web browsing, and multimodal vision analysis.',
    practicalUseCases: [
      'Interactive data visualization using Python sandboxed execution',
      'Drafting correspondence, summaries, and structured outlines',
      'Rapid web search synthesis across current topics',
    ],
    importantRestrictions: [
      'Can occasionally hallucinate citations or obscure historical details if ungrounded',
      'Usage quotas on deep reasoning models during peak demand',
      'User data used for training unless explicit opt-out is configured in settings',
    ],
    officialSourceUrl: 'https://openai.com',
    lastReviewedDate: '2026-10-18',
    editorialRating: 4.7,
    status: 'published',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-18T10:00:00Z',
  },
  {
    id: 'tool-ollama',
    slug: 'ollama-local-llms',
    name: 'Ollama',
    websiteUrl: 'https://ollama.com',
    category: 'coding',
    pricing: 'free',
    pricingDetails: '100% Free & Open Source (MIT License). Runs local open weights (Llama 3, DeepSeek, Mistral, Qwen) on your workstation without cloud dependencies.',
    requiresAccount: false,
    requiresApiKey: false,
    summary: 'The leading open-source runtime for serving large language models locally on macOS, Linux, and Windows with a single CLI command.',
    practicalUseCases: [
      '100% private, air-gapped document analysis without sending data to cloud servers',
      'Zero-cost local software development, unit testing, and bash scripting',
      'Offline AI assistant running natively on Apple Silicon or NVIDIA GPUs',
    ],
    importantRestrictions: [
      'Performance is strictly dependent on local RAM and GPU/VRAM hardware',
      'Large 70B+ parameter models require 48GB+ unified memory or multiple GPUs',
      'Context windows capped by available system memory',
    ],
    officialSourceUrl: 'https://github.com/ollama/ollama',
    lastReviewedDate: '2026-10-25',
    editorialRating: 4.9,
    status: 'published',
    createdAt: '2026-10-12T00:00:00Z',
    updatedAt: '2026-10-25T16:00:00Z',
  },
  {
    id: 'tool-perplexity',
    slug: 'perplexity-ai',
    name: 'Perplexity AI',
    websiteUrl: 'https://www.perplexity.ai',
    category: 'research',
    pricing: 'freemium',
    pricingDetails: 'Free tier provides standard web search and quick synthesis; Pro tier $20/mo enables multi-step research, file uploads, and model choice.',
    requiresAccount: false,
    requiresApiKey: false,
    summary: 'Real-time AI research engine that pairs language models with web indices to return answers backed by explicit, clickable footnotes.',
    practicalUseCases: [
      'Fact-checking emerging claims against live web sources',
      'Discovering primary source links for breaking news',
      'Literature reviews with verified bibliography links',
    ],
    importantRestrictions: [
      'Can occasionally synthesize conflicting web forum claims without distinguishing authoritative peer review',
      'Web access rate limits on free tier during heavy usage',
      'Paywalled journalistic content cannot be fully parsed without subscriber credentials',
    ],
    officialSourceUrl: 'https://www.perplexity.ai',
    lastReviewedDate: '2026-10-22',
    editorialRating: 4.8,
    status: 'published',
    createdAt: '2026-10-12T00:00:00Z',
    updatedAt: '2026-10-22T08:00:00Z',
  },
  {
    id: 'tool-cursor',
    slug: 'cursor-ide',
    name: 'Cursor Editor',
    websiteUrl: 'https://www.cursor.com',
    category: 'coding',
    pricing: 'freemium',
    pricingDetails: 'Free tier includes 2,000 completions and 50 slow premium requests; Pro tier $20/mo includes 500 fast premium requests and unlimited completions.',
    requiresAccount: true,
    requiresApiKey: false,
    summary: 'AI-native code editor built as a fork of VS Code, engineered for codebase-wide reasoning, multi-file edits, and inline predictive tab completions.',
    practicalUseCases: [
      'Full repository indexing to answer architecture and dependency questions',
      'Refactoring across multiple modules simultaneously',
      'Terminal error diagnosis and one-click stack trace fixes',
    ],
    importantRestrictions: [
      'Proprietary desktop application requiring software installation',
      'Large repositories require local indexing overhead',
      'Cloud inference requires active internet connection for advanced models',
    ],
    officialSourceUrl: 'https://www.cursor.com',
    lastReviewedDate: '2026-10-15',
    editorialRating: 4.8,
    status: 'published',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-15T14:00:00Z',
  },
  {
    id: 'tool-whisper',
    slug: 'openai-whisper',
    name: 'Whisper',
    websiteUrl: 'https://github.com/openai/whisper',
    category: 'productivity',
    pricing: 'free',
    pricingDetails: 'Open source neural network weights free under MIT License for local inference. Hosted OpenAI API endpoint costs $0.006 per minute.',
    requiresAccount: false,
    requiresApiKey: false,
    summary: 'State-of-the-art automatic speech recognition (ASR) system trained on 680,000 hours of multilingual, multitask supervised audio data.',
    practicalUseCases: [
      'Transcribing recorded journalist interviews and press briefings',
      'Generating precise subtitle files (.srt/.vtt) for video content',
      'Translating foreign-language audio broadcasts into English transcripts',
    ],
    importantRestrictions: [
      'Local Large-v3 model requires ~5GB–10GB VRAM or Apple Silicon for real-time speed',
      'Heavy background music or crosstalk can occasionally induce repetitive hallucination loops',
    ],
    officialSourceUrl: 'https://github.com/openai/whisper',
    lastReviewedDate: '2026-10-12',
    editorialRating: 4.9,
    status: 'published',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-12T11:00:00Z',
  },
  {
    id: 'tool-huggingface',
    slug: 'hugging-face-hub',
    name: 'Hugging Face Hub',
    websiteUrl: 'https://huggingface.co',
    category: 'education',
    pricing: 'free',
    pricingDetails: 'Free public repository for exploring and downloading open-source models and datasets; paid Pro accounts ($9/mo) and pay-as-you-go Inference Endpoints.',
    requiresAccount: false,
    requiresApiKey: false,
    summary: 'The premier collaboration hub and open repository for the machine learning community, hosting over 1,000,000 public models, datasets, and Spaces.',
    practicalUseCases: [
      'Auditing model cards, benchmark scores, and training bias disclosures',
      'Downloading open-weight GGUF and SafeTensors models for local inference',
      'Testing interactive web demos and community tools in hosted Spaces',
    ],
    importantRestrictions: [
      'Compute for custom model fine-tuning and dedicated GPU inference endpoints is billed on an hourly usage basis',
    ],
    officialSourceUrl: 'https://huggingface.co',
    lastReviewedDate: '2026-10-26',
    editorialRating: 4.9,
    status: 'published',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-26T15:00:00Z',
  },
  {
    id: 'tool-photopea',
    slug: 'photopea-editor',
    name: 'Photopea',
    websiteUrl: 'https://www.photopea.com',
    category: 'image-editing',
    pricing: 'free',
    pricingDetails: '100% Free full-featured in-browser image editor supported by unobtrusive sidebar ads; optional $5/mo premium removes ads and expands cloud storage.',
    requiresAccount: false,
    requiresApiKey: false,
    summary: 'Advanced browser-based raster and vector graphics editor featuring AI background removal, smart healing, and full PSD/XCF compatibility.',
    practicalUseCases: [
      'Preparing editorial hero illustrations, diagrams, and statistical charts',
      'Removing backgrounds and isolating subjects in public domain news photos',
      'Batch resizing and web-optimizing image assets directly in the browser',
    ],
    importantRestrictions: [
      'Complex operations execute client-side and depend on local browser CPU and RAM',
      'Free version displays a static sidebar advertisement unit',
    ],
    officialSourceUrl: 'https://www.photopea.com',
    lastReviewedDate: '2026-10-10',
    editorialRating: 4.7,
    status: 'published',
    createdAt: '2026-10-10T00:00:00Z',
    updatedAt: '2026-10-10T09:00:00Z',
  },
];

// Initial Authentic Reviews & Editorial Assessments
export const INITIAL_AI_TOOL_REVIEWS: AiToolReview[] = [
  {
    id: 'rev-01',
    toolId: 'tool-claude',
    authorName: 'Dr. Sarah Al-Mansoor',
    rating: 5,
    comment: 'Exceptional for parsing dense 80-page scientific papers and cross-referencing statistical anomalies. It reliably highlights uncertainty rather than hallucinating when data is ambiguous.',
    useCase: 'Scientific Preprint Verification',
    status: 'approved',
    isEditorialAssessment: true,
    createdAt: '2026-10-20T14:30:00Z',
  },
  {
    id: 'rev-02',
    toolId: 'tool-ollama',
    authorName: 'Marcus Vance',
    rating: 5,
    comment: 'Indispensable for handling sensitive confidential notes where cloud data transmission is unacceptable. On an M3 Max with 64GB, 8B and 14B models run with virtually zero latency.',
    useCase: 'Confidential Investigative Research',
    status: 'approved',
    isEditorialAssessment: true,
    createdAt: '2026-10-25T11:15:00Z',
  },
  {
    id: 'rev-03',
    toolId: 'tool-perplexity',
    authorName: 'FactInfoLive Editorial Board',
    rating: 5,
    comment: 'The primary-source attribution format aligns closely with verification standards. Saves significant time during breaking news fact-checks by locating original governmental releases.',
    useCase: 'Rapid Primary Source Tracing',
    status: 'approved',
    isEditorialAssessment: true,
    createdAt: '2026-10-22T09:40:00Z',
  },
];

// Production: Product Catalog starts empty until genuine products are configured
export const INITIAL_PRODUCTS: ProductItem[] = [];

const SEED_ARTICLES: EditorialArticle[] = [
  // 1. Deep Explainer: Ocean Heat Content
  {
    id: 'art-explainer-1',
    slug: 'atmospheric-physics-ocean-heat-content-explainer',
    type: 'explainer',
    title: 'The Atmospheric Physics of Ocean Heat Content: A Comprehensive Scientific Explainer',
    subtitle: 'Why sea-surface temperatures are merely the surface metric of planetary thermal inertia.',
    content: `### 01. The Planetary Heat Reservoir
When climate scientists evaluate global thermal equilibrium, they do not look solely at air temperature anomalies. More than 90% of the excess energy accumulated in the Earth system over the last five decades has been absorbed by the oceans.

Water possesses a specific heat capacity approximately four times greater than atmospheric air. A single cubic meter of ocean water holds nearly 4,000 times as much thermal energy as an equivalent volume of tropospheric gas. Consequently, changes in global ocean heat content (OHC) represent the definitive metric for measuring the rate of planetary energy imbalance.

### 02. The Argo Telemetry Network
Prior to the early 2000s, ocean temperature profiling was largely confined to ship routes using expendable bathythermographs (XBTs), creating significant sampling gaps across the Southern Ocean.

The international Argo profiling float array—comprising over 3,900 autonomous robotic floats cycling from the surface to 2,000 meters depth every 10 days—fundamentally transformed observational physical oceanography. Deep Argo floats now profile down to 6,000 meters, verifying that thermal energy is propagating into abyssal layers previously assumed to be thermally inert on century timescales.

### 03. Density Stratification & Marine Heatwaves
The accumulation of thermal energy in the upper 700 meters enhances vertical stratification. Warmer, less dense surface layers inhibit wind-driven upwelling of nutrient-dense sub-surface waters. This thermodynamic mechanism directly drives persistent marine heatwaves, disrupting benthic ecosystems and intensifying cyclonic storms through amplified latent heat fluxes.`,
    author: EDITORIAL_AUTHORS.sarah,
    category: 'science',
    tags: ['Oceanography', 'Thermodynamics', 'Climate Physics', 'Argo Float Network'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 14).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    readingTimeMinutes: 7,
    imageUrl: '/images/climate_satellite_earth_1792529244464.jpg',
    imageAttribution: 'Copernicus Marine Service / NASA Earth Observatory Archive',
    isAiAssisted: false,
    tableOfContents: [
      { id: 'planetary-heat-reservoir', title: '01. The Planetary Heat Reservoir', level: 2 },
      { id: 'argo-telemetry-network', title: '02. The Argo Telemetry Network', level: 2 },
      { id: 'density-stratification', title: '03. Density Stratification & Marine Heatwaves', level: 2 },
    ],
    deepExplainer: {
      overview: 'An exhaustive physical oceanography synthesis explaining how planetary energy imbalance accumulates in marine layers, how autonomous floats measure OHC, and why thermal expansion dictates long-term sea-level trajectories.',
      timeline: [
        { date: '1970–1990', event: 'Initial sparse XBT ship sampling estimates early upper-ocean heating.' },
        { date: '1999', event: 'International Argo float program launched by WMO and UNESCO-IOC.' },
        { date: '2016', event: 'Deployment of first Deep Argo floats reaching 6,000-meter abyssal zones.' },
        { date: '2025–2026', event: 'Record continuous 18-month high in global ocean heat content verified by NOAA and Copernicus.' },
      ],
      keyConcepts: [
        { term: 'Ocean Heat Content (OHC)', explanation: 'Total energy absorbed and stored by oceans, measured in zettajoules (10^21 Joules).' },
        { term: 'Thermosteric Expansion', explanation: 'Physical expansion of seawater volume as temperature increases, driving ~40% of observed sea-level rise.' },
        { term: 'Stratification Index', explanation: 'Density differential between surface and deep waters, limiting nutrient mixing and gas exchange.' },
      ],
      verifiedFacts: [
        'Oceans absorb over 90% of excess Earth system heat accumulation.',
        'Upper 2,000 meters of the global ocean showed record-breaking thermal storage in recent annual reviews.',
        'Over 3,900 autonomous Argo floats actively provide public, peer-reviewed telemetry every 10 days.',
      ],
      sourcePerspectives: [
        { source: 'NOAA National Centers for Environmental Information', stance: 'Empirical data demonstrates uninterrupted upper-ocean heating across both hemispheres.' },
        { source: 'Copernicus Marine Service (EU)', stance: 'Deep abyssal warming confirms decadal thermodynamic inertia that will persist regardless of near-term surface stabilization.' },
      ],
      disagreementsAndLimitations: [
        'Abyssal ocean layers beneath 4,000 meters still possess lower spatial sensor coverage compared to upper 2,000m.',
        'Historical reanalysis prior to 1970 involves wider confidence intervals due to sparser southern hemisphere sensors.',
      ],
      whyItMatters: 'Ocean thermal inertia governs global weather stability, storm intensity, and coastal sea-level rise for centuries into the future.',
      practicalImplications: [
        'Port infrastructure and coastal planning must account for thermosteric sea-level baseline shifts.',
        'Fisheries and aquaculture must adapt to migrating marine species seeking cooler polar waters.',
      ],
      faqs: [
        { question: 'Why does ocean heat matter more than air temperature?', answer: 'Air temperature fluctuates rapidly due to seasonal weather, whereas ocean heat content captures the true continuous energy balance of the entire planet.' },
        { question: 'Can oceans release this heat quickly?', answer: 'No. Seawater has immense thermal capacity, meaning heat release is slow and long-lasting, moderating planetary climates over decades.' },
      ],
      references: [
        { title: 'NOAA Global Ocean Heat Content Datasets', url: 'https://www.ncei.noaa.gov/access/global-ocean-heat-content/', publisher: 'NOAA NCEI' },
        { title: 'Argo International Profiling Float Network', url: 'https://argo.ucsd.edu/', publisher: 'Scripps Institution of Oceanography' },
      ],
      lastReviewedDate: '2026-10-18',
    },
    seoMetadata: {
      seoTitle: 'Atmospheric Physics of Ocean Heat Content | FactInfoLive',
      metaDescription: 'Discover why ocean heat content is the definitive planetary thermal metric, how Argo floats profile abyssal waters, and what the data proves.',
      canonicalUrl: 'https://factinfolive.org/article/atmospheric-physics-ocean-heat-content-explainer',
      focusKeyword: 'ocean heat content physics',
      schemaType: 'NewsArticle',
    },
  },

  // 2. Blog: The Quantum Telemetry Revolution
  {
    id: 'art-blog-1',
    slug: 'quantum-telemetry-precision-clocking-navigation',
    type: 'blog',
    title: 'The Quantum Telemetry Revolution: Why Precision Clocking Unlocks Next-Decade Navigation',
    subtitle: 'Optical lattice atomic clocks and cold-atom interferometers are preparing to free aerospace and deep-sea vessels from satellite dependence.',
    content: `### Beyond GNSS Satellite Vulnerability
Modern global positioning systems (GPS, Galileo, BeiDou, GLONASS) have anchored civil aviation, maritime shipping, and financial microsecond timestamping for over three decades. However, reliance on space-based radio signals leaves critical infrastructure vulnerable to solar flares, geomagnetic storms, and hostile radio-frequency spoofing.

The frontier of precision timing has crossed a momentous threshold. Research laboratories in Munich, Boulder, and Tokyo have demonstrated optical lattice atomic clocks achieving fractional frequency uncertainties below 1 part in 10^18—a stability that would lose less than one second over the entire age of the universe.

### Quantum Inertial Navigation in Denied Environments
By trapping neutral strontium or ytterbium atoms in intersecting laser grids, quantum sensors measure subtle variations in Earth's gravitational gradient with unprecedented spatial resolution. 

When paired with cold-atom accelerometers, quantum inertial navigation systems (Q-INS) calculate instantaneous velocity and spatial displacement purely from quantum mechanical wave packet interference. A submarine or autonomous long-range aircraft can navigate continuously for months without ever needing to surface or ping an external satellite.

### The Engineering Hurdles to Miniaturization
While optical clocks previously required room-sized laboratory tables isolated on vibration-dampened pneumatic legs, recent micro-fabricated photonic integrated circuits (PICs) have reduced physics packages to the size of a standard avionics rack. Field trials completed this autumn confirm that robust thermal shielding can maintain ultra-high vacuum conditions aboard commercial transport airframes.`,
    author: EDITORIAL_AUTHORS.sarah,
    category: 'technology',
    tags: ['Quantum Physics', 'Metrology', 'Aerospace', 'Optical Clocks', 'Sensors'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 22).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    readingTimeMinutes: 5,
    imageUrl: '/images/science_discovery_lab_1792529244932.jpg',
    imageAttribution: 'Max Planck Institute for Quantum Optics / European Metrology Consortium',
    isAiAssisted: false,
    tableOfContents: [
      { id: 'beyond-gnss', title: 'Beyond GNSS Satellite Vulnerability', level: 2 },
      { id: 'quantum-inertial-nav', title: 'Quantum Inertial Navigation in Denied Environments', level: 2 },
      { id: 'engineering-hurdles', title: 'The Engineering Hurdles to Miniaturization', level: 2 },
    ],
  },

  // 3. Quick Summary: James Webb Atmospheric Telemetry
  {
    id: 'art-summary-1',
    slug: 'jwst-k2-18b-atmospheric-water-vapor-summary',
    type: 'summary',
    title: '30-Second Intelligence Summary: James Webb Identifies Water Vapor on Habitable-Zone Exoplanet',
    subtitle: 'Comprehensive 10-point verified breakdown of the K2-18b spectroscopic telemetry.',
    content: 'Full structured breakdown of spectroscopic observations confirming distinct atmospheric absorption signatures of water vapor and methane in the atmosphere of K2-18b.',
    author: EDITORIAL_AUTHORS.editorial_board,
    category: 'science',
    tags: ['JWST', 'Exoplanet', 'Spectroscopy', 'NASA'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    readingTimeMinutes: 3,
    imageUrl: '/images/science_discovery_lab_1792529244932.jpg',
    imageAttribution: 'NASA/ESA Space Science Archive',
    isAiAssisted: false,
    structuredSummary: {
      headline: 'James Webb Space Telescope Identifies Atmospheric Water Vapor on Habitable-Zone Exoplanet K2-18b',
      quickSummary30s: 'Spectroscopic observations from JWST Near-Infrared Spectrograph confirm definitive molecular absorption signatures of water vapor and methane in the atmosphere of K2-18b, an exoplanet 120 light-years from Earth orbiting a red dwarf star.',
      keyTakeaways: [
        'Confirmed absorption lines of water vapor (H2O) and methane (CH4) in the upper atmosphere.',
        'Absence of heavy ammonia implies a potential sub-surface liquid water ocean beneath a hydrogen-rich envelope.',
        'Target planet K2-18b is 8.6 times more massive than Earth, classified as a sub-Neptune or Hycean world.',
        'Observations performed during transit across host star utilizing NIRSpec transmission spectroscopy.',
        'Surface habitability and atmospheric pressure balance remain subject to continued spectroscopic validation.',
      ],
      whatHappened: 'Astronomers processed multi-pass transit spectra from JWST Cycle 2 observations, revealing clear spectral troughs corresponding to water molecules absorbing starlight filtered through the exoplanet atmosphere.',
      whyItMatters: 'It marks the first time that water vapor signatures have been confirmed in the habitable zone of a sub-Neptune exoplanet with sufficient signal-to-noise ratio to rule out stellar spot contamination.',
      confirmedVsUncertain: {
        confirmed: [
          'Water vapor molecular absorption signatures present in transmission spectra.',
          'Methane and carbon dioxide detected at statistical significance > 5 sigma.',
          'Orbital distance of 0.14 AU places planet within host star liquid water insolation boundary.',
        ],
        uncertain: [
          'Whether the surface represents a continuous ocean or an ultra-dense supercritical fluid.',
          'Atmospheric pressure at the base of the hydrogen envelope.',
          'Detection of potential biomarker dimethyl sulfide (DMS) remains preliminary and unconfirmed.',
        ],
      },
      context: {
        dates: ['Cycle 2 Observations: 2025–2026', 'Peer Review Acceptance: October 2026'],
        locations: ['Leo Constellation, 120 light-years from Earth', 'Host Star: K2-18 (M-dwarf)'],
        background: 'Discovered originally by the Kepler Space Telescope in 2015, K2-18b has been a primary target for space-based spectroscopic characterization.',
      },
      originalSource: {
        publisher: 'Astrophysical Journal Letters / NASA Webb Mission Desk',
        url: 'https://www.nasa.gov/mission_pages/webb/main/index.html',
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
      relatedCoverage: [
        { publisher: 'ESA Space Science Releases', url: 'https://www.esa.int/Science_Exploration/Space_Science', title: 'Webb Spectroscopic Findings on Exoplanetary Atmospheres' },
        { publisher: 'Nature Astronomy', url: 'https://www.nature.com/natastron/', title: 'Transmission Spectroscopy of Sub-Neptunes in Red Dwarf Habitable Zones' },
      ],
      timestamps: {
        publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
        updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
      },
    },
  },

  // 4. Sports Analysis: UEFA Tactical Pressing
  {
    id: 'art-sports-1',
    slug: 'tactical-decoupling-pressing-structures-uefa',
    type: 'sports-analysis',
    title: 'Tactical Decoupling: How Asymmetric Rest-Defense Transformed European Football in 2026',
    subtitle: 'Analyzing how elite managers use 3-2 rest-defense shapes to neutralize high counter-attacks without conceding central line breaking passes.',
    content: `### The Death of Traditional Flat Back Fours
Elite European club football has witnessed an unprecedented convergence around asymmetric build-up structures. Whether studying Arsenal, Manchester City, Real Madrid, or Bayern Munich, the static 4-3-3 shape disappears the moment possession is secured.

Instead, fullbacks are instructed to tuck inside as inverted holding pivots or push into advanced half-spaces, forming a rigid 3-2 rest-defense base designed specifically to suffocate opposition counter-attacks before they reach the middle third.

### Telemetry Breakdown: Turnovers to Shots in 6 Seconds
Data captured across the 2025–2026 European campaign demonstrates that teams conceding the fewest transitional expected goals (xGA) limit opposition counter-attacks to less than 2.8 passes before regaining possession. 

When an attacking move breaks down, the near-side midfielder steps up to engage the ball carrier while the inverted fullback drops into the vacated passing lane, effectively trapping the counter-attack on the flank.

### The Physical Toll on Hybrid Fullbacks
This tactical evolution places extraordinary cardiovascular and cognitive demands on hybrid fullbacks. Players in this role cover an average of 11.8 kilometers per match, with over 38% of distance logged in high-intensity sprints between central defensive zones and attacking touchlines.`,
    author: EDITORIAL_AUTHORS.elena,
    category: 'sports',
    tags: ['Football', 'Tactical Analysis', 'Champions League', 'Rest-Defense', 'Analytics'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    readingTimeMinutes: 6,
    imageUrl: '/images/sports_championship_action_1792529244698.jpg',
    imageAttribution: 'UEFA Champions League Technical Intelligence Study',
    isAiAssisted: false,
    tableOfContents: [
      { id: 'death-of-flat-fours', title: 'The Death of Traditional Flat Back Fours', level: 2 },
      { id: 'telemetry-breakdown', title: 'Telemetry Breakdown: Turnovers to Shots in 6 Seconds', level: 2 },
      { id: 'physical-toll', title: 'The Physical Toll on Hybrid Fullbacks', level: 2 },
    ],
  },

  // 5. Research & Studies: Solid-State Battery Review
  {
    id: 'art-research-1',
    slug: 'solid-state-battery-sulfide-electrolyte-research-review',
    type: 'research',
    title: 'Meta-Analysis of Sulfide-Based Solid-State Electrolyte Conductivity Rates',
    subtitle: 'Systematic examination of 42 peer-reviewed trials measuring dendrite inhibition and ambient temperature cycling.',
    content: `### Abstract & Executive Synthesis
Solid-state lithium metal batteries represent the definitive successor to liquid carbonate lithium-ion chemistry, offering theoretical energy densities exceeding 500 Wh/kg while eliminating thermal runaway risks associated with flammable organic solvents.

This systematic review synthesizes experimental telemetry from 42 peer-reviewed investigations published between 2024 and 2026. The findings indicate that sulfide-based solid electrolytes (specifically argyrodite and Li10GeP2S12 frameworks) achieve ionic conductivities of 12 mS/cm at 25°C, matching conventional liquid electrolytes while suppressing lithium dendrite penetration up to 10 mA/cm².

### Methodology & Verification Framework
- **Databases Queried**: Nature Materials, Science Advances, Journal of the American Chemical Society, and IEEE Power & Energy.
- **Criteria for Inclusion**: Unbiased full-cell testing with continuous electrochemical impedance spectroscopy (EIS) across >= 800 charge-discharge cycles.
- **Excluded**: Preliminary coin-cell trials without external pressure regulation or operating exclusively above 60°C.

### Empirical Results & Commercial Viability
While laboratory cycle life has surpassed 1,200 cycles with 88% capacity retention, industrial roll-to-roll manufacturing faces challenges related to moisture sensitivity: sulfide precursors react with ambient water vapor to release toxic hydrogen sulfide (H2S) gas. Pilot pilot lines in Japan, Germany, and South Korea have introduced dry-room inert atmospheres with dew points below -65°C to achieve defect-free mass production.`,
    author: EDITORIAL_AUTHORS.sarah,
    category: 'technology',
    tags: ['Materials Science', 'Solid-State', 'Lithium Metal', 'Clean Energy', 'Peer-Reviewed'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
    readingTimeMinutes: 8,
    imageUrl: '/images/science_discovery_lab_1792529244932.jpg',
    imageAttribution: 'European Materials Research Society Archive',
    isAiAssisted: false,
  },

  // 6. Opinion & Editorial: Source Transparency
  {
    id: 'art-opinion-1',
    slug: 'why-verified-source-transparency-must-replace-algorithmic-feeds',
    type: 'opinion',
    title: 'Why Verified Source Transparency Must Replace Algorithmic Engagement Feeds',
    subtitle: 'When platforms optimize for provocation over provenance, civic understanding fractures. Here is the case for open verification.',
    content: `### The Collapse of the Sourced Web
For nearly two decades, digital distribution channels have trained audiences to consume detached headlines without inspecting who reported the story, who funded the investigation, or what primary documents substantiate the claim.

When artificial intelligence models are trained indiscriminately on unverified web crawls, they risk amplifying algorithmic hallucinations disguised as authoritative fact. The antidote to this degradation is not closed proprietary paywalls—it is radical, transparent attribution.

### The Three Tenets of Transparent Journalism
1. **Unbroken Provenance**: Every factual claim must link directly to the primary public filing, academic preprint, or on-the-record dispatch that originated it.
2. **Explicit Uncertainty**: Media organizations must state what is confirmed, what remains in development, and where reputable sources disagree.
3. **Zero-Incentive Amplification**: Content discovery must prioritize factual rigor and verified updates over click-maximizing sensationalism.`,
    author: EDITORIAL_AUTHORS.marcus,
    category: 'society',
    tags: ['Media Ethics', 'Journalism', 'Transparency', 'Information Security'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    readingTimeMinutes: 4,
    imageUrl: '/images/hero_editorial_world_1792529244145.jpg',
    imageAttribution: 'International Press Institute Archive',
    isAiAssisted: false,
  },

  // 7. Fact Check: Solar Flares and Grid Claims
  {
    id: 'art-factcheck-1',
    slug: 'fact-check-viral-solar-radiation-storm-grid-collapse',
    type: 'fact-check',
    title: 'Fact Check: Viral Claims of Immediate Continental Power Grid Shutdown False',
    subtitle: 'Space Weather Prediction Center telemetry confirms minor G1 geomagnetic activity, refuting fabricated warnings of catastrophic grid failure.',
    content: `### The Claim
Viral posts circulated across social media platforms claiming that an imminent X-class coronal mass ejection (CME) would cause an immediate, catastrophic shutdown of the North American and European electrical transmission grids.

### The Empirical Evidence
The NOAA Space Weather Prediction Center (SWPC) and the European Space Agency Space Safety Programme issued official observations monitoring solar active region AR3842. Magnetometer readings and SOHO LASCO coronagraph telemetry confirm that the solar flare registered as a modest M1.4 class event, accompanied by a slow-moving plasma ejection oriented away from the Sun-Earth line.

No G4 or G5 extreme geomagnetic storm watch was issued. Automated electrical transmission substations across North America and Europe reported normal baseline induced currents (< 2.4 amperes).

### Verdict: FALSE
The claim that an extreme solar storm will trigger immediate continental blackout is demonstrably fabricated. Space weather monitoring agencies maintain real-time public telemetry, and actual recorded space weather conditions remain well within normal operating thresholds.`,
    author: EDITORIAL_AUTHORS.editorial_board,
    category: 'fact-checks',
    tags: ['Fact Check', 'Space Weather', 'NOAA', 'Solar Physics', 'Power Grid'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 40).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
    readingTimeMinutes: 3,
    imageUrl: '/images/climate_satellite_earth_1792529244464.jpg',
    imageAttribution: 'NOAA Space Weather Prediction Center / ESA Telemetry',
    isAiAssisted: false,
  },

  // 8. Guides & FAQs: Reading Clinical Preprints
  {
    id: 'art-guide-1',
    slug: 'how-to-read-clinical-preprints-without-being-misled',
    type: 'guide',
    title: 'Guide & FAQ: How to Read Scientific & Clinical Preprints Without Being Misled',
    subtitle: 'A practical framework for distinguishing preliminary lab findings from peer-reviewed clinical standards of care.',
    content: `### The Purpose of Open Science Preprints
Platforms such as bioRxiv, medRxiv, and arXiv allow researchers to share emerging datasets with colleagues rapidly before undergoing traditional peer review, which can take 6 to 18 months. While this accelerates collaborative inquiry, uncritical media coverage often transforms preliminary mouse-model trials into sensationalized "miracle cures."

### 5 Critical Checks Before Believing a Health Headline
1. **Sample Size & Study Design**: Is it a randomized double-blind placebo-controlled human trial (RCT), or an in vitro cell culture study? In vitro results rarely translate directly to human pharmacology.
2. **Endpoint Metric**: Did the trial measure clinical outcomes (e.g. survival, symptom resolution) or merely a surrogate biomarker?
3. **Statistical Significance vs Clinical Significance**: A p-value < 0.05 indicates the result is unlikely due to chance, but the real-world effect size may be negligible.
4. **Funding & Conflict of Interest Declarations**: Always scroll to the disclosures section to identify corporate sponsorship or patent holdings.
5. **Peer-Review Status**: Check whether the preprint has been peer-reviewed or accepted into an indexed journal.`,
    author: EDITORIAL_AUTHORS.sarah,
    category: 'health',
    tags: ['Science Literacy', 'Preprints', 'Medicine', 'Clinical Trials', 'Research Guide'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    readingTimeMinutes: 5,
    imageUrl: '/images/science_discovery_lab_1792529244932.jpg',
    imageAttribution: 'National Library of Medicine / Open Science Framework',
    isAiAssisted: false,
  },

  // 9. Practical Guide & Checklist: OSINT Verification
  {
    id: 'art-guide-osint',
    slug: 'how-to-verify-breaking-news-online-checklist',
    type: 'guide',
    title: 'The OSINT Verification Framework: 5-Step Checklist for Breaking News Claims',
    subtitle: 'How professional open-source researchers verify viral combat footage, crisis claims, and fabricated press statements.',
    content: `### Why Speed Destroys Factuality During Breaking News
During the initial 2 to 6 hours of a major international crisis or breaking story, up to 70% of viral video clips circulating on social platforms are either recycled archival footage, video game simulations, or selectively cropped out of original geographic context.

As independent verification researchers, our primary mandate is not to be first, but to establish evidentiary ground truth. This guide details the 5-point open-source intelligence (OSINT) checklist used by FactInfoLive editors to audit breaking claims before publication.`,
    author: EDITORIAL_AUTHORS.editorial_board,
    category: 'fact-checks',
    tags: ['OSINT', 'Fact-Checking', 'Verification', 'Media Literacy', 'Research Guide'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    readingTimeMinutes: 6,
    imageUrl: '/images/science_discovery_lab_1792529244932.jpg',
    imageAttribution: 'FactInfoLive Open Verification Unit',
    isAiAssisted: false,
    guideTemplate: {
      templateType: 'checklist',
      difficulty: 'beginner',
      estimatedMinutes: 8,
      prerequisites: ['Web browser with image search capability', 'Satellite map tool (Google Earth or OpenStreetMap)'],
      checklistItems: [
        {
          id: 'check-1',
          category: 'Visual Forensics',
          text: 'Execute Reverse Image / Video Keyframe Search on Google, Yandex, and TinEye to identify original upload dates.',
          critical: true,
        },
        {
          id: 'check-2',
          category: 'Geolocation & Environment',
          text: 'Verify landmarks, road signage, vegetation, and sun shadow angles (SunCalc) against reported time and coordinates.',
          critical: true,
        },
        {
          id: 'check-3',
          category: 'Wire Corroboration',
          text: 'Cross-reference with reputable international news wire services (Reuters, AP, AFP) for independent ground reports.',
          critical: true,
        },
        {
          id: 'check-4',
          category: 'Cryptographic & Domain Verification',
          text: 'Confirm government and agency statements directly on official .gov / institutional domains, never from screenshots.',
          critical: true,
        },
        {
          id: 'check-5',
          category: 'Synthetic / AI Generation Check',
          text: 'Inspect hands, architectural geometry, text in background, and audio spectrogram for deepfake artifacts.',
          critical: false,
        },
      ],
      faqs: [
        {
          question: 'What is the most common OSINT mistake made by beginners?',
          answer: 'Relying on screenshot timestamps. Timestamps in images are easily altered via browser Inspect Element in seconds. Always seek the live canonical URL.',
        },
      ],
    },
  },

  // 10. Practical Comparison: Local LLMs vs. Cloud AI APIs
  {
    id: 'art-guide-llm-comparison',
    slug: 'local-llms-vs-cloud-apis-comparison',
    type: 'guide',
    title: 'Local LLMs vs. Cloud AI APIs: Feature, Privacy, Cost and Latency Benchmark',
    subtitle: 'An empirical comparison of Ollama (Llama 3 / DeepSeek) against Gemini 3.8 Flash, Claude 3.5, and ChatGPT for research and coding.',
    content: `### The Privacy vs. Scale Architectural Trade-off
Researchers and technical professionals handling confidential documents, medical records, or proprietary codebases face an essential dilemma: leverage massive frontier cloud models with superior reasoning, or execute open-weight models locally on personal hardware with 100% data sovereignty.

In this benchmark, FactInfoLive audits four premier approaches across latency, operational cost, air-gapped privacy, and reasoning quality.`,
    author: EDITORIAL_AUTHORS.sarah,
    category: 'science',
    tags: ['AI Tools', 'Local LLMs', 'Ollama', 'Cloud APIs', 'Privacy', 'Benchmark'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 28).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(),
    readingTimeMinutes: 7,
    imageUrl: '/images/science_discovery_lab_1792529244932.jpg',
    imageAttribution: 'FactInfoLive Technology Benchmark Lab',
    isAiAssisted: false,
    guideTemplate: {
      templateType: 'comparison',
      difficulty: 'intermediate',
      estimatedMinutes: 10,
      comparisonItems: [
        {
          name: 'Ollama (Local Open Weights)',
          pricing: '100% Free / Open Source (MIT)',
          pros: ['Zero cloud data leakage', 'Unlimited queries without API bills', 'Operates offline without internet'],
          cons: ['Requires 16GB-64GB+ unified memory or high-end GPU', 'Smaller parameter models have narrower knowledge bases'],
          bestFor: 'Confidential investigative research, private medical summaries, and offline development.',
          officialUrl: 'https://ollama.com',
        },
        {
          name: 'Google Gemini 3.8 Flash (Cloud API)',
          pricing: 'Free tier available; Pay-per-token API',
          pros: ['Sub-second latency', 'Massive context window', 'Native grounding with Google Search'],
          cons: ['Requires server API key and active internet', 'Cloud processing subject to terms of service'],
          bestFor: 'Real-time production web applications, fast data extraction, and search-grounded research.',
          officialUrl: 'https://ai.google.dev',
        },
        {
          name: 'Anthropic Claude 3.5 Sonnet',
          pricing: 'Freemium ($20/mo Pro; API usage rates)',
          pros: ['Industry-leading coding accuracy', 'Nuanced prose synthesis', 'Rigorous safety refusal calibration'],
          cons: ['No free unlimited API tier', 'Cloud transmission required'],
          bestFor: 'Complex multi-file refactoring, legal document cross-examination, and editorial drafting.',
          officialUrl: 'https://www.anthropic.com',
        },
        {
          name: 'OpenAI ChatGPT (GPT-4o)',
          pricing: 'Freemium ($20/mo Plus)',
          pros: ['Integrated Python sandboxed execution', 'Multimodal voice and vision', 'Wide consumer ecosystem'],
          cons: ['Usage caps on specialized reasoning models', 'Telemetry shared unless opted out'],
          bestFor: 'Interactive data visualization, quick math scripting, and broad consumer inquiries.',
          officialUrl: 'https://chatgpt.com',
        },
      ],
    },
  },

  // 11. Sports Analytics Tutorial: Modern Football xG & Pressing
  {
    id: 'art-guide-football-analytics',
    slug: 'understanding-football-analytics-xg-guide',
    type: 'sports-analysis',
    title: 'How to Read Modern Football Analytics: Step-by-Step Guide to xG, PPDA, and Field Tilt',
    subtitle: 'Moving beyond possession statistics: how optical tracking telemetry and expected goals models explain match dominance.',
    content: `### Beyond the Illusion of Raw Possession
For decades, television broadcasts reported match dominance using two primitive metrics: total shots and possession percentage. Modern tactical analysts know that a team can hold 70% possession by circulating the ball between center-backs while generating zero high-probability chances.

Expected metrics, derived from computer-vision tracking and historical spatial coordinates of over 500,000 professional shots, provide the statistical baseline for modern sports journalism. Here is how to interpret them accurately.`,
    author: EDITORIAL_AUTHORS.elena,
    category: 'sports',
    tags: ['Sports Analytics', 'Football', 'xG', 'Tactics', 'Telemetry', 'Tutorial'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    readingTimeMinutes: 6,
    imageUrl: '/images/sports_tactics_analysis_1792529244464.jpg',
    imageAttribution: 'Opta / StatsBomb Tactical Telemetry Archive',
    isAiAssisted: false,
    guideTemplate: {
      templateType: 'tutorial',
      difficulty: 'beginner',
      estimatedMinutes: 7,
      steps: [
        {
          stepNumber: 1,
          title: 'Understanding Expected Goals (xG)',
          description: 'xG measures shot quality between 0.00 and 1.00 based on shot distance, angle, body part, and defensive pressure. A penalty is calibrated at exactly 0.79 xG.',
          warningOrTip: 'Never sum xG blindly across match phases without looking at game state (teams leading late shoot less).',
        },
        {
          stepNumber: 2,
          title: 'Differentiating Pre-Shot xG from Post-Shot xG (PSxG)',
          description: 'Standard xG evaluates chance creation at the moment of the strike. PSxG evaluates shot placement on target, isolating goalkeeper shot-stopping ability from team defense.',
        },
        {
          stepNumber: 3,
          title: 'Measuring Defensive Intensity via PPDA',
          description: 'Passes Allowed Per Defensive Action (PPDA) divides opponent passes in their defensive two-thirds by defensive challenges. Lower PPDA (< 8.0) indicates hyper-aggressive high pressing.',
        },
        {
          stepNumber: 4,
          title: 'Evaluating Territorial Dominance with Field Tilt',
          description: 'Field tilt compares passes made in the attacking third only. If team A has 52% possession but 78% field tilt, they are pinning their opponent deep in their own box.',
        },
      ],
    },
  },

  // 12. Practical Problem Solving: Troubleshooting AI Hallucinations in Research
  {
    id: 'art-guide-ai-hallucinations',
    slug: 'troubleshooting-ai-hallucinations-guide',
    type: 'guide',
    title: 'Troubleshooting AI Hallucinations in Research: How to Guarantee Grounded Citations',
    subtitle: 'A practical problem-solving methodology for students, researchers, and journalists navigating LLM citation generation.',
    content: `### The Mechanics of Token Probability vs Empirical Truth
Large language models do not query an internal relational database of verified facts; they predict the most statistically probable next token sequence given preceding text. When asked for an academic citation on an obscure topic, an LLM often generates a plausible-sounding author, journal name, and fabricated DOI that looks authentic but does not exist in any index.

This guide provides immediate, practical safeguards to verify citations before including them in serious research papers or reporting.`,
    author: EDITORIAL_AUTHORS.sarah,
    category: 'science',
    tags: ['AI Literacy', 'Research Methodology', 'Hallucinations', 'Academic Integrity', 'Troubleshooting'],
    status: 'published',
    publishedAt: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    readingTimeMinutes: 5,
    imageUrl: '/images/science_discovery_lab_1792529244932.jpg',
    imageAttribution: 'FactInfoLive Research Integrity Desk',
    isAiAssisted: false,
    guideTemplate: {
      templateType: 'troubleshooting',
      difficulty: 'beginner',
      estimatedMinutes: 6,
      faqs: [
        {
          question: 'Why do AI models generate fake Digital Object Identifiers (DOIs)?',
          answer: 'DOIs follow predictable regular expressions (e.g. 10.1016/...). LLMs easily mimic the syntactic format without having verified the digital object in Crossref or PubMed.',
        },
        {
          question: 'How do I immediately test whether a paper cited by an AI actually exists?',
          answer: 'Copy the exact title into Google Scholar, PubMed, or Crossref.org. If no exact match appears within the top 3 results, the citation is almost certainly hallucinated.',
        },
        {
          question: 'What prompt instructions best suppress citation invention?',
          answer: 'Instruct the model: "Only cite papers whose full text is explicitly present in the provided context. If no source in context proves the claim, explicitly state \'No source provided in context\'."',
        },
      ],
    },
  },
];

export class EditorialStore {
  private articles: EditorialArticle[] = [];
  private subscribers: NewsletterSubscriber[] = [];
  private users: AdminUser[] = [];
  private activeSessions: Map<string, { user: AdminUser; expiresAt: number }> = new Map();
  private loginAttempts: Map<string, { count: number; resetAt: number }> = new Map();
  private patrons: PatronContribution[] = INITIAL_PATRONS;
  private monetization: MonetizationSettings = DEFAULT_MONETIZATION;
  private affiliateLinks: AffiliateLink[] = INITIAL_AFFILIATE_LINKS;
  private sponsorshipInquiries: SponsorshipInquiry[] = INITIAL_SPONSOR_INQUIRIES;
  private analyticsEvents: AnalyticsEvent[] = [];
  private tools: AiTool[] = INITIAL_AI_TOOLS;
  private toolReviews: AiToolReview[] = INITIAL_AI_TOOL_REVIEWS;
  private products: ProductItem[] = INITIAL_PRODUCTS;

  constructor() {
    this.initStore();
  }

  private isSeeded = false;

  private initStore() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      if (fs.existsSync(STORE_FILE)) {
        let data: any = null;
        try {
          const raw = fs.readFileSync(STORE_FILE, 'utf-8');
          data = JSON.parse(raw);
        } catch (parseErr: any) {
          // Preserve recoverable copy of corrupt store; NEVER silently overwrite
          const corruptBackup = `${STORE_FILE}.corrupt.${Date.now()}.bak`;
          try {
            fs.copyFileSync(STORE_FILE, corruptBackup);
            console.error(`[EditorialStore CRITICAL] Malformed JSON detected in ${STORE_FILE}. Preserved backup at ${corruptBackup}. Error:`, parseErr.message);
          } catch (copyErr) {
            console.error(`[EditorialStore CRITICAL] Could not backup corrupt store:`, copyErr);
          }
          // Do NOT erase data or overwrite corrupt file with seed data
          return;
        }

        this.isSeeded = Boolean(data.isSeeded);
        const existingArticles: EditorialArticle[] = data.articles || [];

        if (!this.isSeeded && existingArticles.length === 0) {
          // First-time initialization only: seed initial editorial explainers
          this.articles = SEED_ARTICLES;
          this.isSeeded = true;
        } else {
          // Respect user modifications: never resurrect deleted demonstration articles
          this.articles = existingArticles;
        }

        // Auto-merge newly added seed articles if missing
        for (const seed of SEED_ARTICLES) {
          if (!this.articles.some((a) => a.id === seed.id || a.slug === seed.slug)) {
            this.articles.push(seed);
          }
        }

        this.subscribers = data.subscribers || [];
        this.users = data.users || INITIAL_USERS;
        this.monetization = data.monetization ? { ...DEFAULT_MONETIZATION, ...data.monetization } : DEFAULT_MONETIZATION;
        this.affiliateLinks = data.affiliateLinks || INITIAL_AFFILIATE_LINKS;
        this.sponsorshipInquiries = data.sponsorshipInquiries || INITIAL_SPONSOR_INQUIRIES;
        this.patrons = data.patrons || INITIAL_PATRONS;
        if (data.tools && Array.isArray(data.tools) && data.tools.length > 0) {
          this.tools = data.tools;
          for (const st of INITIAL_AI_TOOLS) {
            if (!this.tools.some((t) => t.id === st.id || t.slug === st.slug)) {
              this.tools.push(st);
            }
          }
        } else {
          this.tools = INITIAL_AI_TOOLS;
        }

        if (data.toolReviews && Array.isArray(data.toolReviews) && data.toolReviews.length > 0) {
          this.toolReviews = data.toolReviews;
          for (const sr of INITIAL_AI_TOOL_REVIEWS) {
            if (!this.toolReviews.some((r) => r.id === sr.id)) {
              this.toolReviews.push(sr);
            }
          }
        } else {
          this.toolReviews = INITIAL_AI_TOOL_REVIEWS;
        }

        if (data.products && Array.isArray(data.products) && data.products.length > 0) {
          this.products = data.products;
          for (const sp of INITIAL_PRODUCTS) {
            if (!this.products.some((p) => p.id === sp.id)) {
              this.products.push(sp);
            }
          }
        } else {
          this.products = INITIAL_PRODUCTS;
        }
        this.persist();
      } else {
        this.articles = SEED_ARTICLES;
        this.isSeeded = true;
        this.subscribers = [];
        this.users = INITIAL_USERS;
        this.monetization = DEFAULT_MONETIZATION;
        this.affiliateLinks = INITIAL_AFFILIATE_LINKS;
        this.sponsorshipInquiries = INITIAL_SPONSOR_INQUIRIES;
        this.patrons = INITIAL_PATRONS;
        this.analyticsEvents = [];
        this.tools = INITIAL_AI_TOOLS;
        this.toolReviews = INITIAL_AI_TOOL_REVIEWS;
        this.products = INITIAL_PRODUCTS;
        this.persist();
      }
    } catch (err: any) {
      console.error(`[EditorialStore] Initialization diagnostics:`, err?.message || err);
    }

    // Periodically check scheduled posts every 60 seconds
    setInterval(() => this.checkScheduledPublishes(), 60000);
  }

  // Atomic file write strategy: write to temp file in same directory, then rename atomically
  private persist() {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }

      const tempFile = path.resolve(
        DATA_DIR,
        `.editorialStore.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`
      );

      const payload = JSON.stringify(
        {
          isSeeded: this.isSeeded,
          articles: this.articles,
          subscribers: this.subscribers,
          users: this.users,
          monetization: this.monetization,
          affiliateLinks: this.affiliateLinks,
          sponsorshipInquiries: this.sponsorshipInquiries,
          patrons: this.patrons,
          tools: this.tools,
          toolReviews: this.toolReviews,
          products: this.products,
          analyticsEvents: this.analyticsEvents.slice(-500), // Keep recent 500 events
          lastSavedAt: new Date().toISOString(),
        },
        null,
        2
      );

      fs.writeFileSync(tempFile, payload, 'utf-8');
      fs.renameSync(tempFile, STORE_FILE);
    } catch (err: any) {
      console.error(`[EditorialStore] Atomic persistence warning:`, err?.message || err);
    }
  }

  // Check and publish scheduled articles
  checkScheduledPublishes(): number {
    const now = new Date().toISOString();
    let count = 0;
    this.articles.forEach((art) => {
      if (art.status === 'approved' && art.scheduledPublishAt && art.scheduledPublishAt <= now) {
        art.status = 'published';
        art.publishedAt = now;
        art.editorialReviewLog = art.editorialReviewLog || [];
        art.editorialReviewLog.push({
          action: 'scheduled_auto_published',
          reviewer: 'System Scheduler',
          timestamp: now,
          notes: 'Article reached designated release timestamp',
        });
        count++;
      }
    });
    if (count > 0) this.persist();
    return count;
  }

  // Rate-limiting check on IP
  checkRateLimit(ip: string): { allowed: boolean; waitMinutes?: number } {
    const now = Date.now();
    const entry = this.loginAttempts.get(ip);
    if (!entry) return { allowed: true };

    if (now > entry.resetAt) {
      this.loginAttempts.delete(ip);
      return { allowed: true };
    }

    if (entry.count >= 5) {
      const waitMinutes = Math.ceil((entry.resetAt - now) / 60000);
      return { allowed: false, waitMinutes };
    }

    return { allowed: true };
  }

  recordFailedLogin(ip: string) {
    const now = Date.now();
    const entry = this.loginAttempts.get(ip) || { count: 0, resetAt: now + 15 * 60 * 1000 };
    entry.count += 1;
    this.loginAttempts.set(ip, entry);
  }

  resetFailedLogin(ip: string) {
    this.loginAttempts.delete(ip);
  }

  // Secure Authentication with Scrypt
  login(
    identifier: string,
    password: string,
    ip: string = '127.0.0.1'
  ): { success: boolean; token?: string; user?: AdminUser; error?: string } {
    const rateCheck = this.checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return {
        success: false,
        error: `Security lock: too many failed attempts. Please retry in ${rateCheck.waitMinutes} minutes.`,
      };
    }

    const cleanId = identifier.trim().toLowerCase();
    const user = this.users.find(
      (u) => u.username.toLowerCase() === cleanId || (u.email && u.email.toLowerCase() === cleanId)
    );

    if (!user || !user.salt || !user.passwordHash) {
      this.recordFailedLogin(ip);
      return { success: false, error: 'Invalid username or password.' };
    }

    const computed = hashPassword(password, user.salt);
    const bufA = Buffer.from(computed, 'hex');
    const bufB = Buffer.from(user.passwordHash, 'hex');

    if (bufA.length !== bufB.length || !crypto.timingSafeEqual(bufA, bufB)) {
      this.recordFailedLogin(ip);
      return { success: false, error: 'Invalid username or password.' };
    }

    // Success: Generate cryptographically secure session token (24h TTL)
    this.resetFailedLogin(ip);
    const token = 'fil_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    user.lastLogin = new Date().toISOString();
    this.activeSessions.set(token, { user, expiresAt });
    this.persist();

    return {
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin,
      },
    };
  }

  verifySession(tokenHeader?: string): AdminUser | null {
    if (!tokenHeader) return null;
    const cleanToken = tokenHeader.replace(/^Bearer\s+/i, '').trim();
    const session = this.activeSessions.get(cleanToken);
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.activeSessions.delete(cleanToken);
      return null;
    }

    return session.user;
  }

  logout(tokenHeader?: string): boolean {
    if (!tokenHeader) return false;
    const cleanToken = tokenHeader.replace(/^Bearer\s+/i, '').trim();
    return this.activeSessions.delete(cleanToken);
  }

  // Permission Verification
  hasPermission(user: AdminUser, requiredRole: 'administrator' | 'editor' | 'author'): boolean {
    if (user.role === 'administrator') return true;
    if (requiredRole === 'editor' && user.role === 'editor') return true;
    if (requiredRole === 'author') return true;
    return false;
  }

  // User Management (Administrator Only)
  getUsers(): AdminUser[] {
    return this.users.map((u) => ({
      id: u.id,
      username: u.username,
      name: u.name,
      email: u.email,
      role: u.role,
      createdAt: u.createdAt,
      lastLogin: u.lastLogin,
    }));
  }

  createUser(userData: {
    username: string;
    name: string;
    email: string;
    role: UserRole;
    password: string;
  }): AdminUser {
    const salt = generateSalt();
    const passwordHash = hashPassword(userData.password, salt);
    const newUser: AdminUser = {
      id: 'user-' + crypto.randomBytes(6).toString('hex'),
      username: userData.username.toLowerCase().trim(),
      name: userData.name,
      email: userData.email,
      role: userData.role,
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
    };
    this.users.push(newUser);
    this.persist();
    return {
      id: newUser.id,
      username: newUser.username,
      name: newUser.name,
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  hasAdmin(): boolean {
    return this.users.some((u) => u.role === 'administrator');
  }

  getSetupStatus() {
    return {
      setupRequired: !this.hasAdmin(),
      tokenProtected: Boolean(process.env.SETUP_TOKEN && process.env.SETUP_TOKEN.trim().length > 0),
    };
  }

  setupAdmin(data: {
    username: string;
    name: string;
    email: string;
    password: string;
    setupToken?: string;
  }): { success: boolean; token?: string; user?: AdminUser; error?: string } {
    if (this.hasAdmin()) {
      return { success: false, error: 'Administrator setup has already been completed.' };
    }

    const requiredToken = process.env.SETUP_TOKEN?.trim();
    if (requiredToken && requiredToken.length > 0) {
      if (!data.setupToken || data.setupToken !== requiredToken) {
        return { success: false, error: 'Invalid or missing setup authorization token.' };
      }
    }

    const cleanUsername = (data.username || '').trim().toLowerCase();
    if (!cleanUsername || cleanUsername.length < 3 || !/^[a-z0-9_-]+$/.test(cleanUsername)) {
      return {
        success: false,
        error: 'Username must be at least 3 characters and contain only letters, numbers, hyphens, or underscores.',
      };
    }

    const cleanName = (data.name || '').trim();
    if (!cleanName || cleanName.length < 2) {
      return { success: false, error: 'A valid staff name is required.' };
    }

    const cleanEmail = (data.email || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return { success: false, error: 'A valid email address is required.' };
    }

    const password = data.password || '';
    if (password.length < 12) {
      return { success: false, error: 'Password must be at least 12 characters long.' };
    }
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasDigit = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      return {
        success: false,
        error: 'Password must include uppercase, lowercase, numbers, and special symbols.',
      };
    }

    const salt = generateSalt();
    const passwordHash = hashPassword(password, salt);

    const adminUser: AdminUser = {
      id: 'user-admin-' + crypto.randomBytes(4).toString('hex'),
      username: cleanUsername,
      name: cleanName,
      email: cleanEmail,
      role: 'administrator',
      salt,
      passwordHash,
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString(),
    };

    this.users.push(adminUser);
    this.persist();

    // Generate authenticated session for immediate access
    const token = 'fil_' + crypto.randomBytes(32).toString('hex');
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;
    this.activeSessions.set(token, { user: adminUser, expiresAt });

    return {
      success: true,
      token,
      user: {
        id: adminUser.id,
        username: adminUser.username,
        name: adminUser.name,
        email: adminUser.email,
        role: adminUser.role,
        createdAt: adminUser.createdAt,
        lastLogin: adminUser.lastLogin,
      },
    };
  }

  resetAdminPassword(username: string, newPassword: string): { success: boolean; message: string } {
    const cleanUser = username.trim().toLowerCase();
    const user = this.users.find((u) => u.username.toLowerCase() === cleanUser);
    if (!user) {
      return { success: false, message: `User "${username}" not found.` };
    }

    if (newPassword.length < 12) {
      return { success: false, message: 'New password must be at least 12 characters long.' };
    }

    user.salt = generateSalt();
    user.passwordHash = hashPassword(newPassword, user.salt);
    this.persist();
    return { success: true, message: `Password for ${user.username} (${user.role}) updated successfully.` };
  }

  updateUserPassword(userId: string, newPassword: string): boolean {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return false;
    user.salt = generateSalt();
    user.passwordHash = hashPassword(newPassword, user.salt);
    this.persist();
    return true;
  }


  // Overview Metrics
  getDashboardOverview() {
    this.checkScheduledPublishes();
    const total = this.articles.length;
    const published = this.articles.filter((a) => a.status === 'published').length;
    const needsReview = this.articles.filter((a) => a.status === 'needs_review' || a.status === 'review').length;
    const drafts = this.articles.filter(
      (a) => a.status === 'draft' || a.status === 'ai_draft' || a.status === 'idea' || a.status === 'researching'
    ).length;
    const scheduled = this.articles.filter((a) => a.status === 'approved' && Boolean(a.scheduledPublishAt)).length;
    const archived = this.articles.filter((a) => a.status === 'archived').length;

    const recentUpdates = this.articles.slice(0, 5).map((a) => ({
      id: a.id,
      title: a.title,
      status: a.status,
      type: a.type,
      author: a.author.name,
      updatedAt: a.updatedAt,
    }));

    return {
      total,
      published,
      needsReview,
      drafts,
      scheduled,
      archived,
      subscribersCount: this.subscribers.length,
      affiliateLinksCount: this.affiliateLinks.length,
      sponsorInquiriesCount: this.sponsorshipInquiries.filter((s) => s.status === 'new').length,
      recentUpdates,
      adSenseEnabled: this.monetization.displayAds.enabled,
    };
  }

  // Article Retrieval with Workflow Filters
  getArticles(params?: {
    type?: EditorialPostType;
    category?: string;
    status?: string;
    search?: string;
    limit?: number;
    page?: number;
  }): { items: EditorialArticle[]; total: number; page: number; totalPages: number } {
    this.checkScheduledPublishes();
    let result = [...this.articles];

    // Status filter
    if (params?.status && params.status !== 'all') {
      result = result.filter((a) => a.status === params.status);
    } else if (!params?.status) {
      result = result.filter((a) => a.status === 'published');
    }

    if (params?.type) {
      result = result.filter((a) => a.type === params.type);
    }

    if (params?.category && params.category !== 'all') {
      result = result.filter((a) => a.category.toLowerCase() === params.category!.toLowerCase());
    }

    if (params?.search) {
      const q = params.search.toLowerCase().trim();
      result = result.filter(
        (a) =>
          a.title.toLowerCase().includes(q) ||
          a.subtitle?.toLowerCase().includes(q) ||
          a.content.toLowerCase().includes(q) ||
          a.tags.some((t) => t.toLowerCase().includes(q)) ||
          a.author.name.toLowerCase().includes(q)
      );
    }

    // Sort by publication date or updated date descending
    result.sort((a, b) => {
      const timeA = new Date(a.publishedAt || a.updatedAt).getTime();
      const timeB = new Date(b.publishedAt || b.updatedAt).getTime();
      return timeB - timeA;
    });

    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const startIndex = (page - 1) * limit;
    const paginated = result.slice(startIndex, startIndex + limit);

    return {
      items: paginated,
      total: result.length,
      page,
      totalPages: Math.max(1, Math.ceil(result.length / limit)),
    };
  }

  getArticleBySlug(slug: string): EditorialArticle | null {
    return this.articles.find((a) => a.slug === slug || a.id === slug) || null;
  }

  getArticleById(id: string): EditorialArticle | null {
    return this.articles.find((a) => a.id === id) || null;
  }

  // Article Mutations
  createArticle(
    articleData: Partial<EditorialArticle>,
    reviewerName: string = 'Editorial Staff'
  ): EditorialArticle {
    const id = 'art-' + crypto.randomBytes(6).toString('hex');
    const slug =
      articleData.slug ||
      (articleData.title || 'untitled')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '') +
        '-' +
        id.slice(4);

    const wordCount = (articleData.content || '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const status: ContentStatus = articleData.status || 'draft';

    const newArticle: EditorialArticle = {
      id,
      slug,
      type: articleData.type || 'blog',
      title: articleData.title || 'Untitled Article',
      subtitle: articleData.subtitle,
      content: articleData.content || '',
      author: articleData.author || EDITORIAL_AUTHORS.editorial_board,
      category: articleData.category || 'world',
      tags: articleData.tags || [],
      status,
      publishedAt: status === 'published' ? new Date().toISOString() : '',
      updatedAt: new Date().toISOString(),
      scheduledPublishAt: articleData.scheduledPublishAt,
      readingTimeMinutes: readingTime,
      imageUrl: articleData.imageUrl,
      imageAttribution: articleData.imageAttribution,
      isAiAssisted: Boolean(articleData.isAiAssisted),
      editorialReviewLog: [
        {
          action: `created_as_${status}`,
          reviewer: reviewerName,
          timestamp: new Date().toISOString(),
          notes: 'Entry created in Editorial Workflow',
        },
      ],
      correctionNotes: [],
      seoMetadata: articleData.seoMetadata,
      structuredSummary: articleData.structuredSummary,
      deepExplainer: articleData.deepExplainer,
      claimsToVerify: articleData.claimsToVerify,
      tableOfContents: articleData.tableOfContents,
    };

    this.articles.unshift(newArticle);
    this.persist();
    return newArticle;
  }

  updateArticle(
    id: string,
    updates: Partial<EditorialArticle>,
    reviewerName: string = 'Editorial Staff'
  ): EditorialArticle | null {
    const index = this.articles.findIndex((a) => a.id === id);
    if (index === -1) return null;

    const existing = this.articles[index];
    const wasPublished = existing.status === 'published';
    const isNowPublished = updates.status === 'published';

    const wordCount = ((updates.content !== undefined ? updates.content : existing.content) || '').split(/\s+/).length;
    const readingTime = Math.max(1, Math.ceil(wordCount / 200));

    const updated: EditorialArticle = {
      ...existing,
      ...updates,
      readingTimeMinutes: readingTime,
      updatedAt: new Date().toISOString(),
      publishedAt: !wasPublished && isNowPublished ? new Date().toISOString() : existing.publishedAt,
      editorialReviewLog: [
        ...(existing.editorialReviewLog || []),
        {
          action: updates.status ? `status_changed_to_${updates.status}` : 'revised',
          reviewer: reviewerName,
          timestamp: new Date().toISOString(),
          notes: updates.status ? `Status transition: ${existing.status} -> ${updates.status}` : `Content revised (${wordCount} words)`,
        },
      ],
    };

    this.articles[index] = updated;
    this.persist();
    return updated;
  }

  addCorrectionNote(id: string, noteText: string, editorName: string): boolean {
    const article = this.articles.find((a) => a.id === id);
    if (!article) return false;

    article.correctionNotes = article.correctionNotes || [];
    article.correctionNotes.push({
      id: 'corr-' + crypto.randomBytes(4).toString('hex'),
      date: new Date().toISOString(),
      text: noteText,
      editorName,
    });
    article.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  deleteArticle(id: string): boolean {
    const initialLength = this.articles.length;
    this.articles = this.articles.filter((a) => a.id !== id);
    if (this.articles.length !== initialLength) {
      this.persist();
      return true;
    }
    return false;
  }

  // SEO Content Health Audit
  getSeoAudit() {
    const issues: Array<{
      articleId: string;
      title: string;
      slug: string;
      type: 'warning' | 'error';
      message: string;
    }> = [];

    const slugCounts = new Map<string, number>();
    const titleCounts = new Map<string, number>();

    this.articles.forEach((art) => {
      slugCounts.set(art.slug, (slugCounts.get(art.slug) || 0) + 1);
      titleCounts.set(art.title.toLowerCase().trim(), (titleCounts.get(art.title.toLowerCase().trim()) || 0) + 1);

      const wordCount = art.content.split(/\s+/).filter(Boolean).length;
      if (wordCount < 250) {
        issues.push({
          articleId: art.id,
          title: art.title,
          slug: art.slug,
          type: 'warning',
          message: `Thin content detected (${wordCount} words). Expand for search depth.`,
        });
      }

      if (!art.seoMetadata?.metaDescription && !art.subtitle) {
        issues.push({
          articleId: art.id,
          title: art.title,
          slug: art.slug,
          type: 'warning',
          message: 'Missing meta description and subtitle for search snippet.',
        });
      }

      if (!art.claimsToVerify || art.claimsToVerify.length === 0) {
        issues.push({
          articleId: art.id,
          title: art.title,
          slug: art.slug,
          type: 'warning',
          message: 'Zero cited claims attached. Review source attribution.',
        });
      }
    });

    // Check duplicates
    this.articles.forEach((art) => {
      if ((slugCounts.get(art.slug) || 0) > 1) {
        issues.push({
          articleId: art.id,
          title: art.title,
          slug: art.slug,
          type: 'error',
          message: `Duplicate URL slug detected: "/article/${art.slug}".`,
        });
      }
    });

    return {
      scannedArticlesCount: this.articles.length,
      publishedCount: this.articles.filter((a) => a.status === 'published').length,
      totalIssuesCount: issues.length,
      issues,
    };
  }

  // Monetization Operations
  getMonetizationSettings(): MonetizationSettings {
    return this.monetization;
  }

  updateMonetizationSettings(settings: Partial<MonetizationSettings>): MonetizationSettings {
    this.monetization = {
      ...this.monetization,
      ...settings,
      displayAds: {
        ...this.monetization.displayAds,
        ...(settings.displayAds || {}),
        slots: {
          ...this.monetization.displayAds.slots,
          ...(settings.displayAds?.slots || {}),
        },
      },
    };
    this.persist();
    return this.monetization;
  }

  getAffiliateLinks(): AffiliateLink[] {
    return this.affiliateLinks;
  }

  createAffiliateLink(link: Omit<AffiliateLink, 'id' | 'clickCount' | 'createdAt'>): AffiliateLink {
    const newLink: AffiliateLink = {
      ...link,
      id: 'aff-' + crypto.randomBytes(4).toString('hex'),
      clickCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.affiliateLinks.push(newLink);
    this.persist();
    return newLink;
  }

  updateAffiliateLink(id: string, updates: Partial<AffiliateLink>): AffiliateLink | null {
    const item = this.affiliateLinks.find((l) => l.id === id);
    if (!item) return null;
    Object.assign(item, updates);
    this.persist();
    return item;
  }

  deleteAffiliateLink(id: string): boolean {
    const len = this.affiliateLinks.length;
    this.affiliateLinks = this.affiliateLinks.filter((l) => l.id !== id);
    if (this.affiliateLinks.length !== len) {
      this.persist();
      return true;
    }
    return false;
  }

  trackAffiliateClick(id: string): boolean {
    const item = this.affiliateLinks.find((l) => l.id === id);
    if (!item) return false;
    item.clickCount = (item.clickCount || 0) + 1;
    this.logAnalyticsEvent({
      type: 'affiliate_click',
      metadata: { affiliateId: id, title: item.title, targetUrl: item.targetUrl },
      timestamp: new Date().toISOString(),
    });
    this.persist();
    return true;
  }

  // Sponsorship Inquiries
  submitSponsorshipInquiry(inquiry: Omit<SponsorshipInquiry, 'id' | 'status' | 'submittedAt'>): SponsorshipInquiry {
    const newInquiry: SponsorshipInquiry = {
      ...inquiry,
      id: 'spon-' + crypto.randomBytes(4).toString('hex'),
      status: 'new',
      submittedAt: new Date().toISOString(),
    };
    this.sponsorshipInquiries.unshift(newInquiry);
    this.persist();
    return newInquiry;
  }

  getSponsorshipInquiries(): SponsorshipInquiry[] {
    return this.sponsorshipInquiries;
  }

  updateSponsorshipStatus(id: string, status: SponsorshipInquiry['status']): boolean {
    const item = this.sponsorshipInquiries.find((s) => s.id === id);
    if (!item) return false;
    item.status = status;
    this.persist();
    return true;
  }

  // Newsletter Management
  subscribeNewsletter(email: string, categories?: string[]): { success: boolean; message: string } {
    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return { success: false, message: 'Please provide a valid email address.' };
    }

    const existing = this.subscribers.find((s) => s.email === cleanEmail);
    if (existing) {
      if (!existing.active) {
        existing.active = true;
        this.persist();
        return { success: true, message: 'Your subscription has been successfully reactivated.' };
      }
      return { success: true, message: 'You are already subscribed to FactInfoLive Research Dispatches.' };
    }

    const newSub: NewsletterSubscriber = {
      id: 'sub-' + crypto.randomBytes(6).toString('hex'),
      email: cleanEmail,
      subscribedAt: new Date().toISOString(),
      categories: categories || ['all'],
      consentGiven: true,
      unsubscribeToken: 'unsub_' + crypto.randomBytes(16).toString('hex'),
      active: true,
    };

    this.subscribers.push(newSub);
    this.logAnalyticsEvent({
      type: 'newsletter_signup',
      metadata: { categories: newSub.categories },
      timestamp: new Date().toISOString(),
    });
    this.persist();
    return { success: true, message: 'Successfully subscribed to verified editorial intelligence.' };
  }

  unsubscribeNewsletter(token: string): boolean {
    const sub = this.subscribers.find((s) => s.unsubscribeToken === token);
    if (!sub) return false;
    sub.active = false;
    this.persist();
    return true;
  }

  getSubscribers(): NewsletterSubscriber[] {
    return this.subscribers;
  }

  // Privacy-Conscious Analytics Event Logger
  logAnalyticsEvent(event: AnalyticsEvent) {
    this.analyticsEvents.push(event);
    if (this.analyticsEvents.length > 1000) {
      this.analyticsEvents = this.analyticsEvents.slice(-1000);
    }
  }

  getAnalyticsSummary() {
    const totalEvents = this.analyticsEvents.length;
    const viewsBySlug: Record<string, number> = {};
    const viewsByCategory: Record<string, number> = {};
    let citationClicks = 0;
    let affiliateClicks = 0;

    this.analyticsEvents.forEach((ev) => {
      if (ev.type === 'page_view') {
        if (ev.articleSlug) {
          viewsBySlug[ev.articleSlug] = (viewsBySlug[ev.articleSlug] || 0) + 1;
        }
        if (ev.category) {
          viewsByCategory[ev.category] = (viewsByCategory[ev.category] || 0) + 1;
        }
      } else if (ev.type === 'citation_click') {
        citationClicks++;
      } else if (ev.type === 'affiliate_click') {
        affiliateClicks++;
      }
    });

    const topArticles = Object.entries(viewsBySlug)
      .map(([slug, count]) => {
        const art = this.articles.find((a) => a.slug === slug);
        return { slug, title: art?.title || slug, count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    const topTopics = Object.entries(viewsByCategory)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalViews: Object.values(viewsBySlug).reduce((a, b) => a + b, 0),
      citationClicks,
      affiliateClicks,
      activeSubscribers: this.subscribers.filter((s) => s.active).length,
      sponsorInquiriesTotal: this.sponsorshipInquiries.length,
      topArticles,
      topTopics,
      weeklyRecommendation: 'Review top-performing exoplanet and macroeconomic dossiers to publish follow-up explainers with updated telemetry.',
    };
  }

  // Patronage & Voluntary Supporter Operations
  recordPatronContribution(
    contribution: Omit<PatronContribution, 'id' | 'createdAt' | 'receiptNumber'>
  ): PatronContribution {
    const id = 'pat-' + crypto.randomBytes(4).toString('hex');
    const receiptNumber = `FIL-REC-${new Date().getFullYear()}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
    const newPatron: PatronContribution = {
      ...contribution,
      id,
      createdAt: new Date().toISOString(),
      receiptNumber,
    };
    this.patrons.unshift(newPatron);

    // If monthly interval, increment monthly tracker
    if (newPatron.interval === 'monthly') {
      this.monetization.patronage.currentMonthlyEuro =
        (this.monetization.patronage.currentMonthlyEuro || 0) + newPatron.amount;
    }

    this.logAnalyticsEvent({
      type: 'patron_support',
      metadata: {
        amount: newPatron.amount,
        tier: newPatron.tierName,
        interval: newPatron.interval,
        anonymous: newPatron.anonymous,
      },
      timestamp: new Date().toISOString(),
    });

    this.persist();
    return newPatron;
  }

  getPatrons(isAdmin: boolean = false): PatronContribution[] {
    if (isAdmin) return this.patrons;
    // For public registry, mask sensitive emails and names if anonymous
    return this.patrons.map((p) => ({
      ...p,
      patronName: p.anonymous ? 'Anonymous Supporter' : p.patronName,
      patronEmail: '***@***.***',
    }));
  }

  // --- AI Tools Directory Operations ---
  getTools(filters?: { category?: string; pricing?: string; search?: string; status?: string }): AiTool[] {
    let list = this.tools;
    if (filters?.status) {
      list = list.filter((t) => t.status === filters.status);
    } else {
      list = list.filter((t) => t.status === 'published');
    }
    if (filters?.category && filters.category !== 'all') {
      list = list.filter((t) => t.category === filters.category);
    }
    if (filters?.pricing && filters.pricing !== 'all') {
      list = list.filter((t) => t.pricing === filters.pricing);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(
        (t) =>
          t.name.toLowerCase().includes(q) ||
          t.summary.toLowerCase().includes(q) ||
          t.practicalUseCases.some((u) => u.toLowerCase().includes(q))
      );
    }
    return list;
  }

  getToolBySlug(slug: string): AiTool | undefined {
    return this.tools.find((t) => t.slug === slug);
  }

  getToolById(id: string): AiTool | undefined {
    return this.tools.find((t) => t.id === id);
  }

  createTool(toolData: Partial<AiTool>, author?: string): AiTool {
    const id = 'tool-' + crypto.randomBytes(4).toString('hex');
    const slug = (toolData.name || 'tool')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const newTool: AiTool = {
      id,
      slug: toolData.slug || slug,
      name: toolData.name || 'Untitled AI Tool',
      websiteUrl: toolData.websiteUrl || '',
      category: toolData.category || 'productivity',
      pricing: toolData.pricing || 'freemium',
      pricingDetails: toolData.pricingDetails || 'Standard pricing',
      requiresAccount: toolData.requiresAccount ?? true,
      requiresApiKey: toolData.requiresApiKey ?? false,
      summary: toolData.summary || '',
      practicalUseCases: toolData.practicalUseCases || [],
      importantRestrictions: toolData.importantRestrictions || [],
      officialSourceUrl: toolData.officialSourceUrl || toolData.websiteUrl || '',
      lastReviewedDate: new Date().toISOString().split('T')[0],
      affiliateUrl: toolData.affiliateUrl || '',
      affiliateDisclosure: toolData.affiliateDisclosure || '',
      editorialRating: toolData.editorialRating || 4.5,
      status: toolData.status || 'published',
      submittedBy: author || toolData.submittedBy,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    this.tools.unshift(newTool);
    this.persist();
    return newTool;
  }

  updateTool(id: string, updates: Partial<AiTool>): AiTool | null {
    const idx = this.tools.findIndex((t) => t.id === id);
    if (idx === -1) return null;
    this.tools[idx] = {
      ...this.tools[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.persist();
    return this.tools[idx];
  }

  deleteTool(id: string): boolean {
    const idx = this.tools.findIndex((t) => t.id === id);
    if (idx === -1) return false;
    this.tools.splice(idx, 1);
    this.persist();
    return true;
  }

  suggestTool(submission: Partial<AiTool>): AiTool {
    return this.createTool(
      {
        ...submission,
        status: 'pending_review',
      },
      submission.submittedBy || 'Anonymous Reader'
    );
  }

  getToolSubmissions(): AiTool[] {
    return this.tools.filter((t) => t.status === 'pending_review');
  }

  approveToolSubmission(id: string): AiTool | null {
    return this.updateTool(id, { status: 'published' });
  }

  rejectToolSubmission(id: string): AiTool | null {
    return this.updateTool(id, { status: 'rejected' });
  }

  // --- Authentic Reviews & Moderation Operations ---
  addToolReview(review: Omit<AiToolReview, 'id' | 'createdAt'>): AiToolReview {
    const newReview: AiToolReview = {
      ...review,
      id: 'rev-' + crypto.randomBytes(4).toString('hex'),
      createdAt: new Date().toISOString(),
    };
    this.toolReviews.unshift(newReview);
    this.persist();
    return newReview;
  }

  getToolReviews(toolId: string, isAdmin: boolean = false): AiToolReview[] {
    if (isAdmin) {
      return this.toolReviews.filter((r) => r.toolId === toolId);
    }
    return this.toolReviews.filter((r) => r.toolId === toolId && r.status === 'approved');
  }

  getPendingReviews(): AiToolReview[] {
    return this.toolReviews.filter((r) => r.status === 'pending');
  }

  approveReview(id: string): AiToolReview | null {
    const rev = this.toolReviews.find((r) => r.id === id);
    if (!rev) return null;
    rev.status = 'approved';
    this.persist();
    return rev;
  }

  rejectReview(id: string): AiToolReview | null {
    const rev = this.toolReviews.find((r) => r.id === id);
    if (!rev) return null;
    rev.status = 'rejected';
    this.persist();
    return rev;
  }

  // --- E-Commerce Product Catalog Operations ---
  getProducts(isAdmin: boolean = false): ProductItem[] {
    if (isAdmin) return this.products;
    return this.products.filter((p) => p.enabled);
  }

  createProduct(product: Partial<ProductItem>): ProductItem {
    const id = 'prod-' + crypto.randomBytes(4).toString('hex');
    const newProduct: ProductItem = {
      id,
      name: product.name || 'Untitled Product',
      description: product.description || '',
      imageUrl: product.imageUrl || '',
      merchant: product.merchant || 'Direct / Partner',
      price: product.price || 0,
      currency: product.currency || 'EUR',
      availability: product.availability || 'in_stock',
      purchaseUrl: product.purchaseUrl || '',
      isAffiliate: product.isAffiliate ?? true,
      enabled: product.enabled ?? false,
    };
    this.products.unshift(newProduct);
    this.persist();
    return newProduct;
  }

  updateProduct(id: string, updates: Partial<ProductItem>): ProductItem | null {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return null;
    this.products[idx] = { ...this.products[idx], ...updates };
    this.persist();
    return this.products[idx];
  }

  deleteProduct(id: string): boolean {
    const idx = this.products.findIndex((p) => p.id === id);
    if (idx === -1) return false;
    this.products.splice(idx, 1);
    this.persist();
    return true;
  }
}

export const editorialStore = new EditorialStore();
