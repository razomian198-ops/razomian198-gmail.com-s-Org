import React, { useState } from 'react';
import {
  Globe,
  Search,
  Sun,
  Moon,
  ShieldCheck,
  Radio,
  ExternalLink,
  ChevronDown,
  Menu,
  X,
  Lock,
  BookOpen,
  Sparkles,
  FileText,
  Heart,
  GitFork
} from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';
import { CATEGORIES } from '../data/categories.ts';
import { NewsItem } from '../../server/services/types.ts';

interface HeaderProps {
  currentLanguage: SupportedLanguage;
  onLanguageChange: (lang: SupportedLanguage) => void;
  isDarkMode: boolean;
  onThemeToggle: () => void;
  breakingNews: NewsItem[];
  activeCategory: string;
  onSelectCategory: (catId: string) => void;
  onOpenSearch: () => void;
  onOpenStatusModal: () => void;
  onOpenArticle: (item: NewsItem) => void;
  onOpenAdminModal: () => void;
  onOpenAdminDashboard: () => void;
  onOpenSupporterModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentLanguage,
  onLanguageChange,
  isDarkMode,
  onThemeToggle,
  breakingNews,
  activeCategory,
  onSelectCategory,
  onOpenSearch,
  onOpenStatusModal,
  onOpenArticle,
  onOpenAdminModal,
  onOpenAdminDashboard,
  onOpenSupporterModal,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [isLangMenuOpen, setIsLangMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ur', label: 'اردو' },
    { code: 'ar', label: 'العربية' },
  ];

  // The 9 core editorial navigation sections requested in Section A
  const editorialSections = [
    { id: 'facttrail', label: 'FactTrail — Storylines' },
    { id: 'latest-news', label: t.latestNews },
    { id: 'blogs', label: t.blogs },
    { id: 'quick-summaries', label: t.quickSummaries },
    { id: 'deep-explainers', label: t.deepExplainers },
    { id: 'research-studies', label: t.researchStudies },
    { id: 'sports-analysis', label: t.sportsAnalysis },
    { id: 'opinion-editorial', label: t.opinionEditorial },
    { id: 'fact-checks', label: t.factChecksNav },
    { id: 'guides-faqs', label: t.guidesFaqs },
  ];

  const [tickerIndex, setTickerIndex] = useState(0);

  React.useEffect(() => {
    if (breakingNews.length <= 1) return;
    const interval = setInterval(() => {
      setTickerIndex((prev) => (prev + 1) % breakingNews.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [breakingNews.length]);

  const currentBreaking = breakingNews.length > 0 ? breakingNews[tickerIndex % breakingNews.length] : null;

  return (
    <header className="sticky top-0 z-40 w-full max-w-full min-w-0 bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-stone-200 dark:border-slate-800 transition-colors">
      {/* 1. Multi-Source Breaking News Ribbon */}
      {currentBreaking && (
        <div className="w-full max-w-full bg-slate-900 text-stone-100 text-xs py-1.5 px-4 flex items-center justify-between border-b border-slate-800 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden min-w-0 flex-1 mr-2">
            <span className="font-semibold tracking-wider uppercase text-blue-400 shrink-0 flex items-center gap-1.5">
              <Radio className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
              {t.breakingNews}
            </span>
            {breakingNews.length > 1 && (
              <span className="text-[10px] bg-slate-800 text-slate-300 font-mono px-1.5 py-0.5 rounded shrink-0">
                {(tickerIndex % breakingNews.length) + 1}/{breakingNews.length}
              </span>
            )}
            <span className="text-slate-400 shrink-0" aria-hidden="true">·</span>
            <button
              onClick={() => onOpenArticle(currentBreaking)}
              className="text-stone-200 hover:text-white truncate font-medium text-left cursor-pointer transition-colors min-w-0"
            >
              {currentBreaking.isTranslated && currentBreaking.translationLanguage === currentLanguage && currentBreaking.translatedTitle
                ? currentBreaking.translatedTitle
                : currentBreaking.title}
            </button>
            <span className="text-blue-400 text-[11px] font-semibold shrink-0 hidden sm:inline">
              [{currentBreaking.publisher}]
            </span>
            <span className="text-slate-500 text-[11px] shrink-0 hidden md:inline">
              · {new Date(currentBreaking.publishedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[11px]">
            {breakingNews.length > 1 && (
              <button
                onClick={() => setTickerIndex((prev) => (prev + 1) % breakingNews.length)}
                className="hover:text-stone-200 text-[10px] underline cursor-pointer hidden sm:inline"
                title="Next breaking story"
              >
                Next Story →
              </button>
            )}
            <a
              href={currentBreaking.url}
              target="_blank"
              rel="noreferrer"
              className="hover:text-stone-100 flex items-center gap-1 transition-colors"
            >
              <span>{t.sourceOriginal}</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* 2. Top Bar Contract: 3 Zones ([Brand wordmark] — [Nav links] — [Primary action / controls]) */}
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4 lg:gap-8 min-w-0">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onSelectCategory('home')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-8 h-8 rounded-md bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              F
            </div>
            <div>
              <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white font-editorial whitespace-nowrap">
                FactInfo<span className="text-blue-600 dark:text-blue-400">Live</span>
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Concise Navigation Links */}
        <nav className="hidden xl:flex items-center gap-5 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-0 shrink">
          <button
            onClick={() => onSelectCategory('facttrail')}
            className={`transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${
              activeCategory === 'facttrail'
                ? 'text-blue-600 dark:text-blue-400 font-bold'
                : 'text-blue-600/90 dark:text-blue-400/90 font-semibold'
            }`}
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>FactTrail</span>
            <span className="text-[10px] bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-bold px-1.5 py-0.5 rounded-full">
              Stories
            </span>
          </button>
          <button
            onClick={() => onSelectCategory('latest-news')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'latest-news' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            {t.latestNews}
          </button>
          <button
            onClick={() => onSelectCategory('blogs')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'blogs' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            {t.blogs}
          </button>
          <button
            onClick={() => onSelectCategory('deep-explainers')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'deep-explainers' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            {t.deepExplainers}
          </button>
          <button
            onClick={() => onSelectCategory('quick-summaries')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'quick-summaries' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            {t.quickSummaries}
          </button>
          <button
            onClick={() => onSelectCategory('fact-checks')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 ${
              activeCategory === 'fact-checks' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            {t.factChecksNav}
          </button>
        </nav>

        {/* Zone 3: Search, Admin Studio, Language, Theme, Status */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Search Button */}
          <button
            onClick={onOpenSearch}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            title="Search"
            aria-label="Search articles and sports"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Support / Patronage Button */}
          {onOpenSupporterModal && (
            <button
              onClick={onOpenSupporterModal}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md transition-colors cursor-pointer"
              title="Support FactInfoLive (Reader Patronage)"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
              <span className="hidden sm:inline">Support</span>
            </button>
          )}

          {/* Secure Admin Dashboard Route Button */}
          <button
            onClick={onOpenAdminDashboard}
            className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors cursor-pointer"
            title="Secure Admin Dashboard (/admin)"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">Admin (/admin)</span>
          </button>

          {/* Sources Transparency Indicator */}
          <button
            onClick={onOpenStatusModal}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-900 hover:bg-stone-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
            title={t.providerStatus}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden 2xl:inline">{t.providerStatus}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div className="relative">
            <button
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              aria-label="Select Language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase">{currentLanguage}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-stone-200 dark:border-slate-800 py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors ${
                      currentLanguage === lang.code ? 'font-semibold text-blue-600 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-[10px] uppercase text-slate-400">{lang.code}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Theme Toggle Button */}
          <button
            onClick={onThemeToggle}
            className="p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
            title={t.themeToggle}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors"
            aria-label="Open Navigation Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Secondary Editorial & Topic Strip (Displays the 9 requested editorial sections) */}
      <div className="w-full max-w-full min-w-0 border-t border-stone-200 dark:border-slate-800 bg-stone-50/80 dark:bg-slate-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav
            aria-label="Editorial & Topic Sections"
            className="w-full max-w-full min-w-0 py-2 flex items-center gap-4 text-xs font-medium text-slate-600 dark:text-slate-400 overflow-x-auto overscroll-x-contain touch-pan-x no-scrollbar"
            style={{
              WebkitOverflowScrolling: 'touch',
              touchAction: 'pan-x pan-y',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {editorialSections.map((sec) => (
              <button
                key={sec.id}
                onClick={() => onSelectCategory(sec.id)}
                className={`whitespace-nowrap shrink-0 transition-colors py-1 hover:text-slate-900 dark:hover:text-white cursor-pointer ${
                  activeCategory === sec.id
                    ? 'text-blue-600 dark:text-blue-400 font-semibold border-b-2 border-blue-600 dark:border-blue-400'
                    : ''
                }`}
              >
                {sec.label}
              </button>
            ))}
            <span className="text-slate-300 dark:text-slate-700 shrink-0 select-none" aria-hidden="true">|</span>
            <button
              onClick={() => onSelectCategory('all-topics')}
              className="whitespace-nowrap shrink-0 py-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer font-medium"
            >
              + {t.allCategories}
            </button>
          </nav>
        </div>
      </div>

      {/* 4. Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4">
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
              Editorial Publications
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {editorialSections.map((sec) => (
                <button
                  key={sec.id}
                  onClick={() => {
                    onSelectCategory(sec.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left p-2 rounded-md transition-colors ${
                    activeCategory === sec.id
                      ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                      : 'text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-900'
                  }`}
                >
                  {sec.label}
                </button>
              ))}
            </div>
          </div>

          <div className="pt-2 border-t border-stone-200 dark:border-slate-800 flex justify-between items-center text-xs">
            <button
              onClick={() => {
                onOpenAdminModal();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-blue-600 font-semibold"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Editorial CMS Studio</span>
            </button>
            <button onClick={onOpenStatusModal} className="text-slate-500">
              {t.providerStatus}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
