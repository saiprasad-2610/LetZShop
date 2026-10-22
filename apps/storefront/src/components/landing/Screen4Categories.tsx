import React, { useRef, useState } from 'react';
import {
  ArrowRight,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  Croissant,
  CakeSlice,
  Cookie,
  Facebook,
  Flower2,
  Gem,
  Globe2,
  Heart,
  Instagram,
  Leaf,
  Link2,
  Menu,
  MessageCircle,
  Package,
  Paintbrush,
  QrCode,
  Search,
  Shirt,
  ShoppingBag,
  ShoppingBasket,
  Sparkles,
  Wheat,
  type LucideIcon,
} from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

type Category = {
  id: string;
  label: string;
  icon: LucideIcon;
  store: string;
  slug: string;
  tagline: string;
  headline: string;
  accent: string;
  surface: string;
  collections: string[];
  products: { name: string; price: number; icon: LucideIcon }[];
};

const CATEGORIES: Category[] = [
  {
    id: 'fashion',
    label: 'fashion',
    icon: Shirt,
    store: 'Urban Loom',
    slug: 'urbanloom',
    tagline: 'Good clothes. Every day.',
    headline: 'Made for your everyday.',
    accent: '#24566A',
    surface: '#EDF4F5',
    collections: ['Everyday', 'Cotton', 'Layers'],
    products: [
      { name: 'Everyday Shirt', price: 899, icon: Shirt },
      { name: 'Cotton Kurta', price: 1299, icon: Shirt },
      { name: 'Casual Jacket', price: 1899, icon: Shirt },
      { name: 'Classic Tee', price: 599, icon: Shirt },
    ],
  },
  {
    id: 'beauty',
    label: 'beauty',
    icon: Sparkles,
    store: 'Pure & Co.',
    slug: 'pureandco',
    tagline: 'A little care, every day.',
    headline: 'Your everyday care ritual.',
    accent: '#8B5267',
    surface: '#F8EEF2',
    collections: ['Face', 'Body', 'Daily Care'],
    products: [
      { name: 'Face Serum', price: 649, icon: Sparkles },
      { name: 'Moisturiser', price: 449, icon: Flower2 },
      { name: 'Cleanser', price: 349, icon: Sparkles },
      { name: 'Body Care', price: 549, icon: Leaf },
    ],
  },
  {
    id: 'jewellery',
    label: 'jewellery',
    icon: Gem,
    store: 'Aura Jewellery',
    slug: 'aurajewellery',
    tagline: 'Small details. Lasting favourites.',
    headline: 'A little shine. All your own.',
    accent: '#8B662C',
    surface: '#FAF4E8',
    collections: ['Everyday', 'Classics', 'Gifting'],
    products: [
      { name: 'Pendant', price: 1499, icon: Gem },
      { name: 'Earrings', price: 1199, icon: Sparkles },
      { name: 'Bracelet', price: 899, icon: Heart },
      { name: 'Ring', price: 1299, icon: Gem },
    ],
  },
  {
    id: 'food',
    label: 'food',
    icon: Croissant,
    store: 'Daily Bakehouse',
    slug: 'dailybakehouse',
    tagline: 'A happier kind of everyday.',
    headline: 'Something good is baking.',
    accent: '#984D32',
    surface: '#FFF1E6',
    collections: ['Fresh Bakes', 'Sweet Treats', 'Bread'],
    products: [
      { name: 'Croissant', price: 149, icon: Croissant },
      { name: 'Chocolate Cake', price: 699, icon: CakeSlice },
      { name: 'Artisan Bread', price: 199, icon: Wheat },
      { name: 'Cookies', price: 249, icon: Cookie },
    ],
  },
  {
    id: 'handicrafts',
    label: 'handicrafts',
    icon: Paintbrush,
    store: 'Crafted India',
    slug: 'craftedindia',
    tagline: 'Thoughtfully made. Naturally yours.',
    headline: 'A home with a human touch.',
    accent: '#765944',
    surface: '#F5EFE7',
    collections: ['Ceramics', 'Woven', 'Home Accents'],
    products: [
      { name: 'Ceramic Vase', price: 799, icon: Flower2 },
      { name: 'Handmade Decor', price: 599, icon: Paintbrush },
      { name: 'Woven Basket', price: 899, icon: ShoppingBasket },
      { name: 'Table Accent', price: 449, icon: Leaf },
    ],
  },
  {
    id: 'groceries',
    label: 'groceries',
    icon: ShoppingBasket,
    store: 'Daily Basket',
    slug: 'dailybasket',
    tagline: 'Your neighbourhood, now online.',
    headline: 'Everyday essentials, sorted.',
    accent: '#326349',
    surface: '#EDF5EC',
    collections: ['Grains', 'Fresh Picks', 'Essentials'],
    products: [
      { name: 'Rice', price: 349, icon: Wheat },
      { name: 'Pulses', price: 179, icon: Package },
      { name: 'Fresh Produce', price: 149, icon: Leaf },
      { name: 'Daily Essentials', price: 299, icon: ShoppingBasket },
    ],
  },
];

function ProductArt({
  category,
  index = 0,
}: {
  category: Category;
  index?: number;
}) {
  const Icon = category.products[index].icon;
  const colours = [category.accent, '#A6B9B1', '#C4A17C', '#7A8B9C'];
  return (
    <div
      className="flex h-full w-full items-center justify-center"
      style={{ color: colours[index] }}
    >
      {category.id === 'fashion' ? (
        <svg
          viewBox="0 0 140 120"
          className="h-[88%] w-[88%]"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="70"
            cy="108"
            rx="34"
            ry="4"
            fill="currentColor"
            opacity=".08"
          />
          <path
            d="M49 17 31 25 14 47 32 61 43 49v53h54V49l11 12 18-14-17-22-18-8c-8 12-34 12-42 0Z"
            fill="currentColor"
            opacity=".85"
          />
          <path
            d="m49 17 11 18 10-9 10 9 11-18M70 29v72M81 45h10v14H81Z"
            stroke="white"
            strokeWidth="1.5"
            opacity=".8"
          />
          {[46, 60, 74, 88].map((y) => (
            <circle key={y} cx="73" cy={y} r="1.2" fill="white" />
          ))}
        </svg>
      ) : category.id === 'beauty' ? (
        <svg
          viewBox="0 0 140 120"
          className="h-[88%] w-[88%]"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="70"
            cy="108"
            rx="29"
            ry="4"
            fill="currentColor"
            opacity=".1"
          />
          <rect
            x={index === 1 ? 36 : 48}
            y={index === 1 ? 48 : 34}
            width={index === 1 ? 68 : 44}
            height={index === 1 ? 54 : 68}
            rx="9"
            fill="currentColor"
            opacity=".75"
          />
          <rect
            x={index === 1 ? 34 : 53}
            y={index === 1 ? 39 : 25}
            width={index === 1 ? 72 : 34}
            height="13"
            rx="4"
            fill="currentColor"
          />
          {index !== 1 && <path d="M65 25V12h24v6H76v7" fill="currentColor" />}
          <rect
            x="48"
            y="62"
            width="44"
            height="25"
            rx="3"
            fill="white"
            opacity=".9"
          />
          <path d="M60 72h20M65 78h10" stroke="currentColor" strokeWidth="2" />
        </svg>
      ) : category.id === 'jewellery' ? (
        <svg
          viewBox="0 0 140 120"
          className="h-[88%] w-[88%]"
          fill="none"
          aria-hidden="true"
        >
          <ellipse
            cx="70"
            cy="108"
            rx="34"
            ry="4"
            fill="currentColor"
            opacity=".08"
          />
          {index === 0 ? (
            <>
              <path
                d="M35 24c0 66 70 66 70 0"
                stroke="currentColor"
                strokeWidth="3"
              />
              <path
                d="m70 77 12 12-12 16-12-16Z"
                fill="currentColor"
                opacity=".8"
              />
            </>
          ) : index === 1 ? (
            <>
              <circle cx="46" cy="44" r="4" fill="currentColor" />
              <circle cx="94" cy="44" r="4" fill="currentColor" />
              <ellipse
                cx="46"
                cy="72"
                rx="15"
                ry="25"
                stroke="currentColor"
                strokeWidth="4"
              />
              <ellipse
                cx="94"
                cy="72"
                rx="15"
                ry="25"
                stroke="currentColor"
                strokeWidth="4"
              />
            </>
          ) : (
            <>
              <circle
                cx="70"
                cy="70"
                r={index === 2 ? 34 : 25}
                stroke="currentColor"
                strokeWidth={index === 2 ? 5 : 7}
              />
              <path d="m70 25 10 10-10 12-10-12Z" fill="currentColor" />
            </>
          )}
        </svg>
      ) : category.id === 'handicrafts' && index === 0 ? (
        <svg
          viewBox="0 0 140 120"
          className="h-[88%] w-[88%]"
          fill="none"
          aria-hidden="true"
        >
          <path
            d="M57 30h26v14c0 14 18 22 18 37 0 20-17 23-31 23s-31-3-31-23c0-15 18-23 18-37Z"
            fill="currentColor"
            opacity=".75"
          />
          <path
            d="M70 30V8m0 12 18-11M70 17 53 7"
            stroke="#6A825D"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M45 79h50M50 91h40"
            stroke="white"
            strokeWidth="2"
            opacity=".5"
          />
        </svg>
      ) : (
        <Icon
          className="h-[65%] w-[65%]"
          strokeWidth={1.25}
          aria-hidden="true"
        />
      )}
    </div>
  );
}

function IllustrativeQr({ label }: { label: string }) {
  const cells = Array.from({ length: 21 * 21 }, (_, n) => ({
    x: n % 21,
    y: Math.floor(n / 21),
  })).filter(
    ({ x, y }) =>
      !((x < 8 && y < 8) || (x > 12 && y < 8) || (x < 8 && y > 12)) &&
      (x * 7 + y * 11 + x * y) % 5 < 2,
  );
  return (
    <svg
      viewBox="-2 -2 25 25"
      role="img"
      aria-label={label}
      className="h-24 w-24 text-slate-800"
      shapeRendering="crispEdges"
    >
      <rect x="-2" y="-2" width="25" height="25" fill="white" />
      {[
        [0, 0],
        [14, 0],
        [0, 14],
      ].map(([x, y]) => (
        <g key={x + '-' + y}>
          <rect x={x} y={y} width="7" height="7" rx=".5" fill="currentColor" />
          <rect x={x + 1} y={y + 1} width="5" height="5" fill="white" />
          <rect x={x + 2} y={y + 2} width="3" height="3" fill="currentColor" />
        </g>
      ))}
      {cells.map(({ x, y }) => (
        <rect
          key={x + '-' + y}
          x={x}
          y={y}
          width="1"
          height="1"
          fill="currentColor"
        />
      ))}
      <rect x="8" y="8" width="6" height="6" rx="1" fill="white" />
      <path d="M10 9v3h3" stroke="#FF6B00" strokeWidth="1.2" fill="none" />
    </svg>
  );
}

export const Screen4Categories: React.FC = () => {
  const { t } = useLandingI18n();
  const tr = (key: string) => t('landing.businessShowcase.' + key);
  const [activeIndex, setActiveIndex] = useState(0);
  const selector = useRef<HTMLDivElement>(null);
  const category = CATEGORIES[activeIndex];

  const select = (index: number, focus = false) => {
    const next = (index + CATEGORIES.length) % CATEGORIES.length;
    setActiveIndex(next);
    const button = selector.current?.querySelector<HTMLButtonElement>(
      '[data-category="' + CATEGORIES[next].id + '"]',
    );
    button?.scrollIntoView({
      block: 'nearest',
      inline: 'nearest',
      behavior: 'smooth',
    });
    if (focus) button?.focus({ preventScroll: true });
  };

  const productCard = (index: number, mobile = false) => {
    const product = category.products[index];
    return (
      <div key={product.name} className="min-w-0">
        <div
          className={
            mobile
              ? 'h-24 md:h-[60px] rounded-xl border border-black/[.03]'
              : 'h-[92px] rounded-xl border border-black/[.03]'
          }
          style={{ backgroundColor: category.surface }}
        >
          <ProductArt category={category} index={index} />
        </div>
        <p
          className={
            mobile
              ? 'mt-2 text-xs md:text-[10px] font-semibold leading-snug text-slate-800'
              : 'mt-2 text-[13px] font-semibold leading-snug text-slate-800'
          }
        >
          {product.name}
        </p>
        <div className="mt-1 flex items-center justify-between gap-1">
          <span
            className={
              mobile
                ? 'text-xs md:text-[10px] font-bold text-slate-900'
                : 'text-[13px] font-bold text-slate-900'
            }
          >
            ₹{product.price.toLocaleString('en-IN')}
          </span>
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600"
            aria-hidden="true"
          >
            <ArrowUpRight className="h-3 w-3" />
          </span>
        </div>
      </div>
    );
  };

  const benefits = [
    {
      icon: Link2,
      title: 'benefitLink',
      desc: 'benefitLinkDesc',
      colour: 'text-blue-600 bg-blue-50',
    },
    {
      icon: QrCode,
      title: 'benefitShare',
      desc: 'benefitShareDesc',
      colour: 'text-orange-600 bg-orange-50',
    },
    {
      icon: ShoppingBasket,
      title: 'benefitBusiness',
      desc: 'benefitBusinessDesc',
      colour: 'text-emerald-600 bg-emerald-50',
    },
    {
      icon: Clock3,
      title: 'benefitAnytime',
      desc: 'benefitAnytimeDesc',
      colour: 'text-violet-600 bg-violet-50',
    },
  ];

  return (
    <section
      id="categories"
      data-testid="screen4-showcase"
      className="relative overflow-hidden border-b border-slate-100 bg-[#FCFDFE] px-4 py-10 sm:px-6 lg:py-8"
    >
      <div
        className="pointer-events-none absolute left-[10%] top-64 h-80 w-80 rounded-full bg-orange-100/25 blur-3xl"
        aria-hidden="true"
      />
      <div className="relative mx-auto max-w-[1440px] space-y-5 lg:space-y-4">
        <div className="mx-auto max-w-[1250px] text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white px-3 py-1.5 text-[11px] font-extrabold uppercase tracking-wider text-slate-700">
            <Globe2
              className="h-3.5 w-3.5 text-orange-600"
              aria-hidden="true"
            />
            {tr('eyebrow')}
          </span>
          <h2 className="mt-3 text-[34px] font-black leading-[1.2] tracking-tight text-[#0B1528] sm:text-[42px] lg:text-[48px]">
            {tr('titleLead')}{' '}
            <span className="text-[#FF6B00]">{tr('titleEmphasis')}</span>{' '}
            {tr('titleEnd')}
          </h2>
          <p className="mx-auto mt-3 max-w-[990px] text-[15px] leading-relaxed text-slate-500 sm:text-base">
            {tr('supporting')}
          </p>
        </div>

        <div className="mx-auto flex max-w-[1120px] items-center gap-2 sm:gap-3">
          <button
            type="button"
            onClick={() => select(activeIndex - 1)}
            aria-label={tr('previous')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-orange-300 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <div
            ref={selector}
            role="group"
            aria-label={tr('categorySelector')}
            className="flex min-w-0 flex-1 items-center gap-2 overflow-x-auto px-1 py-2 no-scrollbar"
          >
            {CATEGORIES.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  data-category={item.id}
                  aria-pressed={index === activeIndex}
                  aria-controls="business-store-preview"
                  onClick={() => select(index)}
                  onKeyDown={(event) => {
                    if (
                      event.key === 'ArrowRight' ||
                      event.key === 'ArrowLeft'
                    ) {
                      event.preventDefault();
                      select(
                        index + (event.key === 'ArrowRight' ? 1 : -1),
                        true,
                      );
                    }
                  }}
                  className={
                    'flex min-h-11 shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-[13px] font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ' +
                    (index === activeIndex
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm shadow-blue-100'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:bg-blue-50')
                  }
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {tr(item.label)}
                </button>
              );
            })}
          </div>
          <button
            type="button"
            onClick={() => select(activeIndex + 1)}
            aria-label={tr('next')}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-orange-300 hover:text-orange-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        <div
          id="business-store-preview"
          className="grid min-w-0 gap-6 lg:grid-cols-[minmax(0,1fr)_264px]"
        >
          <div className="relative min-w-0 md:pb-3 md:pr-[132px] xl:pr-[150px]">
            <p className="sr-only" aria-live="polite">
              {tr(category.label)}: {category.store}
            </p>
            <div
              data-testid="showcase-desktop"
              data-active-category={category.id}
              className="hidden overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_16px_45px_-20px_rgba(15,23,42,0.25)] md:block"
            >
              <div className="flex items-center gap-3 border-b border-slate-200 bg-slate-50 px-4 py-2.5">
                <div className="flex gap-1" aria-hidden="true">
                  {[0, 1, 2].map((n) => (
                    <span
                      key={n}
                      className="h-1.5 w-1.5 rounded-full bg-slate-300"
                    />
                  ))}
                </div>
                <span className="flex min-w-0 flex-1 items-center justify-center gap-1.5 text-[10px] text-slate-500">
                  <Globe2 className="h-3 w-3" aria-hidden="true" />
                  <span data-store-url>{category.slug}.letzshop.store</span>
                </span>
                <span className="hidden text-[9px] font-medium text-slate-400 xl:inline">
                  {tr('illustrativeDemo')}
                </span>
              </div>
              <div className="px-4 pb-4 xl:px-5 xl:pb-5">
                <div className="flex items-center justify-between gap-2 py-4">
                  <div className="min-w-0">
                    <h3
                      data-store-name
                      className="text-lg font-extrabold tracking-tight"
                      style={{ color: category.accent }}
                    >
                      {category.store}
                    </h3>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {category.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-[10px] text-slate-500">
                    <span className="hidden xl:inline">{tr('home')}</span>
                    <span className="hidden xl:inline">{tr('shop')}</span>
                    <Search className="h-4 w-4" aria-hidden="true" />
                    <ShoppingBag className="h-4 w-4" aria-hidden="true" />
                  </div>
                </div>
                <div
                  className="relative grid min-h-[154px] grid-cols-[1.1fr_1fr] overflow-hidden rounded-xl px-5 py-5 xl:px-7"
                  style={{ backgroundColor: category.surface }}
                >
                  <div className="relative z-10 flex flex-col items-start justify-center">
                    <span
                      className="text-[9px] font-bold uppercase tracking-[.15em]"
                      style={{ color: category.accent }}
                    >
                      {category.collections[0]}
                    </span>
                    <h4 className="mt-2 max-w-[260px] text-[25px] font-extrabold leading-tight tracking-tight text-slate-900 xl:text-[29px]">
                      {category.headline}
                    </h4>
                    <span
                      className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-[10px] font-bold text-white"
                      style={{ backgroundColor: category.accent }}
                    >
                      {tr('shopCollection')}
                      <ArrowRight className="h-3 w-3" aria-hidden="true" />
                    </span>
                  </div>
                  <div
                    className="relative flex items-center justify-center"
                    aria-hidden="true"
                  >
                    <div className="absolute h-32 w-32 rounded-full bg-white/60" />
                    <div className="absolute left-[5%] top-2 h-[95px] w-[95px] -rotate-12 rounded-2xl border border-white bg-white/60 p-2 shadow-sm">
                      <ProductArt category={category} index={1} />
                    </div>
                    <div className="relative ml-9 h-[128px] w-[128px] rotate-6 rounded-2xl border border-white bg-white/90 p-2 shadow-sm">
                      <ProductArt category={category} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 py-3">
                  <span className="mr-1 text-[10px] font-semibold text-slate-400">
                    {tr('collections')}
                  </span>
                  {category.collections.map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-slate-200 px-2.5 py-1 text-[9px] font-medium text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {category.products.map((_, index) => productCard(index))}
                </div>
              </div>
            </div>

            <div
              data-testid="showcase-mobile"
              data-active-category={category.id}
              className="relative mx-auto w-full max-w-[350px] rounded-[32px] border-[5px] border-slate-800 bg-white p-2 shadow-[0_16px_40px_-18px_rgba(15,23,42,0.35)] md:absolute md:bottom-0 md:right-0 md:w-[208px] md:rounded-[27px] md:border-[4px] md:p-1.5"
            >
              <div
                className="mx-auto mb-2 h-1 w-12 rounded-full bg-slate-800 md:mb-1.5 md:h-0.5 md:w-9"
                aria-hidden="true"
              />
              <div className="overflow-hidden rounded-[20px] border border-slate-100 md:rounded-[16px]">
                <div className="flex items-center justify-between gap-2 px-3 py-3 md:px-2 md:py-2.5">
                  <Menu
                    className="h-4 w-4 shrink-0 md:h-3 md:w-3"
                    aria-hidden="true"
                  />
                  <h3
                    data-store-name
                    className="min-w-0 text-sm font-extrabold md:text-[11px]"
                    style={{ color: category.accent }}
                  >
                    {category.store}
                  </h3>
                  <ShoppingBag
                    className="h-4 w-4 shrink-0 md:h-3 md:w-3"
                    aria-hidden="true"
                  />
                </div>
                <div
                  className="relative overflow-hidden px-4 py-5 md:px-3 md:py-3"
                  style={{ backgroundColor: category.surface }}
                >
                  <div
                    className="absolute -bottom-1 -right-3 h-28 w-28 opacity-35 md:h-20 md:w-20"
                    aria-hidden="true"
                  >
                    <ProductArt category={category} />
                  </div>
                  <p className="relative max-w-[190px] text-[24px] font-extrabold leading-tight tracking-tight text-slate-900 md:max-w-[140px] md:text-[20px]">
                    {category.headline}
                  </p>
                  <span
                    className="relative mt-3 inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-[10px] font-semibold text-white md:text-[8px]"
                    style={{ backgroundColor: category.accent }}
                  >
                    {tr('shopCollection')}
                    <ArrowRight className="h-2.5 w-2.5" aria-hidden="true" />
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-2.5 gap-y-3 p-3 md:gap-y-2 md:p-2">
                  {category.products.map((_, index) =>
                    productCard(index, true),
                  )}
                </div>
                <div className="flex items-center justify-center gap-1 border-t border-slate-100 py-2 text-[10px] text-slate-400 md:text-[8px]">
                  <Globe2 className="h-2.5 w-2.5" aria-hidden="true" />
                  {category.slug}.letzshop.store
                </div>
              </div>
            </div>
          </div>

          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_8px_30px_-20px_rgba(15,23,42,0.2)]">
            <div className="flex items-start gap-2.5 rounded-xl border border-blue-100 bg-blue-50/70 p-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white">
                <Clock3 className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-sm font-bold leading-snug text-slate-900">
                  {tr('onlineAccess')}
                </h3>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500">
                  {tr('onlineAccessDesc')}
                </p>
              </div>
            </div>
            <div className="mt-3 text-center">
              <h3 className="text-sm font-bold text-slate-900">
                {tr('scanStore')}
              </h3>
              <div className="mx-auto mt-2 flex w-fit items-center justify-center rounded-xl border border-slate-200 p-1.5">
                <IllustrativeQr label={tr('illustrativeQr')} />
              </div>
              <p className="mt-1.5 text-[10px] leading-relaxed text-slate-400">
                {tr('illustrativeQr')}
              </p>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <h3 className="text-xs font-bold text-slate-700">
                {tr('storeLink')}
              </h3>
              <div className="mt-2 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2.5">
                <Link2
                  className="h-3.5 w-3.5 shrink-0 text-blue-600"
                  aria-hidden="true"
                />
                <code
                  data-testid="showcase-store-link"
                  className="min-w-0 break-all text-[11px] font-semibold text-slate-600"
                >
                  {category.slug}.letzshop.store
                </code>
              </div>
            </div>
            <div className="mt-3 border-t border-slate-100 pt-2.5">
              <h3 className="text-xs font-bold text-slate-700">
                {tr('shareStore')}
              </h3>
              <div
                className="mt-2 flex flex-wrap gap-2"
                aria-label={tr('sharingExamples')}
              >
                {[
                  {
                    icon: MessageCircle,
                    label: 'WhatsApp',
                    style: 'text-emerald-600 bg-emerald-50',
                  },
                  {
                    icon: Instagram,
                    label: 'Instagram',
                    style: 'text-rose-600 bg-rose-50',
                  },
                  {
                    icon: Facebook,
                    label: 'Facebook',
                    style: 'text-blue-600 bg-blue-50',
                  },
                  {
                    icon: Copy,
                    label: tr('copyLink'),
                    style: 'text-slate-600 bg-slate-100',
                  },
                ].map((item) => (
                  <span
                    key={item.label}
                    title={item.label}
                    aria-label={item.label}
                    role="img"
                    className={
                      'flex h-9 w-9 items-center justify-center rounded-lg ' +
                      item.style
                    }
                  >
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                ))}
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-slate-400">
                {tr('sharingExamples')}
              </p>
            </div>
          </aside>
        </div>

        <div
          className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4"
          data-testid="showcase-benefits"
        >
          {benefits.map((item) => (
            <div
              key={item.title}
              className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white p-4"
            >
              <span
                className={
                  'flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ' +
                  item.colour
                }
              >
                <item.icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <h3 className="text-[15px] font-bold leading-snug text-slate-900">
                  {tr(item.title)}
                </h3>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-500">
                  {tr(item.desc)}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
