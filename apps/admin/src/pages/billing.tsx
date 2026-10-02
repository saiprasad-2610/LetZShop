import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { CreditCard, Check, AlertTriangle, ShieldCheck, TrendingUp } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { createApiClient } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';

const api = createApiClient();

export default function AdminBillingPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.subscriptions.getPlans()
      .then(setPlans)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <AdminLayout>
      <Head>
        <title>Billing & SaaS Plans | Simply Platform Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Billing & Subscriptions Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Subscription tier management, public store gating enforcement, and recurring revenue
          </p>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans.map((p) => (
            <div key={p.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base text-slate-900">{p.name}</h3>
                <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
                  Max {p.maxProducts} products
                </span>
              </div>

              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-2xl font-black text-slate-900">
                  {formatPaise(p.pricePaise)}
                </span>
                <span className="text-xs text-slate-400 font-sans">/ month</span>
              </div>

              <p className="text-xs text-slate-500">{p.description}</p>

              <div className="pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Razorpay + COD integrated</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Shiprocket shipping partner</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>All 6 foundational themes</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
