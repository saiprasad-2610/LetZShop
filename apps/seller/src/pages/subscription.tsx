import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  AlertCircle, 
  Globe, 
  Lock, 
  Clock, 
  ShieldCheck,
  Zap,
  ArrowRight,
  History,
  FileText,
  Calendar,
  Download
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { formatPaise } from '@simply/ui';

const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false);
    if ((window as any).Razorpay) return resolve(true);

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export default function SubscriptionPage() {
  const { api, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<any[]>([]);
  const [currentSub, setCurrentSub] = useState<any>(null);
  const [store, setStore] = useState<any>(null);
  const [activating, setActivating] = useState<string | null>(null);

  useEffect(() => {
    loadSubscriptionInfo();
  }, []);

  const loadSubscriptionInfo = async () => {
    setLoading(true);
    try {
      const [plansRes, subRes, storeRes] = await Promise.all([
        api.subscriptions.getPlans(),
        api.subscriptions.getCurrent().catch(() => null),
        api.stores.getMyStore(),
      ]);
      setPlans(plansRes || []);
      setCurrentSub(subRes);
      setStore(storeRes);
    } catch (err) {
      console.error('Failed to load subscription info', err);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePlan = async (plan: any) => {
    // 10. Double-clicking subscription payment must not create duplicate subscriptions
    if (activating) return;
    setActivating(plan.id);

    try {
      if (currentSub?.planId === plan.id && isLive) {
        alert('You already have an active subscription to this plan.');
        setActivating(null);
        return;
      }

      // Load Razorpay Checkout SDK
      const sdkReady = await loadRazorpayScript();
      if (!sdkReady) {
        alert('Unable to load Razorpay payment checkout. Please check your network connection.');
        setActivating(null);
        return;
      }

      // Backend calculates authoritative plan amount and creates Razorpay Test Mode Order (Requirements 2, 3)
      const orderData = await api.subscriptions.createOrder(plan.id, 'MONTHLY');

      // Open Razorpay Checkout using returned order_id and public Key ID (Requirement 4)
      const options = {
        key: orderData.keyId,
        amount: orderData.amountPaise,
        currency: orderData.currency || 'INR',
        name: 'AIKYAM Platform',
        description: `Subscription: ${plan.name}`,
        order_id: orderData.providerOrderId,
        prefill: {
          name: user?.fullName || '',
          contact: user?.phone || '',
          email: user?.email || '',
        },
        theme: {
          color: '#10B981',
        },
        modal: {
          ondismiss: function () {
            // Failed/cancelled payment must leave store PRIVATE (Requirement 9)
            setActivating(null);
          },
        },
        handler: async function (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) {
          try {
            // Send razorpay_payment_id, razorpay_order_id, razorpay_signature to backend (Requirement 5)
            await api.subscriptions.verify({
              paymentOrderId: orderData.paymentOrderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
            });

            alert('Subscription payment verified successfully! Your store is now LIVE to the public.');
            await loadSubscriptionInfo();
          } catch (verifyErr: any) {
            alert(verifyErr.message || 'Payment verification failed. Store remains private.');
          } finally {
            setActivating(null);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.on('payment.failed', function (errResp: any) {
        // Failed/cancelled payment leaves store PRIVATE (Requirement 9)
        alert('Payment failed: ' + (errResp.error?.description || 'Payment was unsuccessful.'));
        setActivating(null);
      });
      rzp.open();
    } catch (err: any) {
      alert(err.message || 'Failed to initiate subscription payment.');
      setActivating(null);
    }
  };

  const isLive = (store?.status === 'LIVE' || store?.status === 'ACTIVE') && currentSub?.status === 'ACTIVE';
  const isExpired = currentSub?.status === 'EXPIRED' || store?.status === 'SUSCRIPTION_EXPIRED' || store?.status === 'SUSPENDED';
  const isUnpaid = !currentSub || currentSub?.status === 'UNPAID' || store?.status === 'PRIVATE_PREVIEW' || store?.status === 'DRAFT';

  return (
    <Layout>
      <Head>
        <title>Store Publishing & Subscription | Simply Seller</title>
      </Head>

      <div className="space-y-8 max-w-5xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-[var(--merchant-text)] tracking-tight">
            Store Publishing & Subscription
          </h1>
          <p className="text-sm text-[var(--merchant-text-muted)]">
            Transparent pricing with zero hidden commissions. Keep 100% of your customer revenue.
          </p>
        </div>

        {/* Current Status Card */}
        <div
          className={`p-6 rounded-2xl border shadow-xs transition-colors ${
            isLive
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : isExpired
              ? 'bg-rose-500/10 border-rose-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                {isLive ? (
                  <>
                    <Globe className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-[var(--merchant-text)] text-base">Your Store is LIVE</span>
                  </>
                ) : isExpired ? (
                  <>
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                    <span className="font-bold text-[var(--merchant-text)] text-base">Store Offline (Subscription Expired)</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-amber-500" />
                    <span className="font-bold text-[var(--merchant-text)] text-base">Your Store is Private</span>
                  </>
                )}
              </div>

              <p className="text-xs text-[var(--merchant-text-muted)]">
                {isLive
                  ? `Active on the ${currentSub?.plan?.name || 'Pro'} plan. Valid through ${new Date(
                      currentSub?.currentPeriodEnd
                    ).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}.`
                  : isExpired
                  ? 'Your subscription expired. Public shoppers currently see a maintenance screen. Private preview remains accessible.'
                  : 'Your storefront is configured and ready for shoppers! Select a plan below to publish publicly.'}
              </p>
            </div>

            {isLive && (
              <a
                href={`http://localhost:3000/store/${store?.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg shadow-sm transition self-start sm:self-auto"
              >
                Visit Public Storefront
              </a>
            )}
          </div>
        </div>

        {/* Pricing Plans Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-[var(--merchant-text)]">Choose a Merchant Plan</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((p) => {
              const isCurrent = currentSub?.planId === p.id && isLive;
              const isPopular = p.name.toLowerCase().includes('growth') || p.name.toLowerCase().includes('pro');

              return (
                <div
                  key={p.id}
                  className={`bg-[var(--merchant-surface)] rounded-2xl border p-6 flex flex-col justify-between transition-all duration-200 shadow-xs relative ${
                    isCurrent
                      ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                      : isPopular
                      ? 'border-[var(--merchant-accent)] ring-1 ring-[var(--merchant-accent)]/30 shadow-md'
                      : 'border-[var(--merchant-border)] hover:border-[var(--merchant-border-strong)]'
                  }`}
                >
                  {isPopular && !isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--merchant-accent)] text-slate-900 text-[11px] font-black uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Most Popular
                    </span>
                  )}
                  {isCurrent && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-0.5 rounded-full shadow-xs">
                      Current Plan
                    </span>
                  )}

                  <div className="space-y-4">
                    <div>
                      <h3 className="font-bold text-lg text-[var(--merchant-text)]">{p.name}</h3>
                      <p className="text-xs text-[var(--merchant-text-muted)] mt-1">{p.description}</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-black text-[var(--merchant-text)] font-mono">
                        {formatPaise(p.pricePaise)}
                      </span>
                      <span className="text-xs text-[var(--merchant-text-muted)] font-medium">/ month</span>
                    </div>

                    <div className="border-t border-[var(--merchant-border)] pt-4 space-y-2 text-xs text-[var(--merchant-text-secondary)]">
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Up to {p.maxProducts} active products</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>0% transaction fees on all orders</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>All 6 foundational themes + Brand Studio</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Razorpay + COD payment gateway</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>Shiprocket shipping integration</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6">
                    <button
                      type="button"
                      disabled={isCurrent || activating === p.id}
                      onClick={() => handleActivatePlan(p)}
                      className={`w-full py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                        isCurrent
                          ? 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)] cursor-default'
                          : isPopular
                          ? 'bg-[var(--merchant-accent)] hover:bg-[var(--merchant-accent-hover)] text-slate-900 shadow-xs'
                          : 'bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white shadow-xs'
                      }`}
                    >
                      {activating === p.id ? (
                        'Activating...'
                      ) : isCurrent ? (
                        <>
                          <Check className="w-4 h-4 text-emerald-500" /> Active
                        </>
                      ) : (
                        <>
                          <span>Activate Plan</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Subscription Details & Billing History (Requirement: Production-Level History & Validation) */}
        {currentSub && (
          <div className="space-y-4 pt-8 border-t border-[var(--merchant-border)]">
            <h2 className="text-lg font-bold text-[var(--merchant-text)] flex items-center gap-2">
              <History className="w-5 h-5 text-[var(--merchant-text-muted)]" /> Subscription Details & Billing History
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Active Plan Details */}
              <div className="bg-[var(--merchant-surface)] rounded-2xl border border-[var(--merchant-border)] p-6 shadow-xs flex flex-col justify-between transition-colors">
                <div>
                  <h3 className="text-sm font-semibold text-[var(--merchant-text)] flex items-center gap-2 mb-4">
                    <CreditCard className="w-4 h-4 text-emerald-500" /> Current Subscription
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--merchant-border)]">
                      <span className="text-[var(--merchant-text-muted)]">Plan</span>
                      <span className="font-semibold text-[var(--merchant-text)]">{currentSub.plan?.name || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--merchant-border)]">
                      <span className="text-[var(--merchant-text-muted)]">Status</span>
                      <span className={`font-bold ${isLive ? 'text-emerald-500' : 'text-amber-500'}`}>
                        {currentSub.status}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--merchant-border)]">
                      <span className="text-[var(--merchant-text-muted)]">Period Start</span>
                      <span className="font-medium text-[var(--merchant-text-secondary)]">
                        {new Date(currentSub.currentPeriodStart).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pb-2 border-b border-[var(--merchant-border)]">
                      <span className="text-[var(--merchant-text-muted)]">Period End</span>
                      <span className="font-medium text-[var(--merchant-text-secondary)]">
                        {new Date(currentSub.currentPeriodEnd).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-[var(--merchant-text-muted)]">Auto-Renew</span>
                      <span className="font-medium text-[var(--merchant-text-secondary)]">
                        {!currentSub.cancelAtPeriodEnd ? 'Enabled' : 'Disabled'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Invoices */}
              <div className="lg:col-span-2 bg-[var(--merchant-surface)] rounded-2xl border border-[var(--merchant-border)] shadow-xs overflow-hidden flex flex-col transition-colors">
                <div className="px-6 py-4 border-b border-[var(--merchant-border)] bg-[var(--merchant-surface-muted)]">
                  <h3 className="text-sm font-semibold text-[var(--merchant-text)] flex items-center gap-2">
                    <FileText className="w-4 h-4 text-[var(--merchant-primary)]" /> Invoice History
                  </h3>
                </div>
                
                {(!currentSub.invoices || currentSub.invoices.length === 0) ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-8 text-[var(--merchant-text-muted)]">
                    <FileText className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No billing history available yet.</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border-b border-[var(--merchant-border)]">
                        <tr>
                          <th className="px-6 py-3 font-medium">Invoice #</th>
                          <th className="px-6 py-3 font-medium">Date</th>
                          <th className="px-6 py-3 font-medium">Amount</th>
                          <th className="px-6 py-3 font-medium">Status</th>
                          <th className="px-6 py-3 font-medium text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--merchant-border)]">
                        {currentSub.invoices.map((inv: any) => (
                          <tr key={inv.id} className="hover:bg-[var(--merchant-surface-muted)]/50 transition-colors">
                            <td className="px-6 py-4 font-mono text-xs text-[var(--merchant-text-secondary)]">{inv.invoiceNumber}</td>
                            <td className="px-6 py-4 text-[var(--merchant-text-secondary)]">
                              {new Date(inv.createdAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 font-medium text-[var(--merchant-text)]">
                              {formatPaise(inv.amountPaise)}
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                inv.status === 'PAID' ? 'bg-emerald-500/15 text-emerald-500' :
                                inv.status === 'PENDING' ? 'bg-amber-500/15 text-amber-500' :
                                'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)]'
                              }`}>
                                {inv.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <button
                                type="button"
                                disabled={!inv.invoicePdfUrl}
                                className={`inline-flex items-center gap-1.5 text-xs font-medium transition-colors ${
                                  inv.invoicePdfUrl 
                                    ? 'text-[var(--merchant-primary)] hover:underline' 
                                    : 'text-[var(--merchant-text-muted)] cursor-not-allowed'
                                }`}
                                onClick={() => inv.invoicePdfUrl && window.open(inv.invoicePdfUrl, '_blank')}
                                title={!inv.invoicePdfUrl ? "Invoice PDF not generated yet" : "Download PDF"}
                              >
                                <Download className="w-3.5 h-3.5" />
                                PDF
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Value Proposition Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--merchant-border)]">
          <div className="p-4 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-xl space-y-1 transition-colors">
            <ShieldCheck className="w-5 h-5 text-emerald-500" />
            <h4 className="text-xs font-bold text-[var(--merchant-text)]">Strict Tenant Privacy</h4>
            <p className="text-[11px] text-[var(--merchant-text-muted)]">
              Your customer data, margins, and sales records are isolated and encrypted per tenant.
            </p>
          </div>
          <div className="p-4 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-xl space-y-1 transition-colors">
            <Zap className="w-5 h-5 text-[var(--merchant-accent)]" />
            <h4 className="text-xs font-bold text-[var(--merchant-text)]">Lightning Fast PWA</h4>
            <p className="text-[11px] text-[var(--merchant-text-muted)]">
              Built on Next.js 14 and Fastify for sub-second load times across 4G and 5G networks.
            </p>
          </div>
          <div className="p-4 bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-xl space-y-1 transition-colors">
            <CreditCard className="w-5 h-5 text-[var(--merchant-primary)]" />
            <h4 className="text-xs font-bold text-[var(--merchant-text)]">Direct Merchant Settlement</h4>
            <p className="text-[11px] text-[var(--merchant-text-muted)]">
              All buyer payments route directly into your verified bank account via Razorpay.
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
