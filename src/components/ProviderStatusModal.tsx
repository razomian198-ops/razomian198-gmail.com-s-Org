import React, { useEffect, useState } from 'react';
import { X, ShieldCheck, CheckCircle2, AlertCircle, Key, RefreshCw, ExternalLink } from 'lucide-react';
import { ProviderStatus } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface ProviderStatusModalProps {
  currentLanguage: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
}

export const ProviderStatusModal: React.FC<ProviderStatusModalProps> = ({
  currentLanguage,
  isOpen,
  onClose,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [providers, setProviders] = useState<ProviderStatus[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/sources/status');
      if (res.ok) {
        const data = await res.json();
        setProviders(data.providers || []);
      }
    } catch {
      // Keep existing
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:px-6 border-b border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base sm:text-lg font-bold font-editorial text-slate-900 dark:text-white">
                {t.providerStatus}
              </h2>
              <span className="text-[11px] text-slate-500 font-sans">
                Real-Time Provider Health, Quotas & Open Data Integrity
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchStatus}
              disabled={loading}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
              title="Refresh provider status"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          {/* Data Source Standards & Open Data Banner */}
          <div className="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200">
            <strong className="block font-semibold mb-1">Data Source Standards &amp; Anti-Scraping Policy:</strong>
            <p className="leading-relaxed text-[11px] opacity-90">
              FactInfoLive operates exclusively on authorized open-access APIs, verified RSS syndication feeds, and official institutional press desks. We strictly respect publisher copyright, terms of service, and rate limits.
            </p>
          </div>

          <div className="divide-y divide-stone-100 dark:divide-slate-800/80 space-y-3">
            {providers.map((p) => (
              <div key={p.id} className="pt-3 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-semibold text-slate-900 dark:text-stone-100">
                        {p.name}
                      </h4>
                      <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {p.type}
                      </span>
                      <span className="text-[10px] text-blue-600 dark:text-blue-400 font-mono font-medium">
                        {p.cachedRecordsCount} items cached
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {p.details}
                    </p>
                    {p.lastError && (
                      <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-0.5">
                        Notice: {p.lastError}
                      </p>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="shrink-0 text-right">
                    {p.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Active</span>
                      </span>
                    ) : p.status === 'key_missing' ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
                        <Key className="w-3.5 h-3.5" />
                        <span>Optional Key</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <AlertCircle className="w-3.5 h-3.5" />
                        <span>Standby</span>
                      </span>
                    )}
                    <div className="text-[11px] text-slate-400 font-tabular mt-0.5">
                      {p.latencyMs > 0 ? `${p.latencyMs}ms latency` : 'Zero latency'}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Secret configuration guide */}
          <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-1">
              Adding Custom Credentials:
            </span>
            <p className="text-[11px] leading-relaxed">
              To connect your own keys, simply open <strong>Google AI Studio → Settings → Secrets</strong> and add <code>GEMINI_API_KEY</code> or <code>GUARDIAN_API_KEY</code>. No private keys are ever stored on client browsers or publicly exposed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 sm:px-6 border-t border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 flex items-center justify-between text-xs text-slate-500">
          <span>All connections monitored server-side</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 rounded-md font-medium text-xs hover:bg-slate-800 dark:hover:bg-white transition-colors"
          >
            {t.close}
          </button>
        </div>
      </div>
    </div>
  );
};
