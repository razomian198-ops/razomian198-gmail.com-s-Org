import React from 'react';
import { CATEGORIES } from '../data/categories.ts';
import { pathForCategoryId } from '../data/routes.ts';

interface Props {
  onSelectCategory: (id: string) => void;
}

const GROUPS: { title: string; ids: string[] }[] = [
  { title: 'News', ids: ['breaking', 'world', 'politics', 'business', 'finance', 'elections'] },
  { title: 'Science & Tech', ids: ['tech', 'science', 'health', 'climate'] },
  { title: 'Sports', ids: ['sports', 'football', 'cricket', 'basketball', 'tennis', 'f1'] },
  { title: 'Learn & Verify', ids: ['facttrail', 'ai-tools', 'deep-explainers', 'quick-summaries', 'guides-faqs'] },
];

const EXTRA_NAMES: Record<string, string> = {
  facttrail: 'FactTrail',
  'ai-tools': 'AI Tools',
  'deep-explainers': 'Deep Explainers',
  'quick-summaries': '30-Second Summaries',
  'guides-faqs': 'Guides & FAQs',
};

/** Browse-by-topic block. Uses real links so crawlers and "open in new tab" work. */
export const TopicTiles: React.FC<Props> = ({ onSelectCategory }) => {
  const nameOf = (id: string) => EXTRA_NAMES[id] || CATEGORIES.find((c) => c.id === id)?.name || id;
  return (
    <nav aria-label="Browse by topic" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {GROUPS.map((g) => (
        <div
          key={g.title}
          className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-xl p-4"
        >
          <h2 className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-3">
            {g.title}
          </h2>
          <ul className="flex flex-wrap gap-2">
            {g.ids.map((id) => (
              <li key={id}>
                <a
                  href={pathForCategoryId(id)}
                  onClick={(e) => {
                    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                    e.preventDefault();
                    onSelectCategory(id);
                  }}
                  className="inline-block text-xs font-medium px-2.5 py-1 rounded-full bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-blue-50 dark:hover:bg-slate-700 hover:text-blue-700 transition-colors"
                >
                  {nameOf(id)}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
};
