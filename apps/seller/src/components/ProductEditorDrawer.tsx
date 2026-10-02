import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Image as ImageIcon,
  Check,
  ChevronDown,
  Layers,
  DollarSign,
  Tag,
  Star,
  UploadCloud,
  ArrowLeft,
  ArrowRight,
  Eye,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { formatPaise, parseRupeesToPaise } from '@simply/ui';
import { SafeImage } from './ui/SafeImage';

interface OptionTypeDraft {
  name: string;
  values: string[];
  inputValue: string;
}

interface VariantDraft {
  id?: string;
  title: string;
  optionValues: Record<string, string>;
  sku: string;
  pricePaise: number | null;
  compareAtPaise: number | null;
  inventoryQuantity: number;
  isActive: boolean;
  imageUrls: string[];
}

interface ProductEditorDrawerProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

export const ProductEditorDrawer: React.FC<ProductEditorDrawerProps> = ({
  isOpen,
  productId,
  onClose,
  onSaved,
}) => {
  const { api } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [productType, setProductType] = useState<
    'SELL_ONLINE' | 'ENQUIRY_ONLY' | 'SELL_AND_ENQUIRY'
  >('SELL_ONLINE');
  const [basePriceRupees, setBasePriceRupees] = useState('999');
  const [comparePriceRupees, setComparePriceRupees] = useState('1499');

  // Media state (list of image URLs or base64 data URLs)
  const [generalImages, setGeneralImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
  ]);
  const [isDragging, setIsDragging] = useState(false);

  // Options & Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<OptionTypeDraft[]>([
    { name: 'Colour', values: ['Navy', 'White', 'Black'], inputValue: '' },
    { name: 'Size', values: ['S', 'M', 'L', 'XL'], inputValue: '' },
  ]);
  const [variants, setVariants] = useState<VariantDraft[]>([]);

  useEffect(() => {
    if (isOpen) {
      loadCategories();
      if (productId) {
        loadProduct(productId);
      } else {
        resetForm();
      }
    }
  }, [isOpen, productId]);

  const loadCategories = async () => {
    try {
      const res = await api.catalog.getCategories();
      setCategories(res || []);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategoryId('');
    setProductType('SELL_ONLINE');
    setBasePriceRupees('999');
    setComparePriceRupees('1499');
    setGeneralImages([
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
    ]);
    setHasVariants(false);
    const initialOpts = [
      { name: 'Colour', values: ['Navy', 'White', 'Black'], inputValue: '' },
      { name: 'Size', values: ['S', 'M', 'L', 'XL'], inputValue: '' },
    ];
    setOptions(initialOpts);
    generateVariantMatrix(initialOpts, 99900, 149900);
  };

  const loadProduct = async (id: string) => {
    setLoading(true);
    try {
      const product = await api.catalog.getProduct(id);
      setTitle(product.title || product.name || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || '');
      setProductType(product.productType || product.mode || 'SELL_ONLINE');
      setBasePriceRupees(String((product.basePricePaise || 0) / 100));
      setComparePriceRupees(
        product.compareAtPricePaise ? String(product.compareAtPricePaise / 100) : ''
      );

      const imgUrls = product.images?.map((img: any) => img.url) || [];
      if (imgUrls.length > 0) {
        setGeneralImages(imgUrls);
      }

      if (product.options && product.options.length > 0) {
        setHasVariants(true);
        const mappedOptions: OptionTypeDraft[] = product.options.map((opt: any) => ({
          name: opt.name,
          values: opt.values || [],
          inputValue: '',
        }));
        setOptions(mappedOptions);

        if (product.variants && product.variants.length > 0) {
          const mappedVariants: VariantDraft[] = product.variants.map((v: any) => {
            const vImgs =
              product.images
                ?.filter((img: any) => img.variantId === v.id)
                .map((img: any) => img.url) || [];
            return {
              id: v.id,
              title: v.title,
              optionValues: v.optionValues || {},
              sku: v.sku || '',
              pricePaise: v.pricePaise,
              compareAtPaise: v.compareAtPricePaise,
              inventoryQuantity: v.inventory?.availableQuantity ?? 15,
              isActive: v.isActive ?? true,
              imageUrls: vImgs,
            };
          });
          setVariants(mappedVariants);
        }
      } else {
        setHasVariants(false);
      }
    } catch (err) {
      console.error('Failed to load product', err);
    } finally {
      setLoading(false);
    }
  };

  const generateVariantMatrix = (
    currentOptions: OptionTypeDraft[],
    defaultPricePaise = parseRupeesToPaise(Number(basePriceRupees) || 0),
    defaultComparePaise = parseRupeesToPaise(Number(comparePriceRupees) || 0)
  ) => {
    const validOptions = currentOptions.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOptions.length === 0) {
      setVariants([]);
      return;
    }

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]] as string[][]
      );
    };

    const valueArrays = validOptions.map((o) => o.values);
    const combos = cartesian(valueArrays);

    const newVariants: VariantDraft[] = combos.map((combo) => {
      const optionMap: Record<string, string> = {};
      validOptions.forEach((opt, idx) => {
        optionMap[opt.name] = combo[idx];
      });

      const titlePart = combo.join(' / ');
      const skuSlug = combo.map((v) => v.toUpperCase().replace(/\s+/g, '')).join('-');

      const existing = variants.find((v) =>
        Object.entries(optionMap).every(([k, val]) => v.optionValues[k] === val)
      );

      if (existing) {
        return existing;
      }

      return {
        title: titlePart,
        optionValues: optionMap,
        sku: `SKU-${skuSlug}-${Math.floor(100 + Math.random() * 900)}`,
        pricePaise: defaultPricePaise,
        compareAtPaise: defaultComparePaise,
        inventoryQuantity: 20,
        isActive: true,
        imageUrls: [],
      };
    });

    setVariants(newVariants);
  };

  const handleAddOptionValue = (optIndex: number) => {
    const opt = options[optIndex];
    if (!opt.inputValue.trim()) return;
    const newValues = [...opt.values, opt.inputValue.trim()];
    const updatedOptions = [...options];
    updatedOptions[optIndex] = { ...opt, values: newValues, inputValue: '' };
    setOptions(updatedOptions);
    generateVariantMatrix(updatedOptions);
  };

  const handleRemoveOptionValue = (optIndex: number, valIndex: number) => {
    const opt = options[optIndex];
    const newValues = opt.values.filter((_, idx) => idx !== valIndex);
    const updatedOptions = [...options];
    updatedOptions[optIndex] = { ...opt, values: newValues };
    setOptions(updatedOptions);
    generateVariantMatrix(updatedOptions);
  };

  const handleAddOptionType = (presetName = 'Colour') => {
    const updated = [...options, { name: presetName, values: [], inputValue: '' }];
    setOptions(updated);
  };

  const handleRemoveOptionType = (idx: number) => {
    const updated = options.filter((_, i) => i !== idx);
    setOptions(updated);
    generateVariantMatrix(updated);
  };

  // Real File Upload Handler (Drag & Drop or File Picker)
  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;
    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('image/')) {
        alert(`File ${file.name} is not an image.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`File ${file.name} exceeds 5MB limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const base64Url = e.target?.result as string;
        if (base64Url) {
          setGeneralImages((prev) => [...prev, base64Url]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const updated = [...generalImages];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setGeneralImages(updated);
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= generalImages.length) return;
    const updated = [...generalImages];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setGeneralImages(updated);
  };

  const handleRemoveImage = (index: number) => {
    setGeneralImages(generalImages.filter((_, i) => i !== index));
  };

  // Bulk Apply helpers for non-technical merchants
  const handleApplyBasePriceToAll = () => {
    const basePaise = parseRupeesToPaise(Number(basePriceRupees) || 0);
    const comparePaise = comparePriceRupees ? parseRupeesToPaise(Number(comparePriceRupees)) : null;
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        pricePaise: basePaise,
        compareAtPaise: comparePaise,
      }))
    );
  };

  const handleApplyStockToAll = (qty = 20) => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        inventoryQuantity: qty,
      }))
    );
  };

  const colourOption = options.find(
    (o) => o.name.toLowerCase() === 'colour' || o.name.toLowerCase() === 'color'
  );
  const colourValues = colourOption ? colourOption.values : [];

  const handleAssignImageToColour = (imgUrl: string, colourName: string) => {
    setVariants((prev) =>
      prev.map((v) => {
        const matchesColour = v.optionValues[colourOption?.name || 'Colour'] === colourName;
        if (matchesColour) {
          const alreadyHas = (v.imageUrls || []).includes(imgUrl);
          return {
            ...v,
            imageUrls: alreadyHas ? v.imageUrls : [...(v.imageUrls || []), imgUrl],
          };
        }
        return v;
      })
    );
    alert(`Assigned image to all ${colourName} variants.`);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      alert('Please enter a product title');
      return;
    }

    setSaving(true);
    try {
      const basePaise = parseRupeesToPaise(Number(basePriceRupees) || 0);
      const comparePaise = comparePriceRupees
        ? parseRupeesToPaise(Number(comparePriceRupees))
        : undefined;

      const payload = {
        title: title.trim(),
        description: description.trim(),
        categoryId: categoryId || undefined,
        productType,
        basePricePaise: basePaise,
        compareAtPricePaise: comparePaise,
        hasVariants,
        images: generalImages.map((url, idx) => ({
          url,
          position: idx,
          altText: `${title} view ${idx + 1}`,
        })),
        options: hasVariants
          ? options
              .filter((o) => o.values.length > 0)
              .map((o, idx) => ({
                name: o.name,
                position: idx,
                values: o.values,
              }))
          : [],
        variants: hasVariants
          ? variants.map((v) => ({
              title: v.title,
              sku: v.sku,
              pricePaise: v.pricePaise || basePaise,
              compareAtPricePaise: v.compareAtPaise || comparePaise,
              optionValues: v.optionValues,
              inventoryQuantity: Number(v.inventoryQuantity) || 0,
              isActive: v.isActive,
              images: (v.imageUrls || []).map((url, idx) => ({
                url,
                position: idx,
                altText: `${v.title} image`,
              })),
            }))
          : [],
      };

      if (productId) {
        await api.catalog.updateProduct(productId, payload);
      } else {
        await api.catalog.createProduct(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save product', err);
      alert(err.message || 'Error saving product');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="product-drawer-title"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs"
    >
      <div className="w-full max-w-3xl bg-white h-full flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div>
            <h2 id="product-drawer-title" className="text-lg font-bold text-slate-900 tracking-tight">
              {productId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-slate-500">
              Configure product details, photo uploads, variant matrix, and stock
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* SECTION 1: BASIC DETAILS */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-emerald-600" />
              <span>1. Basic Details</span>
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Classic French Linen Shirt"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="">Select Category (Optional)</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Product Purpose & Mode
                </label>
                <select
                  value={productType}
                  onChange={(e) => setProductType(e.target.value as any)}
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600 bg-white"
                >
                  <option value="SELL_ONLINE">Sell Online (Direct Checkout & Cart)</option>
                  <option value="ENQUIRY_ONLY">Enquiry Only (Request Quote & WhatsApp)</option>
                  <option value="SELL_AND_ENQUIRY">Both (Online Buy + Bulk RFQ)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Description / Story
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Handcrafted from pure natural fibers with tailored fit..."
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* SECTION 2: PRODUCT MEDIA (DRAG & DROP / FILE PICKER) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-blue-600" />
                <span>2. Media & Product Photography</span>
              </h3>
              <span className="text-[11px] text-slate-400">
                {generalImages.length} {generalImages.length === 1 ? 'image' : 'images'}
              </span>
            </div>

            {/* Drag & Drop File Upload Box */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/50'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => processFiles(e.target.files)}
                className="hidden"
              />
              <UploadCloud className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-xs sm:text-sm font-bold text-slate-800">
                Click to upload product photos, or drag & drop files here
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                PNG, JPG, WebP supported up to 5MB each. First image becomes the primary thumbnail.
              </p>
            </div>

            {/* Uploaded Photos Gallery */}
            {generalImages.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide block">
                  Uploaded Showcase Photos
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {generalImages.map((url, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-xl border border-slate-200 overflow-hidden bg-slate-50 shadow-2xs space-y-1 p-1.5"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-white relative">
                        <SafeImage
                          src={url}
                          alt={`Product view ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {idx === 0 && (
                          <span className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[9px] font-bold px-2 py-0.5 rounded shadow-xs flex items-center gap-1">
                            <Star className="w-2.5 h-2.5 fill-current" /> Primary
                          </span>
                        )}
                      </div>

                      {/* Photo Controls */}
                      <div className="flex items-center justify-between text-[11px] pt-1 px-1">
                        <div className="flex items-center gap-1">
                          {idx !== 0 && (
                            <button
                              type="button"
                              onClick={() => handleSetPrimaryImage(idx)}
                              title="Make Primary Image"
                              className="p-1 hover:text-amber-500 transition"
                            >
                              <Star className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'left')}
                            disabled={idx === 0}
                            title="Move Left"
                            className="p-0.5 hover:text-blue-600 disabled:opacity-30"
                          >
                            <ArrowLeft className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleMoveImage(idx, 'right')}
                            disabled={idx === generalImages.length - 1}
                            title="Move Right"
                            className="p-0.5 hover:text-blue-600 disabled:opacity-30"
                          >
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          title="Delete photo"
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* Assign to Colour Selector */}
                      {colourValues.length > 0 && (
                        <div className="pt-1 border-t border-slate-100">
                          <select
                            onChange={(e) => {
                              if (e.target.value) {
                                handleAssignImageToColour(url, e.target.value);
                                e.target.value = '';
                              }
                            }}
                            className="w-full text-[10px] py-0.5 px-1 border border-slate-200 rounded text-slate-600 bg-white"
                          >
                            <option value="">Tag to Colour...</option>
                            {colourValues.map((c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: PRICING & INVENTORY */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              <span>3. Pricing (Base)</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Selling Price (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={basePriceRupees}
                    onChange={(e) => setBasePriceRupees(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Compare at MRP (₹) (Optional strikethrough)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={comparePriceRupees}
                    onChange={(e) => setComparePriceRupees(e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl text-xs sm:text-sm font-mono font-semibold text-slate-500"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: VARIANTS (COLOUR & SIZE MATRIX) */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>4. Product Variants (Colour & Size)</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable if this item has multiple options like colours, sizes, or packs.
                </p>
              </div>

              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasVariants}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setHasVariants(checked);
                    if (checked) {
                      generateVariantMatrix(options);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600" />
              </label>
            </div>

            {hasVariants && (
              <div className="space-y-6 bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200">
                {/* Option Types Definition */}
                <div className="space-y-4">
                  {options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 uppercase">
                          Option {optIdx + 1}: {opt.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveOptionType(optIdx)}
                          className="text-[11px] text-rose-600 hover:underline"
                        >
                          Remove Option
                        </button>
                      </div>

                      {/* Existing Value Tags */}
                      <div className="flex flex-wrap items-center gap-1.5">
                        {opt.values.map((val, valIdx) => (
                          <span
                            key={valIdx}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 text-xs font-medium text-slate-800 border border-slate-200"
                          >
                            <span>{val}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionValue(optIdx, valIdx)}
                              className="text-slate-400 hover:text-rose-600 ml-0.5"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>

                      {/* Add Value Input */}
                      <div className="flex gap-2 max-w-sm pt-1">
                        <input
                          type="text"
                          value={opt.inputValue}
                          onChange={(e) => {
                            const updated = [...options];
                            updated[optIdx].inputValue = e.target.value;
                            setOptions(updated);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddOptionValue(optIdx);
                            }
                          }}
                          placeholder={`Add ${opt.name} (e.g. ${opt.name === 'Colour' ? 'Crimson' : 'XXL'})`}
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddOptionValue(optIdx)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  ))}

                  {options.length < 3 && (
                    <button
                      type="button"
                      onClick={() => handleAddOptionType('Material')}
                      className="text-xs font-semibold text-blue-600 hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Another Option (e.g. Material, Pack)
                    </button>
                  )}
                </div>

                {/* Variant Matrix Table */}
                {variants.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Variant Combinations ({variants.length})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplyBasePriceToAll}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                        >
                          Sync Price to All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyStockToAll(25)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                        >
                          Set Stock (25) All
                        </button>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Variant</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">Price (₹)</th>
                            <th className="py-2.5 px-3">Stock Units</th>
                            <th className="py-2.5 px-3 text-center">Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {variants.map((v, vIdx) => (
                            <tr key={vIdx} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {v.title}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-500">
                                <input
                                  type="text"
                                  value={v.sku}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx].sku = e.target.value;
                                    setVariants(updated);
                                  }}
                                  className="w-28 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                                />
                              </td>
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1 font-mono">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.pricePaise ? v.pricePaise / 100 : ''}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[vIdx].pricePaise = parseRupeesToPaise(
                                        Number(e.target.value) || 0
                                      );
                                      setVariants(updated);
                                    }}
                                    className="w-20 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                                  />
                                </div>
                              </td>
                              <td className="py-2.5 px-3">
                                <input
                                  type="number"
                                  min="0"
                                  value={v.inventoryQuantity}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx].inventoryQuantity =
                                      parseInt(e.target.value, 10) || 0;
                                    setVariants(updated);
                                  }}
                                  className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                                />
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={v.isActive}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx].isActive = e.target.checked;
                                    setVariants(updated);
                                  }}
                                  className="rounded text-blue-600 focus:ring-blue-500"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <span>Saving Product...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{productId ? 'Update Product' : 'Publish Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
