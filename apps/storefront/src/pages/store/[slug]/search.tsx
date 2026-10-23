import { getPublicStoreUrl } from '@simply/types';
import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, Filter, ArrowLeft, ShoppingBag, Plus, Check, Eye } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { useToast } from '../../../components/ui/Toast';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import { StoreHeader } from '../../../components/StoreHeader';
import { StoreFooter } from '../../../components/StoreFooter';
import { SafeImage } from '../../../components/ui/SafeImage';
import { formatPaise } from '@simply/ui';
import { useStorefrontI18n } from '@simply/i18n';
import { getProductTranslation } from '../../../utils/productTranslation';

export default function StoreSearchPage() {
  const router = useRouter();
  const { slug, q, category, preview, embedded } = router.query;
  const { api, setStoreId, addItem } = useCart();
  const { locale, t } = useStorefrontI18n();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(q ? String(q) : '');
  const [selectedCategory, setSelectedCategory] = useState(category ? String(category) : '');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const [catalogPage, setCatalogPage] = useState(1);
  const [catalogPages, setCatalogPages] = useState(1);
  const [catalogLoading, setCatalogLoading] = useState(false);
  useEffect(() => { setCatalogPage(1); }, [slug, searchTerm, selectedCategory, sortBy]);
  useEffect(() => {
    if (!slug || !storeData?.store?.id) return;
    let current = true;
    setCatalogLoading(true);
    const timer = setTimeout(() => {
      api.stores.getPublicProducts(String(slug), { page: catalogPage, limit: 20, q: searchTerm, category: selectedCategory || undefined, sort: sortBy, previewSecret: preview ? String(preview) : undefined }).then((res: any) => {
        if (current) { setProducts(res.products); setCatalogPages(res.pagination.totalPages || 1); }
      }).catch((error: any) => { if (current) toast.error('Could not load products', error.message); }).finally(() => { if (current) setCatalogLoading(false); });
    }, 250);
    return () => { current = false; clearTimeout(timer); };
  }, [slug, storeData?.store?.id, searchTerm, selectedCategory, sortBy, catalogPage, preview]);

  const isPreviewMode = Boolean(
    storeData?.isPreview ||
    preview === 'true' ||
    (typeof window !== 'undefined' && sessionStorage.getItem('simply_merchant_preview') === 'true')
  );
  const isEmbedded = embedded === 'true';

  const getLink = (path: string) => {
    const params = new URLSearchParams();
    if (isPreviewMode) params.set('preview', 'true');
    if (isEmbedded) params.set('embedded', 'true');
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  useEffect(() => {
    if (!slug) return;
    loadStore();
  }, [slug]);

  useEffect(() => {
    if (q) setSearchTerm(String(q));
    if (category) setSelectedCategory(String(category));
  }, [q, category]);

  const loadStore = async () => {
    setLoading(true);
    try {
      const res = await api.stores.getPublicStorefront(String(slug));
      setStoreData(res);
      setProducts(res.products || []);
      setCategories(res.categories || []);
      if (res.store?.id) {
        setStoreId(res.store.id);
      }
    } catch (err) {
      console.error('Failed to load store search', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = async (e: React.MouseEvent, product: any) => {
    e.preventDefault();
    e.stopPropagation();

    let variant = product.variants?.[0];
    if (!variant?.id || variant.id.startsWith('var_')) {
      router.push(getLink(`/store/${slug}/product/${product.id}`));
      return;
    }

    setAddingId(product.id);
    try {
      const primaryMedia = product.media?.find((m: any) => m.isPrimary) || product.media?.[0];
      const primaryImg =
        primaryMedia?.publicUrl ||
        (primaryMedia?.storageKey ? `/media/file/${primaryMedia.storageKey}` : undefined) ||
        product.images?.[0]?.url;

      await addItem(variant.id, 1, {
        productId: product.id,
        productName: product.name || product.title || 'Product',
        variantName: variant.name || variant.title || 'Standard',
        pricePaise: product.basePricePaise ?? variant.pricePaise ?? 0,
        compareAtPricePaise: product.compareAtPricePaise ?? variant.compareAtPricePaise,
        imageUrl: primaryImg,
        sku: variant.sku || '',
      });

      setAddedId(product.id);
      toast.success(t('cartToast.added'));
      setTimeout(() => setAddedId(null), 2200);
    } catch (err: any) {
      toast.error('Could Not Add Item', err?.message || 'Failed to add item to cart');
    } finally {
      setAddingId(null);
    }
  };

  const filteredProducts = products;

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--store-surface)] store-surface">
        <div className="w-8 h-8 border-4 border-[var(--store-border)] border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const { store, themeConfig } = storeData;

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>Browse Products | {store.name}</title>
      </Head>

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Breadcrumb & Title */}
        <div className="flex items-center gap-2 text-xs text-[var(--store-text-secondary)]">
          <Link href={getLink(getPublicStoreUrl(String(slug)))} className="hover:text-[var(--store-text-primary)] flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
          <span>/</span>
          <span className="font-semibold text-[var(--store-text-primary)]">All Products</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--store-text-primary)]">Explore Catalog</h1>
          <p className="text-xs text-[var(--store-text-secondary)] mt-1">
            Showing {filteredProducts.length} items from {store.name}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-[var(--store-surface)] store-surface p-3 rounded-xl border border-[var(--store-border)] shadow-sm">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--store-text-secondary)]" />
            <input
              type="text"
              placeholder="Search by keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-[var(--store-border)] rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-[var(--store-border)] rounded-lg bg-[var(--store-surface)] store-surface focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Categories</option>
              {categories.map((c: any) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full px-3 py-2 text-xs border border-[var(--store-border)] rounded-lg bg-[var(--store-surface)] store-surface focus:ring-2 focus:ring-emerald-500"
            >
              <option value="featured">Featured / Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-[var(--store-surface)] store-surface border border-dashed border-[var(--store-border)] rounded-2xl p-12 text-center space-y-3">
            <Search className="w-10 h-10 text-[var(--store-text-secondary)] mx-auto" />
            <h3 className="text-base font-semibold text-[var(--store-text-primary)]">No matching products found</h3>
            <p className="text-xs text-[var(--store-text-secondary)] max-w-sm mx-auto">
              Try adjusting your search terms or clearing the selected category filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              data-theme-btn="true"
              className="px-4 py-2 bg-[var(--store-button-bg)] store-inverse text-white rounded-lg text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="store-product-grid grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const trans = getProductTranslation(p.translations, locale);
              const title = trans?.name?.trim() || p.name || p.title || 'Product';
              const primaryVariant = p.variants?.[0];
              const pricePaise = p.basePricePaise ?? primaryVariant?.pricePaise ?? 0;
              const comparePaise = p.compareAtPricePaise ?? primaryVariant?.compareAtPricePaise;
              const primaryMedia = p.media?.find((m: any) => m.isPrimary) || p.media?.[0];
              const coverImage =
                primaryMedia?.publicUrl ||
                (primaryMedia?.storageKey ? `/media/file/${primaryMedia.storageKey}` : undefined) ||
                p.images?.[0]?.url ||
                '';

              const isAdding = addingId === p.id;
              const isAdded = addedId === p.id;

              return (
                <div
                  key={p.id}
                  className="bg-[var(--store-surface)] store-surface rounded-2xl border border-[var(--store-border)] overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group relative"
                >
                  <Link
                    href={getLink(`/store/${slug}/product/${p.id}`)}
                    className="block relative aspect-square bg-[var(--store-surface)] store-surface overflow-hidden"
                  >
                    <SafeImage
                      src={coverImage}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    {comparePaise && comparePaise > pricePaise && (
                      <span className="absolute top-2 left-2 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                        {Math.round(((comparePaise - pricePaise) / comparePaise) * 100)}% OFF
                      </span>
                    )}
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {p.category?.name && (
                        <span className="text-[11px] font-semibold text-[var(--store-text-secondary)] uppercase tracking-wide block mb-1">
                          {p.category.name}
                        </span>
                      )}
                      <Link
                        href={getLink(`/store/${slug}/product/${p.id}`)}
                        className="font-bold text-sm text-[var(--store-text-primary)] hover:text-emerald-700 transition line-clamp-2"
                      >
                        {title}
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-[var(--store-border)] flex items-center justify-between gap-2">
                      <div>
                        <div className="font-mono font-bold text-sm text-[var(--store-text-primary)]">
                          {formatPaise(pricePaise)}
                        </div>
                        {comparePaise && comparePaise > pricePaise && (
                          <div className="text-[11px] text-[var(--store-text-secondary)] font-mono line-through">
                            {formatPaise(comparePaise)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Interactive Add to Cart Button */}
                        <button
                          data-store-button="true"
                          onClick={(e) => handleAddToCart(e, p)}
                          disabled={isAdding}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shadow-sm flex items-center gap-1.5 hover:opacity-95 ${
                            isAdded
                              ? 'bg-emerald-700 text-white'
                              : 'text-white'
                          }`}
                          style={{
                            backgroundColor: isAdded ? '#047857' : 'var(--theme-primary, #111827)',
                          }}
                          title="Add item directly to shopping cart"
                        >
                          {isAdded ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-white" />
                              <span>Added</span>
                            </>
                          ) : isAdding ? (
                            <>
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              <span>Adding...</span>
                            </>
                          ) : (
                            <>
                              <ShoppingBag className="w-3.5 h-3.5" />
                              <span>{t('storefront.addToCart')}</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <nav className="flex items-center justify-center gap-4 py-6" aria-label={t('storefront.products')} aria-busy={catalogLoading}>
          <button type="button" className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40" disabled={catalogLoading || catalogPage <= 1} onClick={() => setCatalogPage(page => page - 1)}>{t('common.previous')}</button>
          <span className="text-sm tabular-nums">{catalogPage} / {catalogPages}</span>
          <button type="button" className="rounded-lg border px-4 py-2 text-sm disabled:opacity-40" disabled={catalogLoading || catalogPage >= catalogPages} onClick={() => setCatalogPage(page => page + 1)}>{t('common.next')}</button>
        </nav>
      </main>

      <StoreFooter store={store} themeConfig={themeConfig} />
    </ThemeWrapper>
  );
}
