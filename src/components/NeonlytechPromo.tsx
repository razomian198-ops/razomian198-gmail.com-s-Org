import React from 'react';
import { ArrowUpRight } from 'lucide-react';

const BASE = 'https://neonlytech.com';
const href = (campaign: string) =>
  `${BASE}/?utm_source=factinfolive&utm_medium=referral&utm_campaign=${campaign}`;

/** Slim, clearly labelled strip shown under the header on every page. */
export const NeonlytechBar: React.FC = () => (
  <div className="bg-slate-900 text-slate-200 text-[11px] sm:text-xs border-b border-slate-800">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5 flex items-center justify-center gap-2 flex-wrap text-center">
      <span className="uppercase tracking-wider text-[9px] font-bold text-slate-400">Our other project</span>
      <span>
        <strong className="text-white">NEONLYTECH</strong> – Smarter Technology. Better Business.
        <span className="hidden sm:inline"> AI automation, websites &amp; SEO.</span>
      </span>
      <a
        href={href('header_bar')}
        target="_blank"
        rel="noopener"
        className="inline-flex items-center gap-0.5 font-semibold text-cyan-300 hover:text-cyan-200 hover:underline"
      >
        Visit neonlytech.com <ArrowUpRight className="w-3 h-3" />
      </a>
    </div>
  </div>
);

/** Labelled block shown with every article. */
export const NeonlytechCard: React.FC = () => (
  <aside
    aria-label="Promotion: NEONLYTECH"
    className="my-8 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
  >
    <div className="flex-1 space-y-1">
      <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Promotion · our other project</p>
      <p className="text-sm font-bold text-slate-900 dark:text-white">NEONLYTECH – Smarter Technology. Better Business.</p>
      <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
        Digital technology and AI automation: chatbots, website development, SEO/AEO and process automation for small businesses.
      </p>
    </div>
    <a
      href={href('article_card')}
      target="_blank"
      rel="noopener"
      className="inline-flex items-center justify-center gap-1 px-4 py-2 rounded-lg bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-semibold hover:opacity-90 whitespace-nowrap"
    >
      Visit neonlytech.com <ArrowUpRight className="w-3.5 h-3.5" />
    </a>
  </aside>
);

export const neonlytechFooterHref = href('footer');
