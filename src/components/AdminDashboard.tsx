import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
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
  RefreshCw,
  Eye,
  DollarSign,
  TrendingUp,
  Search,
  Globe,
  Users,
  Calendar,
  Clock,
  Check,
  X,
  Smartphone,
  Monitor,
  Link as LinkIcon,
  HelpCircle,
  Tag,
  Share2,
  Download,
  AlertCircle,
  Cpu,
  ShoppingBag,
  MessageSquare
} from 'lucide-react';
import {
  EditorialArticle,
  EditorialPostType,
  ContentStatus,
  AdminUser,
  AffiliateLink,
  SponsorshipInquiry,
  MonetizationSettings,
  NewsletterSubscriber,
  UserRole,
  AiTool,
  AiToolReview,
  ProductItem
} from '../../server/services/types.ts';
import { SupportedLanguage, TRANSLATIONS } from '../i18n/translations.ts';

interface AdminDashboardProps {
  currentLanguage: SupportedLanguage;
  onBackToHome: () => void;
  onOpenArticleBySlug: (slug: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  currentLanguage,
  onBackToHome,
  onOpenArticleBySlug,
}) => {
  const t = TRANSLATIONS[currentLanguage];
  const [token, setToken] = useState<string | null>(localStorage.getItem('factinfolive_admin_token'));
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);

  // Setup state
  const [setupRequired, setSetupRequired] = useState<boolean | null>(null);
  const [setupTokenProtected, setSetupTokenProtected] = useState<boolean>(false);
  const [setupUsername, setSetupUsername] = useState('admin');
  const [setupName, setSetupName] = useState('');
  const [setupEmail, setSetupEmail] = useState('');
  const [setupPassword, setSetupPassword] = useState('');
  const [setupConfirmPassword, setSetupConfirmPassword] = useState('');
  const [setupTokenInput, setSetupTokenInput] = useState('');
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  // Login form state
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<
    'overview' | 'articles' | 'ai-studio' | 'ai-tools' | 'revenue' | 'seo' | 'analytics' | 'team'
  >('overview');

  // AI Tools Directory & Reviews State
  const [adminTools, setAdminTools] = useState<AiTool[]>([]);
  const [adminSubmissions, setAdminSubmissions] = useState<AiTool[]>([]);
  const [adminPendingReviews, setAdminPendingReviews] = useState<(AiToolReview & { toolTitle?: string })[]>([]);
  const [loadingAiTools, setLoadingAiTools] = useState(false);
  const [aiToolsSubTab, setAiToolsSubTab] = useState<'directory' | 'submissions' | 'reviews'>('directory');

  // New Tool Form State
  const [newToolName, setNewToolName] = useState('');
  const [newToolWebsite, setNewToolWebsite] = useState('');
  const [newToolCategory, setNewToolCategory] = useState<AiTool['category']>('research');
  const [newToolPricing, setNewToolPricing] = useState<AiTool['pricing']>('freemium');
  const [newToolPricingDetails, setNewToolPricingDetails] = useState('');
  const [newToolUseCases, setNewToolUseCases] = useState('');
  const [newToolRestrictions, setNewToolRestrictions] = useState('');
  const [newToolRequiresAccount, setNewToolRequiresAccount] = useState(true);
  const [newToolRequiresApiKey, setNewToolRequiresApiKey] = useState(false);

  // Products / Commerce State
  const [adminProducts, setAdminProducts] = useState<ProductItem[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductDesc, setNewProductDesc] = useState('');
  const [newProductPrice, setNewProductPrice] = useState(19.99);
  const [newProductCategory, setNewProductCategory] = useState<string>('FactInfoLive Guides');


  // Overview metrics state
  const [overview, setOverview] = useState<any>(null);
  const [loadingOverview, setLoadingOverview] = useState(false);

  // Articles & Workflow state
  const [articles, setArticles] = useState<EditorialArticle[]>([]);
  const [loadingArticles, setLoadingArticles] = useState(false);
  const [articleStatusFilter, setArticleStatusFilter] = useState<string>('all');
  const [articleTypeFilter, setArticleTypeFilter] = useState<string>('all');
  const [articleSearchQuery, setArticleSearchQuery] = useState('');

  // Editing article state
  const [editingArticle, setEditingArticle] = useState<Partial<EditorialArticle> | null>(null);
  const [editorSubTab, setEditorSubTab] = useState<'content' | 'seo' | 'claims' | 'corrections'>('content');
  const [savingArticle, setSavingArticle] = useState(false);
  const [previewArticle, setPreviewArticle] = useState<EditorialArticle | null>(null);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');
  const [newCorrectionNote, setNewCorrectionNote] = useState('');

  // AI Assistant state
  const [aiTopic, setAiTopic] = useState('');
  const [aiType, setAiType] = useState<EditorialPostType>('explainer');
  const [aiCategory, setAiCategory] = useState('science');
  const [runningAiWorkflow, setRunningAiWorkflow] = useState(false);
  const [suggestedIdeas, setSuggestedIdeas] = useState<any[]>([]);
  const [translateTargetLang, setTranslateTargetLang] = useState('it');
  const [translating, setTranslating] = useState(false);
  const [translatedResult, setTranslatedResult] = useState<string | null>(null);
  const [claimsAuditResult, setClaimsAuditResult] = useState<any | null>(null);
  const [auditingClaims, setAuditingClaims] = useState(false);

  // Revenue & Growth state
  const [monetization, setMonetization] = useState<MonetizationSettings | null>(null);
  const [affiliateLinks, setAffiliateLinks] = useState<AffiliateLink[]>([]);
  const [sponsorshipInquiries, setSponsorshipInquiries] = useState<SponsorshipInquiry[]>([]);
  const [subscribers, setSubscribers] = useState<NewsletterSubscriber[]>([]);
  const [savingMonetization, setSavingMonetization] = useState(false);
  const [newAffiliateTitle, setNewAffiliateTitle] = useState('');
  const [newAffiliateUrl, setNewAffiliateUrl] = useState('');
  const [newAffiliateCategory, setNewAffiliateCategory] = useState('technology');

  // SEO Audit state
  const [seoAudit, setSeoAudit] = useState<any>(null);
  const [loadingSeoAudit, setLoadingSeoAudit] = useState(false);

  // Analytics state
  const [analyticsSummary, setAnalyticsSummary] = useState<any>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Team state
  const [teamUsers, setTeamUsers] = useState<AdminUser[]>([]);
  const [newUsername, setNewUsername] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('author');
  const [newUserPassword, setNewUserPassword] = useState('');

  // Global banner notification
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Check setup status and existing session on mount
  useEffect(() => {
    fetch('/api/auth/setup-status')
      .then((res) => res.json())
      .then((data) => {
        setSetupRequired(Boolean(data.setupRequired));
        setSetupTokenProtected(Boolean(data.tokenProtected));
      })
      .catch(() => setSetupRequired(false));

    if (token) {
      fetch('/api/auth/verify', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => {
          if (!res.ok) throw new Error('Invalid');
          return res.json();
        })
        .then((data) => {
          if (data.authenticated && data.user) {
            setCurrentUser(data.user);
          } else {
            handleLogout();
          }
        })
        .catch(() => {
          handleLogout();
        });
    }
  }, [token]);


  // Load section-specific data when active tab changes
  useEffect(() => {
    if (!token || !currentUser) return;

    if (activeTab === 'overview') {
      loadOverview();
    } else if (activeTab === 'articles') {
      loadArticles();
    } else if (activeTab === 'ai-studio') {
      loadIdeas();
    } else if (activeTab === 'ai-tools') {
      loadAdminToolsData();
    } else if (activeTab === 'revenue') {
      loadRevenueData();
      loadAdminProducts();
    } else if (activeTab === 'seo') {
      loadSeoAudit();
    } else if (activeTab === 'analytics') {
      loadAnalytics();
    } else if (activeTab === 'team' && currentUser.role === 'administrator') {
      loadTeam();
    }
  }, [activeTab, token, currentUser]);

  // API Loaders
  const loadOverview = () => {
    if (!token) return;
    setLoadingOverview(true);
    fetch('/api/admin/overview', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setOverview(data);
        setLoadingOverview(false);
      })
      .catch(() => setLoadingOverview(false));
  };

  const loadArticles = () => {
    if (!token) return;
    setLoadingArticles(true);
    const params = new URLSearchParams();
    if (articleStatusFilter !== 'all') params.append('status', articleStatusFilter);
    if (articleTypeFilter !== 'all') params.append('type', articleTypeFilter);
    if (articleSearchQuery.trim()) params.append('search', articleSearchQuery.trim());
    params.append('limit', '50');

    fetch(`/api/editorial/articles?${params.toString()}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setArticles(data.items || []);
        setLoadingArticles(false);
      })
      .catch(() => setLoadingArticles(false));
  };

  const loadIdeas = () => {
    fetch('/api/editorial/suggest-ideas')
      .then((res) => res.json())
      .then((data) => setSuggestedIdeas(data || []))
      .catch(() => {});
  };

  const loadRevenueData = () => {
    if (!token) return;
    fetch('/api/monetization/settings')
      .then((res) => res.json())
      .then((data) => setMonetization(data))
      .catch(() => {});

    fetch('/api/monetization/affiliate-links')
      .then((res) => res.json())
      .then((data) => setAffiliateLinks(data || []))
      .catch(() => {});

    fetch('/api/sponsorship/inquiries', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setSponsorshipInquiries(data || []))
      .catch(() => {});

    fetch('/api/newsletter/subscribers', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setSubscribers(data || []))
      .catch(() => {});
  };

  const loadSeoAudit = () => {
    if (!token) return;
    setLoadingSeoAudit(true);
    fetch('/api/seo/audit', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setSeoAudit(data);
        setLoadingSeoAudit(false);
      })
      .catch(() => setLoadingSeoAudit(false));
  };

  const loadAnalytics = () => {
    if (!token) return;
    setLoadingAnalytics(true);
    fetch('/api/analytics/summary', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => {
        setAnalyticsSummary(data);
        setLoadingAnalytics(false);
      })
      .catch(() => setLoadingAnalytics(false));
  };

  const loadTeam = () => {
    if (!token) return;
    fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.json())
      .then((data) => setTeamUsers(data || []))
      .catch(() => {});
  };

  const loadAdminToolsData = () => {
    if (!token) return;
    setLoadingAiTools(true);
    Promise.allSettled([
      fetch('/api/tools').then((r) => r.json()),
      fetch('/api/admin/tools/submissions', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
      fetch('/api/admin/reviews/pending', { headers: { Authorization: `Bearer ${token}` } }).then((r) => r.json()),
    ])
      .then(([toolsRes, subsRes, revsRes]) => {
        if (toolsRes.status === 'fulfilled' && Array.isArray(toolsRes.value)) {
          setAdminTools(toolsRes.value);
        }
        if (subsRes.status === 'fulfilled' && Array.isArray(subsRes.value)) {
          setAdminSubmissions(subsRes.value);
        }
        if (revsRes.status === 'fulfilled' && Array.isArray(revsRes.value)) {
          setAdminPendingReviews(revsRes.value);
        }
        setLoadingAiTools(false);
      })
      .catch(() => setLoadingAiTools(false));
  };

  const handleApproveSubmission = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/tools/submissions/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatusMessage('Tool submission approved and published to public directory.');
        loadAdminToolsData();
      }
    } catch {}
  };

  const handleRejectSubmission = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/tools/submissions/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatusMessage('Tool submission declined.');
        loadAdminToolsData();
      }
    } catch {}
  };

  const handleApproveReview = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}/approve`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatusMessage('User review verified and approved.');
        loadAdminToolsData();
      }
    } catch {}
  };

  const handleRejectReview = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/reviews/${id}/reject`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatusMessage('Review deleted.');
        loadAdminToolsData();
      }
    } catch {}
  };

  const handleCreateTool = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newToolName.trim() || !newToolWebsite.trim() || !token) return;
    try {
      const res = await fetch('/api/admin/tools', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newToolName.trim(),
          websiteUrl: newToolWebsite.trim(),
          category: newToolCategory,
          pricing: newToolPricing,
          pricingDetails: newToolPricingDetails.trim() || undefined,
          practicalUseCases: newToolUseCases.split(',').map((s) => s.trim()).filter(Boolean),
          restrictions: newToolRestrictions.split(',').map((s) => s.trim()).filter(Boolean),
          requiresAccount: newToolRequiresAccount,
          requiresApiKey: newToolRequiresApiKey,
          isActive: true,
          verificationStatus: 'verified',
        }),
      });
      if (res.ok) {
        setStatusMessage(`Tool "${newToolName}" added to verified AI Tools Directory.`);
        setNewToolName('');
        setNewToolWebsite('');
        setNewToolPricingDetails('');
        setNewToolUseCases('');
        setNewToolRestrictions('');
        loadAdminToolsData();
      }
    } catch {}
  };

  const handleDeleteTool = async (id: string) => {
    if (!confirm('Permanently remove this tool from directory?') || !token) return;
    try {
      const res = await fetch(`/api/admin/tools/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatusMessage('Tool removed from directory.');
        loadAdminToolsData();
      }
    } catch {}
  };

  const loadAdminProducts = () => {
    if (!token) return;
    setLoadingProducts(true);
    fetch('/api/admin/products', { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAdminProducts(data);
        setLoadingProducts(false);
      })
      .catch(() => setLoadingProducts(false));
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim() || !token) return;
    try {
      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: newProductName.trim(),
          description: newProductDesc.trim(),
          price: Number(newProductPrice) || 0,
          currency: 'EUR',
          merchant: newProductCategory,
          availability: 'in_stock',
          purchaseUrl: '#',
          isAffiliate: false,
          enabled: false, // Disabled by default for readiness
        }),
      });
      if (res.ok) {
        setStatusMessage('New digital product / guide catalog entry created (staged in readiness mode).');
        setNewProductName('');
        setNewProductDesc('');
        loadAdminProducts();
      }
    } catch {}
  };

  const handleToggleProduct = async (prod: ProductItem) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/admin/products/${prod.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ enabled: !prod.enabled }),
      });
      if (res.ok) {
        loadAdminProducts();
      }
    } catch {}
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product item?') || !token) return;
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        loadAdminProducts();
      }
    } catch {}
  };

  // Auth Handlers
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: usernameInput, password: passwordInput }),
      });
      const data = await res.json();

      if (res.ok && data.token && data.user) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('factinfolive_admin_token', data.token);
        setUsernameInput('');
        setPasswordInput('');
        setStatusMessage(`Welcome back, ${data.user.name}. Authenticated as [${data.user.role.toUpperCase()}].`);
      } else {
        setAuthError(data.error || 'Authentication denied. Check credentials.');
      }
    } catch {
      setAuthError('Connection failed. Please check network connectivity.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    if (token) {
      fetch('/api/auth/logout', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      }).catch(() => {});
    }
    setToken(null);
    setCurrentUser(null);
    localStorage.removeItem('factinfolive_admin_token');
  };

  // Article Action Handlers
  const handleSaveArticle = async (newStatus?: ContentStatus) => {
    if (!editingArticle?.title || !token) return;
    setSavingArticle(true);
    setStatusMessage(null);

    try {
      const targetStatus = newStatus || editingArticle.status || 'draft';
      const payload = {
        ...editingArticle,
        status: targetStatus,
      };

      const url = editingArticle.id ? `/api/editorial/articles/${editingArticle.id}` : '/api/editorial/articles';
      const method = editingArticle.id ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Save operation failed.');
      const saved = await res.json();
      setStatusMessage(`Article "${saved.title}" saved with status [${saved.status.toUpperCase()}].`);
      setEditingArticle(null);
      loadArticles();
      loadOverview();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setSavingArticle(false);
    }
  };

  const handleDeleteArticle = async (id: string) => {
    if (!confirm('Are you sure you want to permanently delete this article?') || !token) return;
    try {
      const res = await fetch(`/api/editorial/articles/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setStatusMessage('Article removed successfully.');
        loadArticles();
      }
    } catch {}
  };

  const handleAddCorrection = async (articleId: string) => {
    if (!newCorrectionNote.trim() || !token) return;
    try {
      const res = await fetch(`/api/editorial/articles/${articleId}/corrections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ note: newCorrectionNote.trim() }),
      });
      if (res.ok) {
        setStatusMessage('Correction note recorded and attached to public article.');
        setNewCorrectionNote('');
        loadArticles();
      }
    } catch {}
  };

  // Run AI 10-Step Workflow
  const handleRunAiWorkflow = async () => {
    if (!aiTopic.trim() || runningAiWorkflow || !token) return;
    setRunningAiWorkflow(true);
    setStatusMessage(null);

    try {
      const res = await fetch('/api/editorial/ai-workflow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ topic: aiTopic, type: aiType, category: aiCategory }),
      });
      if (!res.ok) throw new Error('Workflow execution error.');
      const data = await res.json();
      setStatusMessage(`AI Draft generated: "${data.article.title}". Saved to Drafts queue for human review.`);
      setEditingArticle(data.article);
      setActiveTab('articles');
      loadArticles();
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setRunningAiWorkflow(false);
    }
  };

  // Run AI Translation
  const handleTranslate = async (content: string) => {
    if (!content || translating || !token) return;
    setTranslating(true);
    setTranslatedResult(null);
    try {
      const res = await fetch('/api/editorial/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content, targetLanguage: translateTargetLang }),
      });
      const data = await res.json();
      setTranslatedResult(data.translatedText);
    } catch {
      setStatusMessage('Translation failed.');
    } finally {
      setTranslating(false);
    }
  };

  // Audit Claims in active editor
  const handleAuditClaims = async (content: string) => {
    if (!content || auditingClaims || !token) return;
    setAuditingClaims(true);
    setClaimsAuditResult(null);
    try {
      const res = await fetch('/api/editorial/audit-claims', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ content }),
      });
      const data = await res.json();
      setClaimsAuditResult(data);
    } catch {
      setStatusMessage('Claims audit failed.');
    } finally {
      setAuditingClaims(false);
    }
  };

  // Monetization Updates
  const handleSaveMonetization = async (updated: MonetizationSettings) => {
    if (!token) return;
    setSavingMonetization(true);
    try {
      const res = await fetch('/api/monetization/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(updated),
      });
      const data = await res.json();
      setMonetization(data);
      setStatusMessage('Monetization parameters updated successfully.');
    } catch {
      setStatusMessage('Failed to update monetization settings.');
    } finally {
      setSavingMonetization(false);
    }
  };

  const handleCreateAffiliateLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAffiliateTitle || !newAffiliateUrl || !token) return;
    try {
      const res = await fetch('/api/monetization/affiliate-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title: newAffiliateTitle,
          targetUrl: newAffiliateUrl,
          category: newAffiliateCategory,
          disclosureLabel: 'FactInfoLive may earn an ethical affiliate commission on qualifying purchases.',
        }),
      });
      if (res.ok) {
        setNewAffiliateTitle('');
        setNewAffiliateUrl('');
        loadRevenueData();
        setStatusMessage('Affiliate link registered with ethical disclosure tag.');
      }
    } catch {}
  };

  const handleUpdateSponsorStatus = async (id: string, status: SponsorshipInquiry['status']) => {
    if (!token) return;
    try {
      await fetch(`/api/sponsorship/inquiries/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status }),
      });
      loadRevenueData();
    } catch {}
  };

  // Create Team User (Admin Only)
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername || !newUserPassword || !newUserName || !token) return;
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          username: newUsername,
          name: newUserName,
          email: newUserEmail,
          role: newUserRole,
          password: newUserPassword,
        }),
      });
      if (res.ok) {
        setNewUsername('');
        setNewUserName('');
        setNewUserEmail('');
        setNewUserPassword('');
        loadTeam();
        setStatusMessage(`New ${newUserRole} account created successfully.`);
      }
    } catch {}
  };

  // First-Time Administrator Initialization Handler
  const handleSetupAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setSetupError(null);

    if (setupPassword !== setupConfirmPassword) {
      setSetupError('Passwords do not match. Please re-enter.');
      return;
    }

    if (setupPassword.length < 12) {
      setSetupError('Master password must be at least 12 characters long.');
      return;
    }

    const hasUpper = /[A-Z]/.test(setupPassword);
    const hasLower = /[a-z]/.test(setupPassword);
    const hasDigit = /[0-9]/.test(setupPassword);
    const hasSpecial = /[^A-Za-z0-9]/.test(setupPassword);
    if (!hasUpper || !hasLower || !hasDigit || !hasSpecial) {
      setSetupError('Password must contain uppercase, lowercase, numbers, and symbols.');
      return;
    }

    setSetupLoading(true);
    try {
      const res = await fetch('/api/auth/setup-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: setupUsername.trim().toLowerCase(),
          name: setupName.trim(),
          email: setupEmail.trim().toLowerCase(),
          password: setupPassword,
          setupToken: setupTokenInput.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to initialize administrator account.');
      }

      if (data.token && data.user) {
        setToken(data.token);
        setCurrentUser(data.user);
        localStorage.setItem('factinfolive_admin_token', data.token);
        setSetupRequired(false);
        setStatusMessage(`Master Administrator account [${data.user.username}] initialized successfully.`);
      }
    } catch (err: any) {
      setSetupError(err.message || 'Setup initialization encountered an error.');
    } finally {
      setSetupLoading(false);
    }
  };

  // ==========================================
  // VIEW: UNAUTHENTICATED LOGIN / SETUP SCREEN
  // ==========================================
  if (!token || !currentUser) {
    if (setupRequired === null) {
      return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3 text-slate-500">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <span className="text-xs font-medium">Verifying server security state...</span>
          </div>
        </div>
      );
    }

    // SCREEN A: FIRST-TIME MASTER ADMIN SETUP
    if (setupRequired) {
      return (
        <div className="min-h-[85vh] flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 sm:p-8 shadow-xl space-y-6">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-xl bg-amber-600 text-white flex items-center justify-center mx-auto shadow-sm">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h1 className="text-xl sm:text-2xl font-bold font-editorial text-slate-950 dark:text-white">
                Master Administrator Setup
              </h1>
              <p className="text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                No administrator exists on this deployment yet. Initialize your root administrative credentials.
                Once completed, this setup is permanently locked and cannot be re-run.
              </p>
            </div>

            <form onSubmit={handleSetupAdmin} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Master Username:
                  </label>
                  <input
                    type="text"
                    required
                    value={setupUsername}
                    onChange={(e) => setSetupUsername(e.target.value)}
                    placeholder="admin"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                    Full Staff Name:
                  </label>
                  <input
                    type="text"
                    required
                    value={setupName}
                    onChange={(e) => setSetupName(e.target.value)}
                    placeholder="e.g. Lead Editorial Director"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Official Email Address:
                </label>
                <input
                  type="email"
                  required
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  placeholder="editor@factinfolive.org"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Create Master Password (min 12 chars):
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={setupPassword}
                  onChange={(e) => setSetupPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  Confirm Master Password:
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={setupConfirmPassword}
                  onChange={(e) => setSetupConfirmPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500 font-mono"
                />
              </div>

              {setupTokenProtected && (
                <div>
                  <label className="text-xs font-semibold text-amber-700 dark:text-amber-400 block mb-1">
                    Server Setup Authorization Token (SETUP_TOKEN required):
                  </label>
                  <input
                    type="password"
                    required
                    value={setupTokenInput}
                    onChange={(e) => setSetupTokenInput(e.target.value)}
                    placeholder="Enter SETUP_TOKEN configured in server environment"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-amber-300 dark:border-amber-700 text-slate-900 dark:text-white outline-none focus:border-amber-500"
                  />
                </div>
              )}

              {/* Password complexity checklist */}
              <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-[11px] space-y-1">
                <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                  Password Security Requirements:
                </span>
                <div className={setupPassword.length >= 12 ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                  • Minimum 12 characters ({setupPassword.length}/12)
                </div>
                <div className={/[A-Z]/.test(setupPassword) && /[a-z]/.test(setupPassword) ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                  • Uppercase and lowercase letters
                </div>
                <div className={/[0-9]/.test(setupPassword) && /[^A-Za-z0-9]/.test(setupPassword) ? 'text-emerald-600 font-medium' : 'text-slate-500'}>
                  • Numbers and special symbols
                </div>
              </div>

              {setupError && (
                <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{setupError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={setupLoading}
                className="w-full py-2.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                {setupLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initializing Root Security Credentials...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Create Master Administrator &amp; Lock Setup</span>
                  </>
                )}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={onBackToHome}
                  className="text-xs text-slate-500 hover:underline"
                >
                  ← Return to Public Front Page
                </button>
              </div>
            </form>
          </div>
        </div>
      );
    }

    // SCREEN B: SECURE STAFF LOGIN
    return (
      <div className="min-h-[85vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center mx-auto shadow-sm">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold font-editorial text-slate-950 dark:text-white">
              FactInfoLive Editorial Studio
            </h1>
            <p className="text-xs text-slate-500">
              Authorized access for administrators, editors, and research fellows.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                Username or Staff Email:
              </label>
              <input
                type="text"
                required
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="e.g. admin or editor"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Password:
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••••••"
                className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />
            </div>

            {authError && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
            >
              {authLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Authenticate Session</span>
                </>
              )}
            </button>

            {/* Server-Side Recovery Guidance */}
            <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-[11px] text-slate-500 space-y-1">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block">
                Security &amp; Account Recovery Policy:
              </span>
              <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
                To prevent brute-force attacks, repeated failed attempts trigger an automatic IP lock.
                If you have forgotten your password, the server administrator can safely reset it via the server console:
              </p>
              <code className="block bg-stone-200 dark:bg-slate-800 px-2 py-1 rounded text-[10px] text-slate-800 dark:text-slate-200 font-mono overflow-x-auto">
                npm run reset-admin &lt;username&gt; &lt;new_password&gt;
              </code>
            </div>

            <div className="text-center pt-2">
              <button
                type="button"
                onClick={onBackToHome}
                className="text-xs text-slate-500 hover:underline"
              >
                ← Return to Public Front Page
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }


  // ==========================================
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Top Bar with User Badge, Role, and Quick Links */}
      <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-4 sm:px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
            F
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-editorial text-slate-950 dark:text-white">
                FactInfoLive Admin Studio
              </h1>
              <span
                className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                  currentUser.role === 'administrator'
                    ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800'
                    : currentUser.role === 'editor'
                    ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                }`}
              >
                {currentUser.role}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              Authenticated: {currentUser.name} ({currentUser.username})
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end flex-wrap">
          <button
            onClick={onBackToHome}
            className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Live Site
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/50 hover:bg-red-100 text-red-600 dark:text-red-400 text-xs font-semibold transition-colors cursor-pointer"
          >
            Sign Out
          </button>
        </div>
      </div>

      {/* Global Status Banner */}
      {statusMessage && (
        <div className="p-3.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900/60 text-xs text-blue-900 dark:text-blue-200 flex items-center justify-between">
          <span>{statusMessage}</span>
          <button onClick={() => setStatusMessage(null)} className="p-1 text-blue-500 hover:text-blue-700">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Dashboard Sub-Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1 border-b border-stone-200 dark:border-slate-800 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('articles')}
          className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'articles'
              ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Editorial Workflows</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-studio')}
          className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ai-studio'
              ? 'bg-blue-600 text-white'
              : 'text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>AI Writing & Research</span>
        </button>

        <button
          onClick={() => setActiveTab('ai-tools')}
          className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'ai-tools'
              ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <Cpu className="w-3.5 h-3.5" />
          <span>AI Tools & Directory</span>
          {(adminSubmissions.length > 0 || adminPendingReviews.length > 0) && (
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse ml-0.5" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('revenue')}
          className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'revenue'
              ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <DollarSign className="w-3.5 h-3.5" />
          <span>Revenue & Growth</span>
        </button>

        <button
          onClick={() => setActiveTab('seo')}
          className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'seo'
              ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <Search className="w-3.5 h-3.5" />
          <span>SEO Center</span>
        </button>

        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
            activeTab === 'analytics'
              ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
              : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
          }`}
        >
          <Globe className="w-3.5 h-3.5" />
          <span>Analytics</span>
        </button>

        {currentUser.role === 'administrator' && (
          <button
            onClick={() => setActiveTab('team')}
            className={`px-3.5 py-2 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === 'team'
                ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Team & Roles</span>
          </button>
        )}
      </div>

      {/* ========================================================
          TAB 1: OVERVIEW METRICS & TELEMETRY
          ======================================================== */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {loadingOverview ? (
            <div className="py-20 flex justify-center text-blue-600">
              <Loader2 className="w-8 h-8 animate-spin" />
            </div>
          ) : overview ? (
            <>
              {/* Stat Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Published</span>
                  <div className="text-2xl font-bold font-tabular text-emerald-600 dark:text-emerald-400">
                    {overview.published}
                  </div>
                  <span className="text-[11px] text-slate-500">Live dossiers</span>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Needs Review</span>
                  <div className="text-2xl font-bold font-tabular text-amber-500">
                    {overview.needsReview}
                  </div>
                  <span className="text-[11px] text-slate-500">Pending approval</span>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Drafts & Ideas</span>
                  <div className="text-2xl font-bold font-tabular text-blue-600 dark:text-blue-400">
                    {overview.drafts}
                  </div>
                  <span className="text-[11px] text-slate-500">In research</span>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Scheduled</span>
                  <div className="text-2xl font-bold font-tabular text-purple-600 dark:text-purple-400">
                    {overview.scheduled}
                  </div>
                  <span className="text-[11px] text-slate-500">Automated release</span>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Subscribers</span>
                  <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white">
                    {overview.subscribersCount}
                  </div>
                  <span className="text-[11px] text-slate-500">Verified emails</span>
                </div>

                <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Sponsor Leads</span>
                  <div className="text-2xl font-bold font-tabular text-blue-600">
                    {overview.sponsorInquiriesCount}
                  </div>
                  <span className="text-[11px] text-slate-500">New inquiries</span>
                </div>
              </div>

              {/* Editorial Pipeline & Workflow Status */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold font-editorial text-slate-900 dark:text-white">
                    7-Stage Editorial Production Pipeline
                  </h3>
                  <button
                    onClick={() => {
                      setEditingArticle({
                        title: '',
                        content: '',
                        category: 'science',
                        type: 'explainer',
                        status: 'idea',
                        tags: [],
                      });
                      setActiveTab('articles');
                    }}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    + Create New Topic
                  </button>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 text-center text-xs">
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">1. Idea</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Topic Pitch</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">2. Researching</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Wire Sources</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-purple-400 block">3. AI Draft</span>
                    <span className="font-semibold text-purple-600 dark:text-purple-300">AI Synthesized</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-amber-500 block">4. Needs Review</span>
                    <span className="font-semibold text-amber-600 dark:text-amber-400">Fact-Check Gate</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-blue-500 block">5. Approved</span>
                    <span className="font-semibold text-blue-600 dark:text-blue-300">Ready for Launch</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-emerald-600 block">6. Published</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">Public Live</span>
                  </div>
                  <div className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">7. Archived</span>
                    <span className="font-semibold text-slate-500">Historical</span>
                  </div>
                </div>
              </div>

              {/* Recent Updates Table */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-3">
                <h3 className="text-sm font-bold font-editorial text-slate-900 dark:text-white">
                  Recent Production Activity
                </h3>
                <div className="divide-y divide-stone-100 dark:divide-slate-800 text-xs">
                  {overview.recentUpdates.map((item: any) => (
                    <div key={item.id} className="py-2.5 flex items-center justify-between gap-4">
                      <div>
                        <span className="font-semibold text-slate-900 dark:text-white block">
                          {item.title}
                        </span>
                        <span className="text-slate-400 text-[11px]">
                          {item.author} · {item.type} · Updated {new Date(item.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* ========================================================
          TAB 2: ARTICLES & WORKFLOW MANAGER (7 STAGES)
          ======================================================== */}
      {activeTab === 'articles' && (
        <div className="space-y-6">
          {editingArticle ? (
            /* Inline Article Workspace with Tabs: Content, SEO, Claims, Corrections */
            <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-stone-200 dark:border-slate-800">
                <div>
                  <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white">
                    {editingArticle.id ? 'Edit Editorial Dossier' : 'New Article Draft'}
                  </h3>
                  <span className="text-xs text-slate-500">
                    Status: <strong className="uppercase text-blue-600 dark:text-blue-400">{editingArticle.status || 'draft'}</strong>
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPreviewArticle(editingArticle as EditorialArticle)}
                    className="px-3 py-1.5 border border-stone-200 dark:border-slate-800 text-xs font-semibold rounded-lg hover:bg-stone-100 dark:hover:bg-slate-800 flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview Layout</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveArticle('draft')}
                    disabled={savingArticle}
                    className="px-3 py-1.5 bg-stone-200 dark:bg-slate-800 text-slate-800 dark:text-stone-200 text-xs font-semibold rounded-lg hover:bg-stone-300 cursor-pointer"
                  >
                    Save Draft
                  </button>
                  {currentUser.role !== 'author' && (
                    <button
                      type="button"
                      onClick={() => handleSaveArticle('published')}
                      disabled={savingArticle}
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Publish to Live</span>
                    </button>
                  )}
                  {currentUser.role === 'author' && (
                    <button
                      type="button"
                      onClick={() => handleSaveArticle('needs_review')}
                      disabled={savingArticle}
                      className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Submit for Review</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingArticle(null)}
                    className="p-1.5 text-slate-500 hover:text-slate-900"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Workspace Sub-Tabs */}
              <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-2 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setEditorSubTab('content')}
                  className={`px-3 py-1 rounded-lg ${
                    editorSubTab === 'content'
                      ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  1. Article Content & Metadata
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubTab('seo')}
                  className={`px-3 py-1 rounded-lg ${
                    editorSubTab === 'seo'
                      ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  2. SEO & Structured Data
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubTab('claims')}
                  className={`px-3 py-1 rounded-lg ${
                    editorSubTab === 'claims'
                      ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  3. Source Claims & Verification
                </button>
                <button
                  type="button"
                  onClick={() => setEditorSubTab('corrections')}
                  className={`px-3 py-1 rounded-lg ${
                    editorSubTab === 'corrections'
                      ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  4. Correction Log
                </button>
              </div>

              {/* Sub-tab 1: Content */}
              {editorSubTab === 'content' && (
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Editorial Headline:
                    </label>
                    <input
                      type="text"
                      value={editingArticle.title || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, title: e.target.value })}
                      placeholder="Clear, authoritative headline..."
                      className="w-full px-3.5 py-2 text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      Deck / Subtitle:
                    </label>
                    <input
                      type="text"
                      value={editingArticle.subtitle || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, subtitle: e.target.value })}
                      placeholder="Concise contextual summary..."
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Format:
                      </label>
                      <select
                        value={editingArticle.type || 'explainer'}
                        onChange={(e) => setEditingArticle({ ...editingArticle, type: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      >
                        <option value="explainer">Deep Explainer</option>
                        <option value="blog">Blog / Monograph</option>
                        <option value="summary">30s Summary</option>
                        <option value="research">Research & Study</option>
                        <option value="sports-analysis">Sports Analysis</option>
                        <option value="fact-check">Fact Check</option>
                        <option value="opinion">Opinion & Editorial</option>
                        <option value="guide">Guide & FAQ</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Department Category:
                      </label>
                      <select
                        value={editingArticle.category || 'science'}
                        onChange={(e) => setEditingArticle({ ...editingArticle, category: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize"
                      >
                        <option value="science">Science</option>
                        <option value="technology">Technology</option>
                        <option value="world">World</option>
                        <option value="sports">Sports</option>
                        <option value="business">Business</option>
                        <option value="health">Health</option>
                        <option value="society">Society</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Workflow Status:
                      </label>
                      <select
                        value={editingArticle.status || 'draft'}
                        onChange={(e) => setEditingArticle({ ...editingArticle, status: e.target.value as any })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none font-semibold capitalize"
                      >
                        <option value="idea">1. Idea</option>
                        <option value="researching">2. Researching</option>
                        <option value="ai_draft">3. AI Draft</option>
                        <option value="needs_review">4. Needs Review</option>
                        <option value="approved">5. Approved</option>
                        <option value="published">6. Published</option>
                        <option value="archived">7. Archived</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Schedule Publish (Optional):
                      </label>
                      <input
                        type="datetime-local"
                        value={editingArticle.scheduledPublishAt ? editingArticle.scheduledPublishAt.slice(0, 16) : ''}
                        onChange={(e) =>
                          setEditingArticle({
                            ...editingArticle,
                            scheduledPublishAt: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none font-tabular"
                      />
                    </div>
                  </div>

                  {/* Image and Licensing */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Featured Image URL:
                      </label>
                      <input
                        type="text"
                        value={editingArticle.imageUrl || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, imageUrl: e.target.value })}
                        placeholder="https://... or /images/..."
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Image License Attribution:
                      </label>
                      <input
                        type="text"
                        value={editingArticle.imageAttribution || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, imageAttribution: e.target.value })}
                        placeholder="e.g. NASA / Copernicus Marine Archive (Public Domain)"
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  {/* Prose Content */}
                  <div>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <label className="font-semibold text-slate-700 dark:text-slate-300">
                        Markdown Article Content:
                      </label>
                      <span className="text-slate-500 font-tabular">
                        {(editingArticle.content || '').split(/\s+/).filter(Boolean).length} words · ~
                        {Math.max(1, Math.ceil(((editingArticle.content || '').split(/\s+/).filter(Boolean).length) / 200))} min read
                      </span>
                    </div>
                    <textarea
                      rows={12}
                      value={editingArticle.content || ''}
                      onChange={(e) => setEditingArticle({ ...editingArticle, content: e.target.value })}
                      placeholder="Write your in-depth verified dossier in markdown with ### headings..."
                      className="w-full px-4 py-3 text-xs sm:text-sm font-mono rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none leading-relaxed"
                    />
                  </div>
                </div>
              )}

              {/* Sub-tab 2: SEO */}
              {editorSubTab === 'seo' && (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-900 dark:text-blue-200">
                    <strong>Search Engine Optimization Standards:</strong> Titles must be between 30 and 60 characters. Meta descriptions must be between 120 and 160 characters. Clean URL slugs prevent indexing fragmentation.
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        SEO Page Title:
                      </label>
                      <span className={`text-[11px] font-tabular ${
                        (editingArticle.seoMetadata?.seoTitle?.length || 0) >= 30 && (editingArticle.seoMetadata?.seoTitle?.length || 0) <= 60
                          ? 'text-emerald-600 font-semibold'
                          : 'text-amber-500'
                      }`}>
                        {editingArticle.seoMetadata?.seoTitle?.length || 0} / 60 characters
                      </span>
                    </div>
                    <input
                      type="text"
                      value={editingArticle.seoMetadata?.seoTitle || editingArticle.title || ''}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          seoMetadata: { ...editingArticle.seoMetadata, seoTitle: e.target.value, slug: editingArticle.slug || '' },
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Search Snippet Meta Description:
                      </label>
                      <span className={`text-[11px] font-tabular ${
                        (editingArticle.seoMetadata?.metaDescription?.length || 0) >= 120 && (editingArticle.seoMetadata?.metaDescription?.length || 0) <= 160
                          ? 'text-emerald-600 font-semibold'
                          : 'text-amber-500'
                      }`}>
                        {editingArticle.seoMetadata?.metaDescription?.length || 0} / 160 characters
                      </span>
                    </div>
                    <textarea
                      rows={3}
                      value={editingArticle.seoMetadata?.metaDescription || editingArticle.subtitle || ''}
                      onChange={(e) =>
                        setEditingArticle({
                          ...editingArticle,
                          seoMetadata: { ...editingArticle.seoMetadata, metaDescription: e.target.value, slug: editingArticle.slug || '' },
                        })
                      }
                      className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        URL Slug:
                      </label>
                      <input
                        type="text"
                        value={editingArticle.slug || ''}
                        onChange={(e) => setEditingArticle({ ...editingArticle, slug: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                        Focus Keyword:
                      </label>
                      <input
                        type="text"
                        value={editingArticle.seoMetadata?.focusKeyword || ''}
                        onChange={(e) =>
                          setEditingArticle({
                            ...editingArticle,
                            seoMetadata: { ...editingArticle.seoMetadata, focusKeyword: e.target.value, slug: editingArticle.slug || '' },
                          })
                        }
                        className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Sub-tab 3: Source Claims */}
              {editorSubTab === 'claims' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                        Fact Verification Checklist
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        Every factual assertion must have an empirical source link or primary documentation attached.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAuditClaims(editingArticle.content || '')}
                      disabled={auditingClaims}
                      className="px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      {auditingClaims ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      <span>Auto-Audit Claims with AI</span>
                    </button>
                  </div>

                  {claimsAuditResult && (
                    <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/60 text-xs space-y-2">
                      <span className="font-bold text-amber-800 dark:text-amber-300 block">Audit Diagnostics:</span>
                      {claimsAuditResult.missingEvidence?.length > 0 && (
                        <div>
                          <strong>Missing Evidentiary Context:</strong>
                          <ul className="list-disc list-inside mt-1">
                            {claimsAuditResult.missingEvidence.map((m: string, i: number) => (
                              <li key={i}>{m}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="space-y-2">
                    {(editingArticle.claimsToVerify || []).map((cl, i) => (
                      <div
                        key={i}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs flex items-start justify-between gap-3"
                      >
                        <div className="space-y-1">
                          <span className="font-semibold text-slate-900 dark:text-white">{cl.claim}</span>
                          {cl.sourceUrl && (
                            <a
                              href={cl.sourceUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-blue-500 hover:underline block text-[11px]"
                            >
                              Source: {cl.sourceUrl}
                            </a>
                          )}
                        </div>
                        <span className="text-emerald-600 text-[11px] font-semibold shrink-0">
                          Verified ✓
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sub-tab 4: Corrections */}
              {editorSubTab === 'corrections' && (
                <div className="space-y-4">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Editorial Corrections & Amendments Log
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Transparent corrections are permanently stamped on the article with the editor's signature.
                    </p>
                  </div>

                  <div className="space-y-2">
                    {(editingArticle.correctionNotes || []).map((note) => (
                      <div
                        key={note.id}
                        className="p-3 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px] text-slate-400">
                          <span>Editor: {note.editorName}</span>
                          <span>{new Date(note.date).toLocaleString()}</span>
                        </div>
                        <p className="text-slate-700 dark:text-slate-300 font-sans">{note.text}</p>
                      </div>
                    ))}
                  </div>

                  {editingArticle.id && (
                    <div className="pt-2 flex items-center gap-2">
                      <input
                        type="text"
                        value={newCorrectionNote}
                        onChange={(e) => setNewCorrectionNote(e.target.value)}
                        placeholder="Add formal correction note (e.g. Corrected typo in paragraph 4 regarding 1999 launch date)..."
                        className="flex-1 px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddCorrection(editingArticle.id!)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shrink-0 cursor-pointer"
                      >
                        Affix Correction
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* Articles Table */
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={articleSearchQuery}
                      onChange={(e) => setArticleSearchQuery(e.target.value)}
                      placeholder="Search articles..."
                      className="pl-9 pr-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                    />
                  </div>

                  <select
                    value={articleStatusFilter}
                    onChange={(e) => setArticleStatusFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize"
                  >
                    <option value="all">All Statuses</option>
                    <option value="idea">1. Idea</option>
                    <option value="researching">2. Researching</option>
                    <option value="ai_draft">3. AI Draft</option>
                    <option value="needs_review">4. Needs Review</option>
                    <option value="approved">5. Approved</option>
                    <option value="published">6. Published</option>
                    <option value="archived">7. Archived</option>
                  </select>

                  <select
                    value={articleTypeFilter}
                    onChange={(e) => setArticleTypeFilter(e.target.value)}
                    className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize"
                  >
                    <option value="all">All Formats</option>
                    <option value="explainer">Explainer</option>
                    <option value="blog">Blog</option>
                    <option value="summary">Summary</option>
                    <option value="research">Research</option>
                    <option value="sports-analysis">Sports Analysis</option>
                    <option value="fact-check">Fact Check</option>
                    <option value="opinion">Opinion</option>
                    <option value="guide">Guide</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={loadArticles}
                    className="p-2 rounded-lg border border-stone-200 dark:border-slate-800 text-slate-500 hover:text-slate-900 cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingArticle({
                        title: '',
                        content: '',
                        category: 'world',
                        type: 'explainer',
                        status: 'idea',
                        tags: [],
                      });
                      setEditorSubTab('content');
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    + New Article
                  </button>
                </div>
              </div>

              {loadingArticles ? (
                <div className="py-20 flex justify-center text-blue-600">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : articles.length > 0 ? (
                <div className="border border-stone-200 dark:border-slate-800 rounded-2xl bg-white dark:bg-slate-900 divide-y divide-stone-100 dark:divide-slate-800 overflow-hidden shadow-xs">
                  {articles.map((art) => (
                    <div
                      key={art.id}
                      className="p-4 hover:bg-stone-50/70 dark:hover:bg-slate-800/40 transition-colors flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                    >
                      <div className="space-y-1 pr-4">
                        <div className="flex items-center gap-2 text-[11px]">
                          <span
                            className={`font-bold uppercase px-2 py-0.5 rounded text-[10px] ${
                              art.status === 'published'
                                ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400'
                                : art.status === 'needs_review' || art.status === 'review'
                                ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400'
                                : art.status === 'approved'
                                ? 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-400'
                                : art.status === 'ai_draft'
                                ? 'bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-400'
                                : 'bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {art.status}
                          </span>
                          <span className="font-semibold text-blue-600 dark:text-blue-400 uppercase">
                            {art.type}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400">{art.category}</span>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-400">{art.author.name}</span>
                          {art.scheduledPublishAt && (
                            <span className="text-purple-500 font-semibold text-[10px] flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Scheduled: {new Date(art.scheduledPublishAt).toLocaleDateString()}
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
                        <button
                          onClick={() => setPreviewArticle(art)}
                          className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-white rounded"
                          title="Preview Layout"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => {
                            setEditingArticle(art);
                            setEditorSubTab('content');
                          }}
                          className="p-1.5 text-slate-500 hover:text-blue-600 rounded"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>

                        {currentUser.role === 'administrator' && (
                          <button
                            onClick={() => handleDeleteArticle(art.id)}
                            className="p-1.5 text-slate-500 hover:text-red-500 rounded"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-16 bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl text-xs text-slate-500">
                  No articles found matching filters.
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          TAB 3: AI WRITING & RESEARCH ASSISTANT
          ======================================================== */}
      {activeTab === 'ai-studio' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 text-white space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-200">
              <Sparkles className="w-4 h-4" />
              <span>FactInfoLive AI Editorial Research Assistant</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold font-editorial">
              10-Step AI Content Creation & Fact-Auditing Protocol
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 max-w-3xl leading-relaxed">
              Powered by Google Gemini 3.8 Flash. Automatically retrieves real-time wire dispatches from connected feeds, generates structured outlines, synthesizes 30s summaries, extracts verifiable claims, and saves drafts safely into the review queue.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="space-y-3">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                Research Topic or Headline Angle:
              </label>
              <input
                type="text"
                value={aiTopic}
                onChange={(e) => setAiTopic(e.target.value)}
                placeholder="e.g. Next-Generation Solid-State Electrolytes or European Central Bank Liquidity Guardrails..."
                className="w-full px-4 py-2.5 text-xs sm:text-sm rounded-xl bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none focus:border-blue-500"
              />

              {suggestedIdeas.length > 0 && (
                <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
                  <span className="text-slate-400 text-[11px] font-semibold">Suggested from live feeds:</span>
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
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Article Format:
                  </label>
                  <select
                    value={aiType}
                    onChange={(e) => setAiType(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                  >
                    <option value="explainer">Deep Explainer</option>
                    <option value="blog">Blog / Monograph</option>
                    <option value="summary">30-Second Summary</option>
                    <option value="research">Research & Study</option>
                    <option value="sports-analysis">Sports Analysis</option>
                    <option value="fact-check">Fact Check</option>
                    <option value="opinion">Opinion & Editorial</option>
                    <option value="guide">Guide & FAQ</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 block mb-1">
                    Department:
                  </label>
                  <select
                    value={aiCategory}
                    onChange={(e) => setAiCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize"
                  >
                    <option value="science">Science & Space</option>
                    <option value="technology">Technology & AI</option>
                    <option value="world">World & Geopolitics</option>
                    <option value="sports">Sports</option>
                    <option value="business">Economy & Business</option>
                    <option value="health">Health & Clinical</option>
                    <option value="society">Society</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleRunAiWorkflow}
                  disabled={runningAiWorkflow || !aiTopic.trim()}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 cursor-pointer transition-colors shadow-sm"
                >
                  {runningAiWorkflow ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Retrieving live sources and executing 10-step protocol...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Run AI Content Workflow & Save as Draft</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Multilingual Translation Tool */}
            <div className="pt-6 border-t border-stone-200 dark:border-slate-800 space-y-3">
              <h3 className="text-sm font-bold font-editorial text-slate-900 dark:text-white flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                <span>Multilingual Translation Desk (7 Languages)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Translate any drafted report into Italian, French, Spanish, German, Urdu, or Arabic while respecting right-to-left (RTL) rules.
              </p>

              <div className="flex items-center gap-3">
                <select
                  value={translateTargetLang}
                  onChange={(e) => setTranslateTargetLang(e.target.value)}
                  className="px-3 py-2 text-xs rounded-lg bg-stone-100 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                >
                  <option value="it">Italian (Italiano)</option>
                  <option value="fr">French (Français)</option>
                  <option value="es">Spanish (Español)</option>
                  <option value="de">German (Deutsch)</option>
                  <option value="ur">Urdu (اردو) - RTL</option>
                  <option value="ar">Arabic (العربية) - RTL</option>
                  <option value="en">English</option>
                </select>

                <button
                  onClick={() => handleTranslate(aiTopic || 'The planetary energy balance is governed by oceanic thermal absorption.')}
                  disabled={translating}
                  className="px-4 py-2 bg-stone-900 dark:bg-stone-100 text-white dark:text-slate-900 rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  {translating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Globe className="w-3.5 h-3.5" />}
                  <span>Test Sample Translation</span>
                </button>
              </div>

              {translatedResult && (
                <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 text-xs font-sans whitespace-pre-wrap leading-relaxed">
                  {translatedResult}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB: AI TOOLS & COMMUNITY DIRECTORY MODERATION
          ======================================================== */}
      {activeTab === 'ai-tools' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold font-editorial text-slate-950 dark:text-white flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-blue-600" />
                  <span>AI Tools Directory &amp; Community Moderation</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Curate verified software, review community tool suggestions, and moderate authentic user reviews.
                </p>
              </div>
              <button
                onClick={loadAdminToolsData}
                disabled={loadingAiTools}
                className="px-3 py-1.5 rounded-lg border border-stone-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800 flex items-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAiTools ? 'animate-spin' : ''}`} />
                <span>Refresh Queue</span>
              </button>
            </div>

            {/* Sub-tabs within AI Tools */}
            <div className="flex items-center gap-2 border-b border-stone-200 dark:border-slate-800 pb-2 text-xs font-medium">
              <button
                onClick={() => setAiToolsSubTab('directory')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                  aiToolsSubTab === 'directory'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                Verified Directory ({adminTools.length})
              </button>
              <button
                onClick={() => setAiToolsSubTab('submissions')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  aiToolsSubTab === 'submissions'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Submissions Queue</span>
                {adminSubmissions.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                    {adminSubmissions.length}
                  </span>
                )}
              </button>
              <button
                onClick={() => setAiToolsSubTab('reviews')}
                className={`px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 ${
                  aiToolsSubTab === 'reviews'
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800'
                }`}
              >
                <span>Review Moderation</span>
                {adminPendingReviews.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-500 text-slate-950 font-bold">
                    {adminPendingReviews.length}
                  </span>
                )}
              </button>
            </div>

            {/* SubTab 1: Directory List & Add Form */}
            {aiToolsSubTab === 'directory' && (
              <div className="space-y-6">
                {/* Add Tool Form */}
                <form
                  onSubmit={handleCreateTool}
                  className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-4"
                >
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    + Add Verified AI Software to Directory
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Tool Name *
                      </label>
                      <input
                        type="text"
                        value={newToolName}
                        onChange={(e) => setNewToolName(e.target.value)}
                        placeholder="e.g. DeepSeek"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Official Website URL *
                      </label>
                      <input
                        type="url"
                        value={newToolWebsite}
                        onChange={(e) => setNewToolWebsite(e.target.value)}
                        placeholder="https://example.com"
                        required
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Category
                      </label>
                      <select
                        value={newToolCategory}
                        onChange={(e) => setNewToolCategory(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize"
                      >
                        <option value="writing">Writing &amp; Content</option>
                        <option value="coding">Coding &amp; Software</option>
                        <option value="research">Research &amp; Analysis</option>
                        <option value="image-video">Image &amp; Video</option>
                        <option value="productivity">Productivity</option>
                        <option value="education">Education</option>
                        <option value="audio-music">Audio &amp; Speech</option>
                        <option value="automation">Automation</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Pricing Tier
                      </label>
                      <select
                        value={newToolPricing}
                        onChange={(e) => setNewToolPricing(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize"
                      >
                        <option value="free">Free Forever</option>
                        <option value="freemium">Freemium</option>
                        <option value="free-trial">Free Trial</option>
                        <option value="paid">Paid Only</option>
                        <option value="open-source">Open Source</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Practical Use Cases (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={newToolUseCases}
                        onChange={(e) => setNewToolUseCases(e.target.value)}
                        placeholder="Drafting essays, summarization, brainstorming"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-600 dark:text-slate-400 font-semibold mb-1">
                        Known Restrictions &amp; Caveats (comma-separated)
                      </label>
                      <input
                        type="text"
                        value={newToolRestrictions}
                        onChange={(e) => setNewToolRestrictions(e.target.value)}
                        placeholder="Rate limits on free tier, requires GPU for local"
                        className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                    <div className="flex items-center gap-4 text-xs">
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newToolRequiresAccount}
                          onChange={(e) => setNewToolRequiresAccount(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Requires Account Registration</span>
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={newToolRequiresApiKey}
                          onChange={(e) => setNewToolRequiresApiKey(e.target.checked)}
                          className="rounded text-blue-600"
                        />
                        <span>Requires API Key</span>
                      </label>
                    </div>

                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                    >
                      Publish Verified Tool
                    </button>
                  </div>
                </form>

                {/* Directory Table */}
                <div className="border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden">
                  <div className="p-3 bg-stone-100 dark:bg-slate-950 font-semibold text-xs text-slate-700 dark:text-slate-300">
                    Active Directory Entries ({adminTools.length})
                  </div>
                  <div className="divide-y divide-stone-200 dark:divide-slate-800 text-xs">
                    {adminTools.map((tool) => (
                      <div
                        key={tool.id}
                        className="p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-stone-50 dark:hover:bg-slate-800/40"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-950 dark:text-white">{tool.name}</span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 capitalize">
                              {tool.category}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-stone-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 capitalize">
                              {tool.pricing}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 dark:text-slate-400">
                            {tool.websiteUrl} · Last reviewed:{' '}
                            {tool.lastReviewedDate ? new Date(tool.lastReviewedDate).toLocaleDateString() : 'N/A'}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <a
                            href={tool.websiteUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-stone-200"
                            title="Visit website"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => handleDeleteTool(tool.id)}
                            className="p-1.5 text-red-500 hover:text-red-700 cursor-pointer"
                            title="Delete tool"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* SubTab 2: Submissions Queue */}
            {aiToolsSubTab === 'submissions' && (
              <div className="space-y-4">
                {adminSubmissions.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800">
                    No pending submissions in queue. Community suggestions submitted via the public &quot;Suggest a Tool&quot; form will be listed here.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminSubmissions.map((sub) => (
                      <div
                        key={sub.id}
                        className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-950 dark:text-white">{sub.name}</span>
                            <span className="px-2 py-0.5 rounded text-[10px] bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200 font-bold uppercase">
                              Pending Review
                            </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            Website: <a href={sub.websiteUrl} target="_blank" rel="noreferrer" className="text-blue-600 underline">{sub.websiteUrl}</a>
                            {' · '}Category: <span className="capitalize">{sub.category}</span>
                            {' · '}Pricing: <span className="capitalize">{sub.pricing}</span>
                          </div>
                          {sub.practicalUseCases && sub.practicalUseCases.length > 0 && (
                            <p className="text-xs text-slate-600 dark:text-slate-300">
                              <strong>Use Cases:</strong> {sub.practicalUseCases.join(', ')}
                            </p>
                          )}
                          {sub.importantRestrictions && sub.importantRestrictions.length > 0 && (
                            <p className="text-xs text-slate-500">
                              <strong>Restrictions:</strong> {sub.importantRestrictions.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveSubmission(sub.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve &amp; Publish</span>
                          </button>
                          <button
                            onClick={() => handleRejectSubmission(sub.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950 hover:bg-red-200 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <X className="w-3.5 h-3.5" />
                            <span>Reject</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SubTab 3: Review Moderation */}
            {aiToolsSubTab === 'reviews' && (
              <div className="space-y-4">
                {adminPendingReviews.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-500 bg-stone-50 dark:bg-slate-950 rounded-xl border border-stone-200 dark:border-slate-800">
                    No pending authentic reviews to moderate. Reviews submitted with authentic user feedback will be staged here before publication.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {adminPendingReviews.map((rev) => (
                      <div
                        key={rev.id}
                        className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-slate-950 dark:text-white">
                              {rev.authorName}
                            </span>
                            <span className="text-amber-500 text-xs">
                              {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                            </span>
                            {rev.toolTitle && (
                              <span className="text-xs text-blue-600 dark:text-blue-400 font-semibold">
                                on {rev.toolTitle}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-700 dark:text-slate-300 italic font-serif">
                            &quot;{rev.comment}&quot;
                          </p>
                          <span className="text-[10px] text-slate-400">
                            Submitted: {new Date(rev.createdAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleApproveReview(rev.id)}
                            className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer shadow-sm flex items-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Approve Review</span>
                          </button>
                          <button
                            onClick={() => handleRejectReview(rev.id)}
                            className="px-3 py-1.5 rounded-lg bg-red-100 dark:bg-red-950 hover:bg-red-200 text-red-700 dark:text-red-300 text-xs font-semibold cursor-pointer flex items-center gap-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Discard Spam</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 4: REVENUE & GROWTH CENTER (MONETIZATION)
          ======================================================== */}
      {activeTab === 'revenue' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-editorial text-slate-950 dark:text-white flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                  <span>Monetization Control Center</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ethical revenue channels: Display Ads, Disclosed Affiliates, Direct Sponsorships, and Email Newsletters.
                </p>
              </div>
            </div>

            {/* A. Display Ads Settings */}
            {monetization && (
              <div className="p-5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      Google AdSense & Ethical Display Units
                    </h4>
                    <span className="text-[11px] text-slate-500">
                      Scripts are withheld until approved. Never injects deceptive or unverified ads.
                    </span>
                  </div>
                  <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                    <span>Enable Display Ads:</span>
                    <input
                      type="checkbox"
                      checked={monetization.displayAds.enabled}
                      onChange={(e) =>
                        handleSaveMonetization({
                          ...monetization,
                          displayAds: { ...monetization.displayAds, enabled: e.target.checked },
                        })
                      }
                      className="w-4 h-4 rounded text-blue-600"
                    />
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                      AdSense Client ID:
                    </label>
                    <input
                      type="text"
                      value={monetization.displayAds.adClient}
                      onChange={(e) =>
                        setMonetization({
                          ...monetization,
                          displayAds: { ...monetization.displayAds, adClient: e.target.value },
                        })
                      }
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>

                  <div className="flex items-center gap-4 pt-4">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={monetization.displayAds.testMode}
                        onChange={(e) =>
                          setMonetization({
                            ...monetization,
                            displayAds: { ...monetization.displayAds, testMode: e.target.checked },
                          })
                        }
                      />
                      <span>Test Mode (Safe Placeholders)</span>
                    </label>

                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={monetization.displayAds.consentEnabled}
                        onChange={(e) =>
                          setMonetization({
                            ...monetization,
                            displayAds: { ...monetization.displayAds, consentEnabled: e.target.checked },
                          })
                        }
                      />
                      <span>GDPR Consent Banner</span>
                    </label>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => handleSaveMonetization(monetization)}
                    disabled={savingMonetization}
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg cursor-pointer"
                  >
                    Save Ad Settings
                  </button>
                </div>
              </div>
            )}

            {/* B. Affiliate Marketing Management */}
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Affiliate Links & Disclosures
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Disclosed partner destination links. Transparent click-through telemetry.
                  </span>
                </div>
              </div>

              <form onSubmit={handleCreateAffiliateLink} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <input
                  type="text"
                  required
                  value={newAffiliateTitle}
                  onChange={(e) => setNewAffiliateTitle(e.target.value)}
                  placeholder="Product / Book Title"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="url"
                  required
                  value={newAffiliateUrl}
                  onChange={(e) => setNewAffiliateUrl(e.target.value)}
                  placeholder="https://affiliate.destination.url..."
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <select
                  value={newAffiliateCategory}
                  onChange={(e) => setNewAffiliateCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="science">Science & Books</option>
                  <option value="sports">Sports Gear & Sensors</option>
                  <option value="technology">Technology Hardware</option>
                  <option value="business">Finance & Economics</option>
                </select>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900 rounded-lg font-semibold cursor-pointer"
                >
                  + Add Link
                </button>
              </form>

              <div className="divide-y divide-stone-200 dark:divide-slate-800 text-xs">
                {affiliateLinks.map((link) => (
                  <div key={link.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">{link.title}</span>
                      <span className="text-slate-400 text-[11px]">{link.targetUrl}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-tabular">
                      <span className="text-blue-600 dark:text-blue-400 font-semibold">{link.clickCount} clicks</span>
                      <span className="text-slate-400 capitalize">{link.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* C. Direct Sponsorship Inquiries Pipeline */}
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                Sponsorship Inquiries ({sponsorshipInquiries.length})
              </h4>
              <div className="divide-y divide-stone-200 dark:divide-slate-800 text-xs">
                {sponsorshipInquiries.map((inq) => (
                  <div key={inq.id} className="py-3 flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white">{inq.companyName}</strong>
                        <span className="text-slate-400">({inq.contactEmail})</span>
                        <span className="px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-bold uppercase">
                          {inq.packageType}
                        </span>
                      </div>
                      <p className="text-slate-600 dark:text-slate-400 font-sans leading-relaxed">{inq.message}</p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      <select
                        value={inq.status}
                        onChange={(e) => handleUpdateSponsorStatus(inq.id, e.target.value as any)}
                        className="px-2.5 py-1 text-xs rounded border border-stone-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-semibold capitalize"
                      >
                        <option value="new">New</option>
                        <option value="contacted">Contacted</option>
                        <option value="booked">Booked</option>
                        <option value="declined">Declined</option>
                      </select>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* D. Newsletter Subscribers */}
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                    Newsletter Subscribers ({subscribers.length})
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    GDPR-compliant double-optin subscribers.
                  </span>
                </div>
                <button
                  onClick={() => {
                    const csvContent =
                      'data:text/csv;charset=utf-8,Email,SubscribedAt,Active\n' +
                      subscribers.map((s) => `${s.email},${s.subscribedAt},${s.active}`).join('\n');
                    const encodedUri = encodeURI(csvContent);
                    const link = document.createElement('a');
                    link.setAttribute('href', encodedUri);
                    link.setAttribute('download', 'factinfolive_subscribers.csv');
                    document.body.appendChild(link);
                    link.click();
                  }}
                  className="px-3 py-1.5 border border-stone-200 dark:border-slate-800 text-xs font-semibold rounded-lg hover:bg-white dark:hover:bg-slate-900 flex items-center gap-1 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>

              <div className="divide-y divide-stone-200 dark:divide-slate-800 text-xs max-h-48 overflow-y-auto">
                {subscribers.map((sub) => (
                  <div key={sub.id} className="py-2 flex items-center justify-between">
                    <span className="font-medium text-slate-900 dark:text-white">{sub.email}</span>
                    <span className="text-slate-400 text-[11px]">
                      {new Date(sub.subscribedAt).toLocaleDateString()} · {sub.active ? 'Active' : 'Unsubscribed'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* E. Digital Products & Guides Catalog (E-Commerce Readiness) */}
            <div className="p-5 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShoppingBag className="w-4 h-4 text-emerald-600" />
                    <span>Digital Products &amp; Guides Catalog ({adminProducts.length})</span>
                  </h4>
                  <span className="text-[11px] text-slate-500">
                    Drafted items remain disabled on the public site until real merchant integration is active. €0 overhead.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-200">
                  Readiness Mode (Drafts Staged)
                </span>
              </div>

              {/* Add Product Form */}
              <form onSubmit={handleCreateProduct} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div>
                  <input
                    type="text"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Product / Guide title..."
                    required
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    value={newProductDesc}
                    onChange={(e) => setNewProductDesc(e.target.value)}
                    placeholder="Brief description..."
                    className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    step="0.01"
                    value={newProductPrice}
                    onChange={(e) => setNewProductPrice(parseFloat(e.target.value) || 0)}
                    placeholder="19.99"
                    className="w-20 px-2 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none font-tabular"
                  />
                  <select
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value as any)}
                    className="flex-1 px-2 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white outline-none capitalize text-xs"
                  >
                    <option value="guide">Guide</option>
                    <option value="subscription">Subscription</option>
                    <option value="merchandise">Merchandise</option>
                    <option value="support">Support</option>
                  </select>
                </div>
                <div>
                  <button
                    type="submit"
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm"
                  >
                    + Stage Product
                  </button>
                </div>
              </form>

              {/* Products List */}
              <div className="divide-y divide-stone-200 dark:divide-slate-800 text-xs">
                {adminProducts.map((prod) => (
                  <div key={prod.id} className="py-2.5 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className="text-slate-900 dark:text-white">{prod.name}</strong>
                        <span className="text-emerald-600 dark:text-emerald-400 font-tabular font-semibold">
                          €{prod.price.toFixed(2)}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-stone-100 dark:bg-slate-800 text-slate-500 capitalize">
                          {prod.merchant}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">{prod.description}</p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleToggleProduct(prod)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold cursor-pointer ${
                          prod.enabled
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200'
                            : 'bg-stone-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                        }`}
                      >
                        {prod.enabled ? 'Active (Public)' : 'Disabled (Staged)'}
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(prod.id)}
                        className="p-1 text-red-500 hover:text-red-700 cursor-pointer"
                        title="Delete product"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 5: SEO & ORGANIC GROWTH CENTER
          ======================================================== */}
      {activeTab === 'seo' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white flex items-center gap-2">
                  <Search className="w-5 h-5 text-blue-600" />
                  <span>SEO & Organic Growth Health Audit</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Comprehensive audit scanning for thin content, duplicate slugs, missing meta descriptions, and sitemap synchronization.
                </p>
              </div>
              <button
                onClick={loadSeoAudit}
                disabled={loadingSeoAudit}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {loadingSeoAudit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                <span>Rescan Site Health</span>
              </button>
            </div>

            {/* Sitemap & Robots.txt Direct Verified Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">XML Sitemap Generator</span>
                  <span className="text-[11px] text-slate-500">Auto-includes all published dispatches and sections</span>
                </div>
                <a
                  href="/sitemap.xml"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-stone-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-semibold text-xs flex items-center gap-1 hover:bg-stone-300"
                >
                  <span>Open /sitemap.xml</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-slate-900 dark:text-white block">Robots.txt Directives</span>
                  <span className="text-[11px] text-slate-500">Search engine crawler instructions and sitemap link</span>
                </div>
                <a
                  href="/robots.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="px-3 py-1 bg-stone-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded font-semibold text-xs flex items-center gap-1 hover:bg-stone-300"
                >
                  <span>Open /robots.txt</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* Audit Diagnostics Table */}
            {seoAudit && (
              <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                    Site Health Scan Results
                  </span>
                  <span className="text-slate-500">
                    Scanned {seoAudit.scannedArticlesCount} articles · {seoAudit.totalIssuesCount} diagnostic issues found
                  </span>
                </div>

                {seoAudit.issues.length === 0 ? (
                  <div className="p-4 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-center font-medium">
                    ✓ All articles adhere to optimal SEO guidelines, word count baselines, and structured metadata.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {seoAudit.issues.map((iss: any, idx: number) => (
                      <div
                        key={idx}
                        className={`p-3 rounded-lg border flex items-center justify-between gap-4 ${
                          iss.type === 'error'
                            ? 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-300'
                            : 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900 text-amber-800 dark:text-amber-300'
                        }`}
                      >
                        <div>
                          <strong className="block text-slate-900 dark:text-white">{iss.title}</strong>
                          <span className="text-[11px]">{iss.message}</span>
                        </div>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded bg-white/60 dark:bg-black/40">
                          {iss.type}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 6: PRIVACY-CONSCIOUS ANALYTICS
          ======================================================== */}
      {activeTab === 'analytics' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-blue-600" />
                <span>Privacy-First First-Party Analytics</span>
              </h3>
              <p className="text-xs text-slate-500">
                100% GDPR-compliant telemetry. Zero third-party trackers, no cookies, no personal data harvesting.
              </p>
            </div>

            {loadingAnalytics ? (
              <div className="py-20 flex justify-center text-blue-600">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : analyticsSummary ? (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Total Page Views</span>
                    <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white">
                      {analyticsSummary.totalViews}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Citation Verifications</span>
                    <div className="text-2xl font-bold font-tabular text-blue-600 dark:text-blue-400">
                      {analyticsSummary.citationClicks}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Affiliate Clicks</span>
                    <div className="text-2xl font-bold font-tabular text-emerald-600">
                      {analyticsSummary.affiliateClicks}
                    </div>
                  </div>
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50 dark:bg-slate-950">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">Active Subscribers</span>
                    <div className="text-2xl font-bold font-tabular text-slate-900 dark:text-white">
                      {analyticsSummary.activeSubscribers}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Top Articles Leaderboard */}
                  <div className="p-4 rounded-xl border border-stone-200 dark:border-slate-800 space-y-3 text-xs">
                    <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px] block">
                      Most-Read Editorial Dossiers
                    </span>
                    <div className="divide-y divide-stone-100 dark:divide-slate-800">
                      {analyticsSummary.topArticles.map((art: any, i: number) => (
                        <div key={i} className="py-2 flex items-center justify-between">
                          <span className="font-medium text-slate-900 dark:text-white truncate max-w-xs">{art.title}</span>
                          <span className="font-tabular font-bold text-blue-600">{art.count} views</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Weekly Performance Recommendation */}
                  <div className="p-4 rounded-xl bg-blue-50/50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs space-y-2">
                    <span className="font-bold text-blue-900 dark:text-blue-200 uppercase tracking-wider text-[11px] block">
                      Weekly Performance Recommendation
                    </span>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed font-sans">
                      {analyticsSummary.weeklyRecommendation}
                    </p>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      )}

      {/* ========================================================
          TAB 7: TEAM & ROLE PERMISSIONS (ADMIN ONLY)
          ======================================================== */}
      {activeTab === 'team' && currentUser.role === 'administrator' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 space-y-6">
            <div>
              <h3 className="text-base font-bold font-editorial text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-600" />
                <span>Editorial Team & Role-Based Permissions</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage administrators, editors, and research fellows with scrypt-hashed authorization.
              </p>
            </div>

            {/* Add User Form */}
            <form onSubmit={handleCreateUser} className="p-4 rounded-xl bg-stone-50 dark:bg-slate-950 border border-stone-200 dark:border-slate-800 space-y-3 text-xs">
              <span className="font-bold text-slate-900 dark:text-white block text-[11px] uppercase tracking-wider">
                Create New Staff Account
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Username (e.g. editor2)"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  placeholder="Full Name & Title"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value as any)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                >
                  <option value="author">Staff Author / Fellow</option>
                  <option value="editor">Senior Fact-Checking Editor</option>
                  <option value="administrator">System Administrator</option>
                </select>
                <input
                  type="password"
                  required
                  value={newUserPassword}
                  onChange={(e) => setNewUserPassword(e.target.value)}
                  placeholder="Initial Password"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 text-slate-900 dark:text-white"
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-lg text-xs cursor-pointer"
                >
                  Create Staff User
                </button>
              </div>
            </form>

            {/* Users Table */}
            <div className="border border-stone-200 dark:border-slate-800 rounded-xl overflow-hidden divide-y divide-stone-100 dark:divide-slate-800 text-xs">
              {teamUsers.map((u) => (
                <div key={u.id} className="p-3 flex items-center justify-between">
                  <div>
                    <strong className="text-slate-900 dark:text-white block">{u.name}</strong>
                    <span className="text-slate-400 text-[11px]">@{u.username} · {u.email || 'Internal User'}</span>
                  </div>
                  <span className="px-2.5 py-1 rounded bg-stone-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold uppercase text-[10px]">
                    {u.role}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          LIVE PREVIEW MODAL (DESKTOP & MOBILE VIEWPORT TOGGLE)
          ======================================================== */}
      {previewArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 border border-stone-200 dark:border-slate-800 rounded-2xl w-full max-w-5xl overflow-hidden shadow-2xl relative my-8">
            <div className="p-4 border-b border-stone-200 dark:border-slate-800 flex items-center justify-between bg-stone-50 dark:bg-slate-950">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Live Viewport Simulation:
                </span>
                <div className="flex items-center gap-1 border border-stone-200 dark:border-slate-800 rounded-lg p-0.5">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      previewDevice === 'desktop'
                        ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    <Monitor className="w-3.5 h-3.5" />
                    <span>Desktop Broadsheet</span>
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-1 rounded text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                      previewDevice === 'mobile'
                        ? 'bg-slate-900 dark:bg-stone-100 text-white dark:text-slate-900'
                        : 'text-slate-500'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Mobile Screen (375px)</span>
                  </button>
                </div>
              </div>
              <button
                onClick={() => setPreviewArticle(null)}
                className="p-1 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[75vh] overflow-y-auto flex justify-center bg-stone-100 dark:bg-slate-950">
              <div
                className={`bg-white dark:bg-slate-900 p-6 rounded-xl border border-stone-200 dark:border-slate-800 shadow-sm transition-all duration-300 ${
                  previewDevice === 'mobile' ? 'w-[375px]' : 'w-full max-w-4xl'
                }`}
              >
                <div className="text-[11px] uppercase font-bold text-blue-600 dark:text-blue-400 mb-2">
                  {previewArticle.category} · {previewArticle.type}
                </div>
                <h1 className="text-2xl font-bold font-editorial text-slate-950 dark:text-white leading-tight mb-2">
                  {previewArticle.title}
                </h1>
                {previewArticle.subtitle && (
                  <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 font-sans leading-relaxed">
                    {previewArticle.subtitle}
                  </p>
                )}
                {previewArticle.imageUrl && (
                  <div className="rounded-lg overflow-hidden aspect-video mb-4 bg-stone-100 dark:bg-slate-950">
                    <img
                      src={previewArticle.imageUrl}
                      alt={previewArticle.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="prose prose-slate dark:prose-invert text-xs sm:text-sm font-sans leading-relaxed whitespace-pre-line">
                  {previewArticle.content}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
