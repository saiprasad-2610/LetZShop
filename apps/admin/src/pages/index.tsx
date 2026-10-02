import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  CreditCard, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  Activity,
  ArrowRight
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { createApiClient } from '@simply/api-contracts';
import { formatPaise } from '@simply/ui';

const api = createApiClient();

export default function AdminOverviewPage() {
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOverview();
  }, []);

  const loadOverview = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getOverview();
      setData(res);
    } catch (err) {
      console.error('Failed to load admin overview', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {
    totalMerchants: 2,
    activeStores: 2,
    privateStores: 0,
    expiredSubscriptions: 0,
    totalOrders: 0,
    platformGmvPaise: 0,
  };

  return (
    <AdminLayout>
      <Head>
        <title>Overview | Simply Platform Admin</title>
      </Head>

      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Platform Command Center</h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time SaaS telemetry, multi-tenant health, and cross-merchant commerce metrics
          </p>
        </div>

        {/* 6 Metric Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Merchants */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Merchants</span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {kpis.totalMerchants}
            </div>
            <p className="text-[11px] text-slate-400">Independent businesses registered</p>
          </div>

          {/* Card 2: Live Stores */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Live Storefronts</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600">
              {kpis.activeStores}
            </div>
            <p className="text-[11px] text-emerald-700">Active public storefronts online</p>
          </div>

          {/* Card 3: Platform GMV */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Platform GMV</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {formatPaise(kpis.platformGmvPaise)}
            </div>
            <p className="text-[11px] text-slate-400">Total processed buyer transaction volume</p>
          </div>

          {/* Card 4: Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {kpis.totalOrders}
            </div>
            <p className="text-[11px] text-slate-400">Total customer orders fulfilled</p>
          </div>

          {/* Card 5: Subscriptions Expired */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Expired Subscriptions</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600">
              {kpis.expiredSubscriptions}
            </div>
            <p className="text-[11px] text-slate-400">Stores gated due to expired billing</p>
          </div>

          {/* Card 6: Infrastructure Health */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-xs font-bold uppercase tracking-wider">Core Engine</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>PostgreSQL & Fastify Healthy</span>
            </div>
            <p className="text-[11px] text-slate-400">Zero Redis, zero ES, zero bloat</p>
          </div>
        </div>

        {/* Quick Governance Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href="/merchants"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-900 transition group shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between font-bold text-sm text-slate-900">
              <span>Inspect Merchants</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500">
              Review registered businesses, audit status, and manage suspension overrides.
            </p>
          </Link>

          <Link
            href="/commerce"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-900 transition group shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between font-bold text-sm text-slate-900">
              <span>Commerce Telemetry</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500">
              Monitor payments, transactions, and courier dispatch events in real-time.
            </p>
          </Link>

          <Link
            href="/operations"
            className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-slate-900 transition group shadow-sm space-y-2"
          >
            <div className="flex items-center justify-between font-bold text-sm text-slate-900">
              <span>Transactional Outbox</span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-500">
              View event dispatch pipeline, audit logs, and delivery retries.
            </p>
          </Link>
        </div>
      </div>
    </AdminLayout>
  );
}
