import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  FileSpreadsheet,
  FileDown,
  Printer,
  RefreshCw,
  Calendar,
  Filter,

  Search,
  TrendingUp,
  ShoppingBag,
  Package,
  Users,
  CheckCircle2,
  Clock,
  AlertCircle,
  ArrowDownToLine,
  ChevronDown,
  SlidersHorizontal,
  X,
  CreditCard,
  Building2,
  Check,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { formatPaise } from '@simply/ui';
import {
  exportReportToExcel,
  exportReportToPdf,
  printReportView,
} from '../utils/reportExport';

type ReportType = 'sales' | 'orders' | 'products' | 'customers';

type DatePreset =
  | 'today'
  | 'yesterday'
  | '7d'
  | '30d'
  | 'this_month'
  | 'last_month'
  | 'all'
  | 'custom';

const DATE_PRESETS: { key: DatePreset; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: '7d', label: 'Last 7 Days' },
  { key: '30d', label: 'Last 30 Days' },
  { key: 'this_month', label: 'This Month' },
  { key: 'last_month', label: 'Last Month' },
  { key: 'all', label: 'All Time' },
  { key: 'custom', label: 'Custom Range' },
];

const ORDER_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Order Statuses' },
  { value: 'NEW', label: 'New' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'ACCEPTED', label: 'Accepted' },
  { value: 'READY', label: 'Ready to Ship' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const PAYMENT_STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Payment Statuses' },
  { value: 'PAID', label: 'Paid' },
  { value: 'PENDING', label: 'Pending' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'REFUNDED', label: 'Refunded' },
];

export default function ReportsPage() {
  const { user, store, api, token, loading: authLoading } = useAuth();
  const router = useRouter();

  // Tab & Filter States
  const [reportType, setReportType] = useState<ReportType>('sales');
  const [datePreset, setDatePreset] = useState<DatePreset>('30d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('ALL');
  const [paymentStatusFilter, setPaymentStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Data State
  const [reportData, setReportData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Export State
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Compute ISO dates based on preset
  const computedDateRange = useMemo(() => {
    const now = new Date();
    let start: Date | null = new Date();
    let end: Date | null = new Date();

    if (datePreset === 'today') {
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
    } else if (datePreset === 'yesterday') {
      start.setDate(now.getDate() - 1);
      start.setHours(0, 0, 0, 0);
      end.setDate(now.getDate() - 1);
      end.setHours(23, 59, 59, 999);
    } else if (datePreset === '7d') {
      start.setDate(now.getDate() - 7);
      start.setHours(0, 0, 0, 0);
    } else if (datePreset === '30d') {
      start.setDate(now.getDate() - 30);
      start.setHours(0, 0, 0, 0);
    } else if (datePreset === 'this_month') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (datePreset === 'last_month') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else if (datePreset === 'all') {
      start = null;
      end = null;
    } else if (datePreset === 'custom') {
      if (customStartDate) start = new Date(customStartDate + 'T00:00:00');
      else start = null;
      if (customEndDate) end = new Date(customEndDate + 'T23:59:59');
      else end = null;
    }

    return {
      startDate: start ? start.toISOString() : undefined,
      endDate: end ? end.toISOString() : undefined,
      label:
        datePreset === 'custom' && customStartDate && customEndDate
          ? `${customStartDate} to ${customEndDate}`
          : DATE_PRESETS.find((p) => p.key === datePreset)?.label || 'Selected Period',
    };
  }, [datePreset, customStartDate, customEndDate]);

  // Fetch Report Data from API
  const fetchReport = useCallback(
    async (isBackground = false) => {
      if (authLoading || !token) return;
      if (!isBackground) setLoading(true);
      setRefreshing(true);
      setError(null);

      try {
        const res = await (api as any).reports.getReport({
          type: reportType,
          startDate: computedDateRange.startDate,
          endDate: computedDateRange.endDate,
          status: orderStatusFilter !== 'ALL' ? orderStatusFilter : undefined,
          paymentStatus: paymentStatusFilter !== 'ALL' ? paymentStatusFilter : undefined,
        });

        const data = res?.data || res;
        setReportData(data);
      } catch (err: any) {
        console.error('Failed to load report data', err);
        setError(err.message || 'Failed to fetch report data. Please check your connection.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [
      api,
      token,
      authLoading,
      reportType,
      computedDateRange.startDate,
      computedDateRange.endDate,
      orderStatusFilter,
      paymentStatusFilter,
    ]
  );

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Client-side search within records
  const filteredRecords = useMemo(() => {
    if (!reportData?.records) return [];
    if (!searchQuery.trim()) return reportData.records;

    const q = searchQuery.toLowerCase().trim();
    return reportData.records.filter((r: any) => {
      return Object.values(r).some((val) => {
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(q);
      });
    });
  }, [reportData?.records, searchQuery]);

  // Export Handlers
  const handleDownloadExcel = async () => {
    if (!reportData) return;
    setExportingExcel(true);
    try {
      exportReportToExcel(reportData, {
        storeName: store?.name || 'My Store',
        storeSlug: store?.slug,
        dateRangeText: computedDateRange.label,
        supportPhone: store?.supportPhone,
        supportEmail: store?.supportEmail,
      });
      setExportSuccessMsg('Excel (.xlsx) report downloaded successfully!');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to generate Excel file: ' + err.message);
    } finally {
      setExportingExcel(false);
    }
  };

  const handleDownloadPdf = async () => {
    if (!reportData) return;
    setExportingPdf(true);
    try {
      exportReportToPdf(reportData, {
        storeName: store?.name || 'My Store',
        storeSlug: store?.slug,
        dateRangeText: computedDateRange.label,
        supportPhone: store?.supportPhone,
        supportEmail: store?.supportEmail,
      });
      setExportSuccessMsg('Customized PDF report generated and downloaded!');
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err: any) {
      alert('Failed to generate PDF file: ' + err.message);
    } finally {
      setExportingPdf(false);
    }
  };

  const handlePrint = () => {
    if (!reportData) return;
    printReportView(reportData, {
      storeName: store?.name || 'My Store',
      storeSlug: store?.slug,
      dateRangeText: computedDateRange.label,
      supportPhone: store?.supportPhone,
      supportEmail: store?.supportEmail,
    });
  };

  const summary = reportData?.summary || {};

  return (
    <Layout
      title="Reports & Exports"
      actions={
        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || !reportData}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg shadow-2xs transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            id="btn-export-excel"
            onClick={handleDownloadExcel}
            disabled={loading || exportingExcel || !reportData}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-lg shadow-2xs transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{exportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            id="btn-export-pdf"
            onClick={handleDownloadPdf}
            disabled={loading || exportingPdf || !reportData}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-slate-200" />
            <span>{exportingPdf ? 'Generating...' : 'Download PDF'}</span>
          </button>
        </div>
      }
    >
      <Head>
        <title>Reports & Analytics | ShopOnGo Merchant Portal</title>
      </Head>

      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* =========================================================================
            HEADER & NOTIFICATION BANNER
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                Business Intelligence & Reports
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Extract formatted transaction records, revenue breakdown, inventory movement, and
              customer lists for account reconciliation and audit. Download in Excel (.xlsx) or
              branded PDF.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => fetchReport(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 bg-slate-50 hover:bg-slate-100 rounded-xl border border-slate-200 transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-xl shadow-2xs transition disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>

            <button
              type="button"
              id="btn-export-excel"
              onClick={handleDownloadExcel}
              disabled={loading || exportingExcel || !reportData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200 rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>{exportingExcel ? 'Exporting...' : 'Export Excel (.xlsx)'}</span>
            </button>

            <button
              type="button"
              id="btn-export-pdf"
              onClick={handleDownloadPdf}
              disabled={loading || exportingPdf || !reportData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-slate-200" />
              <span>{exportingPdf ? 'Generating...' : 'Download PDF'}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccessMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-medium">{exportSuccessMsg}</span>
          </div>
        )}

        {/* =========================================================================
            PART 1: REPORT TYPE SELECTOR TABS
        ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-200">
          {[
            {
              id: 'sales' as ReportType,
              label: 'Sales & Revenue',
              icon: TrendingUp,
              desc: 'Daily gross, net, taxes & shipping',
            },
            {
              id: 'orders' as ReportType,
              label: 'Orders Register',
              icon: ShoppingBag,
              desc: 'Every itemized order with buyer & address',
            },
            {
              id: 'products' as ReportType,
              label: 'Product Performance',
              icon: Package,
              desc: 'Units sold, revenue & current stock',
            },
            {
              id: 'customers' as ReportType,
              label: 'Customers & LTV',
              icon: Users,
              desc: 'Repeat buyers, contact numbers & total spend',
            },
          ].map((tab) => {
            const isActive = reportType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition cursor-pointer ${isActive
                    ? 'border-blue-600 text-blue-600 font-bold bg-blue-50/50 rounded-t-lg'
                    : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
                  }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            PART 2: CUSTOM FILTERS & TIMEFRAME CONTROLS
        ========================================================================= */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Timeframe:
              </span>
              {DATE_PRESETS.map((p) => {
                const isSelected = datePreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setDatePreset(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${isSelected
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/80'
                      }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Search in Records */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Filter table rows..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Pickers (Shown only if custom is selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">From:</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">To:</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white"
                />
              </div>
            </div>
          )}

          {/* Secondary Filters for Sales & Orders */}
          {(reportType === 'sales' || reportType === 'orders') && (
            <div className="flex items-center gap-3 pt-2 border-t border-slate-100 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Order Status:</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  {ORDER_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500 font-medium">Payment Status:</span>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-slate-200 rounded-lg bg-white text-slate-700"
                >
                  {PAYMENT_STATUS_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* =========================================================================
            PART 3: EXECUTIVE KPI HIGHLIGHT CARDS
        ========================================================================= */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {reportType === 'sales' && (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Revenue
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatPaise(summary.totalRevenuePaise || 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Gross: {formatPaise(summary.totalGrossSalesPaise || 0)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Orders
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {summary.totalOrders ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Paid: {summary.paidOrdersCount ?? 0} | Pending: {summary.pendingOrdersCount ?? 0}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Net Sales
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatPaise(summary.totalNetSalesPaise || 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Discounts: {formatPaise(summary.totalDiscountPaise || 0)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Average Order Value
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatPaise(summary.avgOrderValuePaise || 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  GST Tax: {formatPaise(summary.totalTaxPaise || 0)}
                </p>
              </div>
            </>
          )}

          {reportType === 'orders' && (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Orders
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {summary.totalOrders ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Avg Value: {formatPaise(summary.avgOrderValuePaise || 0)}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Order Value
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatPaise(summary.totalRevenuePaise || 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  All fulfilled & active orders
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Paid Orders
                </p>
                <h3 className="text-xl font-bold text-emerald-600 mt-1">
                  {summary.paidOrdersCount ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Pending: {summary.pendingOrdersCount ?? 0}
                </p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Completed / Fulfilled
                </p>
                <h3 className="text-xl font-bold text-blue-600 mt-1">
                  {summary.completedOrdersCount ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Cancelled: {summary.cancelledOrdersCount ?? 0}
                </p>
              </div>
            </>
          )}

          {reportType === 'products' && (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Products Sold
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {summary.totalProductsSold ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Unique catalog items</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Units Sold
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {summary.totalUnitsSold ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Across all customer carts</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Product Sales
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatPaise(summary.totalProductRevenuePaise || 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Excludes tax & shipping</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Top Product
                </p>
                <h3 className="text-base font-bold text-slate-900 mt-1 truncate" title={summary.topProduct}>
                  {summary.topProduct || 'None'}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Highest volume sales</p>
              </div>
            </>
          )}

          {reportType === 'customers' && (
            <>
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Customers
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1">
                  {summary.totalCustomers ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">In current store</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Repeat Customers
                </p>
                <h3 className="text-xl font-bold text-emerald-600 mt-1">
                  {summary.repeatCustomers ?? 0}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">&gt;1 orders placed</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Total Customer Spend
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatPaise(summary.totalSpentPaise || 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Cumulative LTV</p>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
                <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Avg. Customer Value
                </p>
                <h3 className="text-xl font-bold text-slate-900 mt-1 font-mono">
                  {formatPaise(summary.avgCustomerValuePaise || 0)}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Revenue / Customer</p>
              </div>
            </>
          )}
        </div>

        {/* =========================================================================
            PART 4: REPORT DATA TABLE PREVIEW
        ========================================================================= */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          {/* Table Header Bar */}
          <div className="px-5 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
            <div>
              <h2 className="text-sm font-bold text-slate-900">
                {reportType === 'sales' && 'Sales & Revenue Breakdown'}
                {reportType === 'orders' && 'Itemized Orders Ledger'}
                {reportType === 'products' && 'Product Sales & Live Stock Matrix'}
                {reportType === 'customers' && 'Customer Profiles & Order Frequency'}
              </h2>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Showing {filteredRecords.length} of {reportData?.records?.length || 0} records for{' '}
                {computedDateRange.label}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 font-medium hidden sm:inline">
                Ready to download:
              </span>
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={loading || exportingExcel || !reportData}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-md transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={loading || exportingPdf || !reportData}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-md transition"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-600" />
              <p className="text-xs text-slate-500 font-medium">
                Compiling business records and calculating aggregates...
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-slate-700">No records found</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No transactions or catalog activity matched the selected timeframe and filter
                parameters. Try adjusting your date range.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                {/* 1. SALES TABLE */}
                {reportType === 'sales' && (
                  <>
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4 text-center">Orders</th>
                        <th className="py-3 px-4 text-right">Gross Sales</th>
                        <th className="py-3 px-4 text-right">Discounts</th>
                        <th className="py-3 px-4 text-right">Net Sales</th>
                        <th className="py-3 px-4 text-right">Taxes (GST)</th>
                        <th className="py-3 px-4 text-right">Shipping</th>
                        <th className="py-3 px-4 text-right">Paid Sales</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-900">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-medium text-slate-900 whitespace-nowrap">
                            {new Date(r.date).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-800">
                            {r.ordersCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono">
                            {formatPaise(r.grossSalesPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-600">
                            {r.discountPaise > 0 ? `-${formatPaise(r.discountPaise)}` : '₹0.00'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-slate-800">
                            {formatPaise(r.netSalesPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatPaise(r.taxPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatPaise(r.shippingPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-700">
                            {formatPaise(r.paidTotalPaise)} ({r.paidCount})
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatPaise(r.totalPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">Total Summary</td>
                        <td className="py-3 px-4 text-center">{summary.totalOrders ?? 0}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatPaise(summary.totalGrossSalesPaise || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-600">
                          {summary.totalDiscountPaise > 0
                            ? `-${formatPaise(summary.totalDiscountPaise)}`
                            : '₹0.00'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatPaise(summary.totalNetSalesPaise || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatPaise(summary.totalTaxPaise || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatPaise(summary.totalShippingPaise || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-emerald-700">
                          {summary.paidOrdersCount ?? 0} Paid
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-slate-900">
                          {formatPaise(summary.totalRevenuePaise || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {/* 2. ORDERS TABLE */}
                {reportType === 'orders' && (
                  <>
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Order #</th>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Customer</th>
                        <th className="py-3 px-4">Phone / City</th>
                        <th className="py-3 px-4">Items Summary</th>
                        <th className="py-3 px-4 text-center">Payment</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-900">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r: any) => (
                        <tr key={r.orderId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900 whitespace-nowrap">
                            #{r.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(r.date).toLocaleString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-slate-900 block">
                              {r.customerName}
                            </span>
                            <span className="text-[11px] text-slate-400">{r.customerEmail}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-slate-700 block">{r.customerPhone}</span>
                            <span className="text-[11px] text-slate-400">
                              {r.city} {r.pincode ? `(${r.pincode})` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-slate-600">
                            <span className="font-semibold text-slate-800">
                              {r.itemsCount} {r.itemsCount === 1 ? 'item' : 'items'}
                            </span>
                            <span className="block text-[11px] text-slate-400 truncate">
                              {r.itemsSummary}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${r.paymentStatus === 'PAID'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                            >
                              {r.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
                              {r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatPaise(r.totalPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">Total Summary</td>
                        <td colSpan={6} className="py-3 px-4 text-slate-500 font-normal">
                          {summary.totalOrders ?? 0} Orders ({summary.paidOrdersCount ?? 0} Paid,{' '}
                          {summary.pendingOrdersCount ?? 0} Pending)
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-slate-900">
                          {formatPaise(summary.totalRevenuePaise || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {/* 3. PRODUCTS TABLE */}
                {reportType === 'products' && (
                  <>
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Product Name</th>
                        <th className="py-3 px-4">Variant</th>
                        <th className="py-3 px-4">SKU</th>
                        <th className="py-3 px-4 text-center">Units Sold</th>
                        <th className="py-3 px-4 text-center">Current Stock</th>
                        <th className="py-3 px-4 text-right">Avg Selling Price</th>
                        <th className="py-3 px-4 text-center">Orders Count</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-900">Total Revenue</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-slate-900 max-w-xs truncate">
                            {r.productName}
                          </td>
                          <td className="py-3 px-4 text-slate-600">{r.variantTitle}</td>
                          <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{r.sku}</td>
                          <td className="py-3 px-4 text-center font-bold text-blue-600">
                            {r.unitsSold}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-slate-700">
                            {r.currentStock !== 'N/A' ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${r.currentStock < 10
                                    ? 'bg-rose-50 text-rose-700 font-bold'
                                    : 'bg-emerald-50 text-emerald-700'
                                  }`}
                              >
                                {r.currentStock} in stock
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-slate-600">
                            {formatPaise(r.avgSellingPricePaise)}
                          </td>
                          <td className="py-3 px-4 text-center text-slate-500 font-medium">
                            {r.ordersCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatPaise(r.revenuePaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">Total Summary</td>
                        <td colSpan={2} className="py-3 px-4 text-slate-500 font-normal">
                          {summary.totalProductsSold ?? 0} Catalog items
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-blue-600">
                          {summary.totalUnitsSold ?? 0} units
                        </td>
                        <td colSpan={3}></td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-slate-900">
                          {formatPaise(summary.totalProductRevenuePaise || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {/* 4. CUSTOMERS TABLE */}
                {reportType === 'customers' && (
                  <>
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">Customer Name</th>
                        <th className="py-3 px-4">Phone Number</th>
                        <th className="py-3 px-4">Email</th>
                        <th className="py-3 px-4 text-center">Checkout Type</th>
                        <th className="py-3 px-4 text-center">Orders Placed</th>
                        <th className="py-3 px-4">First Order</th>
                        <th className="py-3 px-4">Latest Order</th>
                        <th className="py-3 px-4 text-right font-bold text-slate-900">Total Spend (LTV)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredRecords.map((r: any) => (
                        <tr key={r.customerId} className="hover:bg-slate-50/80 transition">
                          <td className="py-3 px-4 font-bold text-slate-900">{r.customerName}</td>
                          <td className="py-3 px-4 font-mono text-slate-700">{r.phone}</td>
                          <td className="py-3 px-4 text-slate-500">{r.email}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                              {r.isGuest ? 'Guest Checkout' : 'Registered'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${r.ordersCount > 1
                                  ? 'bg-purple-50 text-purple-700 border border-purple-200'
                                  : 'bg-slate-50 text-slate-600'
                                }`}
                            >
                              {r.ordersCount} {r.ordersCount === 1 ? 'order' : 'orders'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(r.firstOrderDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                            {new Date(r.lastOrderDate).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            {formatPaise(r.totalSpentPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-100/80 border-t-2 border-slate-300 font-bold text-slate-900">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">Total Summary</td>
                        <td colSpan={3} className="py-3 px-4 text-slate-500 font-normal">
                          {summary.totalCustomers ?? 0} Customers ({summary.repeatCustomers ?? 0} Repeat)
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-purple-700">
                          {filteredRecords.reduce(
                            (acc: number, r: any) => acc + (r.ordersCount || 0),
                            0
                          )}{' '}
                          Orders
                        </td>
                        <td colSpan={2}></td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-slate-900">
                          {formatPaise(summary.totalSpentPaise || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}
              </table>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
