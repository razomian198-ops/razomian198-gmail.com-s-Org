import React, { useEffect } from 'react';
import { X, ArrowRight, Grid, Trophy, Atom, Globe, Shield } from 'lucide-react';
import { CATEGORIES } from '../data/categories.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface AllTopicsModalProps {
  currentLanguage: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
  onSelectCategory: (catId: string) => void;
}

export const AllTopicsModal: React.FC<AllTopicsModalProps> = ({
  currentLanguage,
  isOpen,
  onClose,
  onSelectCategory,
}) => {
  const t = TRANSLATIONS[currentLanguage];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const groups = [
    { id: 'news', label: 'Global News & Geopolitics', icon: Globe },
    { id: 'sports', label: 'Live Sports & Leagues', icon: Trophy },
    { id: 'science', label: 'Science, Space & Health', icon: Atom },
    { id: 'society', label: 'Society & Culture', icon: Grid },
    { id: 'special', label: 'Special Intelligence & Verification', icon: Shield },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/70 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50">
          <div>
            <h2 className="text-xl font-bold font-editorial text-slate-950 dark:text-white">
              FactInfoLive Full Topic Directory ({CATEGORIES.length} Categories)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select any department to view dedicated dispatches, verified datasets, and telemetry.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-8">
          {groups.map((group) => {
            const items = CATEGORIES.filter((c) => c.group === group.id);
            const Icon = group.icon;

            return (
              <div key={group.id} className="space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 border-b border-stone-200/80 dark:border-slate-800 pb-2">
                  <Icon className="w-4 h-4" />
                  <span>{group.label}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {items.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => {
                        onSelectCategory(cat.id);
                        onClose();
                      }}
                      className="p-3 text-left rounded-lg border border-stone-200 dark:border-slate-800 hover:border-blue-500 hover:bg-blue-50/50 dark:hover:bg-slate-800/60 transition-all cursor-pointer group flex flex-col justify-between"
                    >
                      <div>
                        <span className="font-semibold text-xs sm:text-sm text-slate-900 dark:text-stone-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 block transition-colors">
                          {cat.name}
                        </span>
                        <span className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-normal">
                          {cat.description}
                        </span>
                      </div>
                      <div className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold flex items-center gap-1 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <span>Open Category</span>
                        <ArrowRight className="w-3 h-3" />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
