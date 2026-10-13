import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  Package,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Copy,
  Trash2,
  Edit3,
  AlertTriangle,
  Layers,
  Tag,
  Check,
  X,
  ExternalLink,
  RefreshCw,
  ShieldCheck,
  ShoppingCart,
  ShoppingBag,
  Boxes,
  Info,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Layout } from '../components/Layout';
import { useAuth } from '../context/AuthContext';
import { ProductEditorDrawer } from '../components/ProductEditorDrawer';
import { TableSkeleton } from '../components/ui/Skeletons';
import { EmptyState } from '../components/ui/EmptyState';
import { SafeImage } from '../components/ui/SafeImage';
import { formatPaise } from '@simply/ui';

export default function ProductsPage() {
  const { api } = useAuth();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'products' | 'categories' | 'inventory'>('products');
  const [loading, setLoading] = useState(true);

  // Products Tab State
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Categories Tab State
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [editingCategory, setEditingCategory] = useState<any | null>(null);
  const [editCategoryName, setEditCategoryName] = useState('');
  const [editCategoryDesc, setEditCategoryDesc] = useState('');

  // Inventory Tab State
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [inventorySearch, setInventorySearch] = useState('');
  const [inventoryCategoryFilter, setInventoryCategoryFilter] = useState('');
  const [inventoryStockFilter, setInventoryStockFilter] = useState<'ALL' | 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK'>('ALL');
  const [stockModalItem, setStockModalItem] = useState<any | null>(null);
  const [stockAdjustment, setStockAdjustment] = useState<number>(0);
  const [stockReason, setStockReason] = useState<string>('RESTOCK');

  useEffect(() => {
    if (router.query.action === 'add') {
      setEditingProductId(null);
      setEditorOpen(true);
    }
    if (router.query.tab === 'inventory') {
      setActiveTab('inventory');
    }
  }, [router.query]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async (searchOverride?: string, categoryOverride?: string) => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const activeSearch = searchOverride !== undefined ? searchOverride : searchQuery;
        const activeCategory = categoryOverride !== undefined ? categoryOverride : categoryFilter;
        const [prodRes, catRes] = await Promise.all([
          api.catalog.getProducts({
            search: activeSearch.trim() || undefined,
            categoryId: activeCategory || undefined,
          }),
          api.catalog.getCategories(),
        ]);
        setProducts(prodRes?.items || prodRes || []);
        setCategories(catRes || []);
      } else if (activeTab === 'categories') {
        const catRes = await api.catalog.getCategories();
        setCategories(catRes || []);
      } else if (activeTab === 'inventory') {
        const [invRes, catRes] = await Promise.all([
          api.inventory.getInventory(),
          api.catalog.getCategories(),
        ]);
        setInventoryList(invRes || []);
        setCategories(catRes || []);
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData(searchQuery, categoryFilter);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    loadData('', categoryFilter);
  };

  const handleResetAllFilters = () => {
    setSearchQuery('');
    setCategoryFilter('');
    setStockFilter('ALL');
    loadData('', '');
  };

  const displayedProducts = products.filter((p) => {
    if (stockFilter === 'ALL') return true;
    const totalStock =
      p.variants && p.variants.length > 0
        ? p.variants.reduce(
            (acc: number, v: any) =>
              acc + (v.inventory?.stockOnHand ?? v.inventory?.availableQuantity ?? 0),
            0
          )
        : 0;
    if (stockFilter === 'OUT_OF_STOCK') return totalStock <= 0;
    if (stockFilter === 'LOW_STOCK') return totalStock > 0 && totalStock < 5;
    if (stockFilter === 'IN_STOCK') return totalStock >= 5;
    return true;
  });

  const handleDuplicate = async (id: string) => {
    try {
      await api.catalog.duplicateProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to duplicate product');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to archive this product?')) return;
    try {
      await api.catalog.deleteProduct(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete product');
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      await api.catalog.createCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      });
      setNewCategoryName('');
      setNewCategoryDesc('');
      setShowAddCategoryModal(false);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    }
  };

  const handleUpdateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory || !editCategoryName.trim()) return;
    try {
      await api.catalog.updateCategory(editingCategory.id, {
        name: editCategoryName.trim(),
        description: editCategoryDesc.trim() || undefined,
      });
      setEditingCategory(null);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update category');
    }
  };

  const handleDeleteCategory = async (cat: any) => {
    const count = cat._count?.products ?? 0;
    const confirmMsg =
      count > 0
        ? `Delete category "${cat.name}"? The ${count} product(s) in this category will become Uncategorized, but will NOT be deleted.`
        : `Are you sure you want to delete category "${cat.name}"?`;
    if (!confirm(confirmMsg)) return;
    try {
      await api.catalog.deleteCategory(cat.id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  const displayedInventory = inventoryList.filter((inv) => {
    if (inventoryCategoryFilter) {
      if (inventoryCategoryFilter === 'uncategorized') {
        if (inv.categoryId) return false;
      } else {
        if (inv.categoryId !== inventoryCategoryFilter) return false;
      }
    }
    const q = inventorySearch.toLowerCase().trim();
    if (q) {
      const matchName = (inv.productName || '').toLowerCase().includes(q);
      const matchSku = (inv.sku || '').toLowerCase().includes(q);
      const matchVariant = (inv.variantTitle || '').toLowerCase().includes(q);
      const matchCategory = (inv.categoryName || '').toLowerCase().includes(q);
      if (!matchName && !matchSku && !matchVariant && !matchCategory) return false;
    }
    const avail = inv.availableQuantity ?? inv.stockOnHand ?? 0;
    if (inventoryStockFilter === 'OUT_OF_STOCK') return avail <= 0;
    if (inventoryStockFilter === 'LOW_STOCK') return avail > 0 && avail < 5;
    if (inventoryStockFilter === 'IN_STOCK') return avail >= 5;
    return true;
  });

  const handleAdjustStock = async () => {
    if (!stockModalItem || stockAdjustment < 0) return;
    try {
      const targetId = stockModalItem.variantId || stockModalItem.id;
      await api.inventory.adjustStock(targetId, stockAdjustment, stockReason);
      setStockModalItem(null);
      setStockAdjustment(0);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to adjust stock');
    }
  };

  return (
    <Layout title="Products & Catalog">
      <Head>
        <title>Products & Catalog | Simply Seller</title>
      </Head>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-[var(--merchant-text)] tracking-tight">
              Products & Catalog
            </h1>
            <p className="text-xs sm:text-sm text-[var(--merchant-text-muted)] mt-0.5">
              Manage your showcase, colour/size variant matrix, and stock inventory
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingProductId(null);
                setEditorOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[var(--merchant-border)] gap-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-[var(--merchant-primary)] text-[var(--merchant-primary)]'
                : 'border-transparent text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]'
            }`}
          >
            <Package className="w-4 h-4" />
            All Products
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-[var(--merchant-primary)] text-[var(--merchant-primary)]'
                : 'border-transparent text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]'
            }`}
          >
            <Tag className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-[var(--merchant-primary)] text-[var(--merchant-primary)]'
                : 'border-transparent text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]'
            }`}
          >
            <Layers className="w-4 h-4" />
            Inventory & Stock
          </button>
        </div>

        {/* TAB 1: ALL PRODUCTS */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            {/* Search & Filter Bar */}
            <div className="space-y-3">
              <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--merchant-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search products by name or SKU..."
                    value={searchQuery}
                    onChange={(e) => {
                      const val = e.target.value;
                      setSearchQuery(val);
                      if (val === '') {
                        loadData('', categoryFilter);
                      }
                    }}
                    className="w-full pl-9 pr-8 py-2.5 border border-[var(--merchant-input-border)] rounded-xl text-xs sm:text-sm bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)]"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="absolute right-2.5 top-2.5 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] p-0.5 rounded-md transition"
                      title="Clear search"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <select
                  value={categoryFilter}
                  onChange={(e) => {
                    const val = e.target.value;
                    setCategoryFilter(val);
                    loadData(searchQuery, val);
                  }}
                  className="px-3 py-2 border border-[var(--merchant-input-border)] rounded-xl text-xs sm:text-sm bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)] cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="uncategorized">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                <button
                  type="submit"
                  className="px-4 py-2.5 bg-[var(--merchant-surface-raised)] border border-[var(--merchant-border)] text-[var(--merchant-text)] rounded-xl text-xs font-semibold hover:bg-[var(--merchant-surface-muted)] transition"
                >
                  Search
                </button>

                {(searchQuery || categoryFilter || stockFilter !== 'ALL') && (
                  <button
                    type="button"
                    onClick={handleResetAllFilters}
                    className="px-3.5 py-2.5 border border-[var(--merchant-border)] text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] rounded-xl text-xs font-semibold hover:bg-[var(--merchant-surface-muted)] transition flex items-center justify-center gap-1.5"
                    title="Reset all filters"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                )}
              </form>

              {/* Quick Stock Filters */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                {[
                  { id: 'ALL', label: 'All Products' },
                  { id: 'IN_STOCK', label: 'In Stock' },
                  { id: 'LOW_STOCK', label: 'Low Stock (< 5)' },
                  { id: 'OUT_OF_STOCK', label: 'Out of Stock' },
                ].map((pill) => (
                  <button
                    key={pill.id}
                    type="button"
                    onClick={() => setStockFilter(pill.id as any)}
                    className={`px-3 py-1 rounded-full font-medium transition text-xs border ${
                      stockFilter === pill.id
                        ? 'bg-[var(--merchant-primary)] text-white border-[var(--merchant-primary)] shadow-xs'
                        : 'bg-[var(--merchant-surface)] text-[var(--merchant-text-secondary)] border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)]'
                    }`}
                  >
                    {pill.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Products Table */}
            {loading ? (
              <TableSkeleton columns={7} rows={4} />
            ) : products.length === 0 ? (
              searchQuery || categoryFilter ? (
                <div className="p-8 text-center bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl">
                  <Package className="w-8 h-8 text-[var(--merchant-text-muted)] mx-auto mb-2 opacity-50" />
                  <h4 className="font-bold text-[var(--merchant-text)] text-sm mb-1">
                    No products match your filters
                  </h4>
                  <p className="text-xs text-[var(--merchant-text-muted)] mb-3">
                    Try clearing your search query or selecting a different category.
                  </p>
                  <button
                    onClick={handleResetAllFilters}
                    className="px-4 py-2 bg-[var(--merchant-surface-raised)] border border-[var(--merchant-border)] text-[var(--merchant-text)] rounded-xl text-xs font-semibold hover:bg-[var(--merchant-surface-muted)] transition"
                  >
                    Clear All Filters
                  </button>
                </div>
              ) : (
                <EmptyState
                  icon={Package}
                  title="No products in catalog"
                  description="Get started by adding your first product with photography, colour & size variants, and pricing."
                  actionText="Add Product"
                  onAction={() => {
                    setEditingProductId(null);
                    setEditorOpen(true);
                  }}
                />
              )
            ) : displayedProducts.length === 0 ? (
              <div className="p-8 text-center bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl">
                <Package className="w-8 h-8 text-[var(--merchant-text-muted)] mx-auto mb-2 opacity-50" />
                <h4 className="font-bold text-[var(--merchant-text)] text-sm mb-1">
                  No products with this stock status
                </h4>
                <p className="text-xs text-[var(--merchant-text-muted)] mb-3">
                  No products matched the current stock status filter.
                </p>
                <button
                  onClick={() => setStockFilter('ALL')}
                  className="px-4 py-2 bg-[var(--merchant-surface-raised)] border border-[var(--merchant-border)] text-[var(--merchant-text)] rounded-xl text-xs font-semibold hover:bg-[var(--merchant-surface-muted)] transition"
                >
                  Show All Products
                </button>
              </div>
            ) : (
                <div className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-[var(--merchant-surface-muted)] border-b border-[var(--merchant-border)] text-[var(--merchant-text-muted)] font-semibold uppercase tracking-wider">
                        <tr>
                          <th className="py-3 px-4">Product Details</th>
                          <th className="py-3 px-4">Category</th>
                          <th className="py-3 px-4">Price / MRP</th>
                          <th className="py-3 px-4">Stock</th>
                          <th className="py-3 px-4">Variants</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--merchant-border)]">
                        {displayedProducts.map((p) => {
                          const coverImg =
                            p.media?.[0]?.publicUrl ||
                            p.images?.[0]?.url ||
                            null;
                          const variantCount = p.variants?.length || 0;

                          // Calculate total stock across all variants
                          const totalStock =
                            p.variants && p.variants.length > 0
                              ? p.variants.reduce(
                                  (acc: number, v: any) =>
                                    acc + (v.inventory?.stockOnHand ?? v.inventory?.availableQuantity ?? 0),
                                  0
                                )
                              : 0;

                          const basePaise = p.variants?.[0]?.pricePaise ?? p.basePricePaise ?? 0;
                          const comparePaise = p.variants?.[0]?.compareAtPricePaise ?? p.compareAtPricePaise;

                          const isOutOfStock = totalStock <= 0;
                          const isLowStock = totalStock > 0 && totalStock < 5;

                          return (
                            <tr key={p.id} className="hover:bg-[var(--merchant-surface-muted)] transition">
                              {/* Product Column */}
                              <td className="py-3.5 px-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-12 h-12 rounded-xl overflow-hidden bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] shrink-0 flex items-center justify-center">
                                    {coverImg ? (
                                      <SafeImage
                                        src={coverImg}
                                        alt={p.name || p.title}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <Package className="w-5 h-5 text-[var(--merchant-text-muted)]" />
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="font-bold text-[var(--merchant-text)] truncate max-w-xs">
                                      {p.name || p.title}
                                    </div>
                                    <span className="text-[10px] text-[var(--merchant-text-muted)] font-mono">
                                      ID: {p.id.slice(0, 8)}...
                                    </span>
                                  </div>
                                </div>
                              </td>

                              {/* Category */}
                              <td className="py-3.5 px-4 text-[var(--merchant-text-secondary)]">
                                <span
                                  className={`inline-block px-2.5 py-0.5 rounded-md font-medium text-[11px] border ${
                                    p.category?.name
                                      ? 'bg-[var(--merchant-primary-soft)] text-[var(--merchant-primary)] border-[var(--merchant-primary)]/20'
                                      : 'bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border-[var(--merchant-border)]'
                                  }`}
                                >
                                  {p.category?.name || 'Uncategorized'}
                                </span>
                              </td>

                            {/* Price / MRP */}
                            <td className="py-3.5 px-4 font-mono font-bold text-[var(--merchant-text)]">
                              <div>{formatPaise(basePaise)}</div>
                              {comparePaise && (
                                <span className="text-[10px] text-[var(--merchant-text-muted)] line-through">
                                  {formatPaise(comparePaise)}
                                </span>
                              )}
                            </td>

                            {/* Stock with status color */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isOutOfStock
                                    ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20'
                                    : isLowStock
                                    ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                                    : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                }`}
                              >
                                {isOutOfStock
                                  ? 'Out of Stock'
                                  : isLowStock
                                  ? `${totalStock} Left (Low)`
                                  : `${totalStock} In Stock`}
                              </span>
                            </td>

                            {/* Variants */}
                            <td className="py-3.5 px-4 text-[var(--merchant-text-secondary)]">
                              {variantCount > 0 ? (
                                <span className="font-medium text-[11px]">
                                  {variantCount} variants
                                </span>
                              ) : (
                                <span className="text-[11px] text-[var(--merchant-text-muted)]">Single item</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[var(--merchant-surface-muted)] text-[var(--merchant-text)] border border-[var(--merchant-border)]">
                                {p.status || 'PUBLISHED'}
                              </span>
                            </td>

                            {/* Actions */}
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => {
                                    setEditingProductId(p.id);
                                    setEditorOpen(true);
                                  }}
                                  title="Edit Product"
                                  className="p-1.5 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-primary)] hover:bg-[var(--merchant-surface-raised)] rounded-lg transition"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDuplicate(p.id)}
                                  title="Duplicate Product"
                                  className="p-1.5 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] hover:bg-[var(--merchant-surface-raised)] rounded-lg transition"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  title="Archive Product"
                                  className="p-1.5 text-[var(--merchant-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: CATEGORIES */}
        {activeTab === 'categories' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <p className="text-xs text-[var(--merchant-text-muted)]">
                Organize your catalog into customer-facing collections
              </p>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-3.5 py-1.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> New Category
              </button>
            </div>

            {categories.length === 0 ? (
              <div className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl p-8 text-center space-y-3">
                <Tag className="w-8 h-8 text-[var(--merchant-text-muted)] mx-auto" />
                <h3 className="text-sm font-bold text-[var(--merchant-text)]">No categories created yet</h3>
                <p className="text-xs text-[var(--merchant-text-muted)] max-w-sm mx-auto">
                  Create categories like Sarees, Kurtas, or Accessories to group your products for easier shopping.
                </p>
                <button
                  onClick={() => setShowAddCategoryModal(true)}
                  className="px-3.5 py-1.5 bg-[var(--merchant-primary)] text-white rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" /> Create First Category
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {categories.map((c) => (
                  <div
                    key={c.id}
                    className="bg-[var(--merchant-surface)] p-5 rounded-2xl border border-[var(--merchant-border)] shadow-xs flex flex-col justify-between gap-3 transition-colors hover:border-[var(--merchant-primary)]/40"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[var(--merchant-text)] text-sm line-clamp-1">{c.name}</span>
                        <span className="text-[10px] font-mono bg-[var(--merchant-surface-muted)] px-2 py-0.5 rounded text-[var(--merchant-text-secondary)] border border-[var(--merchant-border)] shrink-0">
                          {c._count?.products ?? 0} {c._count?.products === 1 ? 'item' : 'items'}
                        </span>
                      </div>
                      <p className="text-xs text-[var(--merchant-text-muted)] line-clamp-2 min-h-[2rem]">
                        {c.description || 'No description provided.'}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-[var(--merchant-border)] flex items-center justify-between gap-2 text-xs">
                      <button
                        onClick={() => {
                          setCategoryFilter(c.id);
                          setActiveTab('products');
                          loadData(searchQuery, c.id);
                        }}
                        className="text-[11px] font-semibold text-[var(--merchant-primary)] hover:underline flex items-center gap-1"
                      >
                        <Package className="w-3 h-3" />
                        View Products
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingCategory(c);
                            setEditCategoryName(c.name);
                            setEditCategoryDesc(c.description || '');
                          }}
                          className="p-1.5 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] hover:bg-[var(--merchant-surface-muted)] rounded-lg transition"
                          title="Edit Category"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDeleteCategory(c)}
                          className="p-1.5 text-[var(--merchant-text-muted)] hover:text-rose-500 hover:bg-rose-500/10 rounded-lg transition"
                          title="Delete Category"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <div className="space-y-5">
            {/* Explanatory Header Banner */}
            <div className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl p-4 sm:p-5 shadow-xs transition-colors">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-sm sm:text-base font-bold text-[var(--merchant-text)]">
                        Live Stock & Anti-Overselling Guard
                      </h2>
                      <span className="px-2 py-0.5 text-[10px] font-semibold tracking-wide uppercase rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        Atomic Protection Active
                      </span>
                    </div>
                    <p className="text-xs text-[var(--merchant-text-muted)] mt-1 max-w-2xl leading-relaxed">
                      Real-time inventory ledger protecting your store against overselling. When shoppers start checkout, items are reserved atomically so two buyers cannot purchase the same last unit during flash sales or high traffic.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <button
                    onClick={() => loadData()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] text-[var(--merchant-text-secondary)] border border-[var(--merchant-border)] rounded-xl text-xs font-semibold transition"
                    title="Refresh stock levels"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Refresh
                  </button>
                </div>
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-[var(--merchant-border)]">
                <div className="p-3 bg-[var(--merchant-surface-muted)]/50 rounded-xl border border-[var(--merchant-border)]">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--merchant-text-muted)] font-semibold flex items-center gap-1.5">
                    <Boxes className="w-3.5 h-3.5 text-blue-500" />
                    Available to Sell
                  </div>
                  <div className="text-lg font-bold font-mono text-[var(--merchant-text)] mt-1">
                    {inventoryList.reduce((acc, i) => acc + (i.availableQuantity ?? i.stockOnHand ?? 0), 0)}
                  </div>
                  <div className="text-[10px] text-[var(--merchant-text-muted)]">Unreserved stock on hand</div>
                </div>

                <div className="p-3 bg-[var(--merchant-surface-muted)]/50 rounded-xl border border-[var(--merchant-border)]">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--merchant-text-muted)] font-semibold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    Reserved in Orders
                  </div>
                  <div className="text-lg font-bold font-mono text-amber-500 mt-1">
                    {inventoryList.reduce((acc, i) => acc + (i.reservedQuantity ?? i.stockReserved ?? 0), 0)}
                  </div>
                  <div className="text-[10px] text-[var(--merchant-text-muted)]">Held in active checkout</div>
                </div>

                <div className="p-3 bg-[var(--merchant-surface-muted)]/50 rounded-xl border border-[var(--merchant-border)]">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--merchant-text-muted)] font-semibold flex items-center gap-1.5">
                    <ShoppingCart className="w-3.5 h-3.5 text-indigo-500" />
                    In Customer Carts
                  </div>
                  <div className="text-lg font-bold font-mono text-[var(--merchant-text)] mt-1">
                    {inventoryList.reduce((acc, i) => acc + (i.inCart ?? 0), 0)}
                  </div>
                  <div className="text-[10px] text-[var(--merchant-text-muted)]">Active shopper carts</div>
                </div>

                <div className="p-3 bg-[var(--merchant-surface-muted)]/50 rounded-xl border border-[var(--merchant-border)]">
                  <div className="text-[10px] uppercase tracking-wider text-[var(--merchant-text-muted)] font-semibold flex items-center gap-1.5">
                    <ShoppingBag className="w-3.5 h-3.5 text-emerald-500" />
                    Total Units Sold
                  </div>
                  <div className="text-lg font-bold font-mono text-[var(--merchant-text)] mt-1">
                    {inventoryList.reduce((acc, i) => acc + (i.totalSold ?? 0), 0)}
                  </div>
                  <div className="text-[10px] text-[var(--merchant-text-muted)]">Purchased to date</div>
                </div>
              </div>
            </div>

            {/* Inventory Search & Filters */}
            <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
              <div className="flex flex-col sm:flex-row gap-2.5 flex-1 max-w-xl">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-[var(--merchant-text-muted)]" />
                  <input
                    type="text"
                    placeholder="Search by product name, variant, or SKU..."
                    value={inventorySearch}
                    onChange={(e) => setInventorySearch(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl text-xs placeholder:text-[var(--merchant-text-muted)] focus:outline-none focus:border-[var(--merchant-primary)]"
                  />
                  {inventorySearch && (
                    <button
                      onClick={() => setInventorySearch('')}
                      className="absolute right-2.5 top-2.5 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)]"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                <select
                  value={inventoryCategoryFilter}
                  onChange={(e) => setInventoryCategoryFilter(e.target.value)}
                  className="px-3 py-2 border border-[var(--merchant-input-border)] rounded-xl text-xs bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)] cursor-pointer"
                >
                  <option value="">All Categories</option>
                  <option value="uncategorized">Uncategorized</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>

                {(inventorySearch || inventoryCategoryFilter || inventoryStockFilter !== 'ALL') && (
                  <button
                    onClick={() => {
                      setInventorySearch('');
                      setInventoryCategoryFilter('');
                      setInventoryStockFilter('ALL');
                    }}
                    className="px-2.5 py-2 border border-[var(--merchant-border)] text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] rounded-xl text-xs font-semibold hover:bg-[var(--merchant-surface-muted)] transition flex items-center justify-center gap-1"
                    title="Reset filters"
                  >
                    <RefreshCw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Status pills */}
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {(['ALL', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK'] as const).map((filterKey) => {
                  const label =
                    filterKey === 'ALL'
                      ? 'All Items'
                      : filterKey === 'IN_STOCK'
                      ? 'In Stock'
                      : filterKey === 'LOW_STOCK'
                      ? 'Low Stock (< 5)'
                      : 'Out of Stock';
                  const active = inventoryStockFilter === filterKey;
                  return (
                    <button
                      key={filterKey}
                      onClick={() => setInventoryStockFilter(filterKey)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                        active
                          ? 'bg-[var(--merchant-primary)] text-white border-[var(--merchant-primary)] shadow-xs'
                          : 'bg-[var(--merchant-surface)] text-[var(--merchant-text-secondary)] border-[var(--merchant-border)] hover:bg-[var(--merchant-surface-muted)]'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Table */}
            <div className="bg-[var(--merchant-surface)] border border-[var(--merchant-border)] rounded-2xl shadow-xs overflow-hidden transition-colors">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-[var(--merchant-surface-muted)] border-b border-[var(--merchant-border)] text-[var(--merchant-text-muted)] font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3.5 px-4">Product & Item</th>
                      <th className="py-3.5 px-4">SKU</th>
                      <th className="py-3.5 px-4">Available to Sell</th>
                      <th className="py-3.5 px-4">Reserved (In Orders)</th>
                      <th className="py-3.5 px-4 text-center">In Carts</th>
                      <th className="py-3.5 px-4 text-center">Units Sold</th>
                      <th className="py-3.5 px-4 text-right">Quick Restock</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--merchant-border)]">
                    {displayedInventory.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-[var(--merchant-text-muted)]">
                          <p className="font-semibold">No inventory records matching your filter.</p>
                          {(inventorySearch || inventoryCategoryFilter || inventoryStockFilter !== 'ALL') && (
                            <button
                              onClick={() => {
                                setInventorySearch('');
                                setInventoryCategoryFilter('');
                                setInventoryStockFilter('ALL');
                              }}
                              className="mt-2 text-xs text-[var(--merchant-primary)] hover:underline font-semibold"
                            >
                              Reset filters
                            </button>
                          )}
                        </td>
                      </tr>
                    ) : (
                      displayedInventory.map((inv) => {
                        const avail = inv.availableQuantity ?? inv.stockOnHand ?? 0;
                        const reserved = inv.reservedQuantity ?? inv.stockReserved ?? 0;
                        const isOutOfStock = avail <= 0;
                        const isLowStock = avail > 0 && avail < 5;

                        return (
                          <tr key={inv.id} className="hover:bg-[var(--merchant-surface-muted)]/50 transition-colors">
                            {/* Product & Variant */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] overflow-hidden shrink-0 flex items-center justify-center">
                                  {inv.productImage ? (
                                    <SafeImage
                                      src={inv.productImage}
                                      alt={inv.productName || 'Product'}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <Package className="w-5 h-5 text-[var(--merchant-text-muted)]" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-[var(--merchant-text)] line-clamp-1">
                                    {inv.productName || 'Unnamed Product'}
                                  </div>
                                  <div className="text-[11px] text-[var(--merchant-text-secondary)] mt-0.5 flex flex-wrap items-center gap-1.5">
                                    <span className="inline-block px-1.5 py-0.2 rounded bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)] text-[10px]">
                                      {inv.variantTitle || 'Standard / Default'}
                                    </span>
                                    {inv.categoryName ? (
                                      <span className="inline-block px-1.5 py-0.2 rounded bg-[var(--merchant-primary)]/10 text-[var(--merchant-primary)] border border-[var(--merchant-primary)]/20 text-[10px] font-semibold">
                                        {inv.categoryName}
                                      </span>
                                    ) : (
                                      <span className="inline-block px-1.5 py-0.2 rounded bg-[var(--merchant-surface-muted)] text-[var(--merchant-text-muted)] border border-[var(--merchant-border)] text-[10px]">
                                        Uncategorized
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* SKU */}
                            <td className="py-3.5 px-4 font-mono text-[var(--merchant-text)]">
                              <span className="px-2 py-0.5 rounded bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] text-[11px] font-semibold">
                                {inv.sku && inv.sku !== inv.variantId ? inv.sku : (inv.sku?.substring(0, 8) || 'N/A')}
                              </span>
                            </td>

                            {/* Available Stock */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-sm text-[var(--merchant-text)]">
                                  {avail}
                                </span>
                                {isOutOfStock ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                                    Out
                                  </span>
                                ) : isLowStock ? (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                    Low
                                  </span>
                                ) : (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                    In Stock
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Reserved */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-1.5">
                                <span className={`font-mono font-semibold ${reserved > 0 ? 'text-amber-500' : 'text-[var(--merchant-text-muted)]'}`}>
                                  {reserved}
                                </span>
                                {reserved > 0 && (
                                  <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title="Locked by active orders/checkout">
                                    Locked
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* In Carts */}
                            <td className="py-3.5 px-4 text-center font-mono text-[var(--merchant-text-secondary)]">
                              <span className="inline-flex items-center gap-1">
                                <ShoppingCart className="w-3 h-3 text-[var(--merchant-text-muted)]" />
                                {inv.inCart ?? 0}
                              </span>
                            </td>

                            {/* Units Sold */}
                            <td className="py-3.5 px-4 text-center font-mono font-semibold text-[var(--merchant-text)]">
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <ShoppingBag className="w-3 h-3" />
                                {inv.totalSold ?? 0}
                              </span>
                            </td>

                            {/* Action */}
                            <td className="py-3.5 px-4 text-right">
                              <button
                                onClick={() => {
                                  setStockModalItem(inv);
                                  setStockAdjustment(avail);
                                }}
                                className="px-3 py-1.5 bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)] border border-[var(--merchant-border)] rounded-xl text-xs font-semibold transition"
                              >
                                Adjust Stock
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {stockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-[var(--merchant-surface)] rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl border border-[var(--merchant-border)] transition-colors">
            <div>
              <h3 className="font-bold text-[var(--merchant-text)] text-sm">Adjust Stock Level</h3>
              <p className="text-xs text-[var(--merchant-text-muted)] mt-0.5">
                Update on-hand inventory count. Database ledger records this change atomically.
              </p>
            </div>

            {/* Product card info */}
            <div className="p-3 bg-[var(--merchant-surface-muted)] rounded-xl border border-[var(--merchant-border)] flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[var(--merchant-surface)] border border-[var(--merchant-border)] overflow-hidden shrink-0 flex items-center justify-center">
                {stockModalItem.productImage ? (
                  <SafeImage
                    src={stockModalItem.productImage}
                    alt={stockModalItem.productName || 'Product'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-5 h-5 text-[var(--merchant-text-muted)]" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-xs text-[var(--merchant-text)] truncate">
                  {stockModalItem.productName || 'Product'}
                </div>
                <div className="text-[11px] text-[var(--merchant-text-muted)] flex items-center gap-2 mt-0.5">
                  <span>{stockModalItem.variantTitle || 'Default Variant'}</span>
                  <span>•</span>
                  <span className="font-mono font-semibold">{stockModalItem.sku || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Stock counts overview */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-lg bg-[var(--merchant-surface-muted)]/50 border border-[var(--merchant-border)]">
                <span className="text-[var(--merchant-text-muted)] block text-[10px] uppercase font-semibold">Current Available</span>
                <span className="font-mono font-bold text-base text-[var(--merchant-text)]">
                  {stockModalItem.availableQuantity ?? stockModalItem.stockOnHand ?? 0} units
                </span>
              </div>
              <div className="p-2.5 rounded-lg bg-[var(--merchant-surface-muted)]/50 border border-[var(--merchant-border)]">
                <span className="text-[var(--merchant-text-muted)] block text-[10px] uppercase font-semibold">Locked in Orders</span>
                <span className="font-mono font-bold text-base text-amber-500">
                  {stockModalItem.reservedQuantity ?? stockModalItem.stockReserved ?? 0} units
                </span>
              </div>
            </div>

            {/* Target input */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--merchant-text-secondary)]">
                  New Available Stock (On Hand)
                </label>
                <span className="text-[11px] font-mono font-semibold text-[var(--merchant-text-muted)]">
                  Change:{' '}
                  {stockAdjustment - (stockModalItem.availableQuantity ?? stockModalItem.stockOnHand ?? 0) >= 0 ? '+' : ''}
                  {stockAdjustment - (stockModalItem.availableQuantity ?? stockModalItem.stockOnHand ?? 0)}
                </span>
              </div>
              <input
                type="number"
                min="0"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl text-sm font-mono font-bold focus:border-[var(--merchant-primary)] focus:outline-none"
              />

              {/* Quick increment buttons */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className="text-[10px] text-[var(--merchant-text-muted)] mr-1">Quick Add:</span>
                {[1, 5, 10, 25, 50].map((inc) => (
                  <button
                    key={inc}
                    type="button"
                    onClick={() => setStockAdjustment((prev) => prev + inc)}
                    className="px-2 py-0.5 rounded-lg bg-[var(--merchant-surface-muted)] hover:bg-[var(--merchant-surface-raised)] text-[var(--merchant-text-secondary)] border border-[var(--merchant-border)] text-[10px] font-mono font-semibold transition"
                  >
                    +{inc}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setStockAdjustment(0)}
                  className="px-2 py-0.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-[10px] font-semibold transition ml-auto"
                >
                  Set to 0
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">Reason for Adjustment</label>
              <select
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] rounded-xl text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
              >
                <option value="RESTOCK">Supplier Restock (New Inventory Received)</option>
                <option value="CORRECTION">Inventory Audit Correction</option>
                <option value="DAMAGED">Damaged / Written Off</option>
                <option value="RETURN">Customer Return Restocked</option>
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setStockModalItem(null)}
                className="px-3 py-2 text-xs text-[var(--merchant-text-secondary)] hover:bg-[var(--merchant-surface-muted)] rounded-xl transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAdjustStock}
                className="px-4 py-2 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Save Stock Level
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateCategory}
            className="bg-[var(--merchant-surface)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-[var(--merchant-border)] transition-colors"
          >
            <h3 className="font-bold text-[var(--merchant-text)] text-sm">Create New Category</h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Silk Sarees"
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-xl text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">Description</label>
              <textarea
                rows={2}
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Optional collection description"
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-xl text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-3 py-1.5 text-xs text-[var(--merchant-text-secondary)] hover:bg-[var(--merchant-surface-muted)] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Create Category
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Category Modal */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <form
            onSubmit={handleUpdateCategory}
            className="bg-[var(--merchant-surface)] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-[var(--merchant-border)] transition-colors"
          >
            <h3 className="font-bold text-[var(--merchant-text)] text-sm">Edit Category</h3>
            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={editCategoryName}
                onChange={(e) => setEditCategoryName(e.target.value)}
                placeholder="Category name"
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-xl text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[var(--merchant-text-secondary)] mb-1">Description</label>
              <textarea
                rows={2}
                value={editCategoryDesc}
                onChange={(e) => setEditCategoryDesc(e.target.value)}
                placeholder="Optional collection description"
                className="w-full px-3 py-2 bg-[var(--merchant-input-bg)] border border-[var(--merchant-input-border)] text-[var(--merchant-text)] placeholder-[var(--merchant-text-muted)] rounded-xl text-xs focus:border-[var(--merchant-primary)] focus:outline-none"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCategory(null)}
                className="px-3 py-1.5 text-xs text-[var(--merchant-text-secondary)] hover:bg-[var(--merchant-surface-muted)] rounded-lg transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Product Drawer */}
      <ProductEditorDrawer
        isOpen={editorOpen}
        productId={editingProductId}
        onClose={() => setEditorOpen(false)}
        onSaved={() => loadData(searchQuery, categoryFilter)}
      />
    </Layout>
  );
}
