import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  ExternalLink,
  HelpCircle,
  AlertTriangle,
  Scale,
  CheckCircle2,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { AskAssistantResponse } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface AskAiPanelProps {
  currentLanguage: SupportedLanguage;
}

export const AskAiPanel: React.FC<AskAiPanelProps> = ({ currentLanguage }) => {
  const t = TRANSLATIONS[currentLanguage];
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<AskAssistantResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const samplePrompts = [
    "What are today's major world developments?",
    "Explain the latest James Webb Space Telescope discovery in simple English.",
    "Compare the main arguments regarding clean energy grid transition.",
    "What happened in the Premier League title race this week?",
  ];

  const handleAsk = async (promptToAsk?: string) => {
    const q = (promptToAsk || query).trim();
    if (!q || loading) return;

    setLoading(true);
    setError(null);
    if (promptToAsk) setQuery(promptToAsk);

    try {
      const res = await fetch('/api/assistant/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: q, language: currentLanguage }),
      });

      if (!res.ok) {
        throw new Error(`Server returned error ${res.status}`);
      }

      const data: AskAssistantResponse = await res.json();
      setResponse(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to synthesize answer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-900 text-stone-100 rounded-2xl p-6 sm:p-8 lg:p-10 border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Subtle background gradient */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial text-white flex items-center gap-2">
              <span>{t.askAssistant}</span>
              <span className="text-[11px] font-sans font-medium uppercase tracking-wider text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800/60">
                Gemini 3.8 Intelligence
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Grounded multi-perspective research engine with authentic source citations
            </p>
          </div>
        </div>
      </div>

      {/* Prompt Form */}
      <div className="relative z-10">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="flex flex-col sm:flex-row items-stretch gap-2.5"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchPlaceholder}
              disabled={loading}
              className="w-full bg-slate-950/80 border border-slate-700/80 focus:border-blue-500 text-sm text-stone-100 placeholder:text-slate-500 rounded-xl px-4 py-3 outline-none transition-colors"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center justify-center gap-2 transition-colors cursor-pointer shrink-0 shadow-sm"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Synthesizing...</span>
              </>
            ) : (
              <>
                <span>{t.askButton}</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Suggested Quick Prompts */}
        <div className="flex items-center gap-2 flex-wrap mt-3 text-xs text-slate-400">
          <span className="text-slate-500 font-medium shrink-0 flex items-center gap-1">
            <HelpCircle className="w-3.5 h-3.5" /> Examples:
          </span>
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleAsk(p)}
              disabled={loading}
              className="px-2.5 py-1 bg-slate-800/80 hover:bg-slate-800 text-slate-300 rounded-md border border-slate-700/60 transition-colors cursor-pointer truncate max-w-xs text-[11px]"
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div className="relative z-10 mt-6 p-4 rounded-xl bg-red-950/50 border border-red-800/60 text-xs text-red-200 flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block mb-0.5">Intelligence Service Notice</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* AI Synthesis Result */}
      {response && (
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800 space-y-6">
          {/* Metadata pill-less strip */}
          <div className="flex items-center flex-wrap gap-2 text-xs text-slate-400">
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" /> Verified Grounding
            </span>
            <span aria-hidden="true">·</span>
            <span>Confidence: <strong className="text-slate-200 capitalize font-medium">{response.confidence.replace('_', ' ')}</strong></span>
            <span aria-hidden="true">·</span>
            <span>Engine: {response.modelUsed}</span>
          </div>

          {/* Core Synthesized Answer */}
          <div className="bg-slate-950/60 rounded-xl p-5 border border-slate-800/80">
            <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed font-sans space-y-3 whitespace-pre-line">
              {response.answer}
            </div>
          </div>

          {/* Competing Perspectives if available */}
          {response.perspectives && (response.perspectives.perspectiveA || response.perspectives.perspectiveB) && (
            <div className="bg-slate-950/40 rounded-xl p-5 border border-slate-800">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-blue-400 flex items-center gap-1.5 mb-3">
                <Scale className="w-4 h-4" />
                <span>{t.perspectives}</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {response.perspectives.perspectiveA && (
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-200 block mb-1">Perspective A:</span>
                    <p className="text-slate-400 leading-relaxed">{response.perspectives.perspectiveA}</p>
                  </div>
                )}
                {response.perspectives.perspectiveB && (
                  <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800/80">
                    <span className="font-semibold text-slate-200 block mb-1">Perspective B:</span>
                    <p className="text-slate-400 leading-relaxed">{response.perspectives.perspectiveB}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Primary Sourced Citations */}
          {response.citations && response.citations.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                {t.citations} ({response.citations.length})
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {response.citations.map((cite, i) => (
                  <a
                    key={i}
                    href={cite.url}
                    target="_blank"
                    rel="noreferrer"
                    className="p-3 bg-slate-950/50 hover:bg-slate-950 border border-slate-800/80 hover:border-slate-700 rounded-lg text-xs text-slate-300 transition-colors flex flex-col justify-between group"
                  >
                    <span className="font-medium text-slate-200 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {cite.title}
                    </span>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                      <span>{cite.publisher}</span>
                      <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-blue-400" />
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Recommended follow-up questions */}
          {response.suggestedFollowUps && response.suggestedFollowUps.length > 0 && (
            <div className="pt-2">
              <span className="text-xs font-semibold text-slate-400 block mb-2">{t.followUps}:</span>
              <div className="flex flex-wrap gap-2">
                {response.suggestedFollowUps.map((followUp, i) => (
                  <button
                    key={i}
                    onClick={() => handleAsk(followUp)}
                    disabled={loading}
                    className="text-left text-xs bg-slate-800 hover:bg-slate-700/80 text-blue-300 px-3 py-1.5 rounded-lg border border-slate-700/60 transition-colors cursor-pointer"
                  >
                    → {followUp}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Editorial / Clinical Disclaimer */}
          <div className="pt-4 border-t border-slate-800 text-[11px] text-slate-500 flex items-center justify-between flex-wrap gap-2">
            <span>{t.disclaimer}</span>
            {response.limitations && (
              <span className="italic">Note: {response.limitations}</span>
            )}
          </div>
        </div>
      )}
    </section>
  );
};
