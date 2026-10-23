import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Save,
  Send,
  Loader2,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Eye
} from 'lucide-react';
import { EditorialArticle, EditorialPostType, ContentStatus } from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface EditorialAdminModalProps {
  currentLanguage: SupportedLanguage;
  isOpen: boolean;
  onClose: () => void;
  onArticlePublished?: (article: EditorialArticle) => void;
}

export const EditorialAdminModal: React.FC<EditorialAdminModalProps> = ({
  currentLanguage,
  isOpen,
  onClose,
  onArticlePublished,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [token, setToken] = useState<string | null>(localStorage.getItem('factinfolive_admin_token'));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'manage' | 'ai-studio' | 'create'>('manage');

  // Articles state
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);

  // AI Workflow state
  const [aiTopic, setAiTopic] = useState('');
  const [aiType, setAiType] = useState<EditorialPostType>('explainer');
  const [aiCategory, setAiCategory] = useState('science');
  const [runningWorkflow, setRunningWorkflow] = useState(false);
  const [workflowResult, setWorkflowResult] = useState<any | null>(null);
  const [suggestedIdeas, setSuggestedIdeas] = useState<any[]>([]);

  // Manual Editor state
  const [editingArticle, setEditingArticle] = useState<Partial<EditorialArticle> | null>(null);
  const [savingArticle, setSavingArticle] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Load articles
  const fetchAdminArticles = () => {
    if (!token) return;
    setLoadingArticles(true);
    fetch('/api/editorial/articles?status=all', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (res.status === 401) {
          setToken(null);
          localStorage.removeItem('factinfolive_admin_token');
          return null;
        }
        return res.json();
      })
      .then((data) => {
        if (data?.items) setArticles(data.items);
        setLoadingArticles(false);
      })
      .catch(() => setLoadingArticles(false));
  };

  // Load ideas
  const fetchIdeas = () => {
    fetch('/api/editorial/suggest-ideas')
      .then((res) => res.json())
      .then((data) => setSuggestedIdeas(data || []))
      .catch(() => {});
  };

  useEffect(() => {
    if (isOpen && token) {
      fetchAdminArticles();
      fetchIdeas();
    }
  }, [isOpen, token]);

  if (!isOpen) return null;

  // Handle Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: username, password }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        localStorage.setItem('factinfolive_admin_token', data.token);
        setPassword('');
        setUsername('');
      } else {
        setAuthError(data.error || 'Authentication rejected. Verify credentials.');
      }
    } catch {
      setAuthError('Connection failure.');
    }
  };


  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('factinfolive_admin_token');
  };

  // Run AI Editorial Workflow
  const handleRunAiWorkflow = async () => {
    if (!aiTopic.trim() || runningWorkflow || !token) return;
    setRunningWorkflow(true);
    setWorkflowResult(null);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/editorial/ai-workflow', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          topic: aiTopic,
          type: aiType,
          category: aiCategory,
        }),
      });

      if (!res.ok) throw new Error('Workflow failed');
      const data = await res.json();
      setWorkflowResult(data);
      setStatusMessage('AI draft successfully generated and saved to Drafts queue for human verification.');
      fetchAdminArticles();
    } catch (err: any) {
      setStatusMessage(`Workflow execution error: ${err.message}`);
    } finally {
      setRunningWorkflow(false);
    }
  };

  // Save / Update Article
  const handleSaveArticle = async (publishImmediate = false) => {
    if (!editingArticle?.title || !token) return;
    setSavingArticle(true);
    setStatusMessage(null);

    try {
      const payload = {
        ...editingArticle,
        status: publishImmediate ? 'published' : editingArticle.status || 'draft',
      };

      const url = editingArticle.id
        ? `/api/editorial/articles/${editingArticle.id}`
        : '/api/editorial/articles';
      const method = editingArticle.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save failed');
      const saved = await res.json();
      setStatusMessage(
        publishImmediate
          ? `Article "${saved.title}" published to public feed successfully!`
          : `Article saved with status [${saved.status.toUpperCase()}].`
      );

      if (publishImmediate && onArticlePublished) {
        onArticlePublished(saved);
      }

      setEditingArticle(null);
      setActiveTab('manage');
      fetchAdminArticles();
    } catch (err: any) {
      setStatusMessage(`Error saving article: ${err.message}`);
    } finally {
      setSavingArticle(false);
    }
  };

  // Delete article
  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to permanently remove this article?') || !token) return;
    try {
      const res = await fetch(`/api/editorial/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchAdminArticles();
      }
    } catch {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div
        className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-4xl overflow-hidden shadow-2xl relative my-8"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="p-4 sm:px-6 border-b border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <div>
              <h2 className="text-base font-bold font-editorial text-slate-900 dark:text-white">
                FactInfoLive Editorial CMS Studio
              </h2>
              <span className="text-[11px] text-slate-500 font-sans">
                Authenticated Editorial Operations & AI Assistant Workflow
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="text-xs text-red-500 hover:underline px-2 py-1"
              >
                Log Out
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded-md"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          {!token ? (
            /* Authentication Screen */
            <div className="max-w-sm mx-auto py-10 space-y-6 text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold font-editorial text-slate-900 dark:text-white">
                  Editorial Passcode Required
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Access to article drafts, publishing controls, and AI workflow is restricted to authorized editorial staff.
                </p>
              </div>

              <form onSubmit={handleLogin} className="space-y-3">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username or Staff Email"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Staff Password"
                  className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
                {authError && <span className="text-xs text-red-500 block">{authError}</span>}
                <button
                  type="submit"
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors cursor-pointer"
                >
                  Authorize Session
                </button>
                <div className="text-center pt-2">
                  <a
                    href="/admin"
                    onClick={(e) => {
                      e.preventDefault();
                      onClose();
                      window.history.pushState({}, '', '/admin');
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }}
                    className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                  >
                    <span>Launch Full /admin Editorial Studio</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </form>
            </div>
          ) : (
            /* Authenticated Content Management Console */
            <div className="space-y-6">
              {/* Navigation Tabs */}
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-3">
                <button
                  onClick={() => {
                    setEditingArticle(null);
                    setActiveTab('manage');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'manage'
                      ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  Articles & Drafts Queue ({articles.length})
                </button>
                <button
                  onClick={() => setActiveTab('ai-studio')}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                    activeTab === 'ai-studio'
                      ? 'bg-blue-600 text-white'
                      : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>AI Content Assistant</span>
                </button>
                <button
                  onClick={() => {
                    setEditingArticle({
                      title: '',
                      subtitle: '',
                      content: '',
                      type: 'blog',
                      category: 'world',
                      status: 'draft',
                      tags: [],
                    });
                    setActiveTab('create');
                  }}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                    activeTab === 'create'
                      ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                  }`}
                >
                  + New Manual Article
                </button>
              </div>

              {/* Status Message */}
              {statusMessage && (
                <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
                  <span>{statusMessage}</span>
                  <button onClick={() => setStatusMessage(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* TAB 1: Manage Articles / Drafts Queue */}
              {activeTab === 'manage' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>Manage drafts, review status, and live publications</span>
                    <button
                      onClick={fetchAdminArticles}
                      className="flex items-center gap-1 text-blue-600 hover:underline"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {loadingArticles ? (
                    <div className="py-12 flex justify-center text-blue-600">
                      <Loader2 className="w-6 h-6 animate-spin" />
                    </div>
                  ) : articles.length > 0 ? (
                    <div className="divide-y divide-stone-100 dark:divide-slate-800/80 border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden">
                      {articles.map((art) => (
                        <div
                          key={art.id}
                          className="p-4 hover:bg-stone-50 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4"
                        >
                          <div className="space-y-1 pr-4">
                            <div className="flex items-center gap-2 text-[11px]">
                              <span
                                className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                                  art.status === 'published'
                                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                    : art.status === 'review'
                                    ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                    : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                                }`}
                              >
                                {art.status}
                              </span>
                              <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                                {art.type}
                              </span>
                              <span aria-hidden="true">·</span>
                              <span className="text-slate-400">{art.author.name}</span>
                              {art.isAiAssisted && (
                                <span className="text-purple-500 font-semibold text-[10px]">
                                  AI-Drafted
                                </span>
                              )}
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 dark:text-white line-clamp-1">
                              {art.title}
                            </h4>
                            <p className="text-xs text-slate-500 line-clamp-1">
                              {art.subtitle || art.content.slice(0, 100)}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            {art.status !== 'published' ? (
                              <button
                                onClick={() => {
                                  setEditingArticle(art);
                                  handleSaveArticle(true);
                                }}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-semibold cursor-pointer"
                              >
                                Publish
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingArticle(art);
                                  handleSaveArticle(false);
                                }}
                                className="px-3 py-1 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 text-slate-700 dark:text-slate-300 rounded text-xs font-medium cursor-pointer"
                              >
                                Unpublish
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingArticle(art);
                                setActiveTab('create');
                              }}
                              className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                              title="Edit Article"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() => handleDeleteArticle(art.id)}
                              className="p-1.5 text-slate-500 hover:text-red-500 rounded"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-xs text-slate-500">
                      No articles in store. Use AI Content Assistant to generate research drafts.
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: AI Editorial Assistant Workflow */}
              {activeTab === 'ai-studio' && (
                <div className="space-y-6">
                  <div className="p-4 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-950 dark:text-blue-200">
                    <strong className="block font-semibold mb-1">
                      10-Step AI Editorial Assistant Workflow Protocol:
                    </strong>
                    <ol className="list-decimal list-inside space-y-0.5 text-[11px] opacity-90">
                      <li>Retrieves source material from live wire index</li>
                      <li>Generates outline and analytical structure</li>
                      <li>Drafts explanatory article with empirical citations</li>
                      <li>Extracts claims requiring human verification with attached source links</li>
                      <li>Identifies missing evidence, conflicting information, or outdated facts</li>
                      <li><strong>Saves as a DRAFT for human review</strong> (never published by default)</li>
                    </ol>
                  </div>

                  {/* Topic & Controls */}
                  <div className="space-y-3">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Article Topic or Headline Angle:
                    </label>
                    <input
                      type="text"
                      value={aiTopic}
                      onChange={(e) => setAiTopic(e.target.value)}
                      placeholder="e.g. Next-Generation Solid-State Electrolytes or European Central Bank Liquidity Guardrails..."
                      className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />

                    {/* Suggested Ideas from Wire */}
                    {suggestedIdeas.length > 0 && (
                      <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                        <span className="text-slate-400 text-[11px] font-semibold">Suggested from live wire:</span>
                        {suggestedIdeas.map((idea, i) => (
                          <button
                            key={i}
                            onClick={() => {
                              setAiTopic(idea.title);
                              setAiCategory(idea.category);
                            }}
                            className="px-2.5 py-1 rounded bg-stone-100 dark:bg-slate-800 hover:bg-stone-200 text-slate-600 dark:text-slate-300 text-[11px] truncate max-w-xs cursor-pointer"
                          >
                            {idea.title}
                          </button>
                        ))}
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">
                          Article Format:
                        </label>
                        <select
                          value={aiType}
                          onChange={(e) => setAiType(e.target.value as EditorialPostType)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                        >
                          <option value="explainer">Deep Explainer</option>
                          <option value="blog">Blog / Essay</option>
                          <option value="summary">30-Second Summary</option>
                          <option value="research">Research & Studies</option>
                          <option value="sports-analysis">Sports Analysis</option>
                          <option value="fact-check">Fact Check</option>
                          <option value="guide">Guide & FAQ</option>
                          <option value="opinion">Opinion & Editorial</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-medium text-slate-500 block mb-1">
                          Category:
                        </label>
                        <select
                          value={aiCategory}
                          onChange={(e) => setAiCategory(e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize"
                        >
                          <option value="science">Science</option>
                          <option value="technology">Technology</option>
                          <option value="world">World</option>
                          <option value="sports">Sports</option>
                          <option value="business">Economy & Business</option>
                          <option value="health">Health</option>
                          <option value="society">Society</option>
                        </select>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={handleRunAiWorkflow}
                        disabled={runningWorkflow || !aiTopic.trim()}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                      >
                        {runningWorkflow ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>Retrieving sources & executing 10-step workflow...</span>
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4" />
                            <span>Run 10-Step AI Content Workflow & Save Draft</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Workflow Result Preview */}
                  {workflowResult && (
                    <div className="p-5 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/50 dark:bg-slate-950/50 space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Draft Saved (ID: {workflowResult.article.id})</span>
                        </span>
                        <button
                          onClick={() => {
                            setEditingArticle(workflowResult.article);
                            setActiveTab('create');
                          }}
                          className="text-xs text-blue-600 hover:underline font-semibold"
                        >
                          Open in Editor & Review Claims →
                        </button>
                      </div>

                      <div className="text-xs space-y-2 text-slate-700 dark:text-slate-300">
                        <div>
                          <strong>Generated Title:</strong> {workflowResult.article.title}
                        </div>
                        <div>
                          <strong>Retrieved Sources:</strong> {workflowResult.workflowMetadata.sourcesRetrievedCount} wire articles
                        </div>
                        <div>
                          <strong>Extracted Claims to Verify:</strong> {workflowResult.workflowMetadata.claimsCount} claims
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Manual Article Editor & Claims Verification */}
              {activeTab === 'create' && editingArticle && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-stone-200 dark:border-slate-800">
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      {editingArticle.id ? 'Edit Article & Verify Claims' : 'Draft New Article'}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleSaveArticle(false)}
                        disabled={savingArticle}
                        className="px-3 py-1.5 bg-stone-200 dark:bg-slate-800 hover:bg-stone-300 text-slate-800 dark:text-stone-200 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save as Draft</span>
                      </button>
                      <button
                        onClick={() => handleSaveArticle(true)}
                        disabled={savingArticle}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Publish to Live Site</span>
                      </button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Title:
                      </label>
                      <input
                        type="text"
                        value={editingArticle.title || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                        className="w-full px-3 py-2 text-xs sm:text-sm rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Subtitle / Deck:
                      </label>
                      <input
                        type="text"
                        value={editingArticle.subtitle || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, subtitle: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Type:
                        </label>
                        <select
                          value={editingArticle.type || 'blog'}
                          onChange={(e) => setEditingArticle({ ...editingArticle, type: e.target.value as EditorialPostType })}
                          className="w-full px-3 py-1.5 text-xs rounded bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        >
                          <option value="blog">Blog</option>
                          <option value="explainer">Explainer</option>
                          <option value="summary">Summary</option>
                          <option value="research">Research</option>
                          <option value="sports-analysis">Sports Analysis</option>
                          <option value="opinion">Opinion</option>
                          <option value="fact-check">Fact Check</option>
                          <option value="guide">Guide</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Category:
                        </label>
                        <input
                          type="text"
                          value={editingArticle.category || 'world'}
                          onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                          className="w-full px-3 py-1.5 text-xs rounded bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                          Publication Status:
                        </label>
                        <select
                          value={editingArticle.status || 'draft'}
                          onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value as ContentStatus })}
                          className="w-full px-3 py-1.5 text-xs rounded bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white font-semibold"
                        >
                          <option value="draft">Draft (Private)</option>
                          <option value="review">Under Review</option>
                          <option value="published">Published (Public)</option>
                          <option value="archived">Archived</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                        Markdown Content:
                      </label>
                      <textarea
                        rows={10}
                        value={editingArticle.content || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                        className="w-full px-4 py-3 text-xs sm:text-sm font-mono rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>

                    {/* Claims Verification Table */}
                    {editingArticle.claimsToVerify && editingArticle.claimsToVerify.length > 0 && (
                      <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950 space-y-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                          Claims Requiring Human Fact-Checking:
                        </span>
                        <div className="space-y-2">
                          {editingArticle.claimsToVerify.map((cl, idx) => (
                            <div key={idx} className="flex items-start justify-between gap-3 text-xs p-2 rounded bg-white dark:bg-slate-900 border border-stone-200/80 dark:border-slate-800">
                              <div>
                                <span className="font-medium text-slate-900 dark:text-white">{cl.claim}</span>
                                {cl.sourceUrl && (
                                  <a href={cl.sourceUrl} target="_blank" rel="noreferrer" className="text-blue-500 hover:underline block text-[11px] mt-0.5">
                                    Source: {cl.sourceUrl}
                                  </a>
                                )}
                              </div>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] shrink-0">
                                ✓ Verified Sourced
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
