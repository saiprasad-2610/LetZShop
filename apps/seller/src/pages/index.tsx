import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { useAuth, apiClient } from '../context/AuthContext';
import { Layout } from '../components/Layout';
import { MiniStorePreview } from '../components/MiniStorePreview';
import { MetricSkeleton } from '../components/ui/Skeletons';
import { formatPaise } from '@simply/ui';
import {
  TrendingUp,
  ShoppingBag,
  MessageSquare,
  Users,
  AlertCircle,
  Plus,
  Palette,
  Eye,
  Share2,
  Package,
  ArrowRight,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, store, loading: authLoading } = useAuth();
  const router = useRouter();

  const [metricsData, setMetricsData] = useState<any | null>(null);
  const [recentProducts, setRecentProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    if (!store) return;
    setLoading(true);
    setError(null);
    try {
      const [metricsRes, prodRes] = await Promise.all([
        apiClient.stores.getMetrics(),
        apiClient.catalog.getProducts({ limit: 4 }).catch(() => ({ items: [] })),
      ]);
      setMetricsData(metricsRes);
      setRecentProducts(prodRes?.items || prodRes || []);
    } catch (err: any) {
      console.error('Failed to load metrics:', err);
      setError(err?.message || 'Failed to load dashboard metrics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    if (!authLoading && user && !store) {
      router.push('/onboarding');
      return;
    }

    if (store) {
      loadDashboardData();
    }
  }, [authLoading, user, store]);

  const metrics = metricsData?.metrics || {
    totalSalesPaise: 0,
    totalOrders: 0,
    totalEnquiries: 0,
    totalCustomers: 0,
  };

  const attention = metricsData?.needsAttention || {
    newOrders: 0,
    newEnquiries: 0,
    lowStock: 0,
    paymentProblems: 0,
    shippingProblems: 0,
  };

  const hasAttentionItems =
    attention.newOrders > 0 ||
    attention.newEnquiries > 0 ||
    attention.lowStock > 0 ||
    attention.paymentProblems > 0 ||
    attention.shippingProblems > 0;

  return (
    <Layout title="Dashboard">
      <Head>
        <title>{store?.name || 'Seller Dashboard'} | Simply Commerce</title>
      </Head>

      <div className="space-y-6">
        {/* Top Greeting Banner - Sleek SaaS Slate */}
        <div className="bg-slate-900 border border-slate-800 text-white p-6 sm:p-7 rounded-2xl shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider">
                Merchant Operations
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-xs text-slate-400">
                {store?.status === 'LIVE' ? 'Store is Public' : 'Private Mode'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Welcome back, {store?.name || 'Partner'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
              {store?.status === 'LIVE'
                ? 'Your online storefront is actively accepting customer orders across India.'
                : 'Your storefront is currently in private preview mode. Add products and subscribe to go live.'}
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={() => router.push('/products?action=add')}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add Product
            </button>
            <button
              onClick={() => router.push('/brand-studio')}
              className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              <Palette className="w-4 h-4 mr-1.5" />
              Store Design
            </button>
          </div>
        </div>

        {/* Live Miniature Storefront Preview Section */}
        <MiniStorePreview store={store} products={recentProducts} />

        {/* Error State with Retry */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-xs text-rose-800">
            <span>{error}</span>
            <button
              onClick={loadDashboardData}
              className="px-3 py-1 bg-white border border-rose-300 rounded-lg font-semibold hover:bg-rose-100 flex items-center gap-1"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Retry
            </button>
          </div>
        )}

        {/* Needs Attention Section (Only displayed when items need resolution) */}
        {hasAttentionItems && (
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <h2 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
                Needs Immediate Attention
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              {attention.newOrders > 0 && (
                <div
                  onClick={() => router.push('/orders?tab=orders')}
                  className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <span className="text-[11px] text-slate-500 block font-medium">New Orders</span>
                  <span className="text-lg font-black text-amber-700 font-mono">{attention.newOrders}</span>
                  <span className="text-[10px] text-blue-600 block mt-1 font-semibold">Accept order &rarr;</span>
                </div>
              )}

              {attention.newEnquiries > 0 && (
                <div
                  onClick={() => router.push('/orders?tab=enquiries')}
                  className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <span className="text-[11px] text-slate-500 block font-medium">Pending RFQs</span>
                  <span className="text-lg font-black text-amber-700 font-mono">{attention.newEnquiries}</span>
                  <span className="text-[10px] text-blue-600 block mt-1 font-semibold">Send quote &rarr;</span>
                </div>
              )}

              {attention.lowStock > 0 && (
                <div
                  onClick={() => router.push('/products?tab=inventory')}
                  className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <span className="text-[11px] text-slate-500 block font-medium">Low Stock</span>
                  <span className="text-lg font-black text-rose-600 font-mono">{attention.lowStock}</span>
                  <span className="text-[10px] text-rose-600 block mt-1 font-semibold">Restock &rarr;</span>
                </div>
              )}

              {attention.paymentProblems > 0 && (
                <div
                  onClick={() => router.push('/orders')}
                  className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <span className="text-[11px] text-slate-500 block font-medium">Payment Review</span>
                  <span className="text-lg font-black text-rose-600 font-mono">{attention.paymentProblems}</span>
                  <span className="text-[10px] text-slate-600 block mt-1 font-semibold">View details &rarr;</span>
                </div>
              )}

              {attention.shippingProblems > 0 && (
                <div
                  onClick={() => router.push('/orders')}
                  className="bg-white p-3.5 rounded-xl border border-amber-200/80 shadow-2xs cursor-pointer hover:border-amber-400 transition-colors"
                >
                  <span className="text-[11px] text-slate-500 block font-medium">Shipping Issue</span>
                  <span className="text-lg font-black text-rose-600 font-mono">{attention.shippingProblems}</span>
                  <span className="text-[10px] text-slate-600 block mt-1 font-semibold">Track &rarr;</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 4 Core Metrics Grid */}
        {loading ? (
          <MetricSkeleton />
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Total Sales</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                {formatPaise(metrics.totalSalesPaise)}
              </div>
              <span className="text-[11px] text-emerald-600 font-semibold block">Paid Orders</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Orders</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                {metrics.totalOrders}
              </div>
              <span className="text-[11px] text-slate-500 block">Total Buyer Orders</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Enquiries / RFQs</span>
                <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                {metrics.totalEnquiries}
              </div>
              <span className="text-[11px] text-slate-500 block">B2B Leads & Quotes</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
              <div className="flex items-center justify-between text-slate-500 mb-1">
                <span className="text-xs font-bold tracking-wider uppercase text-slate-400">Customers</span>
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black font-mono text-slate-900 tracking-tight">
                {metrics.totalCustomers}
              </div>
              <span className="text-[11px] text-slate-500 block">Direct & Guests</span>
            </div>
          </div>
        )}

        {/* Quick Actions Panel */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3.5">
            Quick Actions
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => router.push('/products?action=add')}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-blue-500 hover:bg-blue-50/40 flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Add Product</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Variants & Media</span>
            </button>

            <button
              onClick={() => router.push('/brand-studio')}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-purple-500 hover:bg-purple-50/40 flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Palette className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Customize Store</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Themes & Sections</span>
            </button>

            <button
              onClick={() => router.push('/orders')}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-emerald-500 hover:bg-emerald-50/40 flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ShoppingBag className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Manage Orders</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Fulfillment & Status</span>
            </button>

            <button
              onClick={() => router.push('/marketing')}
              className="p-4 rounded-xl border border-slate-200/80 hover:border-amber-500 hover:bg-amber-50/40 flex flex-col items-center justify-center text-center transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Share2 className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold text-slate-800">Share Store</span>
              <span className="text-[10px] text-slate-400 mt-0.5">WhatsApp & Direct Links</span>
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
