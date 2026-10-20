import React, { useState, useRef } from 'react';
import { ChevronLeft, ChevronRight, Share2, QrCode, MessageCircle, ExternalLink, Check, Copy, ShoppingBag, Sparkles } from 'lucide-react';
import { useLandingI18n } from '@simply/i18n';

interface ProductItem {
  name: string;
  price: number;
  category: string;
  tag: string;
  image: string;
  rating: string;
}

interface CategoryData {
  id: string;
  labelKey: string;
  storeName: string;
  slug: string;
  tagline: string;
  bannerGradient: string;
  bannerTitle: string;
  bannerSubtitle: string;
  accentColor: string;
  accentBg: string;
  categories: string[];
  products: ProductItem[];
}

export const Screen4Categories: React.FC = () => {
  const { t } = useLandingI18n();
  const [activeCategoryId, setActiveCategoryId] = useState<string>('fashion');
  const [copiedLink, setCopiedLink] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const categoriesData: CategoryData[] = [
    {
      id: 'fashion',
      labelKey: 'landing.catFashion',
      storeName: 'Aarya Silk & Couture',
      slug: 'aaryasilk.letzshop.store',
      tagline: 'Handloom Sarees, Lehengas & Ethnic Wear',
      bannerGradient: 'from-pink-900 via-rose-800 to-amber-900',
      bannerTitle: 'Festive Banarasi & Chanderi Silks',
      bannerSubtitle: 'Artisanal weaves shipped straight from master artisans',
      accentColor: 'text-rose-600',
      accentBg: 'bg-rose-600 hover:bg-rose-700',
      categories: ['Sarees', 'Anarkalis', 'Kurtas', 'Dupattas'],
      products: [
        { name: 'Banarasi Katan Silk Saree', price: 4850, category: 'Sarees', tag: 'Bestseller', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
        { name: 'Embroidered Velvet Anarkali', price: 6200, category: 'Anarkalis', tag: 'New Arrival', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=600&auto=format&fit=crop&q=80', rating: '5.0' },
        { name: 'Handloom Chanderi Kurta Set', price: 2490, category: 'Kurtas', tag: 'Popular', image: 'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?w=600&auto=format&fit=crop&q=80', rating: '4.8' },
        { name: 'Zari Woven Festive Dupatta', price: 1750, category: 'Dupattas', tag: 'Trending', image: 'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
      ],
    },
    {
      id: 'food',
      labelKey: 'landing.catFood',
      storeName: 'Giri Organic Provisions',
      slug: 'giriorganics.letzshop.store',
      tagline: 'Farm-Fresh Spices, Cold-Pressed Oils & Forest Honey',
      bannerGradient: 'from-amber-950 via-yellow-900 to-stone-900',
      bannerTitle: 'Pure Cold-Pressed Oils & Raw Honey',
      bannerSubtitle: 'Unadulterated pantry essentials directly from certified growers',
      accentColor: 'text-amber-700',
      accentBg: 'bg-amber-600 hover:bg-amber-700',
      categories: ['Cold-Pressed Oils', 'Raw Honey', 'Organic Spices', 'Desi Ghee'],
      products: [
        { name: 'Cold-Pressed Mustard Oil (1L)', price: 340, category: 'Cold-Pressed Oils', tag: 'Wood-Pressed', image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
        { name: 'Raw Forest Wild Honey (500g)', price: 490, category: 'Raw Honey', tag: '100% Pure', image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80', rating: '5.0' },
        { name: 'Stone-Ground Turmeric Powder (250g)', price: 180, category: 'Organic Spices', tag: 'High Curcumin', image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=600&auto=format&fit=crop&q=80', rating: '4.8' },
        { name: 'Kashmiri Mongra Saffron (1g)', price: 650, category: 'Organic Spices', tag: 'Grade A', image: 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
      ],
    },
    {
      id: 'jewellery',
      labelKey: 'landing.catJewellery',
      storeName: 'Ratnam Silver & Jewels',
      slug: 'ratnamjewels.letzshop.store',
      tagline: 'Hallmarked 925 Silver, Kundan & Temple Jewels',
      bannerGradient: 'from-slate-900 via-amber-950 to-slate-950',
      bannerTitle: 'Heritage 925 Silver & Kundan Jewels',
      bannerSubtitle: 'Hallmarked craftsmanship designed for timeless celebrations',
      accentColor: 'text-amber-600',
      accentBg: 'bg-amber-600 hover:bg-amber-700',
      categories: ['Silver Jhumkas', 'Chokers', 'Kadas', 'Pendants'],
      products: [
        { name: '925 Sterling Silver Jhumkas', price: 2890, category: 'Silver Jhumkas', tag: 'Hallmarked', image: 'https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=600&auto=format&fit=crop&q=80', rating: '5.0' },
        { name: 'Kundan Choker Necklace Set', price: 5400, category: 'Chokers', tag: 'Bridal Pick', image: 'https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
        { name: 'Handcrafted Oxidised Silver Kada', price: 3750, category: 'Kadas', tag: 'Heavy Silver', image: 'https://images.unsplash.com/photo-1611591475878-8386348c3b7a?w=600&auto=format&fit=crop&q=80', rating: '4.8' },
        { name: 'Temple Art Peacock Pendant', price: 1990, category: 'Pendants', tag: 'Antique Finish', image: 'https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
      ],
    },
    {
      id: 'beauty',
      labelKey: 'landing.catBeauty',
      storeName: 'Veda Glow Botanicals',
      slug: 'vedaglow.letzshop.store',
      tagline: 'Pure Ayurvedic Serums, Kumkumadi & Rose Mists',
      bannerGradient: 'from-rose-950 via-pink-900 to-rose-900',
      bannerTitle: 'Ayurvedic Skin Radiance Elixirs',
      bannerSubtitle: 'Botanical formulations free from sulfates, parabens and silicones',
      accentColor: 'text-rose-600',
      accentBg: 'bg-rose-600 hover:bg-rose-700',
      categories: ['Facial Serums', 'Floral Mists', 'Face Masks', 'Hair Oils'],
      products: [
        { name: 'Kumkumadi Night Radiance Oil (30ml)', price: 980, category: 'Facial Serums', tag: 'Pure Saffron', image: 'https://images.unsplash.com/photo-1608248597359-2c786720072b?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
        { name: 'Kannauj Pure Steam-Distilled Rose Mist', price: 380, category: 'Floral Mists', tag: 'Hydro-Distilled', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
        { name: 'Sandalwood & Ubtan Clay Mask (100g)', price: 450, category: 'Face Masks', tag: 'Natural Detox', image: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=600&auto=format&fit=crop&q=80', rating: '4.7' },
        { name: 'Cold-Pressed Bhringraj Hair Oil (200ml)', price: 520, category: 'Hair Oils', tag: 'Root Care', image: 'https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=600&auto=format&fit=crop&q=80', rating: '4.8' },
      ],
    },
    {
      id: 'handicrafts',
      labelKey: 'landing.catHandicrafts',
      storeName: 'Hastakshar Art & Home',
      slug: 'hastakshar.letzshop.store',
      tagline: 'Artisanal Pottery, Brassware & Handloom Linen',
      bannerGradient: 'from-stone-900 via-amber-950 to-orange-950',
      bannerTitle: 'Earthy Pottery & Hand-Cast Brassware',
      bannerSubtitle: 'Slow-made home decor that breathes character into every room',
      accentColor: 'text-orange-700',
      accentBg: 'bg-orange-600 hover:bg-orange-700',
      categories: ['Clay Pottery', 'Brass Urli', 'Cotton Linen', 'Wooden Art'],
      products: [
        { name: 'Handmade Glazed Clay Teapot Set', price: 850, category: 'Clay Pottery', tag: 'Studio Made', image: 'https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
        { name: 'Engraved Brass Diya Urli (10 Inch)', price: 1650, category: 'Brass Urli', tag: 'Solid Brass', image: 'https://images.unsplash.com/photo-1606744824163-985d376605aa?w=600&auto=format&fit=crop&q=80', rating: '5.0' },
        { name: 'Hand-Blocked Cotton Linen Bedcover', price: 2190, category: 'Cotton Linen', tag: 'Vegetable Dyes', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600&auto=format&fit=crop&q=80', rating: '4.8' },
        { name: 'Carved Sheesham Wooden Coaster Set', price: 490, category: 'Wooden Art', tag: 'Solid Wood', image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80', rating: '4.7' },
      ],
    },
    {
      id: 'grocery',
      labelKey: 'landing.catGrocery',
      storeName: 'Sai Krupa Super Store',
      slug: 'saikrupa.letzshop.store',
      tagline: 'Daily Grains, Flours, Pulses & Fresh Provisions',
      bannerGradient: 'from-emerald-950 via-teal-900 to-slate-900',
      bannerTitle: 'Daily Farm Essentials & Grains',
      bannerSubtitle: 'Unpolished dals, premium rice, and stone-ground atta at direct prices',
      accentColor: 'text-emerald-700',
      accentBg: 'bg-emerald-600 hover:bg-emerald-700',
      categories: ['Whole Grains', 'Pulses & Dals', 'Basmati Rice', 'Desi Ghee'],
      products: [
        { name: 'MP Sharbati Whole Wheat Atta (5kg)', price: 320, category: 'Whole Grains', tag: 'Fresh Ground', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=600&auto=format&fit=crop&q=80', rating: '4.8' },
        { name: 'Unpolished Farm Toor Dal (1kg)', price: 195, category: 'Pulses & Dals', tag: 'High Protein', image: 'https://images.unsplash.com/photo-1585994192701-f1a505c817ea?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
        { name: 'Aged Royal Biryani Basmati Rice (5kg)', price: 680, category: 'Basmati Rice', tag: 'Extra Long', image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?w=600&auto=format&fit=crop&q=80', rating: '5.0' },
        { name: 'Pure Bilona Gir Cow A2 Ghee (500ml)', price: 850, category: 'Desi Ghee', tag: 'Vedic Method', image: 'https://images.unsplash.com/photo-1631451095765-2c91616fc9e6?w=600&auto=format&fit=crop&q=80', rating: '4.9' },
      ],
    },
  ];

  const currentCategory = categoriesData.find((c) => c.id === activeCategoryId) || categoriesData[0];

  const scrollTabs = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(`https://${currentCategory.slug}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <section id="categories" className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-blue-600" />
            <span>{t('landing.businessEyebrow')}</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 tracking-tight">
            {t('landing.businessTitle')}
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl mx-auto">
            {t('landing.businessSupporting')}
          </p>
        </div>

        {/* Category Selector Tabs with < and > Controls */}
        <div className="relative max-w-4xl mx-auto flex items-center gap-2">
          {/* Scroll Left Button */}
          <button
            type="button"
            onClick={() => scrollTabs('left')}
            aria-label="Previous categories"
            className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 items-center justify-center shadow-xs shrink-0 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Horizontally scrollable container */}
          <div
            ref={scrollContainerRef}
            className="flex-1 flex items-center gap-2.5 overflow-x-auto no-scrollbar py-2 px-1 scroll-smooth"
          >
            {categoriesData.map((cat) => {
              const isSelected = cat.id === activeCategoryId;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  type="button"
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 shrink-0 border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20 scale-[1.02]'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  {t(cat.labelKey)}
                </button>
              );
            })}
          </div>

          {/* Scroll Right Button */}
          <button
            type="button"
            onClick={() => scrollTabs('right')}
            aria-label="Next categories"
            className="hidden sm:flex w-9 h-9 rounded-full bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 items-center justify-center shadow-xs shrink-0 transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Storefront Preview Canvas */}
        <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200/90 shadow-xl overflow-hidden transition-all duration-300">
          {/* Top Browser URL & Channel Tools Bar */}
          <div className="bg-slate-50 border-b border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Store Link & Copy Action */}
            <div className="flex items-center gap-2">
              <span className="font-mono text-slate-400 text-xs">Link:</span>
              <span className="font-mono font-bold text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                https://{currentCategory.slug}
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-blue-700 hover:bg-slate-50 transition shadow-2xs font-semibold text-[11px]"
              >
                {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedLink ? 'Copied' : 'Copy'}</span>
              </button>
            </div>

            {/* Channels & QR Strip */}
            <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-emerald-700">
                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                WhatsApp Ready
              </span>
              <span className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md border border-slate-200 text-blue-700">
                <QrCode className="w-3.5 h-3.5 text-blue-600" />
                QR Code Access
              </span>
              <span className="inline-flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 text-emerald-700">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                24/7 Live Web
              </span>
            </div>
          </div>

          {/* Storefront Visual Body */}
          <div className="p-4 sm:p-8 space-y-6">
            {/* Storefront Header Mock */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  {currentCategory.storeName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">{currentCategory.tagline}</p>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700">
                  <ShoppingBag className="w-4 h-4 text-blue-600" />
                  <span>Cart (0)</span>
                </div>
              </div>
            </div>

            {/* Storefront Hero Banner */}
            <div className={`rounded-2xl p-6 sm:p-10 bg-gradient-to-r ${currentCategory.bannerGradient} text-white shadow-md relative overflow-hidden transition-all duration-300`}>
              <div className="relative z-10 max-w-lg space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-full backdrop-blur-xs inline-block">
                  Featured Catalogue 2026
                </span>
                <h4 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
                  {currentCategory.bannerTitle}
                </h4>
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                  {currentCategory.bannerSubtitle}
                </p>
                <div className="pt-2">
                  <span className="inline-block text-xs font-bold bg-white text-slate-900 px-4 py-2 rounded-xl shadow-sm">
                    Explore Storefront →
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-Category Pills Strip */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs font-bold text-slate-500 mr-1">Collections:</span>
              {currentCategory.categories.map((c, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/80"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* Product Grid (4 items) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              {currentCategory.products.map((prod, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-white border border-slate-200/80 hover:border-blue-400 hover:shadow-md transition-all duration-200 flex flex-col justify-between space-y-3 group"
                >
                  {/* Clean Demo Product Visual Asset */}
                  <div className="w-full h-40 rounded-xl bg-slate-100 border border-slate-100 relative overflow-hidden group-hover:shadow-sm transition-all">
                    <img
                      src={prod.image}
                      alt={prod.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <span className="absolute top-2 left-2 text-[10px] font-bold bg-white/95 backdrop-blur-xs text-slate-800 px-2 py-0.5 rounded-full border border-slate-200/80 shadow-xs">
                      {prod.tag}
                    </span>
                    <span className="absolute bottom-2 right-2 text-[10px] font-bold bg-white/95 backdrop-blur-xs text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200 shadow-xs">
                      ★ {prod.rating}
                    </span>
                  </div>

                  {/* Product Details */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                      {prod.category}
                    </span>
                    <h5 className="font-bold text-slate-900 text-sm leading-snug line-clamp-1">
                      {prod.name}
                    </h5>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-base font-extrabold text-slate-900">
                        ₹{prod.price.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">
                        In Stock
                      </span>
                    </div>
                  </div>

                  {/* Add to Cart Button */}
                  <button
                    type="button"
                    className="w-full py-2 rounded-xl border border-slate-300 hover:border-slate-400 text-slate-800 text-xs font-bold hover:bg-slate-50 transition shadow-2xs flex items-center justify-center gap-1.5"
                  >
                    <span>Add to Bag</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
