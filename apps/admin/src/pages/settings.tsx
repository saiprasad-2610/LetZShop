import type { AdminSettings } from '@simply/api-contracts';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import {
  Sliders,
  Shield,
  Bell,
  MessageSquare,
  ShoppingBag,
  SlidersHorizontal,
  Layers,
  Cpu,
  Users,
  CheckCircle2,
  AlertTriangle,
  Send,
  Save,
  RotateCw,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, useAdminQuery } from '../components/AdminUI';
import { useAdminAuth } from '../context/AdminAuthContext';

type TabKey =
  | 'general'
  | 'brand'
  | 'notifications'
  | 'whatsapp'
  | 'commerce'
  | 'security'
  | 'moderation'
  | 'integrations'
  | 'system'
  | 'sub-admins';

export default function Settings() {
  const { api } = useAdminAuth();
  const { data, loading, error, reload } =
    useAdminQuery<AdminSettings>('admin/settings');
  const [activeTab, setActiveTab] = useState<TabKey>('general');

  // Form states per tab
  const [generalForm, setGeneralForm] = useState({
    platformName: '',
    supportEmail: '',
    supportPhone: '',
    defaultTimezone: '',
    defaultLocale: '',
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
  });

  const [whatsappForm, setWhatsappForm] = useState({
    defaultTemplateGreeting: '',
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
    requirePinChangeFirstLogin: false,
  });

  const [moderationForm, setModerationForm] = useState({
    reviewModerationPolicy: 'MANUAL_REMOVAL',
    autoHideAfterReports: 0,
  });

  const [systemForm, setSystemForm] = useState({
    maintenanceMode: false,
  });

  const [smtpTestEmail, setSmtpTestEmail] = useState('');
  const [smtpTesting, setSmtpTesting] = useState(false);
  const [smtpResult, setSmtpResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [saveStatus, setSaveStatus] = useState<{
    tab?: string;
    loading?: boolean;
    success?: string;
    error?: string;
  }>({});

  useEffect(() => {
    if (data) {
      setGeneralForm({
        platformName: data.general.platformName || '',
        supportEmail: data.general.supportEmail || '',
        supportPhone: data.general.supportPhone || '',
        defaultTimezone: data.general.defaultTimezone || '',
        defaultLocale: data.general.defaultLocale || '',
      });
      setBrandForm({
        platformDisplayName: data.brand.platformDisplayName || '',
        supportEmail: data.brand.supportEmail || '',
        supportPhone: data.brand.supportPhone || '',
        businessEmail: data.brand.businessEmail || '',
        websiteUrl: data.brand.websiteUrl || '',
        helpCenterUrl: data.brand.helpCenterUrl || '',
      });
      setNotifForm({
        notifyMerchantOnAccountSuspension:
          data.notifications.notifyMerchantOnAccountSuspension,
        notifyAdminOnReviewReport:
          data.notifications.notifyAdminOnReviewReport,
        notifyMerchantOnFailedSubscription:
          data.notifications.notifyMerchantOnFailedSubscription,
      });
      setWhatsappForm({
        defaultTemplateGreeting:
          data.whatsapp.defaultTemplateGreeting || '',
      });
      setCommerceForm({
        subscriptionGracePeriodDays:
          data.commerce.subscriptionGracePeriodDays,
        orderNumberPrefix: data.commerce.orderNumberPrefix || 'ORD-',
        taxInclusivePricing: data.commerce.taxInclusivePricing,
      });
      setSecurityForm({
        adminSessionTimeoutMinutes:
          data.security.adminSessionTimeoutMinutes,
        subAdminInviteExpiryDays: data.security.subAdminInviteExpiryDays,
        maxFailedLoginAttempts: data.security.maxFailedLoginAttempts,
        requirePinChangeFirstLogin:
          data.security.requirePinChangeFirstLogin,
      });
      setModerationForm({
        reviewModerationPolicy:
          data.moderation.reviewModerationPolicy || 'MANUAL_REMOVAL',
        autoHideAfterReports: data.moderation.autoHideAfterReports || 0,
      });
      setSystemForm({
        maintenanceMode: data.system.maintenanceMode,
      });
    }
  }, [data]);

  const handleSave = async (category: string, payload: any) => {
    setSaveStatus({ tab: category, loading: true });
    try {
      await api.admin.updateSettings(category, payload);
      setSaveStatus({
        tab: category,
        success: `${category.toUpperCase()} settings saved successfully.`,
      });
      reload();
      setTimeout(() => setSaveStatus({}), 4000);
    } catch (err: any) {
      setSaveStatus({
        tab: category,
        error:
          err.message || 'Failed to save settings. Please verify inputs.',
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
        message: err.message || 'SMTP test connection failed.',
      });
    } finally {
      setSmtpTesting(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: any }[] = [
    { key: 'general', label: 'General', icon: Sliders },
    { key: 'brand', label: 'Brand & Support', icon: Shield },
    { key: 'notifications', label: 'Notifications', icon: Bell },
    { key: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { key: 'commerce', label: 'Commerce', icon: ShoppingBag },
    { key: 'security', label: 'Security', icon: SlidersHorizontal },
    { key: 'moderation', label: 'Moderation', icon: Layers },
    { key: 'integrations', label: 'Integrations', icon: Cpu },
    { key: 'system', label: 'System', icon: RotateCw },
    { key: 'sub-admins', label: 'Sub Admins', icon: Users },
  ];

  return (
    <AdminLayout>
      <Head>
        <title>Platform Settings — LetzShop Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-admin-text">
            Platform Settings
          </h1>
          <p className="text-sm text-admin-muted mt-1">
            Production-grade configuration for marketplace operations, security policies, and integrations.
          </p>
        </div>

        <Feedback error={error} loading={loading} />

        {data && (
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Tabs Sidebar */}
            <aside className="lg:w-64 shrink-0">
              <nav className="flex flex-row lg:flex-col overflow-x-auto gap-1 border rounded-xl p-1.5 bg-admin-surface border-admin-border">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => {
                        if (tab.key === 'sub-admins') {
                          // Allow switching to Sub Admins tab or opening sub-admins page
                        }
                        setActiveTab(tab.key);
                      }}
                      className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left whitespace-nowrap ${
                        isActive
                          ? 'bg-admin-soft text-admin-accent font-semibold'
                          : 'text-admin-secondary hover:bg-admin-raised hover:text-admin-text'
                      }`}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              <div className="mt-4 p-3 rounded-lg border border-admin-border bg-admin-surface/50 text-xs text-admin-muted space-y-1 hidden lg:block">
                <div className="font-semibold text-admin-text">Configuration Source</div>
                <div className="break-words">{data.source}</div>
              </div>
            </aside>

            {/* Tab Content Panel */}
            <main className="flex-1 min-w-0">
              {saveStatus.tab === activeTab && (
                <div className="mb-4">
                  {saveStatus.success && (
                    <div className="flex items-center gap-2 p-3 text-sm bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{saveStatus.success}</span>
                    </div>
                  )}
                  {saveStatus.error && (
                    <div className="flex items-center gap-2 p-3 text-sm bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 rounded-lg">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>{saveStatus.error}</span>
                    </div>
                  )}
                </div>
              )}

              {/* 1. GENERAL TAB */}
              {activeTab === 'general' && (
                <div className="admin-panel space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">General Settings</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Core platform branding and regional defaults applied across administrative and merchant modules.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Currency (Read-only)
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={data.general.defaultCurrency}
                          className="admin-input w-full text-sm bg-admin-surface/70 cursor-not-allowed opacity-80"
                        />
                        <span className="text-[10px] uppercase font-bold px-2 py-1 bg-admin-raised border rounded text-admin-muted shrink-0">
                          System default
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('general', generalForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading ? 'Saving...' : 'Save General Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* 2. BRAND & SUPPORT TAB */}
              {activeTab === 'brand' && (
                <div className="admin-panel space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">Brand & Support Configuration</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Public-facing identities, contact information, and support URLs displayed in notifications and invoices.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Platform Display Name
                      </label>
                      <input
                        type="text"
                        value={brandForm.platformDisplayName}
                        onChange={(e) =>
                          setBrandForm({
                            ...brandForm,
                            platformDisplayName: e.target.value,
                          })
                        }
                        className="admin-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Public Support Email
                      </label>
                      <input
                        type="email"
                        value={brandForm.supportEmail}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, supportEmail: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Public Support Phone
                      </label>
                      <input
                        type="text"
                        value={brandForm.supportPhone}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, supportPhone: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Business / Legal Email
                      </label>
                      <input
                        type="email"
                        value={brandForm.businessEmail}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, businessEmail: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Official Website URL
                      </label>
                      <input
                        type="url"
                        value={brandForm.websiteUrl}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, websiteUrl: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Help Center URL
                      </label>
                      <input
                        type="url"
                        value={brandForm.helpCenterUrl}
                        onChange={(e) =>
                          setBrandForm({ ...brandForm, helpCenterUrl: e.target.value })
                        }
                        className="admin-input w-full text-sm"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('brand', brandForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading ? 'Saving...' : 'Save Brand Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* 3. NOTIFICATIONS TAB */}
              {activeTab === 'notifications' && (
                <div className="admin-panel space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">Notification Channels & Automated Alerts</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Configure transactional notification triggers sent to merchants and platform administrators.
                      </p>
                    </div>
                    <span
                      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
                        data.notifications.emailServiceStatus === 'CONNECTED'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                      }`}
                    >
                      SMTP: {data.notifications.emailServiceStatus}
                    </span>
                  </div>

                  <div className="space-y-4">
                    <label className="flex items-start gap-3 p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 cursor-pointer">
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
                      <div>
                        <div className="text-sm font-semibold text-admin-text">
                          Send email notification on merchant account suspension
                        </div>
                        <div className="text-xs text-admin-muted">
                          Automatically notifies the merchant owner with support contact details when an administrator suspends their login.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 cursor-pointer">
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
                      <div>
                        <div className="text-sm font-semibold text-admin-text">
                          Alert administrators on new product review report
                        </div>
                        <div className="text-xs text-admin-muted">
                          Pushes attention badge alerts and system notifications when buyers or merchants flag abusive reviews.
                        </div>
                      </div>
                    </label>

                    <label className="flex items-start gap-3 p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 cursor-pointer">
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
                      <div>
                        <div className="text-sm font-semibold text-admin-text">
                          Notify merchant on failed subscription charge
                        </div>
                        <div className="text-xs text-admin-muted">
                          Warns merchants regarding invoice renewal failures during the subscription grace period.
                        </div>
                      </div>
                    </label>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('notifications', notifForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading ? 'Saving...' : 'Save Notification Rules'}
                    </button>
                  </div>
                </div>
              )}

              {/* 4. WHATSAPP TAB */}
              {activeTab === 'whatsapp' && (
                <div className="admin-panel space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">WhatsApp Integration</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Operational messaging configuration for customer & merchant WhatsApp communication.
                      </p>
                    </div>
                    <span className="px-2.5 py-1 text-xs font-semibold rounded-full border bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30">
                      Mode: {data.whatsapp.mode === 'CLOUD_API' ? 'Cloud API' : 'Deep-Link Only'}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-xs text-amber-800 dark:text-amber-200">
                    <strong>Deep-Link Mode Active:</strong> LetzShop currently triggers merchant and customer WhatsApp conversations via secure browser/app deep links (`https://wa.me/...`). Automated background delivery via WhatsApp Business Cloud API requires verified Meta business credentials.
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-admin-text mb-1">
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
                      Pre-filled introductory greeting when merchants or admins initiate WhatsApp contact.
                    </p>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('whatsapp', whatsappForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading ? 'Saving...' : 'Save WhatsApp Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* 5. COMMERCE TAB */}
              {activeTab === 'commerce' && (
                <div className="admin-panel space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">Commerce & Billing Policies</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Global marketplace commerce rules, invoice numbering standards, and subscription grace limits.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                        Days merchants can access features before storefront suspensions on overdue invoices.
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                      />
                      <p className="text-[11px] text-admin-muted mt-1">
                        Standard prefix for generated buyer receipts and marketplace orders.
                      </p>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-3 p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={commerceForm.taxInclusivePricing}
                          onChange={(e) =>
                            setCommerceForm({
                              ...commerceForm,
                              taxInclusivePricing: e.target.checked,
                            })
                          }
                          className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                        />
                        <div>
                          <div className="text-sm font-semibold text-admin-text">
                            Display tax-inclusive product pricing
                          </div>
                          <div className="text-xs text-admin-muted">
                            Standard GST-inclusive pricing shown to retail buyers on all storefronts.
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
                      {saveStatus.loading ? 'Saving...' : 'Save Commerce Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* 6. SECURITY TAB */}
              {activeTab === 'security' && (
                <div className="admin-panel space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">Platform Security Controls</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Session lifetime, delegated administrator invite policies, and rate-limiting rules.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Max Failed PIN Login Attempts
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
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        MFA Policy
                      </label>
                      <input
                        type="text"
                        readOnly
                        value={data.security.mfaPolicy}
                        className="admin-input w-full text-sm bg-admin-surface/70 cursor-not-allowed opacity-80"
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="flex items-center gap-3 p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={securityForm.requirePinChangeFirstLogin}
                          onChange={(e) =>
                            setSecurityForm({
                              ...securityForm,
                              requirePinChangeFirstLogin: e.target.checked,
                            })
                          }
                          className="rounded border-admin-border text-admin-accent focus:ring-admin-accent"
                        />
                        <div>
                          <div className="text-sm font-semibold text-admin-text">
                            Require PIN change on initial delegated administrator login
                          </div>
                          <div className="text-xs text-admin-muted">
                            Mandates that invited sub-admins set a new personal 6-digit PIN upon initial activation.
                          </div>
                        </div>
                      </label>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('security', securityForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading ? 'Saving...' : 'Save Security Rules'}
                    </button>
                  </div>
                </div>
              )}

              {/* 7. MODERATION TAB */}
              {activeTab === 'moderation' && (
                <div className="admin-panel space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">Review Moderation Policy</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Operational policy governing customer reviews, merchant moderation requests, and automated takedowns.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-lg border border-admin-border bg-admin-surface/50 text-xs text-admin-secondary space-y-1">
                    <div className="font-semibold text-admin-text">Current Operational Policy</div>
                    <div>{data.moderation.policyExplanation}</div>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-semibold text-admin-text mb-1">
                        Moderation Action Policy
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
                      <label className="block text-xs font-semibold text-admin-text mb-1">
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
                        Set to 0 to disable automated hiding until manual administrator audit.
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-admin-border">
                    <button
                      onClick={() => handleSave('moderation', moderationForm)}
                      disabled={saveStatus.loading}
                      className="btn-admin-primary flex items-center gap-2 text-xs"
                    >
                      <Save className="w-3.5 h-3.5" />
                      {saveStatus.loading ? 'Saving...' : 'Save Moderation Policy'}
                    </button>
                  </div>
                </div>
              )}

              {/* 8. INTEGRATIONS TAB */}
              {activeTab === 'integrations' && (
                <div className="admin-panel space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">Third-Party Gateway & Service Health</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Live connection status for payment processing, mail delivery, and logistics integrations.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    {/* Razorpay */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-admin-text">Razorpay Gateway</span>
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
                      <p className="text-xs text-admin-muted">
                        Processes marketplace subscriptions and online checkout payments. Secret keys are securely stored in the production environment.
                      </p>
                    </div>

                    {/* SMTP */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-admin-text">SMTP Email Service</span>
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
                      <p className="text-xs text-admin-muted">
                        Delivers administrative invitations, suspension notices, and billing receipts.
                      </p>
                    </div>

                    {/* Shiprocket */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-admin-text">Shiprocket Logistics</span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full border bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30">
                          {data.integrations.shiprocket}
                        </span>
                      </div>
                      <p className="text-xs text-admin-muted">
                        Automated fulfillment and tracking number synchronisation for merchant shipments.
                      </p>
                    </div>

                    {/* WhatsApp */}
                    <div className="p-4 rounded-xl border border-admin-border bg-admin-surface space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-admin-text">WhatsApp Provider</span>
                        <span className="px-2 py-0.5 text-xs font-semibold rounded-full border bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30">
                          {data.integrations.whatsapp}
                        </span>
                      </div>
                      <p className="text-xs text-admin-muted">
                        Deep-link routing to wa.me with pre-formatted merchant context messages.
                      </p>
                    </div>
                  </div>

                  {/* SMTP Connection Tester */}
                  <div className="pt-4 border-t border-admin-border space-y-3">
                    <div>
                      <h3 className="text-sm font-bold text-admin-text">Test SMTP Mail Connection</h3>
                      <p className="text-xs text-admin-muted">
                        Send a diagnostic ping through the configured mail service to verify operational delivery.
                      </p>
                    </div>

                    <form onSubmit={handleTestSmtp} className="flex gap-2 max-w-md">
                      <input
                        type="email"
                        required
                        value={smtpTestEmail}
                        onChange={(e) => setSmtpTestEmail(e.target.value)}
                        placeholder="admin-test@letzshop.in"
                        className="admin-input flex-1 text-xs"
                      />
                      <button
                        type="submit"
                        disabled={smtpTesting}
                        className="btn-admin-primary flex items-center gap-1.5 text-xs shrink-0"
                      >
                        <Send className="w-3.5 h-3.5" />
                        {smtpTesting ? 'Testing...' : 'Test Connection'}
                      </button>
                    </form>

                    {smtpResult && (
                      <div
                        className={`p-3 rounded-lg text-xs border flex items-center gap-2 ${
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

              {/* 9. SYSTEM TAB */}
              {activeTab === 'system' && (
                <div className="admin-panel space-y-6">
                  <div>
                    <h2 className="text-lg font-bold text-admin-text">System Operations & Diagnostic Telemetry</h2>
                    <p className="text-xs text-admin-muted mt-0.5">
                      Platform deployment state, database health check, and emergency maintenance controls.
                    </p>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 space-y-1">
                      <div className="text-xs font-semibold text-admin-muted">Database Connection</div>
                      <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
                        <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                        {data.system.databaseStatus}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 space-y-1">
                      <div className="text-xs font-semibold text-admin-muted">Runtime Environment</div>
                      <div className="text-sm font-bold text-admin-text uppercase">
                        {data.system.environment}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 space-y-1">
                      <div className="text-xs font-semibold text-admin-muted">API Build Version</div>
                      <div className="text-sm font-bold font-mono text-admin-text">
                        {data.system.apiVersion}
                      </div>
                    </div>

                    <div className="p-3.5 rounded-lg border border-admin-border bg-admin-surface/60 space-y-1">
                      <div className="text-xs font-semibold text-admin-muted">Last System Check</div>
                      <div className="text-xs font-mono text-admin-text">
                        {new Date(data.system.lastDeployedAt).toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-admin-border">
                    <label className="flex items-start gap-3 p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/5 cursor-pointer">
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
                      <div>
                        <div className="text-sm font-bold text-rose-700 dark:text-rose-400">
                          Enable Platform Maintenance Mode
                        </div>
                        <div className="text-xs text-admin-muted">
                          When enabled, store visitors and merchants see a scheduled maintenance notice. Platform administrators retain full dashboard access.
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
                      {saveStatus.loading ? 'Saving...' : 'Save System Settings'}
                    </button>
                  </div>
                </div>
              )}

              {/* 10. SUB ADMINS TAB */}
              {activeTab === 'sub-admins' && (
                <div className="admin-panel space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-bold text-admin-text">Delegated Administrator Management</h2>
                      <p className="text-xs text-admin-muted mt-0.5">
                        Create and manage sub-admins with fine-grained access permissions across marketplace domains.
                      </p>
                    </div>
                    <Link
                      href="/sub-admins"
                      className="btn-admin-primary inline-flex items-center gap-2 text-xs self-start"
                    >
                      <Users className="w-4 h-4" />
                      Open Full Sub Admins Console
                    </Link>
                  </div>

                  <div className="p-4 rounded-xl border border-admin-border bg-admin-surface/70 space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-admin-muted">
                      Delegated Role Security Model
                    </div>
                    <ul className="text-xs text-admin-secondary space-y-2 list-disc list-inside">
                      <li>
                        <strong>No Plaintext Permanent Passwords:</strong> Super Admin triggers a cryptographically signed invitation email with a one-time activation token.
                      </li>
                      <li>
                        <strong>Mandatory Self-Onboarding:</strong> Invited administrators set their own secure 6-digit PIN on the activation link.
                      </li>
                      <li>
                        <strong>Server-Side Permission Guards:</strong> Every administrative API checks granular permissions before executing mutations.
                      </li>
                      <li>
                        <strong>Super Admin Protection:</strong> Sub-admins cannot elevate their own permissions or modify Super Admin accounts.
                      </li>
                    </ul>
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
