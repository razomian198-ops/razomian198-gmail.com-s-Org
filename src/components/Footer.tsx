import React from 'react';
import { ShieldCheck, Heart, ExternalLink, Lock } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations.ts';

interface FooterProps {
  currentLanguage: SupportedLanguage;
  onSelectCategory: (catId: string) => void;
  onOpenStatusModal: () => void;
  onOpenAdminDashboard?: () => void;
  onOpenSupporterModal?: () => void;
  onOpenSponsorshipModal?: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectCategory,
  onOpenStatusModal,
  onOpenAdminDashboard,
  onOpenSupporterModal,
  onOpenSponsorshipModal,
}) => {
  return (
    <footer className="bg-white dark:bg-slate-950 border-t border-stone-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 pb-10 border-b border-stone-200 dark:border-slate-800">
          {/* Brand & Mission */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
                F
              </div>
              <span className="text-lg font-bold font-editorial text-slate-950 dark:text-white">
                FactInfo<span className="text-blue-600 dark:text-blue-400">Live</span>
              </span>
            </div>
            <p className="text-xs leading-relaxed text-slate-500">
              A high-integrity international intelligence platform delivering verified breaking news, confirmed sports telemetry, and peer-reviewed scientific discoveries with total source transparency.
            </p>
            <div className="pt-2 flex flex-col gap-2">
              <button
                onClick={onOpenStatusModal}
                className="inline-flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold hover:underline text-left cursor-pointer"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Source Status &amp; Transparency</span>
              </button>
              {onOpenSupporterModal && (
                <button
                  onClick={onOpenSupporterModal}
                  className="inline-flex items-center gap-1.5 text-rose-600 dark:text-rose-400 font-semibold hover:underline text-left cursor-pointer"
                >
                  <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
                  <span>Support FactInfoLive (Patronage)</span>
                </button>
              )}
            </div>
          </div>

          {/* Editorial Publishing Channels */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Editorial Publications
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onSelectCategory('latest-news')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Latest News Wire
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('blogs')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Blogs &amp; Monographs
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('quick-summaries')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  30s Quick Summaries
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('deep-explainers')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Deep Explainers
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('research-studies')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Research &amp; Studies
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('sports-analysis')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Sports Tactical Analysis
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('fact-checks')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Fact Checks &amp; Audits
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('guides-faqs')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Guides &amp; FAQs
                </button>
              </li>
            </ul>
          </div>

          {/* Sports & Science */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Coverage &amp; Feeds
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onSelectCategory('sports')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Live Sports Center
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('science')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Astrophysics &amp; Space Lab
                </button>
              </li>
              <li>
                <button onClick={() => onSelectCategory('health')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Health &amp; Clinical Trials
                </button>
              </li>
              <li>
                <a href="/sitemap.xml" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                  <span>XML Sitemap (/sitemap.xml)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a href="/robots.txt" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                  <span>Robots Directives (/robots.txt)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
              <li>
                <a href="/feed.xml" target="_blank" rel="noreferrer" className="hover:text-slate-900 dark:hover:text-white flex items-center gap-1">
                  <span>RSS Intelligence Feed (/feed.xml)</span>
                  <ExternalLink className="w-3 h-3 text-slate-400" />
                </a>
              </li>
            </ul>
          </div>

          {/* Standards, Governance & Admin Portal */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-900 dark:text-slate-200">
              Governance &amp; Studio
            </h4>
            <ul className="space-y-1.5">
              <li>
                <button onClick={() => onSelectCategory('about')} className="hover:text-slate-900 dark:hover:text-white cursor-pointer">
                  Editorial Independence Policy
                </button>
              </li>
              {onOpenAdminDashboard && (
                <li>
                  <button
                    onClick={onOpenAdminDashboard}
                    className="text-blue-600 dark:text-blue-400 font-semibold hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Lock className="w-3 h-3" />
                    <span>Admin Dashboard (/admin)</span>
                  </button>
                </li>
              )}
              {onOpenSponsorshipModal && (
                <li>
                  <button
                    onClick={onOpenSponsorshipModal}
                    className="hover:text-slate-900 dark:hover:text-white cursor-pointer"
                  >
                    Ethical Sponsorship Inquiries
                  </button>
                </li>
              )}
              <li>
                <span className="text-slate-500 block text-[11px] leading-relaxed pt-1">
                  GDPR-compliant, first-party telemetry, scrypt password hashing.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-slate-500">
          <div>
            © {new Date().getFullYear()} FactInfoLive Intelligence Consortium. All publisher rights belong to original wire reporters.
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => onSelectCategory('about')} className="hover:underline cursor-pointer">
              Ethics &amp; Retractions
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={() => onSelectCategory('all-topics')} className="hover:underline cursor-pointer">
              All 42 Topics
            </button>
            <span aria-hidden="true">·</span>
            <button onClick={onOpenStatusModal} className="hover:underline cursor-pointer">
              Provider Telemetry
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
