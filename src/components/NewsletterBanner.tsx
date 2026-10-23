import React, { useState } from 'react';
import { Mail, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface NewsletterBannerProps {
  currentLanguage: SupportedLanguage;
}

export const NewsletterBanner: React.FC<NewsletterBannerProps> = ({ currentLanguage }) => {
  const t = TRANSLATIONS[currentLanguage];
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || loading) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, categories: ['all'] }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(data.message || 'Thank you for subscribing to verified research intelligence.');
        setEmail('');
      } else {
        setErrorMsg(data.message || 'Subscription failed. Please check your email.');
      }
    } catch {
      setErrorMsg('Network error. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-900 text-stone-100 rounded-2xl p-6 sm:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-80 h-80 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-2.5 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
          <Mail className="w-4 h-4" />
          <span>Research Intelligence Wire</span>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold font-editorial text-white mb-2">
          {t.newsletterTitle}
        </h3>
        <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed font-sans">
          {t.newsletterSubtitle}
        </p>

        {successMsg ? (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-200 text-xs sm:text-sm flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubscribe} className="space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your academic or corporate email..."
                className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-slate-950 border border-slate-700/80 text-white placeholder:text-slate-500 focus:border-blue-500 outline-none transition-colors"
              />
              <button
                type="submit"
                disabled={loading}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <span>{t.newsletterSubscribe}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
            {errorMsg && (
              <span className="text-xs text-red-400 block">{errorMsg}</span>
            )}
            <span className="text-[11px] text-slate-500 block">
              We respect your privacy. No promotional spam. Unsubscribe anytime.
            </span>
          </form>
        )}
      </div>
    </div>
  );
};
