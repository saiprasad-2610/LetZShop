import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { 
  BarChart3, 
  TrendingUp, 
  ShoppingBag, 
  CreditCard, 
  Store, 
  ExternalLink, 
  Percent, 
  ArrowUpRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';
import { formatPaise } from '@simply/ui';

export default function AdminAnalyticsPage() {
  const { api } = useAdminAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getAnalytics();
      setData(res);
    } catch (err) {
      console.error('Failed to load analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const kpis = data?.kpis || {
    totalRevenuePaise: 0,
    totalOrders: 0,
    paidOrdersCount: 0,
    averageOrderValuePaise: 0,
    platformCommissionPaise: 0,
    totalStores: 0,
    totalTenants: 0,
  };

  const topStores = data?.topStores || [];

  return (
    <AdminLayout>
      <Head>
        <title>SaaS Analytics & Financials | ShopOnGo Platform Admin</title>
      </Head>

      <div className="space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              SaaS Financials & Commerce Analytics
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Cross-platform GMV velocity, platform fee yields, average basket sizes, and top store benchmarks
            </p>
          </div>

          <button
            onClick={loadAnalytics}
            disabled={loading}
            className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-xl border border-slate-200 shadow-sm transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
            <span>Recalculate Metrics</span>
          </button>
        </div>

        {/* 4 Financial Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Platform GMV */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Total Processed GMV</span>
              <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {formatPaise(kpis.totalRevenuePaise)}
            </div>
            <p className="text-[11px] text-emerald-600 flex items-center gap-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>Real transactions settled</span>
            </p>
          </div>

          {/* Card 2: Platform Take-Rate Commission */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-600">Platform Revenue (2%)</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Percent className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-amber-600">
              {formatPaise(kpis.platformCommissionPaise)}
            </div>
            <p className="text-[11px] text-slate-400">
              Platform transaction fee share
            </p>
          </div>

          {/* Card 3: Average Order Value (AOV) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-blue-600">Average Order Value (AOV)</span>
              <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                <ShoppingBag className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-slate-900">
              {formatPaise(kpis.averageOrderValuePaise)}
            </div>
            <p className="text-[11px] text-slate-400">
              Across {kpis.paidOrdersCount} completed orders
            </p>
          </div>

          {/* Card 4: Store Footprint */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
            <div className="flex items-center justify-between text-slate-500">
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-600">Active Tenant Stores</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <Store className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-black font-mono text-emerald-600">
              {kpis.totalStores} Stores
            </div>
            <p className="text-[11px] text-slate-400">
              In {kpis.totalTenants} tenant ecosystems
            </p>
          </div>
        </div>

        {/* Top Performing Stores Leaderboard */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Top Performing Merchant Storefronts</h2>
              <p className="text-xs text-slate-400">Leaderboard ranked by catalog capacity and fulfilled transaction velocity</p>
            </div>
            <Link
              href="/merchants"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              <span>Manage All Tenants</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          {topStores.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
              No store data found yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 font-semibold uppercase text-[10px]">
                    <th className="pb-3">Rank</th>
                    <th className="pb-3">Store Name</th>
                    <th className="pb-3">Public Slug</th>
                    <th className="pb-3">Products Listed</th>
                    <th className="pb-3">Orders Fulfilled</th>
                    <th className="pb-3 text-right">Storefront Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {topStores.map((st: any, idx: number) => (
                    <tr key={st.id} className="hover:bg-slate-50/50 transition">
                      <td className="py-3 font-mono font-bold text-slate-500">
                        #{idx + 1}
                      </td>
                      <td className="py-3 font-bold text-slate-900">
                        {st.name}
                      </td>
                      <td className="py-3 font-mono text-slate-500">
                        /store/{st.slug}
                      </td>
                      <td className="py-3 font-mono text-slate-700">
                        {st.productsCount} items
                      </td>
                      <td className="py-3 font-mono font-bold text-emerald-600">
                        {st.ordersCount} orders
                      </td>
                      <td className="py-3 text-right">
                        <a
                          href={`http://localhost:3000/store/${st.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          <span>Visit Store</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
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
