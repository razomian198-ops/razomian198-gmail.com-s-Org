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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const moreMenuRef = React.useRef<HTMLDivElement>(null);
  const langMenuRef = React.useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click or Escape key
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setIsMoreMenuOpen(false);
      }
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setIsLangMenuOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsMoreMenuOpen(false);
        setIsLangMenuOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'it', label: 'Italiano' },
    { code: 'fr', label: 'Français' },
    { code: 'es', label: 'Español' },
    { code: 'de', label: 'Deutsch' },
    { code: 'ur', label: 'اردو' },
    { code: 'ar', label: 'العربية' },
  ];

  // The core editorial navigation sections displayed in the secondary strip and mobile drawer
  const editorialSections = [
    { id: 'facttrail', label: 'FactTrail — Storylines' },
    { id: 'latest-news', label: t.latestNews },
    { id: 'ai-tools', label: 'AI Tools Directory' },
    { id: 'blogs', label: t.blogs },
    { id: 'quick-summaries', label: t.quickSummaries },
    { id: 'deep-explainers', label: t.deepExplainers },
    { id: 'research-studies', label: t.researchStudies },
    { id: 'sports-analysis', label: t.sportsAnalysis },
    { id: 'opinion-editorial', label: t.opinionEditorial },
    { id: 'fact-checks', label: t.factChecksNav },
    { id: 'guides-faqs', label: t.guidesFaqs },
    { id: 'reviews', label: 'Reviews & Benchmarks' },
  ];

  // Secondary destinations exposed via the desktop "More" menu
  const moreSections = [
    { id: 'ai-tools', label: 'AI Tools Directory' },
    { id: 'deep-explainers', label: t.deepExplainers },
    { id: 'quick-summaries', label: t.quickSummaries },
    { id: 'fact-checks', label: t.factChecksNav },
    { id: 'research-studies', label: t.researchStudies },
    { id: 'sports-analysis', label: t.sportsAnalysis },
    { id: 'opinion-editorial', label: t.opinionEditorial },
    { id: 'guides-faqs', label: t.guidesFaqs },
    { id: 'reviews', label: 'Reviews & Benchmarks' },
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

      {/* 2. Top Bar Contract: 3 Distinct Zones ([A: Brand] — [B: Primary Nav + More] — [C: Controls & Actions]) */}
      <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3 flex items-center justify-between gap-3 lg:gap-6 min-w-0">
        {/* AREA A (LEFT): FactInfoLive Logo & Brand */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => onSelectCategory('home')}
            className="flex items-center gap-2 sm:gap-2.5 text-left group cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-md"
            aria-label="FactInfoLive Home"
          >
            <div className="w-7 h-7 sm:w-8 h-8 rounded-md bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center font-bold text-base sm:text-lg shadow-sm shrink-0 transition-transform group-hover:scale-105">
              F
            </div>
            <span className="text-lg sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-white font-editorial whitespace-nowrap">
              FactInfo<span className="text-blue-600 dark:text-blue-400">Live</span>
            </span>
          </button>
        </div>

        {/* AREA B (CENTRE): Primary Navigation (High-priority destinations + More dropdown) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center justify-center gap-4 xl:gap-6 text-sm font-medium text-slate-700 dark:text-slate-200 min-w-0"
        >
          {/* FactTrail */}
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

          {/* Latest News */}
          <button
            onClick={() => onSelectCategory('latest-news')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${
              activeCategory === 'latest-news' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            {t.latestNews}
          </button>

          {/* Blogs & Essays */}
          <button
            onClick={() => onSelectCategory('blogs')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer ${
              activeCategory === 'blogs' ? 'text-blue-600 dark:text-blue-400 font-semibold' : ''
            }`}
          >
            {t.blogs}
          </button>

          {/* Working More Dropdown (Exposes Deep Explainers, Quick Summaries, Fact Checks, etc.) */}
          <div ref={moreMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
              className={`flex items-center gap-1 py-1 px-2.5 rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors whitespace-nowrap cursor-pointer ${
                moreSections.some((sec) => sec.id === activeCategory)
                  ? 'text-blue-600 dark:text-blue-400 font-semibold bg-blue-50/70 dark:bg-blue-950/40'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
              aria-haspopup="true"
              aria-expanded={isMoreMenuOpen}
            >
              <span>More</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isMoreMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isMoreMenuOpen && (
              <div className="absolute left-0 mt-2 w-52 bg-white dark:bg-slate-900 rounded-lg shadow-xl border border-stone-200 dark:border-slate-800 py-1.5 z-50">
                <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Sections & Analysis
                </div>
                {moreSections.map((sec) => (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      onSelectCategory(sec.id);
                      setIsMoreMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
                      activeCategory === sec.id
                        ? 'font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50'
                        : 'text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <span>{sec.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </nav>

        {/* AREA C (RIGHT): Search, Support, Admin, Transparency, Language, Theme, Mobile Toggle */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Search Button (Always accessible at every viewport) */}
          <button
            type="button"
            onClick={onOpenSearch}
            className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors cursor-pointer shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
            title="Search articles, sports, science"
            aria-label="Search articles and sports"
          >
            <Search className="w-4 h-4" />
          </button>

          {/* Support / Patronage Button */}
          {onOpenSupporterModal && (
            <button
              type="button"
              onClick={onOpenSupporterModal}
              className="h-9 hidden sm:inline-flex items-center gap-1.5 px-2.5 text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 rounded-md transition-colors cursor-pointer shrink-0"
              title="Support FactInfoLive (Reader Patronage)"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500/20" />
              <span className="hidden md:inline">Support</span>
            </button>
          )}

          {/* Secure Admin Dashboard Route Button */}
          <button
            type="button"
            onClick={onOpenAdminDashboard}
            className="h-9 hidden md:inline-flex items-center gap-1.5 px-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-900 hover:bg-blue-50 dark:hover:bg-blue-950/60 hover:text-blue-600 dark:hover:text-blue-400 rounded-md transition-colors cursor-pointer shrink-0"
            title="Secure Admin Dashboard (/admin)"
          >
            <Lock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden xl:inline">Admin</span>
          </button>

          {/* Sources Transparency Indicator */}
          <button
            type="button"
            onClick={onOpenStatusModal}
            className="h-9 hidden sm:inline-flex items-center gap-1.5 px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 bg-stone-100 dark:bg-slate-900 hover:bg-stone-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer shrink-0"
            title={t.providerStatus}
          >
            <ShieldCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span className="hidden 2xl:inline">{t.providerStatus}</span>
          </button>

          {/* Language Selector Dropdown */}
          <div ref={langMenuRef} className="relative shrink-0">
            <button
              type="button"
              onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
              className="h-9 flex items-center gap-1 px-2 sm:px-2.5 text-xs font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors cursor-pointer"
              aria-label="Select Language"
              aria-haspopup="true"
              aria-expanded={isLangMenuOpen}
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="uppercase text-[11px] sm:text-xs">{currentLanguage}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {isLangMenuOpen && (
              <div className="absolute right-0 mt-1 w-36 bg-white dark:bg-slate-900 rounded-lg shadow-lg border border-stone-200 dark:border-slate-800 py-1 z-50">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => {
                      onLanguageChange(lang.code);
                      setIsLangMenuOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 text-xs flex items-center justify-between hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer ${
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
            type="button"
            onClick={onThemeToggle}
            className="h-9 w-9 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
            title={t.themeToggle}
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* Mobile Menu Toggle (Visible whenever desktop nav is hidden: lg:hidden) */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="h-9 w-9 lg:hidden flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white rounded-md hover:bg-stone-100 dark:hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
            aria-label="Open Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* 3. Secondary Editorial & Topic Strip (Displays the editorial sections) */}
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
        <div className="lg:hidden border-t border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-4 space-y-4 shadow-lg">
          {/* Quick Search Button in Mobile Drawer */}
          <button
            type="button"
            onClick={() => {
              setIsMobileMenuOpen(false);
              onOpenSearch();
            }}
            className="w-full flex items-center justify-between p-2.5 rounded-lg bg-stone-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 text-xs font-medium hover:bg-stone-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <Search className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>{t.searchPlaceholder}</span>
            </span>
            <span className="text-[10px] text-slate-400 font-mono">Search</span>
          </button>

          {/* Support in Mobile Drawer */}
          {onOpenSupporterModal && (
            <button
              type="button"
              onClick={() => {
                setIsMobileMenuOpen(false);
                onOpenSupporterModal();
              }}
              className="w-full flex items-center gap-2 p-2.5 rounded-lg text-xs font-semibold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 transition-colors cursor-pointer"
            >
              <Heart className="w-4 h-4 fill-rose-500/20" />
              <span>Support FactInfoLive (Reader Patronage)</span>
            </button>
          )}

          {/* Primary Highlights in Mobile */}
          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
              Core Highlights
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('facttrail');
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left p-2 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 ${
                  activeCategory === 'facttrail'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-900'
                }`}
              >
                <GitFork className="w-3 h-3 text-blue-600" />
                <span>FactTrail</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('latest-news');
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left p-2 rounded-md transition-colors cursor-pointer ${
                  activeCategory === 'latest-news'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-900'
                }`}
              >
                {t.latestNews}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('blogs');
                  setIsMobileMenuOpen(false);
                }}
                className={`text-left p-2 rounded-md transition-colors cursor-pointer ${
                  activeCategory === 'blogs'
                    ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-semibold'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-900'
                }`}
              >
                {t.blogs}
              </button>
              <button
                type="button"
                onClick={() => {
                  onSelectCategory('all-topics');
                  setIsMobileMenuOpen(false);
                }}
                className="text-left p-2 rounded-md transition-colors cursor-pointer text-blue-600 dark:text-blue-400 hover:bg-stone-100 dark:hover:bg-slate-900 font-semibold"
              >
                + {t.allCategories}
              </button>
            </div>
          </div>

          <div>
            <span className="text-[11px] uppercase tracking-wider font-bold text-slate-400 block mb-2">
              Editorial Publications
            </span>
            <div className="grid grid-cols-2 gap-2 text-xs font-medium">
              {editorialSections.map((sec) => (
                <button
                  key={sec.id}
                  type="button"
                  onClick={() => {
                    onSelectCategory(sec.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-left p-2 rounded-md transition-colors cursor-pointer ${
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
              type="button"
              onClick={() => {
                onOpenAdminDashboard();
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-semibold cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Admin Dashboard (/admin)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenStatusModal();
                setIsMobileMenuOpen(false);
              }}
              className="text-slate-500 dark:text-slate-400 hover:underline cursor-pointer"
            >
              {t.providerStatus}
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
