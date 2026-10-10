import React from 'react';
import Head from 'next/head';
import { Palette, Check, Sparkles, Layers, Type, Image } from 'lucide-react';
import { AdminLayout } from '../components/AdminLayout';
import { FOUNDATIONAL_THEMES } from '@simply/ui';

export default function AdminThemesPage() {
  const themes = Object.values(FOUNDATIONAL_THEMES);

  return (
    <AdminLayout>
      <Head>
        <title>Themes & Design Engine | ShopOnGo Platform Admin</title>
      </Head>

      <div className="space-y-6 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Theme Engine & Storefront Templates
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Global catalog of {themes.length} foundational and specialized design archetypes available to merchants
            </p>
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>{themes.length} Active Presets</span>
          </div>
        </div>

        {/* Theme Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((th) => {
            const isNew = ['aura', 'noir', 'vista'].includes(th.code);

            return (
              <div
                key={th.code}
                className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md hover:border-slate-300 transition duration-200"
              >
                {/* Visual Header Banner */}
                <div
                  className="h-28 p-4 flex flex-col justify-between relative overflow-hidden"
                  style={{ backgroundColor: th.palette.primary }}
                >
                  {/* Ambient accent circle */}
                  <div
                    className="absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-xl opacity-40 pointer-events-none"
                    style={{ backgroundColor: th.palette.accent }}
                  />

                  <div className="flex items-center justify-between z-10">
                    <span
                      className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-sm text-white"
                      style={{ backgroundColor: th.palette.accent }}
                    >
                      {th.name} Archetype
                    </span>

                    {isNew && (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500 text-slate-950 font-black text-[9px] uppercase tracking-wider">
                        NEW
                      </span>
                    )}
                  </div>

                  <span className="text-white text-xs font-semibold z-10 drop-shadow-sm">
                    {th.tagline}
                  </span>
                </div>

                {/* Details Body */}
                <div className="p-5 space-y-4 flex-1">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm flex items-center justify-between">
                      <span>{th.name}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        code: {th.code}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                      {th.bestFor}
                    </p>
                  </div>

                  {/* Attributes */}
                  <div className="space-y-2 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Type className="w-3.5 h-3.5 text-slate-400" />
                        <span>Typography:</span>
                      </span>
                      <span className="font-semibold text-slate-800 text-[11px]">
                        {th.typography.heading} / {th.typography.body}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Image className="w-3.5 h-3.5 text-slate-400" />
                        <span>Product Ratio:</span>
                      </span>
                      <span className="font-mono text-slate-700 text-[11px] font-bold">
                        {th.imageRatio}
                      </span>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-slate-400" />
                        <span>Card Style:</span>
                      </span>
                      <span className="font-mono text-slate-700 text-[11px]">
                        {th.cardStyle}
                      </span>
                    </div>
                  </div>

                  {/* Swatches */}
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400">Palette Tokens:</span>
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: th.palette.primary }}
                          title={`Primary: ${th.palette.primary}`}
                        />
                        <span className="text-[10px] font-mono text-slate-500">Pri</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-4 h-4 rounded-full border border-black/10 shadow-sm"
                          style={{ backgroundColor: th.palette.accent }}
                          title={`Accent: ${th.palette.accent}`}
                        />
                        <span className="text-[10px] font-mono text-slate-500">Acc</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span
                          className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                          style={{ backgroundColor: th.palette.background }}
                          title={`Background: ${th.palette.background}`}
                        />
                        <span className="text-[10px] font-mono text-slate-500">Bg</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
