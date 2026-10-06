import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Search, Filter, ArrowLeft, ShoppingBag } from 'lucide-react';
import { useCart } from '../../../context/CartContext';
import { ThemeWrapper } from '../../../components/ThemeWrapper';
import { StoreHeader } from '../../../components/StoreHeader';
import { StoreFooter } from '../../../components/StoreFooter';
import { formatPaise } from '@simply/ui';

export default function StoreSearchPage() {
  const router = useRouter();
  const { slug, q, category } = router.query;
  const { api, setStoreId } = useCart();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState(q ? String(q) : '');
  const [selectedCategory, setSelectedCategory] = useState(category ? String(category) : '');
  const [sortBy, setSortBy] = useState<'featured' | 'price_asc' | 'price_desc'>('featured');

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

  const filteredProducts = products
    .filter((p) => {
      const title = p.name || p.title || '';
      const matchSearch =
        !searchTerm.trim() ||
        title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.description && p.description.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat =
        !selectedCategory ||
        p.categoryId === selectedCategory ||
        p.category?.name?.toLowerCase() === selectedCategory.toLowerCase();
      return matchSearch && matchCat;
    })
    .sort((a, b) => {
      const aPrice = a.basePricePaise ?? a.variants?.[0]?.pricePaise ?? 0;
      const bPrice = b.basePricePaise ?? b.variants?.[0]?.pricePaise ?? 0;
      if (sortBy === 'price_asc') return aPrice - bPrice;
      if (sortBy === 'price_desc') return bPrice - aPrice;
      return 0;
    });

  if (loading || !storeData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
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
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href={`/store/${slug}`} className="hover:text-gray-900 flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Storefront
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800">All Products</span>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Explore Catalog</h1>
          <p className="text-xs text-gray-500">
            Showing {filteredProducts.length} items from {store.name}
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              placeholder="Search by keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Category Dropdown */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
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
              className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="featured">Featured / Default</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
          </div>
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center space-y-3">
            <Search className="w-10 h-10 text-gray-300 mx-auto" />
            <h3 className="text-base font-semibold text-gray-800">No matching products found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto">
              Try adjusting your search terms or clearing the selected category filter.
            </p>
            <button
              onClick={() => {
                setSearchTerm('');
                setSelectedCategory('');
              }}
              className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredProducts.map((p) => {
              const title = p.name || p.title || 'Product';
              const primaryVariant = p.variants?.[0];
              const pricePaise = p.basePricePaise ?? primaryVariant?.pricePaise ?? 0;
              const comparePaise = p.compareAtPricePaise ?? primaryVariant?.compareAtPricePaise;
              const primaryMedia = p.media?.find((m: any) => m.isPrimary) || p.media?.[0];
              const coverImage =
                primaryMedia?.publicUrl ||
                (primaryMedia?.storageKey ? `/media/file/${primaryMedia.storageKey}` : undefined) ||
                p.images?.[0]?.url ||
                '';
              return (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col group"
                >
                  <Link
                    href={`/store/${slug}/product/${p.id}`}
                    className="block relative aspect-square bg-gray-100 overflow-hidden"
                  >
                    <img
                      src={coverImage}
                      alt={title}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                  </Link>

                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      {p.category?.name && (
                        <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide block mb-1">
                          {p.category.name}
                        </span>
                      )}
                      <Link
                        href={`/store/${slug}/product/${p.id}`}
                        className="font-bold text-sm text-gray-900 hover:text-emerald-700 transition line-clamp-2"
                      >
                        {title}
                      </Link>
                    </div>

                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                      <div>
                        <div className="font-mono font-bold text-sm text-gray-900">
                          {formatPaise(pricePaise)}
                        </div>
                        {comparePaise && (
                          <div className="text-[11px] text-gray-400 font-mono line-through">
                            {formatPaise(comparePaise)}
                          </div>
                        )}
                      </div>

                      <Link
                        href={`/store/${slug}/product/${p.id}`}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold text-white shadow-sm transition hover:opacity-90"
                        style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
                      >
                        View
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <StoreFooter store={store} />
    </ThemeWrapper>
  );
}
