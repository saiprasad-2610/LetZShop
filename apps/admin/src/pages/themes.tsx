import React from 'react';
import Head from 'next/head';
import { Palette, Check, Sparkles, Layers } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { FOUNDATIONAL_THEMES } from '@simply/ui';

export default function AdminThemesPage() {
  const themes = Object.values(FOUNDATIONAL_THEMES);

  return (
    <AdminLayout>
      <Head>
        <title>Theme Engine Governance | Simply Platform Admin</title>
      </Head>

      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Theme Engine Governance</h1>
          <p className="text-xs text-slate-500 mt-1">
            Catalogue of 6 foundational storefront design archetypes and design fallback parameters
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((th) => (
            <div
              key={th.code}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between"
            >
              {/* Header preview bar with theme colors */}
              <div
                className="h-24 p-4 flex flex-col justify-between"
                style={{ backgroundColor: th.palette.primary }}
              >
                <span
                  className="self-start text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded shadow"
                  style={{ backgroundColor: th.palette.accent, color: '#FFFFFF' }}
                >
                  {th.name} Archetype
                </span>
                <span className="text-white text-xs font-semibold">{th.tagline}</span>
              </div>

              {/* Details */}
              <div className="p-5 space-y-4 flex-1">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">{th.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{th.bestFor}</p>
                </div>

                <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Typography:</span>
                    <span className="font-semibold text-slate-800">
                      {th.typography.heading} / {th.typography.body}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Card Style:</span>
                    <span className="font-mono text-slate-700">{th.cardStyle}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Hero Layout:</span>
                    <span className="font-mono text-slate-700">{th.heroStyle}</span>
                  </div>
                </div>

                {/* Color swatches */}
                <div className="pt-2 border-t border-slate-100 flex items-center gap-2">
                  <span className="text-[11px] text-slate-400">Palette:</span>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: th.palette.primary }}
                      title={`Primary: ${th.palette.primary}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: th.palette.accent }}
                      title={`Accent: ${th.palette.accent}`}
                    />
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                      style={{ backgroundColor: th.palette.background }}
                      title={`Background: ${th.palette.background}`}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
