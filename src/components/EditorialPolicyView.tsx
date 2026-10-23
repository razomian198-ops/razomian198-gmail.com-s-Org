import React from 'react';
import { ShieldCheck, CheckCircle2, AlertCircle, FileText, ArrowLeft, ExternalLink, HelpCircle } from 'lucide-react';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface EditorialPolicyViewProps {
  currentLanguage: SupportedLanguage;
  onBackToHome: () => void;
}

export const EditorialPolicyView: React.FC<EditorialPolicyViewProps> = ({
  currentLanguage,
  onBackToHome,
}) => {
  const t = TRANSLATIONS[currentLanguage];

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 space-y-10 animate-fade-in">
      {/* Back button */}
      <div>
        <button
          onClick={onBackToHome}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Live Intelligence Center</span>
        </button>
      </div>

      {/* Hero Header */}
      <div className="space-y-3 border-b border-stone-200 dark:border-slate-800 pb-8">
        <div className="inline-flex items-center gap-1.5 text-xs uppercase font-semibold tracking-wider text-blue-600 dark:text-blue-400">
          <ShieldCheck className="w-4 h-4" />
          <span>Charter of Independence & Verification</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold font-editorial text-slate-950 dark:text-white leading-tight">
          FactInfoLive Editorial Standards & Data Provenance Policy
        </h1>
        <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          FactInfoLive was created to combat the erosion of information integrity. Our platform operates with total transparency, preserving primary source attribution, clearly labeling unverified developing stories, and distinguishing confirmed empirical facts from political rhetoric and AI synthesis.
        </p>
      </div>

      {/* Key Tenets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sourcing */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold font-editorial text-slate-900 dark:text-white">
            1. Sourcing Hierarchy & Attribution
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            We prioritize primary documents, institutional statistical releases (e.g., IRENA, NSIDC, WHO), academic peer-reviewed preprints/papers, and established global wire syndication services (The Guardian, BBC, Reuters). We never strip publisher credits, bypass paywalls, or scrape private databases. Every article card features an explicit link directly to the original reporting.
          </p>
        </div>

        {/* Breaking News Discipline */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold font-editorial text-slate-900 dark:text-white">
            2. Breaking News vs. Developing Reports
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            We never label an article &ldquo;breaking&rdquo; merely because it is recently published. Stories labeled &ldquo;Breaking&rdquo; reflect urgent, high-impact world events corroborated by recognized wire services. Developing stories are strictly designated with a yellow &ldquo;Developing&rdquo; badge to inform users that details may evolve as secondary verification arrives.
          </p>
        </div>

        {/* Science & Health Rigor */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <FileText className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold font-editorial text-slate-900 dark:text-white">
            3. Scientific & Medical Verification
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            Health and epidemiology updates are sourced strictly from reputable health ministries, the World Health Organization, and peer-reviewed journals. Preliminary in vitro or animal models are explicitly identified as early-stage research. We emphasize that scientific reporting does not substitute for licensed clinical medical care.
          </p>
        </div>

        {/* AI Transparency */}
        <div className="p-6 rounded-xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-950 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <HelpCircle className="w-4 h-4" />
          </div>
          <h3 className="text-lg font-bold font-editorial text-slate-900 dark:text-white">
            4. AI Synthesis & Citation Ethics
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-sans">
            Our &ldquo;Ask FactInfoLive AI&rdquo; assistant utilizes Google Gemini 3.8 Flash running in a secure server-side runtime. The AI is strictly grounded in retrieved evidence records and must explicitly cite working links. If competing political or economic perspectives exist, the AI must outline both viewpoints neutrally and acknowledge uncertainties.
          </p>
        </div>
      </div>

      {/* Corrections Procedure */}
      <div className="p-6 sm:p-8 rounded-xl bg-stone-100 dark:bg-slate-900/60 border border-stone-200 dark:border-slate-800 space-y-4">
        <h2 className="text-xl font-bold font-editorial text-slate-950 dark:text-white">
          Corrections & Retractions Policy
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-sans">
          When an upstream publisher issues a correction or clarification, our system updates the stored record during the next scheduled cache synchronization. If a viral claim is determined to be unsubstantiated or deceptive, it is cataloged under the <strong>Fact Checks</strong> department with empirical refutations from authoritative public datasets.
        </p>
        <div className="text-xs text-slate-500 pt-2 flex items-center gap-2">
          <span>Feedback or corrections inquiries:</span>
          <span className="font-mono text-slate-700 dark:text-slate-300">editorial@factinfolive.org</span>
        </div>
      </div>
    </div>
  );
};
