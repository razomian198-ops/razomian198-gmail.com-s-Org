import React, { useEffect, useState } from 'react';
import { ArrowLeft, Mail } from 'lucide-react';

interface Props {
  onBackToHome: () => void;
}

export const ContactView: React.FC<Props> = ({ onBackToHome }) => {
  const [email, setEmail] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch('/api/site-info')
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive) setEmail(d?.contactEmail || null);
      })
      .catch(() => {})
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="max-w-3xl mx-auto py-8 px-4 sm:px-6 space-y-8">
      <button
        onClick={onBackToHome}
        className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Back to front page</span>
      </button>

      <header className="space-y-3 border-b border-stone-200 dark:border-slate-800 pb-6">
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-slate-950 dark:text-white">Contact FactInfoLive</h1>
        <p className="text-slate-600 dark:text-slate-300">
          FactInfoLive is a small independent site. We read the messages we receive, but we cannot promise a reply to every one.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Email</h2>
        {email ? (
          <a
            href={`mailto:${email}`}
            className="inline-flex items-center gap-2 text-blue-600 dark:text-blue-400 font-semibold hover:underline break-all"
          >
            <Mail className="w-4 h-4 shrink-0" />
            {email}
          </a>
        ) : (
          <p className="text-slate-600 dark:text-slate-300">
            {loaded ? 'Our contact email is being set up and will appear here soon.' : 'Loading...'}
          </p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">What to write to us about</h2>
        <ul className="list-disc pl-5 space-y-2 text-slate-700 dark:text-slate-300">
          <li>
            <strong>Corrections:</strong> if you think something we published is wrong, send the page address, what is wrong, and a link
            to a source. We will check it and correct it if you are right.
          </li>
          <li>
            <strong>Story and source tips:</strong> links to original documents or reports are the most useful.
          </li>
          <li>
            <strong>Removal or copyright requests:</strong> tell us which page and which content, and who owns it.
          </li>
          <li>
            <strong>Partnerships and advertising:</strong> tell us who you are and what you propose. Sponsored content is always labelled.
          </li>
        </ul>
      </section>

      <section className="space-y-2 text-sm text-slate-500 dark:text-slate-400">
        <p>
          Please do not send passwords, payment details or other sensitive personal information by email. Your message is used only to
          respond to you.
        </p>
      </section>
    </div>
  );
};
