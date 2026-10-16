import type { AdminSettings } from '@simply/api-contracts';
import React from 'react';
import Head from 'next/head';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, useAdminQuery } from '../components/AdminUI';
export default function Settings() {
  const { data, loading, error } =
    useAdminQuery<AdminSettings>('admin/settings');
  return (
    <AdminLayout>
      <Head>
        <title>Settings — LetzShop Admin</title>
      </Head>
      <div className="max-w-3xl space-y-5">
        <h1 className="text-2xl font-bold">Platform Settings</h1>
        <p className="text-sm text-admin-muted">
          Current platform configuration. Manage plan records under
          Subscriptions.
        </p>
        <Feedback error={error} loading={loading} />
        {data && (
          <dl className="admin-panel space-y-4">
            {[
              ['Platform', data.platformName],
              ['Support email', data.supportEmail],
              ['Currency', data.currency],
              ['Timezone', data.timezone],
              ['Configuration source', data.source],
              ['Plan configuration', data.plansSource],
              [
                'Growth purchases',
                data.growthPurchaseEnabled ? 'Enabled' : 'Coming Soon',
              ],
              ['Review moderation', data.moderation],
            ].map(([key, value]) => (
              <div key={key} className="grid gap-1 sm:grid-cols-3">
                <dt className="text-sm font-semibold">{key}</dt>
                <dd className="text-sm text-admin-secondary break-words sm:col-span-2">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </AdminLayout>
  );
}
