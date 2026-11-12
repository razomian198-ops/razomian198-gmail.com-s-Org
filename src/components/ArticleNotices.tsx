import React, { useEffect, useState } from 'react';
import { Info, MessageSquareWarning } from 'lucide-react';

/** Shown above every article: nothing here is FactInfoLive's own research, and mistakes are possible. */
export const ArticleDisclaimer: React.FC = () => (
  <div className="flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/30 p-3 sm:p-4 text-xs sm:text-sm text-amber-900 dark:text-amber-200">
    <Info className="w-4 h-4 shrink-0 mt-0.5" />
    <p>
      <strong>Please note:</strong> this article may contain mistakes. It is compiled from the sources listed at the bottom, and
      FactInfoLive does not claim any of it as its own research or testing. Please check the original sources before relying on it.
    </p>
  </div>
);

/** Shown under every article: lets readers suggest a correction by email (prefilled with the page address). */
export const ArticleFeedback: React.FC<{ title: string }> = ({ title }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [text, setText] = useState('');

  useEffect(() => {
    let alive = true;
    fetch('/api/site-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setEmail(d?.contactEmail || null))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, []);

  const href = email
    ? `mailto:${email}?subject=${encodeURIComponent('Correction or suggestion: ' + title)}&body=${encodeURIComponent(
        `${text}\n\n---\nPage: ${typeof window !== 'undefined' ? window.location.href : ''}\nSource link supporting my suggestion (if any): `
      )}`
    : '/contact';

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 p-4 sm:p-5 space-y-3">
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white">Found a mistake or have a suggestion?</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Tell us what looks wrong and, if you can, link a source. We will check it and correct the article if you are right.
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={3}
        placeholder="Write your correction or suggestion here..."
        className="w-full rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-sm text-slate-800 dark:text-slate-100"
      />
      <a
        href={href}
        className="inline-flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2"
      >
        Send by email
      </a>
    </section>
  );
};
