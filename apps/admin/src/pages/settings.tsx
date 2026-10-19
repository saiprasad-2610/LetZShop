import type { AdminSettings } from '@simply/api-contracts';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Sliders,
  Bell,
  ShoppingBag,
  SlidersHorizontal,
  Layers,
  Cpu,
  RotateCw,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  Globe,
  ExternalLink,
  Lock,
  Mail,
  Phone,
  Clock,
  KeyRound,
  ShieldAlert,
  ArrowRight,
  Eye,
  CreditCard,
  Truck,
  MessageSquare,
  ShieldCheck,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, useAdminQuery } from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';

type TabKey =
  | 'general'
  | 'notifications'
  | 'commerce'
  | 'security'
  | 'moderation'
  | 'integrations'
  | 'system';

export default function Settings() {
  const { api, user: currentAdmin } = useAdminAuth();
  const { data, loading, error, reload } =
    useAdminQuery<AdminSettings>('admin/settings');
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // Form states per tab
  const [generalForm, setGeneralForm] = useState({
    platformName: '',
    supportEmail: '',
    supportPhone: '',
    defaultTimezone: 'Asia/Kolkata',
    defaultLocale: 'en-IN',
  });

  const [brandForm, setBrandForm] = useState({
    platformDisplayName: '',
    supportEmail: '',
    supportPhone: '',
    businessEmail: '',
    websiteUrl: '',
    helpCenterUrl: '',
  });

  const [notifForm, setNotifForm] = useState({
    notifyMerchantOnAccountSuspension: true,
    notifyAdminOnReviewReport: true,
    notifyMerchantOnFailedSubscription: true,
    notifyAdminOnBusinessVerification: true,
  });

  const [whatsappForm, setWhatsappForm] = useState({
    defaultTemplateGreeting: 'Hello from LetzShop,',
  });

  const [commerceForm, setCommerceForm] = useState({
    subscriptionGracePeriodDays: 3,
    orderNumberPrefix: 'ORD-',
    taxInclusivePricing: true,
  });

  const [securityForm, setSecurityForm] = useState({
    adminSessionTimeoutMinutes: 60,
    subAdminInviteExpiryDays: 7,
    maxFailedLoginAttempts: 5,
    requirePinChangeFirstLogin: true,
  });

  const [moderationForm, setModerationForm] = useState({
    reviewModerationPolicy: 'MANUAL_REMOVAL',
    autoHideAfterReports: 0,
  });

  const [systemForm, setSystemForm] = useState({
    maintenanceMode: false,
  });

  // Diagnostics states
  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpResult, setSmtpResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [whatsappPreviewOpen, setWhatsappPreviewOpen] = useState(false);

  // Per-section saving feedback
  const [saveStatus, setSaveStatus] = useState<{
    tab?: string;
    loading?: boolean;
    success?: string;
    error?: string;
  }>({});

  useEffect(() => {
    if (data) {
      setGeneralForm({
        platformName: data.general.platformName || 'LetzShop',
        supportEmail: data.general.supportEmail || 'support@letzshop.in',
        supportPhone: data.general.supportPhone || '+91 9876543210',
        defaultTimezone: data.general.defaultTimezone || 'Asia/Kolkata',
        defaultLocale: data.general.defaultLocale || 'en-IN',
      });
      setBrandForm({
        platformDisplayName: data.brand.platformDisplayName || 'LetzShop Marketplace',
        supportEmail: data.brand.supportEmail || 'support@letzshop.in',
        supportPhone: data.brand.supportPhone || '+91 9876543210',
        businessEmail: data.brand.businessEmail || 'admin@letzshop.in',
        websiteUrl: data.brand.websiteUrl || 'https://letzshop.in',
        helpCenterUrl: data.brand.helpCenterUrl || 'https://letzshop.in/help',
      });
      setNotifForm({
        notifyMerchantOnAccountSuspension:
          data.notifications.notifyMerchantOnAccountSuspension ?? true,
        notifyAdminOnReviewReport:
          data.notifications.notifyAdminOnReviewReport ?? true,
        notifyMerchantOnFailedSubscription:
          data.notifications.notifyMerchantOnFailedSubscription ?? true,
        notifyAdminOnBusinessVerification:
          data.notifications.notifyAdminOnBusinessVerification ?? true,
      });
      setWhatsappForm({
        defaultTemplateGreeting:
          data.whatsapp.defaultTemplateGreeting || 'Hello from LetzShop,',
      });
      setCommerceForm({
        subscriptionGracePeriodDays:
          data.commerce.subscriptionGracePeriodDays ?? 3,
        orderNumberPrefix: data.commerce.orderNumberPrefix || 'ORD-',
        taxInclusivePricing: data.commerce.taxInclusivePricing ?? true,
      });
      setSecurityForm({
        adminSessionTimeoutMinutes:
          data.security.adminSessionTimeoutMinutes ?? 60,
        subAdminInviteExpiryDays: data.security.subAdminInviteExpiryDays ?? 7,
        maxFailedLoginAttempts: data.security.maxFailedLoginAttempts ?? 5,
        requirePinChangeFirstLogin: true, // Always true invariant
      });
      setModerationForm({
        reviewModerationPolicy:
          data.moderation.reviewModerationPolicy || 'MANUAL_REMOVAL',
        autoHideAfterReports: data.moderation.autoHideAfterReports || 0,
      });
      setSystemForm({
        maintenanceMode: data.system.maintenanceMode ?? false,
      });

      if (!smtpTestEmail && currentAdmin?.email) {
        setSmtpTestEmail(currentAdmin.email);
      }
    }
  }, [data, currentAdmin]);

  const handleSave = async (category: string, payload: any) => {
    setSaveStatus({ tab: category, loading: true });
    try {
      await api.admin.updateSettings(category, payload);
      setSaveStatus({
        tab: category,
        success: 'Settings saved successfully and logged in Platform Audit.',
      });
      reload();
      setTimeout(() => setSaveStatus({}), 4000);
    } catch (err: any) {
      setSaveStatus({
        tab: category,
        error:
          err.message || 'Failed to save settings. Please verify inputs and permissions.',
      });
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smtpTestEmail) return;
    setSmtpTesting(true);
    setSmtpResult(null);
    try {
      const res = await api.admin.testSmtpConnection(smtpTestEmail);
      setSmtpResult(res);
    } catch (err: any) {
      setSmtpResult({
        success: false,
        message: err.message || 'SMTP test connection failed. Please check host credentials.',
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: any; description: string }[] = [
    { key: 'general', label: 'General', icon: Sliders, description: 'Marketplace identity & defaults' },
    { key: 'notifications', label: 'Notifications', icon: Bell, description: 'Automated alerts & communication' },
    { key: 'commerce', label: 'Commerce', icon: ShoppingBag, description: 'Order prefixes & grace periods' },
    { key: 'security', label: 'Security & Access', icon: SlidersHorizontal, description: 'Session lifespan & delegation' },
    { key: 'moderation', label: 'Moderation', icon: Layers, description: 'Review reports & auto-hide' },
    { key: 'integrations', label: 'Integrations', icon: Cpu, description: 'Razorpay, SMTP & gateways' },
    { key: 'system', label: 'System', icon: RotateCw, description: 'Runtime health & telemetry' },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>Platform Settings — LetzShop Admin</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-admin-text">
              Platform Settings
            </h1>
            <p className="text-sm text-admin-muted mt-1">
              Configure marketplace identity, security policies, integrations, and operational defaults.
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Operational Control Plane
            </span>
          </div>
        </div>

        <Feedback error={error} loading={loading} />

        {data && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tabs Sidebar */}
            <aside className="lg:w-64 shrink-0 space-y-4">
              <div className="border rounded-2xl p-2 bg-admin-surface border-admin-border space-y-1 shadow-xs">
                <div className="text-[10px] uppercase font-bold text-admin-muted px-3 py-1.5 tracking-wider">
                  Settings Sections
                </div>
                <nav className="flex flex-row lg:flex-col overflow-x-auto gap-0.5">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.key;
                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-medium transition-colors text-left whitespace-nowrap ${
                          isActive
                            ? 'bg-admin-soft text-admin-accent font-semibold shadow-xs'
                            : 'text-admin-secondary hover:bg-admin-raised hover:text-admin-text'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <div>
                          <div>{tab.label}</div>
                        </div>
                      </button>
                    );
                  })}
                </nav>
              </div>

              <div className="p-4 rounded-2xl border border-admin-border bg-admin-surface/60 text-xs text-admin-muted space-y-2 hidden lg:block shadow-xs">
                <div className="flex items-center gap-2 font-semibold text-admin-text text-xs">
                  <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  <span>Audit Enforcement</span>
                </div>
                <p className="text-[11px] text-admin-muted leading-relaxed">
                  Every change is committed to PostgreSQL and permanently recorded under <code>PLATFORM_SETTINGS_UPDATED</code> with user attribution and before/after diffs.
                </p>
              </div>
            </aside>

            {/* Tab Content Panel */}
            <main className="flex-1 min-w-0">
              {/* Notification Banner */}
              {saveStatus.tab === activeTab && (
                <div className="mb-4">
                  {saveStatus.success && (
                    <div className="flex items-center gap-2 p-3.5 text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-xl animate-in fade-in">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{saveStatus.success}</span>
                    </div>
                  )}
                  {saveStatus.error && (
                    <div className="flex items-center gap-2 p-3.5 text-sm bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-xl animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{saveStatus.error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* ========================================================================= */}
              {/* 1. GENERAL TAB */}
              {/* ========================================================================= */}
              {activeTab === 'general' && (
                <div className="admin-panel space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-admin-border">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">General Settings</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Manage the platform identity and regional defaults used across LetzShop.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Operational
                    </span>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Platform Name
                      </label>
                      <input
                        type="text"
                        value={generalForm.platformName}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, platformName: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                        placeholder="LetzShop"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Canonical marketplace display name used across admin headers, transactional messages, and platform footers.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Support Email
                      </label>
                      <input
                        type="email"
                        value={generalForm.supportEmail}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, supportEmail: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                        placeholder="support@letzshop.in"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Public platform support email displayed on help surfaces, billing notices, and transactional messages.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Support Phone
                      </label>
                      <input
                        type="text"
                        value={generalForm.supportPhone}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, supportPhone: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                        placeholder="+91 9876543210"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Primary support contact phone number for administrative and merchant inquiries.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Default Timezone
                      </label>
                      <input
                        type="text"
                        value={generalForm.defaultTimezone}
                        onChange={(e) =>
                          setGeneralForm({
                            ...generalForm,
                            defaultTimezone: e.target.value,
                          })
                        }
                        className="admin-input w-full text-sm"
                        placeholder="Asia/Kolkata"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Used for administrative date and time presentations. Stored timestamps remain UTC.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Default Locale
                      </label>
                      <input
                        type="text"
                        value={generalForm.defaultLocale}
                        onChange={(e) =>
                          setGeneralForm({ ...generalForm, defaultLocale: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                        placeholder="en-IN"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Fallback platform locale used when no explicit user or store locale is selected.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Default Currency
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="INR (Indian Rupee)"
                        className="admin-input w-full text-sm bg-admin-surface/70 cursor-not-allowed opacity-80"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        LetzShop currently operates in INR. Multi-currency support requires payment, invoice and tax changes and is not enabled.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('general', generalForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading && saveStatus.tab === 'general' ? 'Saving...' : 'Save General Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 2. NOTIFICATIONS TAB */}
              {/* ========================================================================= */}
              {activeTab === 'notifications' && (
                <div className="admin-panel space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-admin-border">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">Notification Channels & Communication</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Configure transactional notification triggers sent to merchants and platform administrators.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Operational
                    </span>
                  </div>

                  {/* Automated Triggers */}
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                      Automated Trigger Policies
                    </div>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 cursor-pointer hover:bg-admin-raised/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={notifForm.notifyMerchantOnAccountSuspension}
                        onChange={(e) =>
                          setNotifForm({
                            ...notifForm,
                            notifyMerchantOnAccountSuspension: e.target.checked,
                          })
                        }
                        className="mt-1 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-admin-text">
                          Send email notification on merchant account suspension
                        </span>
                        <div className="text-xs text-admin-muted mt-0.5">
                          Automatically notifies the merchant owner with support contact details when an administrator suspends their login.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 cursor-pointer hover:bg-admin-raised/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={notifForm.notifyAdminOnReviewReport}
                        onChange={(e) =>
                          setNotifForm({
                            ...notifForm,
                            notifyAdminOnReviewReport: e.target.checked,
                          })
                        }
                        className="mt-1 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-admin-text">
                          Alert administrators on new product review report
                        </span>
                        <div className="text-xs text-admin-muted mt-0.5">
                          Pushes attention badge alerts and system notifications when buyers or merchants flag abusive reviews.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 cursor-pointer hover:bg-admin-raised/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={notifForm.notifyMerchantOnFailedSubscription}
                        onChange={(e) =>
                          setNotifForm({
                            ...notifForm,
                            notifyMerchantOnFailedSubscription: e.target.checked,
                          })
                        }
                        className="mt-1 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-admin-text">
                          Notify merchant on failed subscription charge
                        </span>
                        <div className="text-xs text-admin-muted mt-0.5">
                          Warns merchants regarding invoice renewal failures during the subscription grace period.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 cursor-pointer hover:bg-admin-raised/40 transition-colors">
                      <input
                        type="checkbox"
                        checked={notifForm.notifyAdminOnBusinessVerification}
                        onChange={(e) =>
                          setNotifForm({
                            ...notifForm,
                            notifyAdminOnBusinessVerification: e.target.checked,
                          })
                        }
                        className="mt-1 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-semibold text-admin-text">
                          Notify administrators on business verification submissions
                        </span>
                        <div className="text-xs text-admin-muted mt-0.5">
                          Alerts compliance team when merchants upload GST, PAN, or identity documents for verification.
                        </div>
                      </div>
                    </label>
                  </div>

                  {/* WhatsApp Greeting Section */}
                  <div className="pt-4 border-t border-admin-border space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-admin-text">WhatsApp Outbound Communication</h3>
                        <p className="text-xs text-admin-muted mt-0.5">
                          Configure default greeting for customer and merchant deep-link WhatsApp interactions.
                        </p>
                      </div>
                      <span className="px-2.5 py-0.5 text-xs font-semibold rounded-full border bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30">
                        Mode: Deep Link
                      </span>
                    </div>

                    <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface/50 text-xs text-admin-muted leading-relaxed">
                      LetzShop currently opens WhatsApp with a pre-filled message. The Admin or merchant must press Send manually. Automated background delivery via WhatsApp Business Cloud API requires verified Meta business credentials.
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Default Template Greeting
                      </label>
                      <input
                        type="text"
                        value={whatsappForm.defaultTemplateGreeting}
                        onChange={(e) =>
                          setWhatsappForm({
                            ...whatsappForm,
                            defaultTemplateGreeting: e.target.value,
                          })
                        }
                        className="admin-input w-full text-sm"
                        placeholder="Hello from LetzShop,"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Pre-filled introductory greeting when administrators or merchants initiate WhatsApp contact.
                      </p>
                    </div>

                    {/* Preview Box */}
                    <div className="p-3.5 rounded-xl border border-admin-border bg-emerald-500/5 text-xs text-admin-text space-y-1 font-mono">
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-bold tracking-wider">
                        Generated Message Preview
                      </div>
                      <div className="text-xs text-admin-secondary">
                        "{whatsappForm.defaultTemplateGreeting || 'Hello from LetzShop,'} Regarding your store account on LetzShop: We noticed..."
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border gap-2">
                    <button
                      onClick={async () => {
                        await handleSave('notifications', notifForm);
                        await handleSave('whatsapp', whatsappForm);
                      }}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading ? 'Saving...' : 'Save Notification Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 3. COMMERCE TAB */}
              {/* ========================================================================= */}
              {activeTab === 'commerce' && (
                <div className="admin-panel space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-admin-border">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">Commerce & Billing Policies</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Global marketplace commerce rules, invoice numbering standards, and subscription grace limits.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Operational
                    </span>
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Subscription Grace Period (Days)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="30"
                        value={commerceForm.subscriptionGracePeriodDays}
                        onChange={(e) =>
                          setCommerceForm({
                            ...commerceForm,
                            subscriptionGracePeriodDays: Number(e.target.value),
                          })
                        }
                        className="admin-input w-full text-sm"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Allows stores to remain accessible for this many days after subscription expiry.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Order Number Prefix
                      </label>
                      <input
                        type="text"
                        value={commerceForm.orderNumberPrefix}
                        onChange={(e) =>
                          setCommerceForm({
                            ...commerceForm,
                            orderNumberPrefix: e.target.value,
                          })
                        }
                        className="admin-input w-full text-sm"
                        placeholder="ORD-"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Used at the start of newly generated order numbers across all stores.
                      </p>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Platform Currency
                      </label>
                      <input
                        type="text"
                        readOnly
                        value="INR (Indian Rupee)"
                        className="admin-input w-full text-sm bg-admin-surface/70 cursor-not-allowed opacity-80"
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Fixed to Indian Rupee (INR) for Razorpay payments and tax compliance.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-start gap-3 p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 cursor-pointer hover:bg-admin-raised/40 transition-colors">
                        <input
                          type="checkbox"
                          checked={commerceForm.taxInclusivePricing}
                          onChange={(e) =>
                            setCommerceForm({
                              ...commerceForm,
                              taxInclusivePricing: e.target.checked,
                            })
                          }
                          className="mt-1 rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-semibold text-admin-text">
                            Display tax-inclusive product pricing across storefronts
                          </span>
                          <div className="text-xs text-admin-muted mt-0.5">
                            Controls whether catalogue prices presented to buyers incorporate applicable GST calculations.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('commerce', commerceForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading && saveStatus.tab === 'commerce' ? 'Saving...' : 'Save Commerce Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 4. SECURITY TAB (WITH ADMIN ACCESS & DELEGATION SUMMARY) */}
              {/* ========================================================================= */}
              {activeTab === 'security' && (
                <div className="space-y-6">
                  {/* Security Controls Panel */}
                  <div className="admin-panel space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-admin-border">
                      <div>
                        <h2 className="text-lg font-bold text-admin-text">Platform Security Controls</h2>
                        <p className="text-xs text-admin-muted mt-0.5">
                          Authentication limits, session lifespans, and account protection policies for administrative staff.
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 self-start">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                        Operational
                      </span>
                    </div>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className="text-xs font-semibold text-admin-text block mb-1">
                          Admin Session Timeout (Minutes)
                        </label>
                        <input
                          type="number"
                          min="15"
                          max="1440"
                          value={securityForm.adminSessionTimeoutMinutes}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              adminSessionTimeoutMinutes: Number(e.target.value),
                            })
                          }
                          className="admin-input w-full text-sm"
                        />
                        <p className="text-[11px] text-admin-muted mt-1">
                          Controls how long an Admin session remains valid before authentication is required again. Changes take effect on subsequent logins.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-admin-text block mb-1">
                          Sub Admin Invite Expiration (Days)
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="30"
                          value={securityForm.subAdminInviteExpiryDays}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              subAdminInviteExpiryDays: Number(e.target.value),
                            })
                          }
                          className="admin-input w-full text-sm"
                        />
                        <p className="text-[11px] text-admin-muted mt-1">
                          Temporary Sub Admin credentials and invitations expire after this period if the administrator has not completed first login.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-admin-text block mb-1">
                          Max Failed Login Attempts
                        </label>
                        <input
                          type="number"
                          min="3"
                          max="20"
                          value={securityForm.maxFailedLoginAttempts}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              maxFailedLoginAttempts: Number(e.target.value),
                            })
                          }
                          className="admin-input w-full text-sm"
                        />
                        <p className="text-[11px] text-admin-muted mt-1">
                          After this many failed login attempts, LetzShop temporarily locks the Admin credential to reduce brute-force attacks. Lock duration: 15 minutes.
                        </p>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-admin-text block mb-1">
                          Multi-Factor Authentication (MFA)
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            readOnly
                            value="Not Configured"
                            className="admin-input w-full text-sm bg-admin-surface/70 cursor-not-allowed opacity-80"
                          />
                        </div>
                        <p className="text-[11px] text-admin-muted mt-1">
                          Multi-factor authentication adds a second verification step for administrative accounts. Hardware/TOTP MFA enforcement is currently not configured in this deployment.
                        </p>
                      </div>

                      <div className="sm:col-span-2">
                        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-purple-500/30 bg-purple-500/5">
                          <Lock className="w-4 h-4 text-purple-600 dark:text-purple-400 mt-1 shrink-0" />
                          <div className="flex-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-semibold text-admin-text">
                                Mandatory Password Change on First Login
                              </span>
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/30">
                                Mandatory Security Policy
                              </span>
                            </div>
                            <div className="text-xs text-admin-muted mt-0.5">
                              All Sub Admin temporary passwords must be replaced on first successful login. This security rule cannot be disabled.
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-3 border-t border-admin-border">
                      <button
                        onClick={() => handleSave('security', securityForm)}
                        disabled={saveStatus.loading}
                        className="btn-admin-primary flex items-center gap-2 text-xs"
                      >
                        <Save className="w-3.5 h-3.5" />
                        {saveStatus.loading && saveStatus.tab === 'security' ? 'Saving...' : 'Save Security Rules'}
                      </button>
                    </div>
                  </div>

                  {/* ADMIN ACCESS & DELEGATION SUMMARY */}
                  <div className="admin-panel space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-admin-border">
                      <div>
                        <h2 className="text-lg font-bold text-admin-text">ADMIN ACCESS & DELEGATION</h2>
                        <p className="text-xs text-admin-muted mt-0.5">
                          Administrative delegation overview, active roles, and security policy invariants.
                        </p>
                      </div>
                      <Link
                        href="/sub-admins"
                        className="btn-admin-primary inline-flex items-center gap-2 text-xs self-start"
                      >
                        <Users className="w-4 h-4" />
                        Manage Sub Admins
                        <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
                      </Link>
                    </div>

                    {/* Summary Counters */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-4 rounded-xl border border-admin-border bg-admin-surface/70 space-y-1">
                        <div className="text-xs text-admin-muted font-medium">Active Sub Admins</div>
                        <div className="text-2xl font-bold text-admin-text">
                          {data.adminDelegation?.activeSubAdmins ?? 1}
                        </div>
                        <div className="text-[11px] text-emerald-600 dark:text-emerald-400">
                          Active administrative credentials
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-admin-border bg-admin-surface/70 space-y-1">
                        <div className="text-xs text-admin-muted font-medium">Pending Invitations</div>
                        <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                          {data.adminDelegation?.pendingInvites ?? 0}
                        </div>
                        <div className="text-[11px] text-admin-muted">
                          Awaiting first login completion
                        </div>
                      </div>

                      <div className="p-4 rounded-xl border border-admin-border bg-admin-surface/70 space-y-1">
                        <div className="text-xs text-admin-muted font-medium">Suspended Sub Admins</div>
                        <div className="text-2xl font-bold text-rose-600 dark:text-rose-400">
                          {data.adminDelegation?.suspendedSubAdmins ?? 0}
                        </div>
                        <div className="text-[11px] text-admin-muted">
                          Access temporarily revoked
                        </div>
                      </div>
                    </div>

                    {/* Security Policy List */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface/40 space-y-2.5">
                      <div className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                        Administrative Security Policies
                      </div>
                      <div className="grid sm:grid-cols-2 gap-3 text-xs text-admin-secondary">
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-admin-text">Temporary Credentials:</strong> Generated with high-entropy salts; delivered securely via email.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-admin-text">Forced Password Change:</strong> Unconditionally enforced on first login before accessing administrative features.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-admin-text">Server-Side Permissions:</strong> Every API endpoint enforces granular permissions on every request.
                          </div>
                        </div>
                        <div className="flex items-start gap-2">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-admin-text">Session Isolation:</strong> Revoking or suspending an admin invalidates only their sessions immediately.
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 5. MODERATION TAB */}
              {/* ========================================================================= */}
              {activeTab === 'moderation' && (
                <div className="admin-panel space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-admin-border">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">Review Moderation Policy</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Rules governing customer product reviews, merchant abuse reports, and automated safety filters.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Operational
                    </span>
                  </div>

                  {/* Policy Explanations Card */}
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface/70 space-y-1.5">
                      <div className="text-xs font-bold text-admin-text uppercase tracking-wider">
                        MANUAL REVIEW & REMOVAL
                      </div>
                      <p className="text-xs text-admin-muted leading-relaxed">
                        Merchant reports create a moderation case, but the customer review remains visible until a Platform Admin investigates and removes it.
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface/70 space-y-1.5">
                      <div className="text-xs font-bold text-admin-text uppercase tracking-wider">
                        AUTO-HIDE ON REPORTS
                      </div>
                      <p className="text-xs text-admin-muted leading-relaxed">
                        Once the number of active reports on a review reaches the configured threshold, LetzShop automatically hides that review from the storefront until an Admin reviews the case.
                      </p>
                    </div>
                  </div>

                  {/* Form Controls */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Active Moderation Policy
                      </label>
                      <select
                        value={moderationForm.reviewModerationPolicy}
                        onChange={(e) =>
                          setModerationForm({
                            ...moderationForm,
                            reviewModerationPolicy: e.target.value,
                          })
                        }
                        className="admin-input w-full text-sm"
                      >
                        <option value="MANUAL_REMOVAL">
                          Manual Review & Removal by Administrator (Default)
                        </option>
                        <option value="AUTO_HIDE_ON_REPORTS">
                          Auto-Hide When Report Threshold Exceeded
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-semibold text-admin-text block mb-1">
                        Auto-Hide Threshold (Report Count)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="50"
                        value={moderationForm.autoHideAfterReports}
                        onChange={(e) =>
                          setModerationForm({
                            ...moderationForm,
                            autoHideAfterReports: Number(e.target.value),
                          })
                        }
                        className="admin-input w-full text-sm"
                        disabled={
                          moderationForm.reviewModerationPolicy === 'MANUAL_REMOVAL'
                        }
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Example: Threshold = 2. First report: Review stays visible. Second qualifying report: Review automatically hides. Set to 0 to disable auto-hide.
                      </p>
                    </div>
                  </div>

                  {/* Moderation Safety Assurance Notice */}
                  <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-500/5 text-xs text-blue-900 dark:text-blue-200 space-y-1.5">
                    <div className="font-bold flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                      <ShieldCheck className="w-4 h-4 shrink-0" />
                      <span>Moderation Safety & Data Invariant</span>
                    </div>
                    <p className="leading-relaxed text-[11px]">
                      Auto-hidden reviews are never hard-deleted. Review text, buyer metadata, product associations, order links, merchant reports, and full audit timelines are permanently preserved. Platform Admins can restore reviews, dismiss reports, or permanently remove public visibility at any time. Merchants cannot directly delete customer reviews.
                    </p>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('moderation', moderationForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading && saveStatus.tab === 'moderation' ? 'Saving...' : 'Save Moderation Policy'}
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 6. INTEGRATIONS TAB */}
              {/* ========================================================================= */}
              {activeTab === 'integrations' && (
                <div className="admin-panel space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-admin-border">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">Third-Party Gateway & Service Health</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Live connection status for payment processing, mail delivery, and logistics integrations.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Operational
                    </span>
                  </div>

                  {/* Integration Operational Status Cards */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* 1. Razorpay */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CreditCard className="w-4 h-4 text-admin-accent" />
                          <span className="font-bold text-sm text-admin-text">Razorpay Gateway</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            data.integrations.razorpay === 'CONNECTED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30'
                          }`}
                        >
                          {data.integrations.razorpay}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-admin-secondary">
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Environment:</span>
                          <span className="font-semibold text-admin-text">
                            {data.integrations.razorpayEnvironment || 'TEST'} Mode
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Used For:</span>
                          <span className="text-right text-admin-text">Subscription & Storefront Payments</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Currency:</span>
                          <span className="text-admin-text">INR (System Fixed)</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-admin-border/60 flex items-center justify-between">
                        <Link
                          href="/payments"
                          className="text-xs text-admin-accent hover:underline font-semibold flex items-center gap-1"
                        >
                          View Payments
                          <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                        <span className="text-[11px] text-admin-muted">Credentials secured</span>
                      </div>
                    </div>

                    {/* 2. SMTP Mail */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-admin-accent" />
                          <span className="font-bold text-sm text-admin-text">SMTP Email Service</span>
                        </div>
                        <span
                          className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${
                            data.integrations.smtp === 'CONNECTED'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                          }`}
                        >
                          {data.integrations.smtp}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-admin-secondary">
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Host / Provider:</span>
                          <span className="font-mono text-admin-text text-[11px]">
                            {data.integrations.smtpHost || 'smtp.ethereal.email'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Sender Email:</span>
                          <span className="font-mono text-admin-text text-[11px]">
                            {data.integrations.smtpSenderEmail || 'noreply@letzshop.in'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Used For:</span>
                          <span className="text-admin-text">Invites, Invoices, Alerts</span>
                        </div>
                      </div>

                      <div className="pt-2 border-t border-admin-border/60">
                        <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                          Operational mail transport
                        </span>
                      </div>
                    </div>

                    {/* 3. Shiprocket */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Truck className="w-4 h-4 text-admin-muted" />
                          <span className="font-bold text-sm text-admin-text">Shiprocket Logistics</span>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full border bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30">
                          {data.integrations.shiprocket === 'CONNECTED' ? 'Configured' : 'Not Configured'}
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-admin-secondary">
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Used For:</span>
                          <span className="text-admin-text">Automated Waybills & Tracking</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Integration Status:</span>
                          <span className="text-admin-muted">Setup Required</span>
                        </div>
                      </div>

                      <p className="text-[11px] text-admin-muted leading-relaxed pt-1">
                        Configure SHIPROCKET_EMAIL and SHIPROCKET_PASSWORD in environment settings to enable automated carrier assignment.
                      </p>
                    </div>

                    {/* 4. WhatsApp */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="w-4 h-4 text-emerald-500" />
                          <span className="font-bold text-sm text-admin-text">WhatsApp Provider</span>
                        </div>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          Deep Link
                        </span>
                      </div>

                      <div className="space-y-1 text-xs text-admin-secondary">
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Mode:</span>
                          <span className="font-semibold text-admin-text">Deep Link Only</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-admin-muted">Greeting:</span>
                          <span className="font-mono text-admin-text text-[11px] truncate max-w-[150px]">
                            {data.whatsapp.defaultTemplateGreeting}
                          </span>
                        </div>
                      </div>

                      <p className="text-[11px] text-admin-muted leading-relaxed pt-1">
                        LetzShop currently opens WhatsApp with a pre-filled message. The Admin or merchant must press Send manually.
                      </p>
                    </div>
                  </div>

                  {/* SMTP Connection Tester */}
                  <div className="pt-4 border-t border-admin-border space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-admin-text">Send Diagnostic Test Email</h3>
                      <p className="text-xs text-admin-muted">
                        Verify live SMTP connection by sending a test delivery message. Prompt for test recipient or send to your administrator account.
                      </p>
                    </div>

                    <form onSubmit={handleTestSmtp} className="flex flex-col sm:flex-row gap-2 max-w-lg">
                      <input
                        type="email"
                        required
                        value={smtpTestEmail}
                        onChange={(e) => setSmtpTestEmail(e.target.value)}
                        placeholder="admin@letzshop.in"
                        className="admin-input flex-1 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={smtpTesting}
                        className="btn-admin-primary flex items-center justify-center gap-1.5 text-xs shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {smtpTesting ? 'Sending Test...' : 'Send Test Email'}
                      </button>
                    </form>

                    {smtpResult && (
                      <div
                        className={`p-3.5 rounded-xl text-xs border flex items-center gap-2 animate-in fade-in ${
                          smtpResult.success
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                            : 'bg-rose-500/10 border-rose-500/30 text-rose-700 dark:text-rose-300'
                        }`}
                      >
                        {smtpResult.success ? (
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-500" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                        )}
                        <span>{smtpResult.message}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================================= */}
              {/* 7. SYSTEM TAB */}
              {/* ========================================================================= */}
              {activeTab === 'system' && (
                <div className="admin-panel space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-admin-border">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">System Operations & Telemetry</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Platform deployment state, database health check, and emergency maintenance controls.
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 shrink-0 self-start">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      Operational
                    </span>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 space-y-1">
                      <span className="text-xs font-semibold text-admin-muted">Database Connection</span>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {data.system.databaseStatus} (PostgreSQL)
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 space-y-1">
                      <span className="text-xs font-semibold text-admin-muted">Runtime Environment</span>
                      <div className="text-sm font-bold text-admin-text uppercase">
                        {data.system.environment}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 space-y-1">
                      <span className="text-xs font-semibold text-admin-muted">API Build Version</span>
                      <div className="text-sm font-bold font-mono text-admin-text">
                        {data.system.apiVersion}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-xl border border-admin-border bg-admin-surface/60 space-y-1">
                      <span className="text-xs font-semibold text-admin-muted">Last System Check</span>
                      <div className="text-xs font-mono text-admin-text">
                        {new Date(data.system.lastDeployedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-admin-border">
                    <label className="flex items-start gap-3 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/5 cursor-pointer hover:bg-rose-500/10 transition-colors">
                      <input
                        type="checkbox"
                        checked={systemForm.maintenanceMode}
                        onChange={(e) =>
                          setSystemForm({
                            ...systemForm,
                            maintenanceMode: e.target.checked,
                          })
                        }
                        className="mt-1 rounded border-rose-300 text-rose-600 focus:ring-rose-500"
                      />
                      <div className="flex-1">
                        <span className="text-sm font-bold text-rose-700 dark:text-rose-400">
                          Enable Platform Maintenance Mode
                        </span>
                        <div className="text-xs text-admin-muted mt-0.5">
                          When enabled, non-administrative storefront and merchant portal traffic is held with an operational maintenance notice.
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('system', systemForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading && saveStatus.tab === 'system' ? 'Saving...' : 'Save System Settings'}
                    </button>
                  </div>
                </div>
              )}
            </main>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
