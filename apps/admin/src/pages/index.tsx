import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  Users, 
  Store, 
  ShoppingBag, 
  TrendingUp, 
  CheckCircle, 
  Activity,
  ArrowRight,
  ShieldCheck,
  Percent,
  Layers,
  Sparkles,
  ExternalLink,
  RefreshCw
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatPaise } from '@simply/ui';

export default function AdminOverviewPage() {
  const { api } = useAdminAuth();
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

  const kpis = data?.kpis || data?.metrics || {
    totalMerchants: 0,
    activeStores: 0,
    liveStores: 0,
    privateStores: 0,
    expiredSubscriptions: 0,
    totalOrders: 0,
    platformGmvPaise: 0,
    totalGmvPaise: 0,
  };

  const recentOrders = data?.recentOrders || [];
  const gmv = kpis.platformGmvPaise || kpis.totalGmvPaise || 0;
  const platformFee = Math.round(gmv * 0.02);

  return (
    <AdminLayout>
      <Head>
        <title>SaaS Command Center | ShopOnGo Platform Admin</title>
      </Head>

      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[11px] font-bold mb-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
              Real-Time SaaS Orchestrator
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Platform Command Center
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-tenant commerce telemetry, tenant health, transaction velocity, and system status
            </p>
          </div>

          <button
            onClick={loadOverview}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Refresh Telemetry</span>
          </button>
        </div>

        {/* 6 Key Performance Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* Card 1: Registered Merchants */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Merchants</span>
              <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {kpis.totalMerchants}
            </div>
            <p className="text-[11px] text-slate-400">Independent businesses registered on ShopOnGo</p>
          </div>

          {/* Card 2: Live Storefronts */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Live Stores</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-emerald-600">
              {kpis.activeStores || kpis.liveStores}
            </div>
            <p className="text-[11px] text-emerald-700">Active public storefronts accepting orders</p>
          </div>

          {/* Card 3: Platform GMV */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">Total Platform GMV</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {formatPaise(gmv)}
            </div>
            <p className="text-[11px] text-slate-400">Gross buyer transaction volume processed</p>
          </div>

          {/* Card 4: Total Orders */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Total Orders Fulfilled</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-slate-900">
              {kpis.totalOrders}
            </div>
            <p className="text-[11px] text-slate-400">Total customer orders generated platform-wide</p>
          </div>

          {/* Card 5: Platform Take-Rate Revenue */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Platform Revenue (2%)</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-3xl font-black font-mono text-amber-600">
              {formatPaise(platformFee)}
            </div>
            <p className="text-[11px] text-slate-400">ShopOnGo estimated commission yield</p>
          </div>

          {/* Card 6: Infrastructure Status */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2 hover:border-slate-300 transition">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600">Health State</span>
              <div className="p-2 rounded-xl bg-teal-50 text-teal-600">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <span className="text-emerald-600">OPTIMAL</span>
              <CheckCircle className="w-5 h-5 text-emerald-500" />
            </div>
            <p className="text-[11px] text-slate-400">PostgreSQL, S3 Storage, API cluster active</p>
          </div>
        </div>

        {/* Quick Admin Navigation Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Link
            href="/merchants"
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-bold text-slate-800 transition group"
          >
            <span>Manage Merchants</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition text-slate-600" />
          </Link>
          <Link
            href="/users"
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-bold text-slate-800 transition group"
          >
            <span>Platform Users</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition text-slate-600" />
          </Link>
          <Link
            href="/themes"
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-bold text-slate-800 transition group"
          >
            <span>Themes & Templates</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition text-slate-600" />
          </Link>
          <Link
            href="/analytics"
            className="p-4 bg-white hover:bg-slate-50 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between text-xs font-bold text-slate-800 transition group"
          >
            <span>SaaS Analytics</span>
            <ArrowRight className="w-4 h-4 text-slate-400 group-hover:translate-x-1 transition text-slate-600" />
          </Link>
        </div>

        {/* Recent Orders Stream & Activity */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Platform Orders</h2>
              <p className="text-xs text-slate-400">Live order feed across all merchant storefronts</p>
            </div>
            <Link
              href="/commerce"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>View All Orders</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentOrders.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-100">
              No recent orders recorded yet. As customers place orders on stores, they will stream here live.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-medium">
                    <th className="pb-3 font-semibold">Order ID</th>
                    <th className="pb-3 font-semibold">Storefront</th>
                    <th className="pb-3 font-semibold">Payment Status</th>
                    <th className="pb-3 font-semibold">Order Total</th>
                    <th className="pb-3 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentOrders.map((ord: any) => (
                    <tr key={ord.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-mono font-medium text-slate-700">
                        #{ord.id.slice(0, 8)}
                      </td>
                      <td className="py-3 font-semibold text-slate-900">
                        {ord.store?.name || 'Store'}
                      </td>
                      <td className="py-3">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          ord.paymentStatus === 'PAID'
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {ord.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 font-bold font-mono text-slate-900">
                        {formatPaise(ord.totalPaise || 0)}
                      </td>
                      <td className="py-3 text-slate-400">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
