import React, { useEffect, useState } from 'react';
import { DisplayAdSettings } from '../../server/services/types.ts';

interface AdBannerProps {
  slot: 'headerBillboard' | 'inArticle' | 'sidebarRail' | 'footerSticky';
  className?: string;
}

export const AdBanner: React.FC<AdBannerProps> = ({ slot, className = '' }) => {
  const [settings, setSettings] = useState<DisplayAdSettings | null>(null);

  useEffect(() => {
    fetch('/api/monetization/settings')
      .then((res) => res.json())
      .then((data) => {
        if (data?.displayAds) {
          setSettings(data.displayAds);
        }
      })
      .catch(() => {});
  }, []);

  if (!settings || !settings.enabled || !settings.slots[slot]) {
    return null;
  }

  // If in test mode or ad client is not configured, show clean placeholder conforming to guidelines
  const isConfigured = Boolean(settings.adClient && settings.adClient.startsWith('ca-pub-'));

  return (
    <div className={`my-4 text-center ${className}`}>
      <div className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider mb-1">
        Advertisement · Ethical Placement
      </div>
      <div className="border border-dashed border-stone-300 dark:border-slate-700 rounded-lg p-4 bg-stone-50 dark:bg-slate-900/40 text-xs text-slate-500 flex flex-col items-center justify-center min-h-[90px]">
        {isConfigured && !settings.testMode ? (
          <div className="w-full">
            {/* Real AdSense tag slot configured */}
            <ins
              className="adsbygoogle"
              style={{ display: 'block', textAlign: 'center' }}
              data-ad-client={settings.adClient}
              data-ad-slot={slot}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        ) : (
          <div className="space-y-1">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Reserved Ad Placement ({slot.replace(/([A-Z])/g, ' $1').toLowerCase()})
            </span>
            <p className="text-[11px] text-slate-400 max-w-sm mx-auto">
              {settings.testMode
                ? 'Monetization Test Mode Active. Live provider script is withheld until official Google AdSense account approval.'
                : 'Awaiting provider credentials in Admin Dashboard > Revenue & Growth.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
