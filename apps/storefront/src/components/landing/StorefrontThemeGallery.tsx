import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight, SlidersHorizontal } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';
import { FOUNDATIONAL_THEMES } from '@simply/ui';

const THEME_IDS = [
  'canvas',
  'aura',
  'horizon',
  'feast',
  'atelier',
  'harvest',
] as const;

export function StorefrontThemeGallery() {
  const { t } = useLandingI18n();
  const tr = (key: string) => t('landing.themeGallery.' + key);
  const rail = useRef<HTMLDivElement>(null);
  const drag = useRef<{ x: number; scroll: number } | null>(null);
  const [dragging, setDragging] = useState(false);
  const [edges, setEdges] = useState({ start: true, end: false });

  const updateEdges = () => {
    const element = rail.current;
    if (element) {
      const next = {
        start: element.scrollLeft <= 1,
        end:
          element.scrollLeft >= element.scrollWidth - element.clientWidth - 1,
      };
      setEdges((current) =>
        current.start === next.start && current.end === next.end
          ? current
          : next,
      );
    }
  };

  useEffect(() => {
    const element = rail.current;
    if (!element) return;
    element.scrollLeft = 0;
    const observer = new ResizeObserver(updateEdges);
    observer.observe(element);
    updateEdges();
    return () => observer.disconnect();
  }, []);

  const scroll = (direction: -1 | 1) => {
    const element = rail.current;
    if (!element) return;
    const distance =
      (element.firstElementChild?.getBoundingClientRect().width || 310) + 16;
    element.scrollBy({
      left: distance * direction,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'instant'
        : 'smooth',
    });
  };

  return (
    <section
      data-testid="theme-gallery"
      aria-labelledby="storefront-themes-title"
      className="min-w-0 border-t border-slate-200/80 pt-5"
    >
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="max-w-[1050px]">
          <p className="text-[10px] font-extrabold uppercase tracking-[.18em] text-orange-700">
            {tr('eyebrow')}
          </p>
          <h3
            id="storefront-themes-title"
            className="mt-1 text-[24px] font-extrabold leading-tight tracking-tight text-slate-900 sm:text-[28px]"
          >
            {tr('title')}
          </h3>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">
            {tr('supporting')}
          </p>
        </div>
        <div className="hidden shrink-0 gap-2 sm:flex">
          <button
            type="button"
            aria-label={tr('previous')}
            aria-controls="storefront-theme-rail"
            disabled={edges.start}
            onClick={() => scroll(-1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:cursor-default disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            aria-label={tr('next')}
            aria-controls="storefront-theme-rail"
            disabled={edges.end}
            onClick={() => scroll(1)}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 hover:border-orange-300 hover:text-orange-600 disabled:cursor-default disabled:opacity-35 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div
        id="storefront-theme-rail"
        ref={rail}
        role="region"
        aria-roledescription={tr('carousel')}
        aria-label={tr('railLabel')}
        tabIndex={0}
        onScroll={updateEdges}
        className="flex cursor-grab select-none gap-4 overflow-x-auto overscroll-x-contain rounded-2xl pb-3 no-scrollbar focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-blue-600"
        style={{
          scrollSnapType: dragging ? 'none' : 'x mandatory',
          cursor: dragging ? 'grabbing' : undefined,
        }}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
            event.preventDefault();
            scroll(event.key === 'ArrowRight' ? 1 : -1);
          }
          if (event.key === 'Home' || event.key === 'End') {
            event.preventDefault();
            rail.current?.scrollTo({
              left: event.key === 'Home' ? 0 : rail.current.scrollWidth,
              behavior: 'instant',
            });
          }
        }}
        onPointerDown={(event) => {
          if (event.pointerType !== 'mouse' || event.button !== 0) return;
          drag.current = {
            x: event.clientX,
            scroll: event.currentTarget.scrollLeft,
          };
          event.currentTarget.setPointerCapture(event.pointerId);
          setDragging(true);
        }}
        onPointerMove={(event) => {
          if (drag.current)
            event.currentTarget.scrollLeft =
              drag.current.scroll + drag.current.x - event.clientX;
        }}
        onPointerUp={(event) => {
          drag.current = null;
          setDragging(false);
          if (event.currentTarget.hasPointerCapture(event.pointerId))
            event.currentTarget.releasePointerCapture(event.pointerId);
        }}
        onPointerCancel={() => {
          drag.current = null;
          setDragging(false);
        }}
        onLostPointerCapture={() => {
          drag.current = null;
          setDragging(false);
        }}
        onDragStart={(event) => event.preventDefault()}
      >
        {THEME_IDS.map((id) => (
          <figure
            key={id}
            data-theme-preview={id}
            className="w-[88%] shrink-0 snap-start overflow-hidden rounded-2xl border border-slate-200 bg-white sm:w-[300px] lg:w-[310px]"
          >
            {/* Pre-optimized snapshots of the actual renderer; no extra app/iframe or image processing at runtime. */}
            <Image
              src={`/images/landing/themes/${id}.webp`}
              width={1008}
              height={768}
              unoptimized
              loading="lazy"
              draggable={false}
              alt={t('landing.themeGallery.previewAlt', {
                theme: FOUNDATIONAL_THEMES[id].name,
              })}
              className="aspect-[21/16] h-auto w-full border-b border-slate-100 object-contain"
            />
            <figcaption className="p-3.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h4 className="text-[17px] font-bold text-slate-900">
                  {FOUNDATIONAL_THEMES[id].name}
                </h4>
                <span className="rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                  {tr('customisable')}
                </span>
              </div>
              <p className="mt-1 min-h-[36px] text-[12px] leading-[18px] text-slate-500">
                {tr(id)}
              </p>
              <p className="mt-2 border-t border-slate-100 pt-2 text-[11px] leading-relaxed text-slate-500">
                {tr('capabilities')}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="mt-1 flex items-center justify-center gap-2 text-center text-[12px] leading-relaxed text-slate-500">
        <SlidersHorizontal
          className="h-3.5 w-3.5 shrink-0 text-orange-600"
          aria-hidden="true"
        />
        {tr('brandStudio')}
      </p>
    </section>
  );
}
