import React from 'react';
import Head from 'next/head';
import type { AdminTheme } from '@simply/api-contracts';
import { AdminLayout } from '../components/AdminLayout';
import { Feedback, useAdminQuery } from '../components/AdminUI';
export default function Themes() {
  const { data, loading, error, reload } =
    useAdminQuery<AdminTheme[]>('admin/themes');
  return (
    <AdminLayout>
      <Head>
        <title>Themes — LetzShop Admin</title>
      </Head>
      <div className="space-y-5">
        <div className="flex flex-wrap justify-between gap-3">
          <h1 className="text-2xl font-bold">Storefront Theme Catalog</h1>
          <button className="admin-secondary" onClick={reload}>
            Refresh
          </button>
        </div>
        <Feedback loading={loading} error={error} onRetry={reload} />
        {data && (
          <>
            <p className="text-sm text-admin-muted">
              {data.length} theme records from the platform catalog. Usage
              counts reference stored merchant theme configurations.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.map((t) => (
                <section className="admin-panel space-y-2" key={t.id}>
                  <h2 className="font-semibold">{t.name}</h2>
                  <p className="text-sm text-admin-secondary">{t.code}</p>
                  <p className="text-sm">
                    {t.isDefault ? 'Default theme' : 'Catalog theme'}
                  </p>
                  <p className="text-sm">
                    {t._count.storeConfigs} store configuration(s)
                  </p>
                  <time className="text-xs text-admin-muted">
                    Updated {new Date(t.updatedAt).toLocaleString()}
                  </time>
                </section>
              ))}
            </div>
            {!data.length && (
              <p className="admin-panel text-admin-muted">
                No themes configured.
              </p>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
