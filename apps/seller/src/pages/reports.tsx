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
import { useSellerI18n } from '@simply/i18n';
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

export default function ReportsPage() {
  const { user, store, api, token, loading: authLoading } = useAuth();
  const { t, locale } = useSellerI18n();
  const router = useRouter();

  const datePresets = useMemo<{ key: DatePreset; label: string }[]>(
    () => [
      { key: 'today', label: t('reports.today') },
      { key: 'yesterday', label: t('reports.yesterday') },
      { key: '7d', label: t('reports.last7Days') },
      { key: '30d', label: t('reports.last30Days') },
      { key: 'this_month', label: t('reports.thisMonth') },
      { key: 'last_month', label: t('reports.lastMonth') },
      { key: 'all', label: t('reports.allTime') },
      { key: 'custom', label: t('reports.customRange') },
    ],
    [t]
  );

  const orderStatusOptions = useMemo(
    () => [
      { value: 'ALL', label: t('reports.allOrderStatus') },
      { value: 'NEW', label: t('orderStatus.NEW') || 'New' },
      { value: 'CONFIRMED', label: t('orderStatus.CONFIRMED') || 'Confirmed' },
      { value: 'ACCEPTED', label: t('orderStatus.ACCEPTED') || 'Accepted' },
      { value: 'READY', label: t('orderStatus.READY') || 'Ready to Ship' },
      { value: 'DISPATCHED', label: t('orderStatus.DISPATCHED') || 'Dispatched' },
      { value: 'COMPLETED', label: t('orderStatus.COMPLETED') || 'Completed' },
      { value: 'CANCELLED', label: t('orderStatus.CANCELLED') || 'Cancelled' },
    ],
    [t]
  );

  const paymentStatusOptions = useMemo(
    () => [
      { value: 'ALL', label: t('reports.allPaymentStatus') },
      { value: 'PAID', label: t('paymentStatus.PAID') || 'Paid' },
      { value: 'PENDING', label: t('paymentStatus.PENDING') || 'Pending' },
      { value: 'FAILED', label: t('paymentStatus.FAILED') || 'Failed' },
      { value: 'REFUNDED', label: t('paymentStatus.REFUNDED') || 'Refunded' },
    ],
    [t]
  );

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

    const presetLabel = datePresets.find((p) => p.key === datePreset)?.label || t('reports.selectedPeriod');

    return {
      startDate: start ? start.toISOString() : undefined,
      endDate: end ? end.toISOString() : undefined,
      label:
        datePreset === 'custom' && customStartDate && customEndDate
          ? `${customStartDate} ${t('reports.toText')} ${customEndDate}`
          : presetLabel,
    };
  }, [datePreset, customStartDate, customEndDate, datePresets, t]);

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
      setExportSuccessMsg(t('reports.excelSuccess'));
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
      setExportSuccessMsg(t('reports.pdfSuccess'));
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
      title={t('reports.title')}
      actions={
        <div className="flex items-center gap-2">
          {/* Print Button */}
          <button
            type="button"
            onClick={handlePrint}
            disabled={loading || !reportData}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[var(--merchant-text)] bg-[var(--merchant-surface)] border border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)] rounded-lg shadow-2xs transition disabled:opacity-50"
          >
            <Printer className="w-3.5 h-3.5 text-[var(--merchant-text-muted)]" />
            <span>{t('reports.print')}</span>
          </button>

          {/* Excel Export Button */}
          <button
            type="button"
            id="btn-export-excel"
            onClick={handleDownloadExcel}
            disabled={loading || exportingExcel || !reportData}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg shadow-2xs transition disabled:opacity-50"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
            <span>{exportingExcel ? t('reports.exportingExcel') : t('reports.exportExcel')}</span>
          </button>

          {/* PDF Export Button */}
          <button
            type="button"
            id="btn-export-pdf"
            onClick={handleDownloadPdf}
            disabled={loading || exportingPdf || !reportData}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] rounded-lg shadow-2xs transition disabled:opacity-50"
          >
            <FileDown className="w-4 h-4 text-white" />
            <span>{exportingPdf ? t('reports.generatingPdf') : t('reports.downloadPdf')}</span>
          </button>
        </div>
      }
    >
      <Head>
        <title>{t('reports.title')} | {store?.name || 'LetzShop'}</title>
      </Head>

      <div className="space-y-6 max-w-7xl mx-auto pb-16">
        {/* =========================================================================
            HEADER & NOTIFICATION BANNER
        ========================================================================= */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--merchant-surface)] p-5 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-[var(--merchant-primary-soft)] text-[var(--merchant-primary)]">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <h1 className="text-xl font-bold text-[var(--merchant-text)] tracking-tight">
                {t('reports.title')}
              </h1>
            </div>
            <p className="text-xs text-[var(--merchant-text-muted)] mt-1 max-w-2xl">
              {t('reports.pageSubtitle')}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0 flex-wrap">
            <button
              type="button"
              onClick={() => fetchReport(true)}
              disabled={refreshing}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-[var(--merchant-text-secondary)] hover:text-[var(--merchant-text)] bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] rounded-xl border border-[var(--merchant-border)] transition disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{t('reports.refresh')}</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              disabled={loading || !reportData}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[var(--merchant-text)] bg-[var(--merchant-surface)] border border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)] rounded-xl shadow-2xs transition disabled:opacity-50"
            >
              <Printer className="w-3.5 h-3.5 text-[var(--merchant-text-muted)]" />
              <span>{t('reports.print')}</span>
            </button>

            <button
              type="button"
              id="btn-export-excel"
              onClick={handleDownloadExcel}
              disabled={loading || exportingExcel || !reportData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
              <span>{exportingExcel ? t('reports.exportingExcel') : t('reports.exportExcel')}</span>
            </button>

            <button
              type="button"
              id="btn-export-pdf"
              onClick={handleDownloadPdf}
              disabled={loading || exportingPdf || !reportData}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] rounded-xl shadow-2xs transition disabled:opacity-50 cursor-pointer"
            >
              <FileDown className="w-4 h-4 text-white" />
              <span>{exportingPdf ? t('reports.generatingPdf') : t('reports.downloadPdf')}</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {exportSuccessMsg && (
          <div className="flex items-center gap-2 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
            <span className="font-medium">{exportSuccessMsg}</span>
          </div>
        )}

        {/* =========================================================================
            PART 1: REPORT TYPE SELECTOR TABS
        ========================================================================= */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-[var(--merchant-border)]">
          {[
            {
              id: 'sales' as ReportType,
              label: t('reports.tabSales'),
              icon: TrendingUp,
              desc: t('reports.tabSalesDesc'),
            },
            {
              id: 'orders' as ReportType,
              label: t('reports.tabOrders'),
              icon: ShoppingBag,
              desc: t('reports.tabOrdersDesc'),
            },
            {
              id: 'products' as ReportType,
              label: t('reports.tabProducts'),
              icon: Package,
              desc: t('reports.tabProductsDesc'),
            },
            {
              id: 'customers' as ReportType,
              label: t('reports.tabCustomers'),
              icon: Users,
              desc: t('reports.tabCustomersDesc'),
            },
          ].map((tab) => {
            const isActive = reportType === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setReportType(tab.id)}
                className={`flex items-center gap-2.5 px-4 py-3 border-b-2 font-medium text-xs whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? 'border-[var(--merchant-primary)] text-[var(--merchant-primary)] font-bold bg-[var(--merchant-primary-soft)] rounded-t-lg'
                    : 'border-transparent text-[var(--merchant-text-secondary)] hover:text-[var(--merchant-text)] hover:border-[var(--merchant-border)]'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-[var(--merchant-primary)]' : 'text-[var(--merchant-text-muted)]'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* =========================================================================
            PART 2: CUSTOM FILTERS & TIMEFRAME CONTROLS
        ========================================================================= */}
        <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs space-y-4 transition-colors">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            {/* Left: Date Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-semibold text-[var(--merchant-text-muted)] mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {t('reports.timeframe')}
              </span>
              {datePresets.map((p) => {
                const isSelected = datePreset === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setDatePreset(p.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition cursor-pointer ${
                      isSelected
                        ? 'bg-[var(--merchant-primary)] text-white shadow-2xs'
                        : 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-secondary)] hover:bg-[var(--merchant-surface-raised)] hover:text-[var(--merchant-text)] border border-[var(--merchant-border)]'
                    }`}
                  >
                    {p.label}
                  </button>
                );
              })}
            </div>

            {/* Right: Search in Records */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--merchant-text-muted)]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t('reports.filterPlaceholder')}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-lg focus:outline-none focus:border-[var(--merchant-primary)]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Custom Date Pickers (Shown only if custom is selected) */}
          {datePreset === 'custom' && (
            <div className="flex items-center gap-3 pt-2 border-t border-[var(--merchant-border)] flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--merchant-text-muted)] font-medium">{t('reports.fromDate')}</span>
                <input
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-[var(--merchant-input-border)] bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] rounded-lg focus:outline-none focus:border-[var(--merchant-primary)]"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--merchant-text-muted)] font-medium">{t('reports.toDate')}</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-[var(--merchant-input-border)] bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] rounded-lg focus:outline-none focus:border-[var(--merchant-primary)]"
                />
              </div>
            </div>
          )}

          {/* Secondary Filters for Sales & Orders */}
          {(reportType === 'sales' || reportType === 'orders') && (
            <div className="flex items-center gap-3 pt-2 border-t border-[var(--merchant-border)] flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--merchant-text-muted)] font-medium">{t('reports.orderStatus')}</span>
                <select
                  value={orderStatusFilter}
                  onChange={(e) => setOrderStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-[var(--merchant-input-border)] rounded-lg bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:outline-none focus:border-[var(--merchant-primary)]"
                >
                  {orderStatusOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-[var(--merchant-text-muted)] font-medium">{t('reports.paymentStatus')}</span>
                <select
                  value={paymentStatusFilter}
                  onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  className="px-2.5 py-1.5 text-xs border border-[var(--merchant-input-border)] rounded-lg bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:outline-none focus:border-[var(--merchant-primary)]"
                >
                  {paymentStatusOptions.map((opt) => (
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
              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.totalRevenue')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1 font-mono">
                  {formatPaise(summary.totalRevenuePaise || 0)}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.gross')} {formatPaise(summary.totalGrossSalesPaise || 0)}
                </p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.totalOrders')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1">
                  {summary.totalOrders ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.paid')} {summary.paidOrdersCount ?? 0} | {t('reports.pending')} {summary.pendingOrdersCount ?? 0}
                </p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.netSales')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1 font-mono">
                  {formatPaise(summary.totalNetSalesPaise || 0)}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.discounts')} {formatPaise(summary.totalDiscountPaise || 0)}
                </p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.avgOrderValue')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1 font-mono">
                  {formatPaise(summary.avgOrderValuePaise || 0)}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.gstTax')} {formatPaise(summary.totalTaxPaise || 0)}
                </p>
              </div>
            </>
          )}

          {reportType === 'orders' && (
            <>
              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.totalOrders')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1">
                  {summary.totalOrders ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.avgValue')} {formatPaise(summary.avgOrderValuePaise || 0)}
                </p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.totalOrderValue')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1 font-mono">
                  {formatPaise(summary.totalRevenuePaise || 0)}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.allFulfilledActive')}
                </p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.paidOrders')}
                </p>
                <h3 className="text-xl font-bold text-emerald-500 mt-1">
                  {summary.paidOrdersCount ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.pending')} {summary.pendingOrdersCount ?? 0}
                </p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.completedFulfilled')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-primary)] mt-1">
                  {summary.completedOrdersCount ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                  {t('reports.cancelled')} {summary.cancelledOrdersCount ?? 0}
                </p>
              </div>
            </>
          )}

          {reportType === 'products' && (
            <>
              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.productsSold')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1">
                  {summary.totalProductsSold ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.uniqueCatalogItems')}</p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.totalUnitsSold')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1">
                  {summary.totalUnitsSold ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.acrossAllCarts')}</p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.productSales')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1 font-mono">
                  {formatPaise(summary.totalProductRevenuePaise || 0)}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.excludesTaxShipping')}</p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.topProduct')}
                </p>
                <h3 className="text-base font-bold text-[var(--merchant-text)] mt-1 truncate" title={summary.topProduct}>
                  {summary.topProduct || t('reports.none')}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.highestVolumeSales')}</p>
              </div>
            </>
          )}

          {reportType === 'customers' && (
            <>
              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.totalCustomers')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1">
                  {summary.totalCustomers ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.inCurrentStore')}</p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.repeatCustomers')}
                </p>
                <h3 className="text-xl font-bold text-emerald-500 mt-1">
                  {summary.repeatCustomers ?? 0}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.moreThan1Order')}</p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.totalCustomerSpend')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1 font-mono">
                  {formatPaise(summary.totalSpentPaise || 0)}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.cumulativeLtv')}</p>
              </div>

              <div className="bg-[var(--merchant-surface)] p-4 rounded-2xl border border-[var(--merchant-border)] shadow-2xs transition-colors">
                <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--merchant-text-muted)]">
                  {t('reports.avgCustomerValue')}
                </p>
                <h3 className="text-xl font-bold text-[var(--merchant-text)] mt-1 font-mono">
                  {formatPaise(summary.avgCustomerValuePaise || 0)}
                </h3>
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">{t('reports.revenuePerCustomer')}</p>
              </div>
            </>
          )}
        </div>

        {/* =========================================================================
            PART 4: REPORT DATA TABLE PREVIEW
        ========================================================================= */}
        <div className="bg-[var(--merchant-surface)] rounded-2xl border border-[var(--merchant-border)] shadow-2xs overflow-hidden transition-colors">
          {/* Table Header Bar */}
          <div className="px-5 py-4 border-b border-[var(--merchant-border)] flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[var(--merchant-surface-muted)]">
            <div>
              <h2 className="text-sm font-bold text-[var(--merchant-text)]">
                {reportType === 'sales' && t('reports.salesBreakdown')}
                {reportType === 'orders' && t('reports.ordersLedger')}
                {reportType === 'products' && t('reports.productsMatrix')}
                {reportType === 'customers' && t('reports.customersProfiles')}
              </h2>
              <p className="text-[11px] text-[var(--merchant-text-muted)] mt-0.5">
                {t('reports.showingRecords', {
                  shown: filteredRecords.length,
                  total: reportData?.records?.length || 0,
                  range: computedDateRange.label,
                })}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-[var(--merchant-text-muted)] font-medium hidden sm:inline">
                {t('reports.readyToDownload')}
              </span>
              <button
                type="button"
                onClick={handleDownloadExcel}
                disabled={loading || exportingExcel || !reportData}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-md transition"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel (.xlsx)</span>
              </button>
              <button
                type="button"
                onClick={handleDownloadPdf}
                disabled={loading || exportingPdf || !reportData}
                className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-[var(--merchant-text)] bg-[var(--merchant-surface)] hover:bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] rounded-md transition"
              >
                <FileDown className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div className="py-20 text-center space-y-3">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[var(--merchant-primary)]" />
              <p className="text-xs text-[var(--merchant-text-muted)] font-medium">
                {t('reports.compiling')}
              </p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)] flex items-center justify-center mx-auto">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <p className="text-sm font-semibold text-[var(--merchant-text)]">{t('reports.noRecords')}</p>
              <p className="text-xs text-[var(--merchant-text-muted)] max-w-sm mx-auto">
                {t('reports.noRecordsDesc')}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-[var(--merchant-text-secondary)]">
                {/* 1. SALES TABLE */}
                {reportType === 'sales' && (
                  <>
                    <thead className="bg-[var(--merchant-surface-muted)] border-b border-[var(--merchant-border)] text-[var(--merchant-text-muted)] font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{t('reports.colDate')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.colOrders')}</th>
                        <th className="py-3 px-4 text-right">{t('reports.colGrossSales')}</th>
                        <th className="py-3 px-4 text-right">{t('reports.colDiscounts')}</th>
                        <th className="py-3 px-4 text-right">{t('reports.colNetSales')}</th>
                        <th className="py-3 px-4 text-right">{t('reports.colTaxes')}</th>
                        <th className="py-3 px-4 text-right">{t('reports.colShipping')}</th>
                        <th className="py-3 px-4 text-right">{t('reports.colPaidSales')}</th>
                        <th className="py-3 px-4 text-right font-bold text-[var(--merchant-text)]">{t('reports.colTotalRevenue')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--merchant-border)]">
                      {filteredRecords.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[var(--merchant-surface-muted)]/50 transition-colors">
                          <td className="py-3 px-4 font-medium text-[var(--merchant-text)] whitespace-nowrap">
                            {new Date(r.date).toLocaleDateString(locale, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-[var(--merchant-text)]">
                            {r.ordersCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--merchant-text)]">
                            {formatPaise(r.grossSalesPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-rose-500">
                            {r.discountPaise > 0 ? `-${formatPaise(r.discountPaise)}` : '₹0.00'}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-medium text-[var(--merchant-text)]">
                            {formatPaise(r.netSalesPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--merchant-text-muted)]">
                            {formatPaise(r.taxPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--merchant-text-muted)]">
                            {formatPaise(r.shippingPaise)}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-emerald-500">
                            {formatPaise(r.paidTotalPaise)} ({r.paidCount})
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--merchant-text)]">
                            {formatPaise(r.totalPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[var(--merchant-surface-muted)] border-t-2 border-[var(--merchant-border)] font-bold text-[var(--merchant-text)]">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">{t('reports.totalSummary')}</td>
                        <td className="py-3 px-4 text-center">{summary.totalOrders ?? 0}</td>
                        <td className="py-3 px-4 text-right font-mono">
                          {formatPaise(summary.totalGrossSalesPaise || 0)}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-rose-500">
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
                        <td className="py-3 px-4 text-right font-mono text-emerald-500">
                          {summary.paidOrdersCount ?? 0} {t('paymentStatus.PAID') || 'Paid'}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-[var(--merchant-text)]">
                          {formatPaise(summary.totalRevenuePaise || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {/* 2. ORDERS TABLE */}
                {reportType === 'orders' && (
                  <>
                    <thead className="bg-[var(--merchant-surface-muted)] border-b border-[var(--merchant-border)] text-[var(--merchant-text-muted)] font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{t('reports.colOrderNum')}</th>
                        <th className="py-3 px-4">{t('reports.colDate')}</th>
                        <th className="py-3 px-4">{t('reports.colCustomer')}</th>
                        <th className="py-3 px-4">{t('reports.colPhoneCity')}</th>
                        <th className="py-3 px-4">{t('reports.colItemsSummary')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.colPayment')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.colStatus')}</th>
                        <th className="py-3 px-4 text-right font-bold text-[var(--merchant-text)]">{t('reports.colAmount')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--merchant-border)]">
                      {filteredRecords.map((r: any) => (
                        <tr key={r.orderId} className="hover:bg-[var(--merchant-surface-muted)]/50 transition-colors">
                          <td className="py-3 px-4 font-mono font-bold text-[var(--merchant-text)] whitespace-nowrap">
                            #{r.orderNumber}
                          </td>
                          <td className="py-3 px-4 text-[var(--merchant-text-muted)] whitespace-nowrap">
                            {new Date(r.date).toLocaleString(locale, {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-[var(--merchant-text)] block">
                              {r.customerName}
                            </span>
                            <span className="text-[11px] text-[var(--merchant-text-muted)]">{r.customerEmail}</span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-mono text-[var(--merchant-text-secondary)] block">{r.customerPhone}</span>
                            <span className="text-[11px] text-[var(--merchant-text-muted)]">
                              {r.city} {r.pincode ? `(${r.pincode})` : ''}
                            </span>
                          </td>
                          <td className="py-3 px-4 max-w-xs truncate text-[var(--merchant-text-secondary)]">
                            <span className="font-semibold text-[var(--merchant-text)]">
                              {r.itemsCount} {r.itemsCount === 1 ? t('reports.itemWord') : t('reports.itemsWord')}
                            </span>
                            <span className="block text-[11px] text-[var(--merchant-text-muted)] truncate">
                              {r.itemsSummary}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                r.paymentStatus === 'PAID'
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/30'
                                  : 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                              }`}
                            >
                              {t('paymentStatus.' + r.paymentStatus) || r.paymentStatus}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-secondary)] border border-[var(--merchant-border)]">
                              {t('orderStatus.' + r.status) || r.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--merchant-text)] whitespace-nowrap">
                            {formatPaise(r.totalPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[var(--merchant-surface-muted)] border-t-2 border-[var(--merchant-border)] font-bold text-[var(--merchant-text)]">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">{t('reports.totalSummary')}</td>
                        <td colSpan={6} className="py-3 px-4 text-[var(--merchant-text-muted)] font-normal">
                          {t('reports.ordersSummaryFooter', {
                            total: summary.totalOrders ?? 0,
                            paid: summary.paidOrdersCount ?? 0,
                            pending: summary.pendingOrdersCount ?? 0,
                          })}
                        </td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-[var(--merchant-text)]">
                          {formatPaise(summary.totalRevenuePaise || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {/* 3. PRODUCTS TABLE */}
                {reportType === 'products' && (
                  <>
                    <thead className="bg-[var(--merchant-surface-muted)] border-b border-[var(--merchant-border)] text-[var(--merchant-text-muted)] font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{t('reports.colProductName')}</th>
                        <th className="py-3 px-4">{t('reports.colVariant')}</th>
                        <th className="py-3 px-4">{t('reports.colSku')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.colUnitsSold')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.colCurrentStock')}</th>
                        <th className="py-3 px-4 text-right">{t('reports.colAvgSellingPrice')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.colOrdersCount')}</th>
                        <th className="py-3 px-4 text-right font-bold text-[var(--merchant-text)]">{t('reports.colTotalRevenue')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--merchant-border)]">
                      {filteredRecords.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-[var(--merchant-surface-muted)]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[var(--merchant-text)] max-w-xs truncate">
                            {r.productName}
                          </td>
                          <td className="py-3 px-4 text-[var(--merchant-text-secondary)]">{r.variantTitle}</td>
                          <td className="py-3 px-4 font-mono text-[var(--merchant-text-muted)] text-[11px]">{r.sku}</td>
                          <td className="py-3 px-4 text-center font-bold text-[var(--merchant-primary)]">
                            {r.unitsSold}
                          </td>
                          <td className="py-3 px-4 text-center font-semibold text-[var(--merchant-text-secondary)]">
                            {r.currentStock !== 'N/A' ? (
                              <span
                                className={`px-2 py-0.5 rounded-full text-[11px] ${
                                  r.currentStock < 10
                                    ? 'bg-rose-500/15 text-rose-500 font-bold'
                                    : 'bg-emerald-500/15 text-emerald-500'
                                }`}
                              >
                                {t('reports.inStock', { count: r.currentStock })}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="py-3 px-4 text-right font-mono text-[var(--merchant-text-muted)]">
                            {formatPaise(r.avgSellingPricePaise)}
                          </td>
                          <td className="py-3 px-4 text-center text-[var(--merchant-text-muted)] font-medium">
                            {r.ordersCount}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--merchant-text)]">
                            {formatPaise(r.revenuePaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[var(--merchant-surface-muted)] border-t-2 border-[var(--merchant-border)] font-bold text-[var(--merchant-text)]">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">{t('reports.totalSummary')}</td>
                        <td colSpan={2} className="py-3 px-4 text-[var(--merchant-text-muted)] font-normal">
                          {t('reports.catalogItemsCount', { count: summary.totalProductsSold ?? 0 })}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-[var(--merchant-primary)]">
                          {t('reports.unitsCount', { count: summary.totalUnitsSold ?? 0 })}
                        </td>
                        <td colSpan={3}></td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-[var(--merchant-text)]">
                          {formatPaise(summary.totalProductRevenuePaise || 0)}
                        </td>
                      </tr>
                    </tfoot>
                  </>
                )}

                {/* 4. CUSTOMERS TABLE */}
                {reportType === 'customers' && (
                  <>
                    <thead className="bg-[var(--merchant-surface-muted)] border-b border-[var(--merchant-border)] text-[var(--merchant-text-muted)] font-semibold uppercase text-[10px] tracking-wider">
                      <tr>
                        <th className="py-3 px-4">{t('reports.colCustomerName')}</th>
                        <th className="py-3 px-4">{t('reports.colPhoneNumber')}</th>
                        <th className="py-3 px-4">{t('reports.colEmail')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.colCheckoutType')}</th>
                        <th className="py-3 px-4 text-center">{t('reports.ordersPlaced')}</th>
                        <th className="py-3 px-4">{t('reports.colFirstOrder')}</th>
                        <th className="py-3 px-4">{t('reports.colLastOrder')}</th>
                        <th className="py-3 px-4 text-right font-bold text-[var(--merchant-text)]">{t('reports.colTotalSpend')}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--merchant-border)]">
                      {filteredRecords.map((r: any) => (
                        <tr key={r.customerId} className="hover:bg-[var(--merchant-surface-muted)]/50 transition-colors">
                          <td className="py-3 px-4 font-bold text-[var(--merchant-text)]">{r.customerName}</td>
                          <td className="py-3 px-4 font-mono text-[var(--merchant-text-secondary)]">{r.phone}</td>
                          <td className="py-3 px-4 text-[var(--merchant-text-muted)]">{r.email}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-secondary)] border border-[var(--merchant-border)]">
                              {r.isGuest ? t('reports.guestCheckout') : t('reports.registered')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                                r.ordersCount > 1
                                  ? 'bg-[var(--merchant-primary-soft)] text-[var(--merchant-primary)] border border-[var(--merchant-border)]'
                                  : 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)]'
                              }`}
                            >
                              {r.ordersCount} {r.ordersCount === 1 ? t('reports.orderWord') : t('reports.ordersWord')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-[var(--merchant-text-muted)] whitespace-nowrap">
                            {new Date(r.firstOrderDate).toLocaleDateString(locale, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-[var(--merchant-text-muted)] whitespace-nowrap">
                            {new Date(r.lastOrderDate).toLocaleDateString(locale, {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 px-4 text-right font-mono font-bold text-[var(--merchant-text)]">
                            {formatPaise(r.totalSpentPaise)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-[var(--merchant-surface-muted)] border-t-2 border-[var(--merchant-border)] font-bold text-[var(--merchant-text)]">
                      <tr>
                        <td className="py-3 px-4 uppercase text-[11px]">{t('reports.totalSummary')}</td>
                        <td colSpan={3} className="py-3 px-4 text-[var(--merchant-text-muted)] font-normal">
                          {t('reports.customersSummaryFooter', {
                            total: summary.totalCustomers ?? 0,
                            repeat: summary.repeatCustomers ?? 0,
                          })}
                        </td>
                        <td className="py-3 px-4 text-center font-extrabold text-[var(--merchant-primary)]">
                          {filteredRecords.reduce(
                            (acc: number, r: any) => acc + (r.ordersCount || 0),
                            0
                          )}{' '}
                          {t('reports.ordersWord')}
                        </td>
                        <td colSpan={2}></td>
                        <td className="py-3 px-4 text-right font-mono text-sm font-extrabold text-[var(--merchant-text)]">
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
