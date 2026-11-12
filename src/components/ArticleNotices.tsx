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

interface FeedbackItem {
  display_name: string | null;
  message: string;
  source_url: string | null;
  created_at: string;
}

/** Shown under every article: readers can send a correction/suggestion (reviewed before it is shown) or use email. */
export const ArticleFeedback: React.FC<{ title: string; slug: string }> = ({ title, slug }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [text, setText] = useState('');
  const [link, setLink] = useState('');
  const [state, setState] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [error, setError] = useState('');
  const [items, setItems] = useState<FeedbackItem[]>([]);

  useEffect(() => {
    let alive = true;
    fetch('/api/site-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => alive && setEmail(d?.contactEmail || null))
      .catch(() => {});
    fetch(`/api/feedback/${encodeURIComponent(slug)}`)
      .then((r) => (r.ok ? r.json() : []))
      .then((d) => alive && Array.isArray(d) && setItems(d))
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [slug]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState('sending');
    setError('');
    try {
      const r = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, name, message: text, sourceUrl: link }),
      });
      if (!r.ok) {
        const d = await r.json().catch(() => ({}));
        throw new Error(d?.error || 'Could not send.');
      }
      setState('done');
      setText('');
      setLink('');
    } catch (err: any) {
      setError(err?.message || 'Could not send.');
      setState('error');
    }
  };

  const mailHref = email
    ? `mailto:${email}?subject=${encodeURIComponent('Correction or suggestion: ' + title)}&body=${encodeURIComponent(
        `\n\n---\nPage: ${typeof window !== 'undefined' ? window.location.href : ''}`
      )}`
    : '/contact';

  return (
    <section className="rounded-2xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-900 p-4 sm:p-5 space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquareWarning className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white">Found a mistake or have a suggestion?</h3>
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">
        Tell us what looks wrong and, if you can, link a source. We review every message before it is shown here, and correct the
        article if you are right.
      </p>

      {items.length > 0 && (
        <ul className="space-y-3">
          {items.map((it, i) => (
            <li key={i} className="rounded-lg bg-white dark:bg-slate-950 border border-stone-200 dark:border-slate-800 p-3 text-sm">
              <p className="text-slate-800 dark:text-slate-100 whitespace-pre-line">{it.message}</p>
              <p className="mt-1 text-xs text-slate-500">
                {it.display_name || 'Reader'} · {new Date(it.created_at).toLocaleDateString()}
                {it.source_url && (
                  <>
                    {' · '}
                    <a href={it.source_url} target="_blank" rel="noopener noreferrer nofollow ugc" className="text-blue-600 dark:text-blue-400 underline">
                      source
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ul>
      )}

      {state === 'done' ? (
        <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Thank you. Your message was received and will appear here after review.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-2.5">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            placeholder="Your name (optional)"
            className="w-full rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-sm text-slate-800 dark:text-slate-100"
          />
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            required
            minLength={5}
            maxLength={2000}
            placeholder="Write your correction or suggestion here..."
            className="w-full rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-sm text-slate-800 dark:text-slate-100"
          />
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            maxLength={500}
            placeholder="Link to a source (optional, https://...)"
            className="w-full rounded-lg border border-stone-300 dark:border-slate-700 bg-white dark:bg-slate-950 p-2.5 text-sm text-slate-800 dark:text-slate-100"
          />
          {state === 'error' && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={state === 'sending'}
              className="inline-flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-4 py-2"
            >
              {state === 'sending' ? 'Sending...' : 'Send'}
            </button>
            <a href={mailHref} className="text-sm text-blue-600 dark:text-blue-400 underline">
              or send by email
            </a>
          </div>
        </form>
      )}
    </section>
  );
};
