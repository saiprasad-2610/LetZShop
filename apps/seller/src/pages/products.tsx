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
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  // Categories Tab State
  const [categories, setCategories] = useState<any[]>([]);
  const [showAddCategoryModal, setShowAddCategoryModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');

  // Inventory Tab State
  const [inventoryList, setInventoryList] = useState<any[]>([]);
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

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'products') {
        const [prodRes, catRes] = await Promise.all([
          api.catalog.getProducts({
            search: searchQuery || undefined,
            categoryId: categoryFilter || undefined,
          }),
          api.catalog.getCategories(),
        ]);
        setProducts(prodRes?.items || prodRes || []);
        setCategories(catRes || []);
      } else if (activeTab === 'categories') {
        const catRes = await api.catalog.getCategories();
        setCategories(catRes || []);
      } else if (activeTab === 'inventory') {
        const invRes = await api.inventory.getInventory();
        setInventoryList(invRes || []);
      }
    } catch (err) {
      console.error('Failed to load catalog data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

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

  const handleAdjustStock = async () => {
    if (!stockModalItem || stockAdjustment === 0) return;
    try {
      await api.inventory.adjustStock(stockModalItem.id, stockAdjustment, stockReason);
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
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Products & Catalog
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage your showcase, colour/size variant matrix, and stock inventory
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingProductId(null);
                setEditorOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-200 gap-1">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'products'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Package className="w-4 h-4" />
            All Products
          </button>
          <button
            onClick={() => setActiveTab('categories')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'categories'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" />
            Categories
          </button>
          <button
            onClick={() => setActiveTab('inventory')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition flex items-center gap-2 ${
              activeTab === 'inventory'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
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
            <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-2.5">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search products by name or SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 bg-white"
                />
              </div>

              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setTimeout(() => loadData(), 50);
                }}
                className="px-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm bg-white focus:ring-2 focus:ring-blue-600"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <button
                type="submit"
                className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
              >
                Search
              </button>
            </form>

            {/* Products Table */}
            {loading ? (
              <TableSkeleton columns={7} rows={4} />
            ) : products.length === 0 ? (
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
            ) : (
              <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
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
                    <tbody className="divide-y divide-slate-100">
                      {products.map((p) => {
                        const coverImg =
                          p.images?.[0]?.url ||
                          'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=120&auto=format&fit=crop&q=80';
                        const variantCount = p.variants?.length || 0;

                        // Calculate total stock across all variants
                        const totalStock =
                          p.variants && p.variants.length > 0
                            ? p.variants.reduce(
                                (acc: number, v: any) =>
                                  acc + (v.inventory?.availableQuantity ?? 15),
                                0
                              )
                            : 20;

                        const isOutOfStock = totalStock <= 0;
                        const isLowStock = totalStock > 0 && totalStock < 5;

                        return (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition">
                            {/* Product Column */}
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 shrink-0">
                                  <SafeImage
                                    src={coverImg}
                                    alt={p.title || p.name}
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-bold text-slate-900 truncate max-w-xs">
                                    {p.title || p.name}
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">
                                    ID: {p.id.slice(0, 8)}...
                                  </span>
                                </div>
                              </div>
                            </td>

                            {/* Category */}
                            <td className="py-3.5 px-4 text-slate-600">
                              <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                                {p.category?.name || 'Uncategorized'}
                              </span>
                            </td>

                            {/* Price / MRP */}
                            <td className="py-3.5 px-4 font-mono font-bold text-slate-900">
                              <div>{formatPaise(p.basePricePaise)}</div>
                              {p.compareAtPricePaise && (
                                <span className="text-[10px] text-slate-400 line-through">
                                  {formatPaise(p.compareAtPricePaise)}
                                </span>
                              )}
                            </td>

                            {/* Stock with status color */}
                            <td className="py-3.5 px-4">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                                  isOutOfStock
                                    ? 'bg-rose-50 text-rose-700 border border-rose-200'
                                    : isLowStock
                                    ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
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
                            <td className="py-3.5 px-4 text-slate-600">
                              {variantCount > 0 ? (
                                <span className="font-medium text-[11px]">
                                  {variantCount} variants
                                </span>
                              ) : (
                                <span className="text-[11px] text-slate-400">Single item</span>
                              )}
                            </td>

                            {/* Status */}
                            <td className="py-3.5 px-4">
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
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
                                  className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                >
                                  <Edit3 className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDuplicate(p.id)}
                                  title="Duplicate Product"
                                  className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
                                >
                                  <Copy className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDelete(p.id)}
                                  title="Archive Product"
                                  className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
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
              <p className="text-xs text-slate-500">
                Organize your catalog into customer-facing collections
              </p>
              <button
                onClick={() => setShowAddCategoryModal(true)}
                className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Plus className="w-3.5 h-3.5" /> New Category
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900 text-sm">{c.name}</span>
                    <span className="text-[10px] font-mono bg-slate-100 px-2 py-0.5 rounded text-slate-600">
                      {c._count?.products ?? 0} items
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">
                    {c.description || 'No description provided.'}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY & STOCK */}
        {activeTab === 'inventory' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-500">
              Live stock levels with atomic reservation defense
            </p>

            <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Variant SKU</th>
                    <th className="py-3 px-4">Available Quantity</th>
                    <th className="py-3 px-4">Reserved (In Cart/Order)</th>
                    <th className="py-3 px-4 text-right">Quick Restock</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {inventoryList.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4 font-mono font-semibold text-slate-900">
                        {inv.sku || inv.variantId || 'General SKU'}
                      </td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-900">
                        {inv.availableQuantity ?? inv.stockOnHand ?? 0}
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-500">
                        {inv.reservedQuantity ?? inv.stockReserved ?? 0}
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => {
                            setStockModalItem(inv);
                            setStockAdjustment(10);
                          }}
                          className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-semibold transition"
                        >
                          Adjust Stock
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Stock Adjustment Modal */}
      {stockModalItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200">
            <h3 className="font-bold text-slate-900 text-sm">Adjust Inventory Stock</h3>
            <p className="text-xs text-slate-500 font-mono">
              SKU: {stockModalItem.sku || stockModalItem.id}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Quantity to Add / Subtract
              </label>
              <input
                type="number"
                value={stockAdjustment}
                onChange={(e) => setStockAdjustment(parseInt(e.target.value, 10) || 0)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Reason</label>
              <select
                value={stockReason}
                onChange={(e) => setStockReason(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs bg-white"
              >
                <option value="RESTOCK">Supplier Restock</option>
                <option value="CORRECTION">Inventory Audit Correction</option>
                <option value="DAMAGED">Damaged / Written Off</option>
                <option value="RETURN">Customer Return</option>
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setStockModalItem(null)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleAdjustStock}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Apply Adjustment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {showAddCategoryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
          <form
            onSubmit={handleCreateCategory}
            className="bg-white rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-xl border border-slate-200"
          >
            <h3 className="font-bold text-slate-900 text-sm">Create New Category</h3>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Category Name *
              </label>
              <input
                type="text"
                required
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="e.g. Silk Sarees"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={newCategoryDesc}
                onChange={(e) => setNewCategoryDesc(e.target.value)}
                placeholder="Optional collection description"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCategoryModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold"
              >
                Create Category
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
        onSaved={loadData}
      />
    </Layout>
  );
}
