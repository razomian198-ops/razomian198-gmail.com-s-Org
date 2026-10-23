import React, { useState, useEffect } from 'react';
import {
  Heart,
  X,
  CheckCircle2,
  ShieldCheck,
  Download,
  ExternalLink,
  Sparkles,
  CreditCard,
  Lock,
  Globe,
  Loader2,
  Users,
  AlertTriangle
} from 'lucide-react';

import { SupportedLanguage } from '../i18n/translations.ts';
import { PatronContribution, MonetizationSettings } from '../../server/services/types.ts';

interface SupporterModalProps {
  currentLanguage: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
  onContributionSuccess?: () => void;
}

export const SupporterModal: React.FC<SupporterModalProps> = ({
  isOpen,
  onClose,
  onContributionSuccess,
}) => {
  const [interval, setInterval] = useState<'monthly' | 'one-time'>('monthly');
  const [selectedTier, setSelectedTier] = useState<string>('sustaining');
  const [customAmount, setCustomAmount] = useState<string>('15');
  const [name, setName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [anonymous, setAnonymous] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [receipt, setReceipt] = useState<PatronContribution | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [monetization, setMonetization] = useState<MonetizationSettings | null>(null);
  const [recentPatrons, setRecentPatrons] = useState<PatronContribution[]>([]);

  useEffect(() => {
    if (!isOpen) return;

    fetch('/api/monetization/settings')
      .then((res) => res.json())
      .then((data) => setMonetization(data))
      .catch(() => {});

    fetch('/api/patronage/patrons')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setRecentPatrons(data);
      })
      .catch(() => {});
  }, [isOpen]);

  if (!isOpen) return null;

  const tiers = [
    {
      id: 'supporter',
      name: 'Reader Supporter',
      monthly: 3,
      oneTime: 5,
      description: 'Keeps our open-source crawlers & fact-checking engines operating 24/7.',
    },
    {
      id: 'sustaining',
      name: 'Sustaining Fellow',
      monthly: 9,
      oneTime: 25,
      popular: true,
      description: 'Sponsors peer-reviewed scientific deep-dives and exoplanet dossier analyses.',
    },
    {
      id: 'patron',
      name: 'Founding Patron',
      monthly: 25,
      oneTime: 100,
      description: 'Funds investigative cross-border reporting and dedicated server telemetry.',
    },
  ];

  const getActiveAmount = (): number => {
    if (selectedTier === 'custom') {
      const parsed = parseFloat(customAmount);
      return isNaN(parsed) || parsed <= 0 ? 5 : parsed;
    }
    const tier = tiers.find((t) => t.id === selectedTier);
    if (!tier) return 9;
    return interval === 'monthly' ? tier.monthly : tier.oneTime;
  };

  const getTierName = (): string => {
    if (selectedTier === 'custom') return 'Custom Patronage';
    const tier = tiers.find((t) => t.id === selectedTier);
    return tier ? tier.name : 'Sustaining Fellow';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setErrorMessage('Please enter a valid email address for receipt delivery.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    const amount = getActiveAmount();
    const tierName = getTierName();

    try {
      const res = await fetch('/api/patronage/contribute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patronName: name.trim() || 'Anonymous Supporter',
          patronEmail: email.trim(),
          amount,
          currency: 'EUR',
          interval,
          tierName,
          anonymous,
          paymentMethod: 'Instant Card / Free Tier Test Mode',
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process contribution');
      }

      setReceipt(data.receipt);
      localStorage.setItem('factinfolive_patron_badge', 'true');
      if (onContributionSuccess) onContributionSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || 'Payment simulation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const patronage = monetization?.patronage || {
    goalMonthlyEuro: 1500,
    currentMonthlyEuro: 0,
    headline: 'Support FactInfoLive Independent Intelligence',
    description:
      'Help us maintain 100% reader-funded, unbiased verification without corporate influence, paywalls, or sensationalist clickbait.',
    stripePaymentLink: '',
    kofiUrl: '',
    buyMeACoffeeUrl: '',
  };

  const goalPercent = Math.min(
    100,
    Math.round(((patronage.currentMonthlyEuro || 0) / (patronage.goalMonthlyEuro || 1500)) * 100)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 sm:px-6 border-b border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <Heart className="w-5 h-5 fill-rose-500/20" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold font-editorial text-slate-900 dark:text-white">
                FactInfoLive Reader Patronage
              </h2>
              <span className="text-[11px] text-slate-500 font-sans">
                Zero Paywalls · Zero Corporate Favors · 100% Open Access Intelligence
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-stone-200 rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {receipt ? (
            /* Thank You & Demo Receipt View */
            <div className="space-y-6 text-center py-4 animate-fade-in">
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <span className="inline-block px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-800 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-2">
                  DEMONSTRATION &amp; LOCAL LEDGER RECEIPT
                </span>
                <h3 className="text-xl font-bold font-editorial text-slate-900 dark:text-white">
                  Pledge Recorded in Local Demonstration Ledger
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-1 max-w-md mx-auto font-sans leading-relaxed">
                  Thank you! Your simulated test entry has been logged in this platform instance&apos;s local ledger.
                  <strong> No money was charged to any payment card or banking account.</strong>
                </p>
              </div>

              {/* Digital Demonstration Receipt Card */}
              <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 text-left max-w-md mx-auto space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between border-b border-stone-200 dark:border-slate-800 pb-2">
                  <span className="font-bold text-slate-900 dark:text-white">FACTINFOLIVE PLEDGE RECEIPT</span>
                  <span className="text-blue-600 dark:text-blue-400">{receipt.receiptNumber}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Tier:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">{receipt.tierName}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Pledged Amount:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    €{receipt.amount}.00 ({receipt.interval})
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Name:</span>
                  <span className="text-slate-900 dark:text-white">{receipt.patronName}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400">
                  <span>Timestamp:</span>
                  <span className="text-slate-900 dark:text-white">
                    {new Date(receipt.createdAt).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-400 pt-2 border-t border-stone-200 dark:border-slate-800">
                  <span>Ledger Status:</span>
                  <span className="text-amber-600 dark:text-amber-400 font-bold uppercase">
                    RECORDED IN LOCAL TEST LEDGER
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 pt-1 leading-normal italic">
                  Non-fiscal receipt. For genuine donations, use real provider links (Ko-fi / Stripe).
                </div>
              </div>

              <div className="flex justify-center gap-3">
                <button
                  onClick={() => {
                    window.print();
                  }}
                  className="px-4 py-2 bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Print Demonstration Receipt</span>
                </button>
                <button
                  onClick={onClose}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer"
                >
                  Return to FactInfoLive
                </button>
              </div>
            </div>
          ) : (

            <>
              {/* Transparency Notice */}
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-semibold block">Transparency Notice — Demonstration &amp; Local Ledger Pledge Mode:</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    The interactive pledge form below operates in <strong>demonstration mode</strong> and logs simulated entries to the platform instance&apos;s local ledger. <strong>No real money is debited from any card or bank account.</strong>
                    To make genuine contributions, use the external provider channels (Ko-fi, Buy Me a Coffee, Stripe) below once connected by the publisher.
                  </p>
                </div>
              </div>

              {/* Mission Statement & Progress */}
              <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/40 space-y-3">
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 font-sans leading-relaxed">
                  {patronage.description}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                    <span>Monthly Operating Target: €{patronage.goalMonthlyEuro}</span>
                    <span className="text-blue-600 dark:text-blue-400">
                      €{patronage.currentMonthlyEuro} recorded in ledger ({goalPercent}%)
                    </span>
                  </div>
                  <div className="w-full bg-blue-200 dark:bg-blue-900/50 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                      style={{ width: `${goalPercent}%` }}
                    />
                  </div>
                </div>
              </div>


              {/* Interval Switcher */}
              <div className="flex justify-center">
                <div className="inline-flex rounded-lg p-1 bg-stone-100 dark:bg-slate-800 border border-stone-200 dark:border-slate-700 text-xs">
                  <button
                    type="button"
                    onClick={() => setInterval('monthly')}
                    className={`px-4 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      interval === 'monthly'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    Monthly Sustaining (Recommended)
                  </button>
                  <button
                    type="button"
                    onClick={() => setInterval('one-time')}
                    className={`px-4 py-1.5 rounded-md font-semibold transition-all cursor-pointer ${
                      interval === 'one-time'
                        ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    One-Time Contribution
                  </button>
                </div>
              </div>

              {/* Tiers Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {tiers.map((t) => {
                  const amount = interval === 'monthly' ? t.monthly : t.oneTime;
                  const isSelected = selectedTier === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setSelectedTier(t.id)}
                      className={`relative p-4 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/40 ring-2 ring-blue-600/30'
                          : 'border-stone-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900'
                      }`}
                    >
                      {t.popular && (
                        <span className="absolute -top-2.5 right-3 px-2 py-0.5 rounded-full bg-blue-600 text-white text-[9px] font-bold uppercase tracking-wider">
                          Most Popular
                        </span>
                      )}
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          {t.name}
                        </div>
                        <div className="text-2xl font-bold font-editorial text-slate-950 dark:text-white mt-1">
                          €{amount}
                          <span className="text-xs font-normal text-slate-500 font-sans">
                            {interval === 'monthly' ? '/mo' : ''}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 leading-relaxed font-sans">
                          {t.description}
                        </p>
                      </div>

                      <div className="mt-3 pt-2 border-t border-stone-100 dark:border-slate-800/80 flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Ad-Free Badge Included</span>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Custom Amount Option */}
              <div className="flex items-center gap-3 p-3 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 text-xs">
                <input
                  type="radio"
                  id="tier-custom"
                  name="tier"
                  checked={selectedTier === 'custom'}
                  onChange={() => setSelectedTier('custom')}
                  className="cursor-pointer"
                />
                <label htmlFor="tier-custom" className="font-semibold text-slate-800 dark:text-slate-200 cursor-pointer">
                  Choose Custom Amount:
                </label>
                <div className="flex items-center gap-1 font-bold text-slate-900 dark:text-white">
                  <span>€</span>
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={customAmount}
                    onChange={(e) => {
                      setCustomAmount(e.target.value);
                      setSelectedTier('custom');
                    }}
                    className="w-20 px-2 py-1 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-700 rounded text-xs"
                  />
                </div>
              </div>

              {/* Contribution Form */}
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Full Name or Pseudonym
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Al-Mansoor"
                      className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Email Address (for receipt &amp; briefing) *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@institution.org"
                      className="w-full px-3 py-2 rounded-lg bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-400">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={anonymous}
                      onChange={(e) => setAnonymous(e.target.checked)}
                      className="cursor-pointer"
                    />
                    <span>Make my contribution anonymous in public registry</span>
                  </label>
                  <span className="flex items-center gap-1 text-[11px] text-slate-400">
                    <Lock className="w-3 h-3 text-emerald-600" />
                    256-bit TLS encrypted
                  </span>
                </div>

                {errorMessage && (
                  <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 text-xs">
                    {errorMessage}
                  </div>
                )}

                {/* Demonstration Mode Submission Button */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 cursor-pointer transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Logging demonstration pledge...</span>
                    </>
                  ) : (
                    <>
                      <CreditCard className="w-4 h-4" />
                      <span>
                        Log Demonstration Pledge (€{getActiveAmount()}.00 {interval === 'monthly' ? '/ Month' : 'Pledge'})
                      </span>
                    </>
                  )}
                </button>
              </form>

              {/* Verified Real Payment Channels */}
              <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-3">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block text-center">
                  Official Financial Contribution Channels:
                </span>

                {Boolean(
                  (patronage.stripePaymentLink && !patronage.stripePaymentLink.includes('test_factinfolive')) ||
                  (patronage.kofiUrl && !patronage.kofiUrl.includes('test_factinfolive')) ||
                  (patronage.buyMeACoffeeUrl && !patronage.buyMeACoffeeUrl.includes('test_factinfolive'))
                ) ? (
                  <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
                    {patronage.stripePaymentLink && !patronage.stripePaymentLink.includes('test_factinfolive') && (
                      <a
                        href={patronage.stripePaymentLink}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold flex items-center gap-1.5 hover:border-blue-500 transition-colors"
                      >
                        <CreditCard className="w-4 h-4 text-blue-600" />
                        <span>Stripe Payment Link</span>
                        <ExternalLink className="w-3 h-3 text-blue-400" />
                      </a>
                    )}
                    {patronage.kofiUrl && !patronage.kofiUrl.includes('test_factinfolive') && (
                      <a
                        href={patronage.kofiUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-lg border border-rose-200 dark:border-rose-800 bg-rose-50/50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 font-semibold flex items-center gap-1.5 hover:border-rose-500 transition-colors"
                      >
                        <Heart className="w-4 h-4 text-rose-500" />
                        <span>Support on Ko-fi (0% Fee)</span>
                        <ExternalLink className="w-3 h-3 text-rose-400" />
                      </a>
                    )}
                    {patronage.buyMeACoffeeUrl && !patronage.buyMeACoffeeUrl.includes('test_factinfolive') && (
                      <a
                        href={patronage.buyMeACoffeeUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-3.5 py-2 rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50/50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 font-semibold flex items-center gap-1.5 hover:border-amber-500 transition-colors"
                      >
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <span>Buy Me a Coffee</span>
                        <ExternalLink className="w-3 h-3 text-amber-400" />
                      </a>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-center space-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 block">
                      Live Payment Providers Not Yet Connected
                    </span>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                      Publishers can paste their real Ko-fi, Buy Me a Coffee, or Stripe Payment Links in the
                      <strong> Admin Dashboard → Revenue &amp; Growth</strong> section to enable fee-free real contributions.
                    </p>
                  </div>
                )}
              </div>


              {/* Public Patron Registry Preview */}
              {recentPatrons.length > 0 && (
                <div className="pt-2 border-t border-stone-200 dark:border-slate-800 space-y-2">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span>Open Registry of Verified Readers &amp; Patrons</span>
                  </div>
                  <div className="divide-y divide-stone-100 dark:divide-slate-800/80 text-[11px]">
                    {recentPatrons.slice(0, 3).map((p) => (
                      <div key={p.id} className="py-1.5 flex items-center justify-between">
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {p.patronName}
                        </span>
                        <span className="text-slate-500">
                          {p.tierName} · €{p.amount} {p.interval}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
