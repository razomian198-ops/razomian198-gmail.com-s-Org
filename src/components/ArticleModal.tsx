import React, { useEffect, useState } from 'react';
import {
  X,
  ExternalLink,
  Share2,
  CheckCircle2,
  Radio,
  Clock,
  User,
  ShieldCheck,
  Check,
  Bookmark
} from 'lucide-react';
import { NewsItem } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface ArticleModalProps {
  currentLanguage: SupportedLanguage;
  article: NewsItem | null;
  onClose: () => void;
}

export const ArticleModal: React.FC<ArticleModalProps> = ({ currentLanguage, article, onClose }) => {
  const t = TRANSLATIONS[currentLanguage];
  const [copied, setCopied] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!article) return null;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(article.url || window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header bar */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span className="uppercase tracking-wider text-blue-600 dark:text-blue-400 font-semibold">
              {article.category}
            </span>
            <span aria-hidden="true">·</span>
            <span>{article.publisher}</span>
            {article.isDeveloping && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-medium flex items-center gap-1">
                  <Radio className="w-3 h-3 text-amber-500" /> Developing
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-lg transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400'
                  : 'text-slate-500 hover:bg-stone-100 dark:hover:bg-slate-800'
              }`}
              title="Bookmark story"
            >
              <Bookmark className="w-4 h-4" />
            </button>
            <button
              onClick={handleCopyLink}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={t.share}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label={t.close}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Article Image if present */}
          {article.imageUrl && (
            <div className="rounded-xl overflow-hidden aspect-video relative bg-stone-100 dark:bg-slate-950">
              <img
                src={article.imageUrl}
                alt={article.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
              {article.imageAttribution && (
                <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 text-[11px] text-stone-200">
                  {article.imageAttribution}
                </div>
              )}
            </div>
          )}

          {/* Headline */}
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-950 dark:text-white leading-tight">
            {article.title}
          </h1>

          {/* Bylines & Timestamps */}
          <div className="flex flex-wrap items-center gap-4 py-3 border-y border-stone-200 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400 font-tabular">
            {article.author && (
              <div className="flex items-center gap-1.5 font-medium text-slate-700 dark:text-slate-300">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>{article.author}</span>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-400" />
              <span>Published: {new Date(article.publishedAt).toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-slate-400">
              Retrieved: {new Date(article.retrievedAt).toLocaleTimeString()}
            </div>
          </div>

          {/* Verification Badge Callout */}
          <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950/70 border border-stone-200 dark:border-slate-800 flex items-start gap-3 text-xs">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-900 dark:text-white block mb-0.5">
                FactInfoLive Verification & Source Provenance
              </span>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                {article.verificationDetails ||
                  `This dispatch was retrieved directly through verified ${article.publisher} syndication feeds. FactInfoLive preserves full attribution and links back to the original reporter.`}
              </p>
            </div>
          </div>

          {/* Factual Content / Summary */}
          <div className="space-y-4 text-slate-700 dark:text-slate-300 font-sans text-base leading-relaxed">
            <p className="font-medium text-lg text-slate-900 dark:text-stone-100">
              {article.summary}
            </p>
            {article.content && (
              <p className="whitespace-pre-line text-sm leading-relaxed">
                {article.content}
              </p>
            )}
          </div>

          {/* Tags */}
          {article.tags && article.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <span className="text-xs text-slate-400 font-medium">Topic Tags:</span>
              {article.tags.map((tag, i) => (
                <span
                  key={i}
                  className="text-xs text-slate-600 dark:text-slate-300 font-medium px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {copied && (
            <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold text-center">
              ✓ {t.copied}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 border-t border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 flex items-center justify-between flex-wrap gap-3">
          <span className="text-xs text-slate-500">
            Source: <strong className="text-slate-700 dark:text-slate-300">{article.publisher}</strong>
          </span>

          <a
            href={article.url}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 text-xs font-semibold rounded-lg hover:bg-slate-800 dark:hover:bg-white transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <span>{t.viewOriginal}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>
    </div>
  );
};
