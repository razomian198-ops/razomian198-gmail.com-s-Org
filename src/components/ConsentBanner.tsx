import React, { useState, useEffect } from 'react';
import { Shield, Check, X, Settings } from 'lucide-react';

export const ConsentBanner: React.FC = () => {
  const [consentGiven, setConsentGiven] = useState<boolean | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('fil_consent_choice');
      if (stored) {
        setConsentGiven(true);
      } else {
        setConsentGiven(false);
      }
    } catch {
      setConsentGiven(false);
    }

    const handleOpenPreferences = () => {
      setShowDetails(true);
      setConsentGiven(false);
    };
    window.addEventListener('fil_open_cookie_preferences', handleOpenPreferences);
    return () => window.removeEventListener('fil_open_cookie_preferences', handleOpenPreferences);
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('fil_consent_choice', JSON.stringify({
        essential: true,
        analytics: true,
        advertising: true,
        timestamp: new Date().toISOString()
      }));
    } catch {}
    setConsentGiven(true);
  };

  const handleRejectNonEssential = () => {
    try {
      localStorage.setItem('fil_consent_choice', JSON.stringify({
        essential: true,
        analytics: false,
        advertising: false,
        timestamp: new Date().toISOString()
      }));
    } catch {}
    setConsentGiven(true);
  };

  if (consentGiven !== false) return null;

  return (
    <div
      role="region"
      aria-label="Privacy & Cookie Preferences"
      className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4 bg-slate-950/95 text-stone-100 border-t border-slate-800 shadow-2xl backdrop-blur-md"
    >
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-3 sm:gap-4 text-xs">
        <div className="flex items-start gap-2.5 max-w-3xl">
          <div className="p-1.5 rounded-md bg-blue-500/20 text-blue-400 shrink-0 mt-0.5">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-white mb-0.5">
              Privacy, Evidence & Cookie Transparency (EU Compliance)
            </p>
            <p className="text-slate-300 leading-relaxed">
              FactInfoLive uses essential local storage for reading preferences and translations. We do not load third-party ad networks or tracking scripts without your consent. In accordance with GDPR and ePrivacy directives, you can accept or decline non-essential cookies.
            </p>
            {showDetails && (
              <div className="mt-2.5 p-2.5 bg-slate-900 rounded border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <p>• <strong>Strictly Necessary:</strong> Language preferences, theme toggle, and rate limiting tokens. Always active.</p>
                <p>• <strong>First-Party Diagnostics:</strong> Aggregated anonymous article view counts to optimize server load. No cross-site profiling.</p>
                <p>• <strong>Advertising & Affiliates:</strong> Only loaded if advertising modules are activated. No behavioral ad retargeting.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 self-end md:self-center">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="px-2.5 py-1.5 text-slate-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1"
          >
            <Settings className="w-3.5 h-3.5" />
            <span>{showDetails ? 'Hide Details' : 'Details'}</span>
          </button>
          <button
            type="button"
            onClick={handleRejectNonEssential}
            className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium transition-colors cursor-pointer"
          >
            Essential Only
          </button>
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-3.5 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-colors cursor-pointer"
          >
            Accept All
          </button>
        </div>
      </div>
    </div>
  );
};
