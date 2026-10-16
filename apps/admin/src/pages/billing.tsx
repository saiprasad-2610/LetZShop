import type { AdminPlan } from '@simply/api-contracts';
import { Feedback, errorMessage } from '../components/AdminUI';
import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { SubscriptionList } from '../components/SubscriptionList';
import {
  CreditCard,
  Check,
  Plus,
  Edit3,
  Trash2,
  ShieldCheck,
  TrendingUp,
  Globe,
  Package,
  Users,
  HardDrive,
  X,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatPaise } from '@simply/ui';

interface PlanFormData {
  id?: string;
  name: string;
  code: string;
  description: string;
  priceRupees: number;
  billingCycle: string;
  maxProducts: number;
  maxStaff: number;
  maxStorageMb: number;
  customDomainAllowed: boolean;
  isPublic: boolean;
}

const initialFormData: PlanFormData = {
  name: '',
  code: '',
  description: '',
  priceRupees: 0,
  billingCycle: 'MONTHLY',
  maxProducts: 100,
  maxStaff: 5,
  maxStorageMb: 2048,
  customDomainAllowed: false,
  isPublic: true,
};

export default function AdminBillingPage() {
  const { api } = useAdminAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<AdminPlan[]>([]);
  const [loadError, setLoadError] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<PlanFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    setLoading(true);
    setLoadError('');
    try {
      const res = await api.admin.getPlans();
      setPlans(res);
    } catch (err) {
      setPlans([]);
      setLoadError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (type: 'success' | 'error', text: string) => {
    setFeedbackMessage({ type, text });
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleOpenCreateModal = () => {
    setIsEditing(false);
    setFormData(initialFormData);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (plan: AdminPlan) => {
    setIsEditing(true);
    setFormData({
      id: plan.id,
      name: plan.name,
      code: plan.code,
      description: plan.description || '',
      priceRupees: plan.pricePaise / 100,
      billingCycle: plan.billingCycle,
      maxProducts: plan.maxProducts,
      maxStaff: plan.maxStaff,
      maxStorageMb: plan.maxStorageMb,
      customDomainAllowed: Boolean(plan.customDomainAllowed),
      isPublic: Boolean(plan.isPublic),
    });
    setFormError(null);
    setModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formData.name.trim()) {
      setFormError('Please enter a plan name.');
      return;
    }

    setSubmitting(true);
    try {
      const pricePaise = Math.round(Number(formData.priceRupees) * 100);

      if (isEditing && formData.id) {
        await api.admin.updatePlan(formData.id, {
          name: formData.name.trim(),
          description: formData.description.trim() || undefined,
          pricePaise,
          billingCycle: formData.billingCycle,
          maxProducts: Number(formData.maxProducts),
          maxStaff: Number(formData.maxStaff),
          maxStorageMb: Number(formData.maxStorageMb),
          customDomainAllowed: formData.customDomainAllowed,
          isPublic: formData.isPublic,
        });
        showNotification(
          'success',
          `Plan "${formData.name}" successfully updated.`,
        );
      } else {
        await api.admin.createPlan({
          name: formData.name.trim(),
          code: formData.code.trim() || undefined,
          description: formData.description.trim() || undefined,
          pricePaise,
          billingCycle: formData.billingCycle,
          maxProducts: Number(formData.maxProducts),
          maxStaff: Number(formData.maxStaff),
          maxStorageMb: Number(formData.maxStorageMb),
          customDomainAllowed: formData.customDomainAllowed,
          isPublic: formData.isPublic,
        });
        showNotification(
          'success',
          `New plan "${formData.name}" successfully created.`,
        );
      }

      setModalOpen(false);
      await loadPlans();
    } catch (err: unknown) {
      console.error('Plan save error:', err);
      setFormError(
        errorMessage(err) || 'Failed to save plan. Please check inputs.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan: AdminPlan) => {
    const subscriberWarning =
      plan.activeSubscribersCount > 0
        ? `\n\nNotice: This plan currently has ${plan.activeSubscribersCount} merchant subscription record(s). To protect running stores, it will be safely archived and hidden from new signups instead of hard-deleted.`
        : '';

    const confirm = window.confirm(
      `Are you sure you want to delete the plan "${plan.name}" (${plan.code})?${subscriberWarning}`,
    );
    if (!confirm) return;

    try {
      const res = await api.admin.deletePlan(plan.id);
      showNotification(
        'success',
        res.message || `Plan "${plan.name}" processed.`,
      );
      await loadPlans();
    } catch (err: unknown) {
      console.error('Failed to delete plan:', err);
      showNotification('error', errorMessage(err) || 'Failed to delete plan.');
    }
  };

  return (
    <AdminLayout>
      <Head>
        <title>SaaS Plans & Pricing | LetzShop Admin</title>
      </Head>

      <div className="space-y-6 font-sans">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-admin-text tracking-tight">
              SaaS Plans & Subscriptions
            </h1>
            <p className="text-xs text-admin-muted mt-1">
              Create, configure, update pricing, feature caps, and govern
              merchant subscription tiers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadPlans}
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-admin-surface hover:bg-admin-bg text-admin-secondary text-xs font-semibold rounded-xl border border-admin-border shadow-sm transition cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-admin-accent' : ''}`}
              />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-admin-primary text-admin-on-primary text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Plan</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMessage && (
          <div
            className={`p-4 rounded-2xl text-xs font-semibold flex items-center gap-2.5 animate-in fade-in ${
              feedbackMessage.type === 'success'
                ? 'bg-admin-soft border border-admin-border text-admin-accent'
                : 'bg-admin-danger-soft border border-admin-border text-admin-danger'
            }`}
          >
            {feedbackMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-admin-accent flex-shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-admin-danger flex-shrink-0" />
            )}
            <span>{feedbackMessage.text}</span>
          </div>
        )}

        {/* Plans Grid */}
        {loadError ? (
          <Feedback error={loadError} onRetry={loadPlans} />
        ) : loading ? (
          <div className="p-16 text-center text-xs text-admin-muted bg-admin-surface rounded-3xl border border-admin-border">
            <span className="w-5 h-5 border-2 border-admin-border border-t-transparent rounded-full animate-spin inline-block mr-2" />
            Loading subscription tiers...
          </div>
        ) : plans.length === 0 ? (
          <div className="p-16 text-center bg-admin-surface rounded-3xl border border-admin-border space-y-3">
            <CreditCard className="w-8 h-8 text-admin-muted mx-auto" />
            <h3 className="font-bold text-admin-secondary text-sm">
              No Subscription Plans Configured
            </h3>
            <p className="text-xs text-admin-muted max-w-sm mx-auto">
              Create your first SaaS subscription tier so merchants can choose
              and subscribe to your platform.
            </p>
            <button
              onClick={handleOpenCreateModal}
              className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 bg-admin-primary text-admin-on-primary rounded-xl text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create Plan</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {plans.map((p) => {
              return (
                <div
                  key={p.id}
                  className={`bg-admin-surface rounded-3xl border ${'border-admin-border'} shadow-sm overflow-hidden flex flex-col justify-between hover:shadow-md transition duration-200 relative`}
                >
                  {/* Card Header & Badge */}
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-black text-lg text-admin-text">
                            {p.name}
                          </h3>
                          {!p.isPublic && p.availability !== 'CONTACT' && (
                            <span className="px-2 py-0.5 rounded-full bg-admin-raised text-admin-muted text-[10px] font-bold uppercase">
                              Archived
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-admin-muted tracking-wider">
                          CODE: {p.code}
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-2xl font-black font-mono text-admin-text">
                          {p.availability === 'CONTACT'
                            ? 'Contact Aikyam'
                            : formatPaise(p.pricePaise)}
                        </span>
                        <span className="text-[11px] text-admin-muted block font-medium">
                          /{p.billingCycle.toLowerCase()}
                        </span>
                      </div>
                    </div>

                    <p className="text-xs text-admin-muted leading-relaxed min-h-[36px]">
                      <span className="block font-semibold text-admin-accent mb-2">
                        {p.availability === 'COMING_SOON'
                          ? 'Coming Soon'
                          : p.availability === 'CONTACT'
                            ? 'Contact Aikyam'
                            : p.purchasable
                              ? 'Purchasable'
                              : 'Hidden'}{' '}
                        · {p.merchantCount} merchant(s)
                      </span>
                      {p.description || 'No description provided.'}
                    </p>

                    {/* Feature Caps List */}
                    <div className="space-y-2.5 pt-4 border-t border-admin-border text-xs text-admin-secondary">
                      <div className="flex items-center justify-between">
                        <span className="text-admin-muted flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-admin-muted" />
                          <span>Product Catalog:</span>
                        </span>
                        <span className="font-bold font-mono text-admin-text">
                          Up to {p.maxProducts} items
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-admin-muted flex items-center gap-1.5">
                          <Users className="w-3.5 h-3.5 text-admin-muted" />
                          <span>Staff Accounts:</span>
                        </span>
                        <span className="font-bold font-mono text-admin-text">
                          {p.maxStaff} members
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-admin-muted flex items-center gap-1.5">
                          <HardDrive className="w-3.5 h-3.5 text-admin-muted" />
                          <span>Media Storage:</span>
                        </span>
                        <span className="font-bold font-mono text-admin-text">
                          {p.maxStorageMb >= 1024
                            ? `${p.maxStorageMb / 1024} GB`
                            : `${p.maxStorageMb} MB`}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-admin-muted flex items-center gap-1.5">
                          <Globe className="w-3.5 h-3.5 text-admin-muted" />
                          <span>Custom Domain:</span>
                        </span>
                        <span
                          className={`font-semibold ${p.customDomainAllowed ? 'text-admin-accent' : 'text-admin-muted'}`}
                        >
                          {p.customDomainAllowed ? 'Included' : 'Not Allowed'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Card Footer: Subscribers & Action Buttons */}
                  <div className="p-4 bg-admin-bg border-t border-admin-border flex items-center justify-between">
                    <span className="text-[11px] font-semibold text-admin-muted">
                      {p.activeSubscribersCount} active merchant(s)
                    </span>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditModal(p)}
                        className="p-2 rounded-xl bg-admin-surface hover:bg-admin-raised text-admin-secondary border border-admin-border transition cursor-pointer"
                        title="Edit Plan"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeletePlan(p)}
                        className="p-2 rounded-xl bg-admin-surface hover:bg-admin-danger-soft text-admin-muted hover:text-admin-danger border border-admin-border hover:border-admin-border transition cursor-pointer"
                        title="Delete or Archive Plan"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Create / Edit Plan Modal Dialog */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-admin-overlay backdrop-blur-sm animate-in fade-in">
            <div
              role="dialog"
              aria-modal="true"
              aria-label={
                isEditing
                  ? 'Edit Subscription Tier'
                  : 'Create New Subscription Tier'
              }
              className="bg-admin-surface rounded-3xl border border-admin-border shadow-2xl max-w-lg w-full max-h-[90dvh] overflow-y-auto animate-in zoom-in-95 duration-200"
            >
              {/* Modal Header */}
              <div className="p-6 border-b border-admin-border flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-black text-admin-text">
                    {isEditing
                      ? 'Edit Subscription Tier'
                      : 'Create New Subscription Tier'}
                  </h2>
                  <p className="text-xs text-admin-muted mt-0.5">
                    Configure pricing, product boundaries, and merchant
                    capabilities
                  </p>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl text-admin-muted hover:text-admin-secondary hover:bg-admin-raised transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
                {formError && (
                  <div className="p-3 rounded-2xl bg-admin-danger-soft border border-admin-border text-admin-danger text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-admin-secondary mb-1">
                      Plan Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Enterprise Tier"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs font-medium text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-border focus:bg-admin-surface"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-admin-secondary mb-1">
                      Unique Plan Code {!isEditing && '(Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. ENTERPRISE_MONTHLY"
                      value={formData.code}
                      onChange={(e) =>
                        setFormData({ ...formData, code: e.target.value })
                      }
                      disabled={isEditing}
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs font-mono text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-border focus:bg-admin-surface disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-admin-secondary mb-1">
                      Price in INR (₹) *
                    </label>
                    <input
                      type="number"
                      step="1"
                      min="0"
                      placeholder="Price in rupees"
                      value={formData.priceRupees}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          priceRupees: Number(e.target.value),
                        })
                      }
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs font-medium text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-border focus:bg-admin-surface"
                      required
                    />
                    <span className="text-[10px] text-admin-muted mt-0.5 block">
                      0 for 100% Free / Trial
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-admin-secondary mb-1">
                      Billing Cycle
                    </label>
                    <select
                      value={formData.billingCycle}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          billingCycle: e.target.value,
                        })
                      }
                      className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs font-medium text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-border focus:bg-admin-surface"
                    >
                      <option value="MONTHLY">Monthly</option>
                      <option value="YEARLY">Yearly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-admin-secondary mb-1">
                    Plan Tagline / Description
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Best for high-growth merchants requiring custom domains"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full px-3 py-2 bg-admin-bg border border-admin-border rounded-xl text-xs font-medium text-admin-text focus:outline-none focus:ring-2 focus:ring-admin-border focus:bg-admin-surface"
                  />
                </div>

                {/* Limits Grid */}
                <div className="grid grid-cols-3 gap-2 pt-1">
                  <div>
                    <label className="block text-[11px] font-semibold text-admin-secondary mb-1">
                      Max Products
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxProducts}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxProducts: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-admin-secondary mb-1">
                      Staff Seats
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={formData.maxStaff}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxStaff: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-admin-secondary mb-1">
                      Storage (MB)
                    </label>
                    <input
                      type="number"
                      min="100"
                      value={formData.maxStorageMb}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          maxStorageMb: Number(e.target.value),
                        })
                      }
                      className="w-full px-2.5 py-1.5 bg-admin-bg border border-admin-border rounded-xl text-xs text-admin-text font-mono"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="pt-2 space-y-2 border-t border-admin-border">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-admin-secondary">
                    <input
                      type="checkbox"
                      checked={formData.customDomainAllowed}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          customDomainAllowed: e.target.checked,
                        })
                      }
                      className="w-4 h-4 text-admin-accent rounded focus:ring-admin-border"
                    />
                    <span>Allow Custom Domain Mapping (e.g. mystore.com)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-admin-secondary">
                    <input
                      type="checkbox"
                      checked={formData.isPublic}
                      onChange={(e) =>
                        setFormData({ ...formData, isPublic: e.target.checked })
                      }
                      className="w-4 h-4 text-admin-accent rounded focus:ring-admin-border"
                    />
                    <span>Publicly Visible in Merchant Plan Picker</span>
                  </label>
                </div>

                {/* Action Buttons */}
                <div className="pt-4 border-t border-admin-border flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2 rounded-xl text-xs font-semibold text-admin-secondary hover:bg-admin-raised transition cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-5 py-2 rounded-xl text-xs font-bold bg-admin-primary hover:bg-admin-primary text-admin-on-primary shadow-md transition disabled:opacity-60 cursor-pointer"
                  >
                    {submitting
                      ? 'Saving Plan...'
                      : isEditing
                        ? 'Update Plan'
                        : 'Create Plan'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        <SubscriptionList
          tenantId={
            typeof router.query.tenantId === 'string'
              ? router.query.tenantId
              : undefined
          }
        />
      </div>
    </AdminLayout>
  );
}
