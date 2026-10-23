import React, { useState } from 'react';
import { X, Send, ShieldCheck, Mail, CheckCircle2, Building, DollarSign, Loader2 } from 'lucide-react';
import { SupportedLanguage } from '../i18n/translations.ts';

interface SponsorshipModalProps {
  currentLanguage: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
}

export const SponsorshipModal: React.FC<SponsorshipModalProps> = ({ isOpen, onClose }) => {
  const [companyName, setCompanyName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [packageType, setPackageType] = useState<'newsletter' | 'sponsored_article' | 'billboard_banner'>('newsletter');
  const [message, setMessage] = useState('');
  const [budgetRange, setBudgetRange] = useState('€1,000 – €2,500');
  const [honeypot, setHoneypot] = useState(''); // Anti-spam field
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) {
      setSubmitted(true);
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/sponsorship/inquire', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          companyName,
          contactEmail,
          packageType,
          message,
          budgetRange,
          websiteHoneypot: honeypot,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit inquiry.');
      }

      setSubmitted(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Transmission failed. Please check network.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 sm:px-6 border-b border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-bold font-editorial text-slate-900 dark:text-white">
                Advertise & Partner with FactInfoLive
              </h2>
              <span className="text-[11px] text-slate-500 font-sans">
                Ethical Sponsorships, Research Briefs & Newsletter Placements
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto space-y-6">
          {submitted ? (
            <div className="py-12 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold font-editorial text-slate-950 dark:text-white">
                Inquiry Received
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 max-w-md mx-auto leading-relaxed">
                Thank you for your partnership proposal. Our editorial commercial director will review your campaign objectives and contact you within 24 business hours.
              </p>
              <div className="pt-4">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 text-xs font-semibold rounded-xl"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Sponsorship Packages Overview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div
                  onClick={() => setPackageType('newsletter')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    packageType === 'newsletter'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-stone-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">
                    Package A
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Research Newsletter</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Dedicated sponsor slot in weekly verified intelligence dispatch.</p>
                </div>

                <div
                  onClick={() => setPackageType('sponsored_article')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    packageType === 'sponsored_article'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-stone-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">
                    Package B
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Sponsored Article</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Clearly disclosed partner monograph subject to factual review.</p>
                </div>

                <div
                  onClick={() => setPackageType('billboard_banner')}
                  className={`p-3.5 rounded-xl border text-left cursor-pointer transition-colors ${
                    packageType === 'billboard_banner'
                      ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/30 ring-1 ring-blue-500'
                      : 'border-stone-200 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block mb-1">
                    Package C
                  </span>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">Editorial Billboard</h4>
                  <p className="text-[11px] text-slate-500 mt-1">Premium top broadsheet positioning on high-traffic departmental hubs.</p>
                </div>
              </div>

              {/* Editorial Independence Notice */}
              <div className="p-3.5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-[11px] leading-relaxed">
                  <strong>Strict Editorial Independence Charter:</strong> All sponsored content and partnerships are visibly marked with permanent disclosure tags. FactInfoLive does not accept deceptive advertising or unverified medical/financial claims.
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Honeypot field for bot protection */}
                <input
                  type="text"
                  name="website_url_check"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  style={{ display: 'none' }}
                  tabIndex={-1}
                  autoComplete="off"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Organization / Brand Name:
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder="e.g. Oxford Clean Energy Labs"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Business Email:
                    </label>
                    <input
                      type="email"
                      required
                      value={contactEmail}
                      onChange={(e) => setContactEmail(e.target.value)}
                      placeholder="name@organization.org"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Campaign Package:
                    </label>
                    <select
                      value={packageType}
                      onChange={(e) => setPackageType(e.target.value as any)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                    >
                      <option value="newsletter">Package A: Research Newsletter Sponsor</option>
                      <option value="sponsored_article">Package B: Verified Sponsored Article</option>
                      <option value="billboard_banner">Package C: Editorial Billboard Placement</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Estimated Budget:
                    </label>
                    <select
                      value={budgetRange}
                      onChange={(e) => setBudgetRange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                    >
                      <option value="€500 – €1,000">€500 – €1,000</option>
                      <option value="€1,000 – €2,500">€1,000 – €2,500</option>
                      <option value="€2,500 – €5,000">€2,500 – €5,000</option>
                      <option value="€5,000+">€5,000+</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Campaign Scope & Message:
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your initiative, target audience, and proposed timeline..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>

                {errorMessage && (
                  <div className="text-xs text-red-500 font-medium">
                    {errorMessage}
                  </div>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Transmitting Inquiry...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-3.5 h-3.5" />
                        <span>Submit Partnership Inquiry</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
