import React, { useState } from 'react';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Share2,
  Bookmark,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  List,
  User,
  HelpCircle,
  Scale
} from 'lucide-react';
import { EditorialArticle } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';
import { NewsletterBanner } from './NewsletterBanner.tsx';

interface BlogDetailViewProps {
  currentLanguage: SupportedLanguage;
  article: EditorialArticle;
  onBack: () => void;
  onOpenArticleBySlug: (slug: string) => void;
  relatedArticles?: EditorialArticle[];
}

export const BlogDetailView: React.FC<BlogDetailViewProps> = ({
  currentLanguage,
  article,
  onBack,
  onOpenArticleBySlug,
  relatedArticles = [],
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${article.title} via @FactInfoLive`);
    const url = encodeURIComponent(window.location.href);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareLinkedIn = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank');
  };

  const explainer = article.deepExplainer;
  const summary = article.structuredSummary;

  return (
    <article className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-10 animate-fade-in">
      {/* Top Back Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Articles & Dispatches</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsSaved(!isSaved)}
            className={`p-2 rounded-lg transition-colors cursor-pointer ${
              isSaved
                ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                : 'text-slate-500 hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
            title="Bookmark dispatch"
          >
            <Bookmark className="w-4 h-4" />
          </button>
          <button
            onClick={handleCopyLink}
            className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            title="Copy link"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Header / Title block */}
      <div className="space-y-4 border-b border-stone-200 dark:border-slate-800 pb-8">
        {/* Unboxed Metadata Line */}
        <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500 font-medium">
          <span className="uppercase tracking-wider font-semibold text-blue-600 dark:text-blue-400">
            {article.type.replace('-', ' ')}
          </span>
          <span aria-hidden="true">·</span>
          <span>{article.category.toUpperCase()}</span>
          <span aria-hidden="true">·</span>
          <span className="font-tabular flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{article.readingTimeMinutes} {t.readingTime}</span>
          </span>
          {article.isAiAssisted && (
            <>
              <span aria-hidden="true">·</span>
              <span className="text-amber-600 dark:text-amber-400 font-semibold">
                AI-Assisted · Human Reviewed
              </span>
            </>
          )}
        </div>

        {/* Display Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold font-editorial text-slate-950 dark:text-white leading-tight">
          {article.title}
        </h1>

        {/* Subtitle */}
        {article.subtitle && (
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 font-sans leading-relaxed">
            {article.subtitle}
          </p>
        )}

        {/* Author Byline & Timestamps */}
        <div className="pt-4 flex items-center justify-between flex-wrap gap-4 border-t border-stone-200/60 dark:border-slate-800/80">
          <div className="flex items-center gap-3">
            {article.author.avatar ? (
              <img
                src={article.author.avatar}
                alt={article.author.name}
                className="w-10 h-10 rounded-full object-cover border border-stone-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 font-bold">
                {article.author.name[0]}
              </div>
            )}
            <div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white block">
                {article.author.name}
              </span>
              <span className="text-xs text-slate-500">{article.author.role}</span>
            </div>
          </div>

          <div className="text-xs text-slate-500 font-tabular space-y-0.5 text-right">
            <div>Published: {new Date(article.publishedAt || article.updatedAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</div>
            {article.updatedAt && (
              <div className="text-[11px] text-slate-400">
                Last reviewed: {new Date(article.updatedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Featured Header Photography */}
      {article.imageUrl && (
        <div className="rounded-2xl overflow-hidden aspect-video relative bg-stone-100 dark:bg-slate-950">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          {article.imageAttribution && (
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-3 text-[11px] text-stone-200">
              {article.imageAttribution}
            </div>
          )}
        </div>
      )}

      {/* Table of Contents (for long articles) */}
      {article.tableOfContents && article.tableOfContents.length > 0 && (
        <div className="p-5 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-stone-100">
            <List className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{t.tableOfContents}</span>
          </div>
          <nav className="space-y-1.5 pt-1 text-xs">
            {article.tableOfContents.map((toc) => (
              <a
                key={toc.id}
                href={`#${toc.id}`}
                className="block text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors font-medium"
              >
                {toc.title}
              </a>
            ))}
          </nav>
        </div>
      )}

      {/* Structured Summary Card (If this is a Summary or has one attached) */}
      {summary && (
        <div className="p-6 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300">
            <ShieldCheck className="w-4 h-4" />
            <span>{t.summary10Point}</span>
          </div>
          <p className="text-base font-semibold text-slate-900 dark:text-blue-100 leading-relaxed font-sans">
            {summary.quickSummary30s}
          </p>

          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 block">
              {t.keyTakeawaysTitle}:
            </span>
            {summary.keyTakeaways.map((takeaway, i) => (
              <div key={i} className="flex items-start gap-2 text-xs text-slate-800 dark:text-slate-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <span>{takeaway}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main Prose Content */}
      <div className="prose prose-slate dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 font-sans leading-relaxed text-base sm:text-lg space-y-6 whitespace-pre-line">
        {article.content}
      </div>

      {/* Deep Explainer Sections if applicable */}
      {explainer && (
        <div className="space-y-8 pt-6 border-t border-stone-200 dark:border-slate-800">
          {/* Key Concepts */}
          {explainer.keyConcepts.length > 0 && (
            <div className="p-6 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
              <h3 className="text-lg font-bold font-editorial text-slate-950 dark:text-white">
                Key Conceptual Glossary
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {explainer.keyConcepts.map((kc, i) => (
                  <div key={i} className="p-3 bg-white dark:bg-slate-950 rounded-lg border border-stone-200/80 dark:border-slate-800 text-xs">
                    <strong className="text-blue-600 dark:text-blue-400 block mb-1">{kc.term}</strong>
                    <span className="text-slate-600 dark:text-slate-400 leading-relaxed">{kc.explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          {explainer.timeline.length > 0 && (
            <div className="p-6 rounded-xl border border-stone-200 dark:border-slate-800 space-y-4">
              <h3 className="text-lg font-bold font-editorial text-slate-950 dark:text-white">
                Historical Chronology & Timeline
              </h3>
              <div className="space-y-3">
                {explainer.timeline.map((item, i) => (
                  <div key={i} className="flex items-start gap-4 text-xs font-tabular">
                    <span className="font-bold text-blue-600 dark:text-blue-400 shrink-0 w-24">{item.date}</span>
                    <span className="text-slate-700 dark:text-slate-300 leading-relaxed">{item.event}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Reputable Sources & Disagreements */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                What Reputable Sources Say
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                {explainer.sourcePerspectives.map((sp, i) => (
                  <li key={i} className="p-2.5 bg-stone-50 dark:bg-slate-950 rounded border border-stone-200/60 dark:border-slate-800">
                    <strong className="block text-slate-900 dark:text-white">{sp.source}</strong>
                    <span className="text-slate-500">{sp.stance}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Disagreements & Limitations
              </h4>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 list-disc list-inside">
                {explainer.disagreementsAndLimitations.map((dl, i) => (
                  <li key={i} className="leading-relaxed">{dl}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* FAQs */}
          {explainer.faqs.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-lg font-bold font-editorial text-slate-950 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span>Frequently Asked Questions</span>
              </h3>
              <div className="space-y-3">
                {explainer.faqs.map((faq, i) => (
                  <div key={i} className="p-4 rounded-xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-xs sm:text-sm">
                    <span className="font-semibold text-slate-900 dark:text-white block mb-1">{faq.question}</span>
                    <p className="text-slate-600 dark:text-slate-400 leading-relaxed font-sans">{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* References & Links */}
          {explainer.references.length > 0 && (
            <div className="pt-4 border-t border-stone-200 dark:border-slate-800 text-xs">
              <span className="font-bold uppercase tracking-wider text-slate-500 block mb-2">
                Primary References & Data Sources
              </span>
              <div className="space-y-1.5">
                {explainer.references.map((ref, i) => (
                  <a
                    key={i}
                    href={ref.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 font-medium"
                  >
                    <span>[{i + 1}] {ref.title} ({ref.publisher})</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Author Bio Box */}
      <div className="p-6 rounded-2xl bg-stone-50 dark:bg-slate-900 border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-center sm:items-start gap-5">
        {article.author.avatar ? (
          <img
            src={article.author.avatar}
            alt={article.author.name}
            className="w-16 h-16 rounded-full object-cover border border-stone-300 dark:border-slate-700 shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 font-bold text-xl shrink-0">
            {article.author.name[0]}
          </div>
        )}
        <div className="space-y-1.5 text-center sm:text-left">
          <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
            About the Author
          </span>
          <h4 className="text-base font-bold text-slate-900 dark:text-white">
            {article.author.name}
          </h4>
          <span className="text-xs text-blue-600 dark:text-blue-400 font-medium block">
            {article.author.role}
          </span>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            {article.author.bio || 'Contributing intelligence analyst for FactInfoLive.'}
          </p>
        </div>
      </div>

      {/* Share Links Strip */}
      <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 flex items-center justify-between flex-wrap gap-4 text-xs font-medium">
        <span className="text-slate-500">Share this verified intelligence dossier:</span>
        <div className="flex items-center gap-2">
          <button
            onClick={handleShareTwitter}
            className="px-3 py-1.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Post to X / Twitter
          </button>
          <button
            onClick={handleShareLinkedIn}
            className="px-3 py-1.5 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 rounded-md transition-colors cursor-pointer"
          >
            Share on LinkedIn
          </button>
          <button
            onClick={handleCopyLink}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-md transition-colors cursor-pointer"
          >
            {copied ? 'Link Copied!' : 'Copy Direct Link'}
          </button>
        </div>
      </div>

      {/* Newsletter Signup Banner */}
      <NewsletterBanner currentLanguage={currentLanguage} />

      {/* Related Articles in same department */}
      {relatedArticles.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-stone-200 dark:border-slate-800">
          <h3 className="text-lg font-bold font-editorial text-slate-950 dark:text-white">
            Related Research & Dispatches
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {relatedArticles.slice(0, 3).map((rel) => (
              <div
                key={rel.id}
                onClick={() => onOpenArticleBySlug(rel.slug)}
                className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-500 transition-colors cursor-pointer flex flex-col justify-between"
              >
                <div>
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">
                    {rel.type}
                  </span>
                  <h4 className="text-sm font-bold font-editorial text-slate-900 dark:text-white line-clamp-2">
                    {rel.title}
                  </h4>
                </div>
                <div className="text-[11px] text-slate-400 mt-3 font-tabular">
                  {rel.readingTimeMinutes} min read · {rel.author.name}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </article>
  );
};
