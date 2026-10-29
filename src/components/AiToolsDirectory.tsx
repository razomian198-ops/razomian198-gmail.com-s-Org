import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Search,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Key,
  UserCheck,
  Star,
  CheckCircle2,
  Filter,
  PlusCircle,
  Clock,
  Send,
  Loader2,
  X,
  MessageSquareQuote,
  ChevronRight,
  Info
} from 'lucide-react';
import {
  AiTool,
  AiToolCategory,
  AiToolPricing,
  AiToolReview
} from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface AiToolsDirectoryProps {
  currentLanguage: SupportedLanguage;
  onOpenArticleBySlug?: (slug: string) => void;
  onBackToHome?: () => void;
  initialToolSlug?: string | null;
}

const CATEGORIES: { id: AiToolCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All Categories' },
  { id: 'research', label: 'Research & Fact-Checking' },
  { id: 'coding', label: 'Coding & Development' },
  { id: 'writing', label: 'Writing & Analysis' },
  { id: 'productivity', label: 'Productivity & Speech' },
  { id: 'image-editing', label: 'Image & Media' },
  { id: 'education', label: 'Education & Models' },
  { id: 'automation', label: 'Local & Automation' },
];

const PRICING_OPTIONS: { id: AiToolPricing | 'all'; label: string }[] = [
  { id: 'all', label: 'All Pricing' },
  { id: 'free', label: '100% Free / Open Source' },
  { id: 'freemium', label: 'Freemium (Free Tier Available)' },
  { id: 'trial', label: 'Free Trial' },
  { id: 'paid', label: 'Paid / Subscription Only' },
];

export const AiToolsDirectory: React.FC<AiToolsDirectoryProps> = ({
  currentLanguage,
  initialToolSlug,
  onBackToHome,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [tools, setTools] = useState<AiTool[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPricing, setSelectedPricing] = useState<string>('all');
  const [selectedTool, setSelectedTool] = useState<AiTool | null>(null);
  const [reviews, setReviews] = useState<AiToolReview[]>([]);
  const [loadingReviews, setLoadingReviews] = useState<boolean>(false);

  // Modal states
  const [isSuggestModalOpen, setIsSuggestModalOpen] = useState(false);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<string | null>(null);

  // Suggest Form State
  const [suggestForm, setSuggestForm] = useState({
    name: '',
    websiteUrl: '',
    category: 'research' as AiToolCategory,
    pricing: 'freemium' as AiToolPricing,
    summary: '',
    practicalUseCases: '',
    importantRestrictions: '',
    submittedBy: '',
  });
  const [submittingTool, setSubmittingTool] = useState(false);

  // Review Form State
  const [reviewForm, setReviewForm] = useState({
    authorName: '',
    rating: 5,
    comment: '',
    useCase: '',
  });
  const [submittingReview, setSubmittingReview] = useState(false);

  // Load tools from server
  const loadTools = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/tools');
      if (res.ok) {
        const data: AiTool[] = await res.json();
        setTools(data);

        // Check if initial slug requested
        if (initialToolSlug) {
          const match = data.find((t) => t.slug === initialToolSlug);
          if (match) {
            handleOpenDetail(match);
          }
        }
      }
    } catch (err) {
      console.error('Failed to load AI tools directory', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTools();
  }, [initialToolSlug]);

  const handleOpenDetail = async (tool: AiTool) => {
    setSelectedTool(tool);
    setIsReviewFormOpen(false);
    setSubmissionFeedback(null);
    try {
      setLoadingReviews(true);
      const res = await fetch(`/api/tools/${encodeURIComponent(tool.slug)}`);
      if (res.ok) {
        const full = await res.json();
        setSelectedTool(full);
        setReviews(full.reviews || []);
      }
    } catch {
      // Fallback
    } finally {
      setLoadingReviews(false);
    }
  };

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suggestForm.name.trim() || !suggestForm.websiteUrl.trim()) return;
    try {
      setSubmittingTool(true);
      const res = await fetch('/api/tools/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...suggestForm,
          practicalUseCases: suggestForm.practicalUseCases
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
          importantRestrictions: suggestForm.importantRestrictions
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean),
        }),
      });
      if (res.ok) {
        setSubmissionFeedback('Tool submitted successfully! It is now in our editorial verification queue.');
        setSuggestForm({
          name: '',
          websiteUrl: '',
          category: 'research',
          pricing: 'freemium',
          summary: '',
          practicalUseCases: '',
          importantRestrictions: '',
          submittedBy: '',
        });
        setTimeout(() => {
          setIsSuggestModalOpen(false);
          setSubmissionFeedback(null);
        }, 2500);
      }
    } catch {
      setSubmissionFeedback('Network error submitting tool. Please try again.');
    } finally {
      setSubmittingTool(false);
    }
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTool || !reviewForm.authorName.trim() || !reviewForm.comment.trim()) return;
    try {
      setSubmittingReview(true);
      const res = await fetch(`/api/tools/${selectedTool.id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(reviewForm),
      });
      if (res.ok) {
        setSubmissionFeedback('Your review has been submitted for moderation to protect against spam.');
        setReviewForm({ authorName: '', rating: 5, comment: '', useCase: '' });
        setIsReviewFormOpen(false);
      }
    } catch {
      setSubmissionFeedback('Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  // Client-side filtering
  const filteredTools = tools.filter((tool) => {
    if (selectedCategory !== 'all' && tool.category !== selectedCategory) return false;
    if (selectedPricing !== 'all' && tool.pricing !== selectedPricing) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = tool.name.toLowerCase().includes(q);
      const matchSummary = tool.summary.toLowerCase().includes(q);
      const matchCases = tool.practicalUseCases.some((c) => c.toLowerCase().includes(q));
      if (!matchName && !matchSummary && !matchCases) return false;
    }
    return true;
  });

  const getPricingBadge = (pricing: AiToolPricing) => {
    switch (pricing) {
      case 'free':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            100% Free / Open Source
          </span>
        );
      case 'freemium':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
            Freemium
          </span>
        );
      case 'trial':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            Free Trial
          </span>
        );
      case 'paid':
        return (
          <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 dark:bg-purple-950/80 dark:text-purple-300 border border-purple-300 dark:border-purple-800">
            Paid Subscription
          </span>
        );
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-fade-in">
      {onBackToHome && (
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 cursor-pointer"
        >
          ← Return to Front Page
        </button>
      )}

      {/* Directory Hero Header */}
      <div className="relative rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white p-6 sm:p-10 border border-slate-700/80 shadow-xl overflow-hidden">
        <div className="relative z-10 max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-400/30">
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Fact-Checked Intelligence Index</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-editorial tracking-tight text-white">
            AI Tools Directory & Benchmarks
          </h1>
          <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
            Unbiased, empirically audited AI tools for researchers, journalists, and developers. Every listing distinguishes genuine free tiers from paid plans, explicitly highlights limitations, and links directly to official project sources.
          </p>
        </div>

        <div className="relative z-10 pt-4 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={() => setIsSuggestModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Suggest a Tool for Review</span>
          </button>
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero sponsored rankings. Non-affiliate transparency.</span>
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="bg-white dark:bg-slate-900 rounded-xl p-4 sm:p-5 border border-stone-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tools by name, use case, or capabilities..."
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 rounded-lg text-slate-900 dark:text-stone-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Pricing filter */}
          <div className="flex items-center gap-2 shrink-0">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedPricing}
              onChange={(e) => setSelectedPricing(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {PRICING_OPTIONS.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 text-xs">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-full whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-stone-200 dark:hover:bg-slate-700'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-xs">Loading verified AI tools directory...</p>
        </div>
      ) : filteredTools.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-xl p-10 border border-stone-200 dark:border-slate-800 text-center space-y-3">
          <Info className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-semibold text-slate-800 dark:text-stone-200">
            No tools matched your filter criteria
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Try adjusting your search terms, selecting "All Categories", or submitting a tool proposal to our editorial review team.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearchQuery('');
              setSelectedCategory('all');
              setSelectedPricing('all');
            }}
            className="px-4 py-1.5 rounded bg-blue-600 text-white text-xs font-semibold hover:bg-blue-500 transition-colors cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTools.map((tool) => (
            <div
              key={tool.id}
              onClick={() => handleOpenDetail(tool)}
              className="bg-white dark:bg-slate-900 rounded-xl border border-stone-200 dark:border-slate-800 p-5 shadow-sm hover:shadow-md hover:border-blue-400/60 dark:hover:border-blue-500/60 transition-all cursor-pointer flex flex-col justify-between group"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase tracking-wider font-bold text-blue-600 dark:text-blue-400">
                      {tool.category}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {tool.name}
                    </h3>
                  </div>
                  {getPricingBadge(tool.pricing)}
                </div>

                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-3">
                  {tool.summary}
                </p>

                {/* Practical use cases tags */}
                {tool.practicalUseCases.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      Best Use Cases:
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {tool.practicalUseCases.slice(0, 2).map((uc, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300 truncate max-w-full"
                        >
                          • {uc}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Card Footer */}
              <div className="pt-4 mt-4 border-t border-stone-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1 text-amber-500 font-semibold">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{tool.editorialRating?.toFixed(1) || '4.5'}</span>
                  </span>
                  <span className="flex items-center gap-1">
                    {tool.requiresAccount ? (
                      <span className="flex items-center gap-0.5 text-slate-400" title="Account required">
                        <UserCheck className="w-3 h-3" /> Account
                      </span>
                    ) : (
                      <span className="text-emerald-500 font-medium" title="No account required">
                        No sign-up
                      </span>
                    )}
                  </span>
                </div>

                <span className="text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  <span>Audit Dossier</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tool Detail Modal */}
      {selectedTool && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-2xl relative my-auto p-5 sm:p-8 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-stone-200 dark:border-slate-800">
              <div className="space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 tracking-wider">
                    {selectedTool.category}
                  </span>
                  {getPricingBadge(selectedTool.pricing)}
                  {selectedTool.editorialRating && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                      <span>{selectedTool.editorialRating} Editorial Rating</span>
                    </span>
                  )}
                </div>
                <h2 className="text-2xl sm:text-3xl font-bold font-editorial text-slate-900 dark:text-stone-100">
                  {selectedTool.name}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTool(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 rounded-md transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-2">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Audited Overview & Architecture
              </h4>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {selectedTool.summary}
              </p>
            </div>

            {/* Practical Use Cases & Important Restrictions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Verified Use Cases</span>
                </div>
                <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-disc list-inside">
                  {selectedTool.practicalUseCases.map((uc, i) => (
                    <li key={i} className="leading-relaxed">
                      {uc}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span>Important Restrictions & Limits</span>
                </div>
                <ul className="text-xs text-amber-900/80 dark:text-amber-200/90 space-y-1.5 list-disc list-inside">
                  {selectedTool.importantRestrictions.map((res, i) => (
                    <li key={i} className="leading-relaxed">
                      {res}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Pricing Breakdown & Technical Requirements */}
            <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-2 text-xs">
              <div className="font-bold text-blue-950 dark:text-blue-300 flex items-center gap-1.5">
                <Info className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Pricing Breakdown & Quota Specifications</span>
              </div>
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {selectedTool.pricingDetails}
              </p>
              <div className="flex flex-wrap gap-4 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
                <span>Account Required: {selectedTool.requiresAccount ? 'Yes' : 'No'}</span>
                <span>API Key Required: {selectedTool.requiresApiKey ? 'Yes' : 'No'}</span>
                {selectedTool.lastReviewedDate && (
                  <span>Last Reviewed: {selectedTool.lastReviewedDate}</span>
                )}
              </div>
            </div>

            {/* Action Buttons: Visit Official Website */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
              <a
                href={selectedTool.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-sm transition-colors cursor-pointer"
              >
                <span>Visit Official Website</span>
                <ExternalLink className="w-4 h-4" />
              </a>

              <button
                type="button"
                onClick={() => setIsReviewFormOpen(!isReviewFormOpen)}
                className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <MessageSquareQuote className="w-4 h-4" />
                <span>{isReviewFormOpen ? 'Cancel Feedback' : 'Write Authentic Review'}</span>
              </button>
            </div>

            {/* Review submission form */}
            {isReviewFormOpen && (
              <form
                onSubmit={handleReviewSubmit}
                className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-3 animate-fade-in"
              >
                <h4 className="text-xs font-bold text-slate-800 dark:text-stone-200 uppercase tracking-wider">
                  Submit Reader Assessment (Moderated)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Your Name / Handle *
                    </label>
                    <input
                      type="text"
                      required
                      value={reviewForm.authorName}
                      onChange={(e) => setReviewForm({ ...reviewForm, authorName: e.target.value })}
                      placeholder="e.g. Alex M."
                      className="w-full px-3 py-1.5 rounded border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                      Your Use Case (Optional)
                    </label>
                    <input
                      type="text"
                      value={reviewForm.useCase}
                      onChange={(e) => setReviewForm({ ...reviewForm, useCase: e.target.value })}
                      placeholder="e.g. Data extraction, code review"
                      className="w-full px-3 py-1.5 rounded border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Rating (1 to 5 Stars) *
                  </label>
                  <select
                    value={reviewForm.rating}
                    onChange={(e) => setReviewForm({ ...reviewForm, rating: Number(e.target.value) })}
                    className="px-3 py-1.5 rounded border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 - Exceptional)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 - Solid & Reliable)</option>
                    <option value={3}>⭐⭐⭐ (3 - Acceptable with Flaws)</option>
                    <option value={2}>⭐⭐ (2 - Significant Limitations)</option>
                    <option value={1}>⭐ (1 - Unreliable / Misleading)</option>
                  </select>
                </div>

                <div className="text-xs">
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Your Practical Review & Benchmark Observation *
                  </label>
                  <textarea
                    required
                    rows={3}
                    value={reviewForm.comment}
                    onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                    placeholder="Describe specific strengths, limitations, or failure modes observed..."
                    className="w-full px-3 py-1.5 rounded border border-stone-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingReview ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit for Review</span>
                </button>
              </form>
            )}

            {/* Feedback Message */}
            {submissionFeedback && (
              <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                {submissionFeedback}
              </div>
            )}

            {/* Authentic Reviews Section */}
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center justify-between">
                <span>Audited Reviews & Testimonials ({reviews.length})</span>
                <span className="text-[10px] font-normal text-slate-400">Strictly moderated for spam</span>
              </h4>

              {loadingReviews ? (
                <div className="py-4 text-center text-xs text-slate-400">Loading reviews...</div>
              ) : reviews.length === 0 ? (
                <div className="p-4 rounded-lg bg-stone-50 dark:bg-slate-950 text-center text-xs text-slate-500">
                  No public community reviews yet. Be the first to share an empirical benchmark or use-case report above.
                </div>
              ) : (
                <div className="space-y-3">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="p-3.5 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {rev.authorName}
                          </span>
                          {rev.isEditorialAssessment && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                              Editorial Desk
                            </span>
                          )}
                          {rev.useCase && (
                            <span className="text-[11px] text-slate-400">
                              · {rev.useCase}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                        {rev.comment}
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {new Date(rev.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Suggest a Tool Modal */}
      {isSuggestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto animate-fade-in">
          <div
            className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-xl p-6 sm:p-8 space-y-5 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between pb-3 border-b border-stone-200 dark:border-slate-800">
              <div>
                <h3 className="text-xl font-bold font-editorial text-slate-900 dark:text-white">
                  Suggest an AI Tool for Audit
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Propose an open-source or commercial AI tool. All proposals are verified against primary sources before publication.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSuggestModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSuggestSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Tool Name *
                </label>
                <input
                  type="text"
                  required
                  value={suggestForm.name}
                  onChange={(e) => setSuggestForm({ ...suggestForm, name: e.target.value })}
                  placeholder="e.g. DeepSeek Coder"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Official Website / Repository URL *
                </label>
                <input
                  type="url"
                  required
                  value={suggestForm.websiteUrl}
                  onChange={(e) => setSuggestForm({ ...suggestForm, websiteUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Category *
                  </label>
                  <select
                    value={suggestForm.category}
                    onChange={(e) => setSuggestForm({ ...suggestForm, category: e.target.value as AiToolCategory })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="research">Research & Fact-Checking</option>
                    <option value="coding">Coding & Development</option>
                    <option value="writing">Writing & Analysis</option>
                    <option value="productivity">Productivity & Speech</option>
                    <option value="image-editing">Image & Media</option>
                    <option value="education">Education & Models</option>
                    <option value="automation">Local & Automation</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                    Pricing Status *
                  </label>
                  <select
                    value={suggestForm.pricing}
                    onChange={(e) => setSuggestForm({ ...suggestForm, pricing: e.target.value as AiToolPricing })}
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white cursor-pointer"
                  >
                    <option value="free">100% Free / Open Source</option>
                    <option value="freemium">Freemium (Free Tier Available)</option>
                    <option value="trial">Free Trial</option>
                    <option value="paid">Paid Subscription</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Brief Summary / Capabilities *
                </label>
                <textarea
                  required
                  rows={2}
                  value={suggestForm.summary}
                  onChange={(e) => setSuggestForm({ ...suggestForm, summary: e.target.value })}
                  placeholder="Primary purpose, architectural highlights, and standout features..."
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Practical Use Cases (one per line)
                </label>
                <textarea
                  rows={2}
                  value={suggestForm.practicalUseCases}
                  onChange={(e) => setSuggestForm({ ...suggestForm, practicalUseCases: e.target.value })}
                  placeholder="e.g. Offline code review&#10;e.g. Synthetic data generation"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                  Your Name / Contributor Handle (Optional)
                </label>
                <input
                  type="text"
                  value={suggestForm.submittedBy}
                  onChange={(e) => setSuggestForm({ ...suggestForm, submittedBy: e.target.value })}
                  placeholder="e.g. Elena, OSINT Enthusiast"
                  className="w-full px-3 py-2 rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-50 dark:bg-slate-950 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {submissionFeedback && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-300">
                  {submissionFeedback}
                </div>
              )}

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSuggestModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium text-xs hover:bg-stone-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingTool}
                  className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {submittingTool ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Submit to Review Queue</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
