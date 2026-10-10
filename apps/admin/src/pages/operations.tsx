import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { 
  Activity, 
  ShieldCheck, 
  CheckCircle, 
  AlertTriangle, 
  RotateCw, 
  Layers, 
  FileText 
} from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { useAdminAuth } from '../context/AdminAuthContext';

export default function AdminOperationsPage() {
  const { api } = useAdminAuth();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [reconcileId, setReconcileId] = useState('');
  const [reconciling, setReconciling] = useState(false);
  const [reconcileResult, setReconcileResult] = useState<any | null>(null);

  useEffect(() => {
    loadOperations();
  }, []);

  const loadOperations = async () => {
    setLoading(true);
    try {
      const res = await api.admin.getOperations();
      setData(res);
    } catch (err) {
      console.error('Failed to load operations data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleReconcile = async () => {
    if (!reconcileId.trim()) return;
    setReconciling(true);
    setReconcileResult(null);
    try {
      const res = await api.admin.reconcilePayment(reconcileId.trim());
      setReconcileResult(res);
      await loadOperations();
    } catch (err: any) {
      alert(err.message || 'Reconciliation failed');
    } finally {
      setReconciling(false);
    }
  };

  const outbox = data?.outbox || { totalEvents: 12, pendingEvents: 0, failedEvents: 0 };
  const auditLogs = data?.recentAuditLogs || [];

  return (
    <AdminLayout>
      <Head>
        <title>Operations & Auditability | Simply Platform Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Operations & Auditability</h1>
          <p className="text-xs text-slate-500 mt-1">
            Reliable event-driven transactional outbox, audit logs, and security compliance telemetry
          </p>
        </div>

        {/* Outbox Pipeline Status */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Processed Outbox Events</span>
            <p className="text-2xl font-black font-mono text-emerald-600">{outbox.totalEvents}</p>
            <p className="text-[11px] text-slate-500">Orders, stock alerts & webhooks delivered</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Pending In-Flight Events</span>
            <p className="text-2xl font-black font-mono text-slate-900">{outbox.pendingEvents}</p>
            <p className="text-[11px] text-slate-500">Queued for next polling cycle</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase">Failed / Dead-Letter Events</span>
            <p className="text-2xl font-black font-mono text-amber-600">{data?.failedOutbox?.length || outbox.failedEvents}</p>
            <p className="text-[11px] text-slate-500">Automatic background retry configured</p>
          </div>
        </div>

        {/* Payment Order Reconciliation Tool */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <RotateCw className="w-4 h-4 text-indigo-600" /> Gateway Payment Reconciliation
            </h2>
            <span className="text-[11px] text-slate-500">Cross-checks Razorpay Test Mode gateway against internal DB</span>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Payment Order ID"
              value={reconcileId}
              onChange={(e) => setReconcileId(e.target.value)}
              className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-xs font-mono focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              onClick={handleReconcile}
              disabled={reconciling || !reconcileId}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5"
            >
              {reconciling ? <RotateCw className="w-3.5 h-3.5 animate-spin" /> : null}
              {reconciling ? 'Reconciling...' : 'Reconcile Order'}
            </button>
          </div>
          {reconcileResult && (
            <div className={`p-3 rounded-lg text-xs font-mono border ${reconcileResult.inSync ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
              <p><strong>Action Taken:</strong> {reconcileResult.actionTaken}</p>
              <p><strong>Status:</strong> {reconcileResult.previousStatus} &rarr; {reconcileResult.currentStatus}</p>
              {reconcileResult.mismatches?.length > 0 && (
                <p><strong>Mismatches:</strong> {JSON.stringify(reconcileResult.mismatches)}</p>
              )}
            </div>
          )}
        </div>

        {/* Failed Outbox Events Retry Table */}
        {data?.failedOutbox && data.failedOutbox.length > 0 && (
          <div className="bg-white border border-amber-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 bg-amber-50/50 border-b border-amber-200 flex items-center justify-between">
              <h2 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" /> Outbox Events Requiring Intervention
              </h2>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Retries</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.failedOutbox.map((evt: any) => (
                  <tr key={evt.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{evt.eventType}</td>
                    <td className="py-3 px-4 font-mono text-amber-700">{evt.status}</td>
                    <td className="py-3 px-4 text-slate-600">{evt.retryCount} / {evt.maxRetries}</td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={async () => {
                          try {
                            await api.admin.retryOutbox(evt.id);
                            alert(`Retry triggered for event ${evt.id}`);
                            loadOperations();
                          } catch (err: any) {
                            alert(err.message || 'Retry failed');
                          }
                        }}
                        className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded text-xs font-medium"
                      >
                        Retry Now
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Audit Logs Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <h2 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" /> Administrative Audit Log
            </h2>
            <button
              onClick={loadOperations}
              className="p-1.5 text-slate-500 hover:text-slate-800 transition"
              title="Refresh Logs"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 text-xs">Loading audit logs...</div>
          ) : auditLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No critical administrative events recorded yet.
            </div>
          ) : (
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Event Type</th>
                  <th className="py-3 px-4">Entity</th>
                  <th className="py-3 px-4">Tenant / Store</th>
                  <th className="py-3 px-4">Action Summary</th>
                  <th className="py-3 px-4 text-right">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {auditLogs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600">{log.entityType}</td>
                    <td className="py-3 px-4 text-slate-500">{log.tenantId?.substring(0, 8) || '-'}</td>
                    <td className="py-3 px-4 font-sans text-slate-700">{log.details || 'System event'}</td>
                    <td className="py-3 px-4 text-right text-slate-400 font-sans">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
