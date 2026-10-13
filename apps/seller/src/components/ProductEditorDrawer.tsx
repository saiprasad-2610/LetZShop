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
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { parseRupeesToPaise } from '@simply/ui';
import { SafeImage } from './ui/SafeImage';

interface OptionTypeDraft {
  id?: string;
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
  mediaAssetId?: string;
}

interface MediaItemDraft {
  id: string; // temp id or mediaAssetId
  mediaAssetId?: string;
  publicUrl: string;
  previewUrl?: string; // local blob URL
  isUploading?: boolean;
}

interface ProductEditorDrawerProps {
  isOpen: boolean;
  productId: string | null;
  onClose: () => void;
  onSaved: () => void;
}

const COMMON_OPTION_SUGGESTIONS = [
  'Colour',
  'Size',
  'Material',
  'Storage',
  'Pack',
  'Weight',
  'Style',
  'Flavour',
];

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
  const [showQuickAddCategory, setShowQuickAddCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [mode, setMode] = useState<
    'SELL_ONLINE' | 'ENQUIRY_ONLY' | 'SELL_AND_ENQUIRY'
  >('SELL_ONLINE');
  const [basePriceRupees, setBasePriceRupees] = useState('799');
  const [comparePriceRupees, setComparePriceRupees] = useState('');
  const [stock, setStock] = useState('10');
  const [sku, setSku] = useState('');

  // Media state (MediaItemDraft with instant blob preview + upload state + canonical publicUrl)
  const [mediaItems, setMediaItems] = useState<MediaItemDraft[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Field validation errors
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [variantLimitError, setVariantLimitError] = useState<string | null>(null);

  // Options & Variants
  const [hasVariants, setHasVariants] = useState(false);
  const [options, setOptions] = useState<OptionTypeDraft[]>([
    { name: 'Colour', values: ['Black', 'White'], inputValue: '' },
    { name: 'Size', values: ['S', 'M', 'L'], inputValue: '' },
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

  const handleQuickCreateCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) return;
    setCreatingCategory(true);
    try {
      const created = await api.catalog.createCategory({ name: trimmed });
      if (created && created.id) {
        setCategories((prev) => [...prev, created]);
        setCategoryId(created.id);
        setNewCatName('');
        setShowQuickAddCategory(false);
      }
    } catch (err: any) {
      console.error('Failed to create category', err);
      alert(err.message || 'Failed to create category');
    } finally {
      setCreatingCategory(false);
    }
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setCategoryId('');
    setShowQuickAddCategory(false);
    setNewCatName('');
    setMode('SELL_ONLINE');
    setBasePriceRupees('799');
    setComparePriceRupees('');
    setStock('10');
    setSku('');
    setMediaItems([]);
    setUploadingImage(false);
    setImageError(null);
    setFormErrors({});
    setVariantLimitError(null);
    setHasVariants(false);
    const initialOpts: OptionTypeDraft[] = [
      { name: 'Colour', values: ['Black', 'White'], inputValue: '' },
      { name: 'Size', values: ['S', 'M', 'L'], inputValue: '' },
    ];
    setOptions(initialOpts);
    generateVariantMatrix(initialOpts, 79900, null, []);
  };

  const loadProduct = async (id: string) => {
    setLoading(true);
    try {
      const product = await api.catalog.getProduct(id);
      setName(product.name || product.title || '');
      setDescription(product.description || '');
      setCategoryId(product.categoryId || '');
      setMode(product.mode || 'SELL_ONLINE');

      const firstVar = product.variants?.[0];
      const basePaise = firstVar?.pricePaise ?? product.pricePaise ?? 0;
      setBasePriceRupees(basePaise ? String(basePaise / 100) : '');

      const compPaise = firstVar?.compareAtPricePaise ?? product.compareAtPricePaise;
      setComparePriceRupees(compPaise ? String(compPaise / 100) : '');

      const initialStock = firstVar?.inventory?.stockOnHand ?? 10;
      setStock(String(initialStock));
      setSku(firstVar?.sku || '');

      // Load media with canonical publicUrl
      const loadedMedia: MediaItemDraft[] = (product.media || []).map((m: any) => ({
        id: m.mediaAssetId || m.id,
        mediaAssetId: m.mediaAssetId || m.id,
        publicUrl: m.publicUrl,
        previewUrl: m.publicUrl,
        isUploading: false,
      }));
      setMediaItems(loadedMedia);

      if (product.options && product.options.length > 0) {
        setHasVariants(true);
        const mappedOptions: OptionTypeDraft[] = product.options.map((opt: any) => ({
          id: opt.id,
          name: opt.name,
          values: (opt.values || []).map((v: any) => (typeof v === 'string' ? v : v.value)),
          inputValue: '',
        }));
        setOptions(mappedOptions);

        if (product.variants && product.variants.length > 0) {
          // Map variant media relation
          const variantMediaMap = new Map<string, string>();
          for (const m of product.media || []) {
            if (m.variantId && m.mediaAssetId) {
              variantMediaMap.set(m.variantId, m.mediaAssetId);
            }
          }

          const mappedVariants: VariantDraft[] = product.variants.map((v: any) => {
            const optMap: Record<string, string> = {};
            if (v.optionValues && Array.isArray(v.optionValues)) {
              v.optionValues.forEach((vo: any) => {
                const optName =
                  vo.optionValue?.option?.name ||
                  mappedOptions.find((o) => o.values.includes(vo.optionValue?.value))?.name;
                if (optName && vo.optionValue?.value) {
                  optMap[optName] = vo.optionValue.value;
                }
              });
            }

            const comboTitle = Object.values(optMap).join(' / ') || v.sku;
            return {
              id: v.id,
              title: comboTitle,
              optionValues: optMap,
              sku: v.sku || '',
              pricePaise: v.pricePaise ?? null,
              compareAtPaise: v.compareAtPricePaise ?? null,
              inventoryQuantity: v.inventory?.stockOnHand ?? 0,
              isActive: v.status !== 'INACTIVE' && v.status !== 'DISCONTINUED',
              mediaAssetId: variantMediaMap.get(v.id) || undefined,
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

  /**
   * Cartesian Variant Generator with existing data retention and combination safety cap
   */
  const generateVariantMatrix = (
    currentOptions: OptionTypeDraft[],
    defaultPricePaise = parseRupeesToPaise(Number(basePriceRupees) || 0),
    defaultComparePaise = comparePriceRupees ? parseRupeesToPaise(Number(comparePriceRupees)) : null,
    currentVariantsList = variants
  ) => {
    const validOptions = currentOptions.filter((o) => o.name.trim() && o.values.length > 0);
    if (validOptions.length === 0) {
      setVariants([]);
      setVariantLimitError(null);
      return;
    }

    // Safety limit check
    const totalCombos = validOptions.reduce((acc, o) => acc * o.values.length, 1);
    if (totalCombos > 100) {
      setVariantLimitError(
        `This combination would create ${totalCombos} variants. Reduce option values to continue (limit is 100).`
      );
      return;
    }
    setVariantLimitError(null);

    const cartesian = (arrays: string[][]): string[][] => {
      return arrays.reduce(
        (acc, curr) => acc.flatMap((c) => curr.map((n) => [...c, n])),
        [[]] as string[][]
      );
    };

    const valueArrays = validOptions.map((o) => o.values);
    const combos = cartesian(valueArrays);

    const prefix = (name || 'PROD').trim().toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4) || 'PROD';

    const newVariants: VariantDraft[] = combos.map((combo) => {
      const optionMap: Record<string, string> = {};
      validOptions.forEach((opt, idx) => {
        optionMap[opt.name.trim()] = combo[idx];
      });

      const titlePart = combo.join(' / ');
      const skuSlug = combo.map((v) => v.toUpperCase().replace(/[^A-Z0-9]/g, '')).join('-');

      // Retain existing variant attributes if combination matches
      const existing = currentVariantsList.find((v) =>
        Object.entries(optionMap).every(([k, val]) => v.optionValues[k] === val)
      );

      if (existing) {
        return {
          ...existing,
          title: titlePart,
          optionValues: optionMap,
        };
      }

      return {
        title: titlePart,
        optionValues: optionMap,
        sku: `${prefix}-${skuSlug}`,
        pricePaise: defaultPricePaise,
        compareAtPaise: defaultComparePaise,
        inventoryQuantity: Number(stock) || 10,
        isActive: true,
        mediaAssetId: undefined,
      };
    });

    setVariants(newVariants);
  };

  // Option modification handlers
  const handleAddOptionValue = (optIndex: number) => {
    const opt = options[optIndex];
    const valTrim = opt.inputValue.trim();
    if (!valTrim) return;

    // Disallow duplicate values (case-insensitive) inside same option
    if (opt.values.some((v) => v.toLowerCase() === valTrim.toLowerCase())) {
      setFormErrors({ options: `Value "${valTrim}" already exists in option "${opt.name}".` });
      return;
    }

    if (opt.values.length >= 20) {
      setFormErrors({ options: `Option "${opt.name}" has reached the limit of 20 values.` });
      return;
    }

    setFormErrors({});
    const newValues = [...opt.values, valTrim];
    const updatedOptions = [...options];
    updatedOptions[optIndex] = { ...opt, values: newValues, inputValue: '' };
    setOptions(updatedOptions);
    generateVariantMatrix(updatedOptions);
  };

  const handleRemoveOptionValue = (optIndex: number, valIndex: number) => {
    const opt = options[optIndex];
    const removedVal = opt.values[valIndex];
    const affectedCount = variants.filter(
      (v) => v.optionValues[opt.name.trim()] === removedVal
    ).length;

    if (
      affectedCount > 0 &&
      !window.confirm(
        `Removing "${removedVal}" will delete ${affectedCount} variant combination(s). Continue?`
      )
    ) {
      return;
    }

    const newValues = opt.values.filter((_, idx) => idx !== valIndex);
    const updatedOptions = [...options];
    updatedOptions[optIndex] = { ...opt, values: newValues };
    setOptions(updatedOptions);
    generateVariantMatrix(updatedOptions);
  };

  const handleAddOption = (defaultName = '') => {
    if (options.length >= 3) {
      setFormErrors({ options: 'A maximum of 3 option dimensions is supported.' });
      return;
    }
    setFormErrors({});
    const updated = [...options, { name: defaultName, values: [], inputValue: '' }];
    setOptions(updated);
  };

  const handleRemoveOption = (optIndex: number) => {
    const opt = options[optIndex];
    if (
      variants.length > 0 &&
      !window.confirm(
        `Removing option "${opt.name || 'Option ' + (optIndex + 1)}" will recalculate variant combinations. Continue?`
      )
    ) {
      return;
    }
    const updated = options.filter((_, i) => i !== optIndex);
    setOptions(updated);
    generateVariantMatrix(updated);
  };

  const handleOptionNameChange = (optIndex: number, newName: string) => {
    const oldName = options[optIndex].name.trim();
    const trimmed = newName.trim();
    const updated = [...options];
    updated[optIndex].name = newName;
    setOptions(updated);

    // Update variant optionValues keys if name changed
    if (oldName && trimmed && oldName !== trimmed) {
      setVariants((prev) =>
        prev.map((v) => {
          const newMap = { ...v.optionValues };
          if (newMap[oldName] !== undefined) {
            newMap[trimmed] = newMap[oldName];
            delete newMap[oldName];
          }
          return { ...v, optionValues: newMap };
        })
      );
    }
  };

  // Immediate Local Blob Preview + Background MediaAsset Upload
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setImageError(null);

    if (mediaItems.length >= 3) {
      setImageError('A maximum of 3 images is allowed per product.');
      return;
    }

    const allowedMime = ['image/jpeg', 'image/png', 'image/webp'];

    for (const file of Array.from(files)) {
      if (mediaItems.length >= 3) {
        setImageError('A maximum of 3 images is allowed per product.');
        break;
      }

      if (!allowedMime.includes(file.type)) {
        setImageError('Upload a supported image format (JPEG, PNG, WebP).');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setImageError('Image file size exceeds 5MB limit.');
        return;
      }

      // Step 1: Create immediate local blob URL
      const blobUrl = URL.createObjectURL(file);
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

      setMediaItems((prev) => [
        ...prev,
        {
          id: tempId,
          publicUrl: blobUrl,
          previewUrl: blobUrl,
          isUploading: true,
        },
      ]);

      setUploadingImage(true);
      try {
        const base64Data = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const commaIdx = result.indexOf(',');
            resolve(commaIdx !== -1 ? result.slice(commaIdx + 1) : result);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const res = await api.media.uploadMediaAsset({
          filename: file.name,
          mimeType: file.type,
          base64Data,
          altText: name || file.name,
        });

        if (res && res.id) {
          // Step 2: Replace temporary upload draft with canonical uploaded MediaAsset
          setMediaItems((prev) =>
            prev.map((item) =>
              item.id === tempId
                ? {
                    id: res.id,
                    mediaAssetId: res.id,
                    publicUrl: res.publicUrl,
                    previewUrl: blobUrl, // keep local blob for instant crispness
                    isUploading: false,
                  }
                : item
            )
          );
        }
      } catch (err: any) {
        console.error('Failed to upload media asset', err);
        setImageError(err.message || 'Failed to upload image.');
        // Remove failed temp item
        setMediaItems((prev) => prev.filter((item) => item.id !== tempId));
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  const handleSetPrimaryImage = (index: number) => {
    if (index === 0) return;
    const updated = [...mediaItems];
    const [selected] = updated.splice(index, 1);
    updated.unshift(selected);
    setMediaItems(updated);
  };

  const handleMoveImage = (index: number, direction: 'left' | 'right') => {
    const targetIdx = direction === 'left' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= mediaItems.length) return;
    const updated = [...mediaItems];
    const [moved] = updated.splice(index, 1);
    updated.splice(targetIdx, 0, moved);
    setMediaItems(updated);
  };

  const handleRemoveImage = (index: number) => {
    if (mediaItems.length <= 1) {
      setImageError('Every product needs at least one image.');
      return;
    }
    setImageError(null);

    const removedItem = mediaItems[index];
    setMediaItems(mediaItems.filter((_, i) => i !== index));

    // Clear any variant image associations linked to this removed photo
    if (removedItem.mediaAssetId) {
      setVariants((prev) =>
        prev.map((v) =>
          v.mediaAssetId === removedItem.mediaAssetId
            ? { ...v, mediaAssetId: undefined }
            : v
        )
      );
    }
  };

  // Bulk Apply helpers for merchants
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

  const handleApplyStockToAll = (qty = 10) => {
    setVariants((prev) =>
      prev.map((v) => ({
        ...v,
        inventoryQuantity: qty,
      }))
    );
  };

  const handleSave = async () => {
    const errors: Record<string, string> = {};

    const trimmedName = name.trim();
    if (!trimmedName) {
      errors.name = 'Product name is required.';
    } else if (trimmedName.length < 2) {
      errors.name = 'Product name must be at least 2 characters.';
    }

    if (mode === 'SELL_ONLINE' || mode === 'SELL_AND_ENQUIRY') {
      if (!hasVariants || variants.length === 0) {
        const numPrice = Number(basePriceRupees);
        if (basePriceRupees === '' || isNaN(numPrice) || numPrice < 0) {
          errors.price = 'Enter a valid price.';
        }
      } else {
        const invalidVar = variants.find(
          (v) => v.isActive && (v.pricePaise === null || v.pricePaise === undefined || v.pricePaise < 0)
        );
        if (invalidVar) {
          errors.general = `Price is required for variant "${invalidVar.title}".`;
        }
      }
    }

    if (hasVariants) {
      const validOptions = options.filter((o) => o.name.trim());
      if (validOptions.length === 0) {
        errors.options = 'Add at least one product option, or disable variants.';
      } else {
        const optNames = new Set<string>();
        for (const opt of validOptions) {
          const lName = opt.name.trim().toLowerCase();
          if (optNames.has(lName)) {
            errors.options = `Duplicate option name "${opt.name}".`;
            break;
          }
          optNames.add(lName);

          if (opt.values.length === 0) {
            errors.options = `Option "${opt.name}" must have at least one value.`;
            break;
          }
        }
      }

      if (variantLimitError) {
        errors.general = variantLimitError;
      }
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    setFormErrors({});

    setSaving(true);
    try {
      const basePaise =
        mode === 'SELL_ONLINE' || mode === 'SELL_AND_ENQUIRY'
          ? parseRupeesToPaise(Number(basePriceRupees) || 0)
          : undefined;
      const comparePaise = comparePriceRupees
        ? parseRupeesToPaise(Number(comparePriceRupees))
        : undefined;

      const mediaAssetIds = mediaItems
        .filter((m) => !m.isUploading && m.mediaAssetId)
        .map((m) => m.mediaAssetId as string);

      if (!productId && mediaAssetIds.length === 0) {
        setImageError('Every product needs at least one image.');
        setFormErrors({ general: 'Every product needs at least one image.' });
        setSaving(false);
        return;
      }
      if (mediaAssetIds.length > 3) {
        setImageError('A maximum of 3 images is allowed per product.');
        setFormErrors({ general: 'A maximum of 3 images is allowed per product.' });
        setSaving(false);
        return;
      }

      const payload: any = {
        name: trimmedName,
        description: description.trim() || undefined,
        categoryId: categoryId ? categoryId : null,
        mode,
        pricePaise: basePaise,
        compareAtPricePaise: comparePaise,
        stock: Number(stock) || 0,
        sku: sku.trim() || undefined,
        ...(mediaAssetIds.length > 0 ? { mediaAssetIds } : {}),
      };

      if (hasVariants && options.some((o) => o.values.length > 0)) {
        payload.options = options
          .filter((o) => o.name.trim() && o.values.length > 0)
          .map((o, idx) => ({
            id: o.id,
            name: o.name.trim(),
            sortOrder: idx,
            values: o.values.map((v, vIdx) => ({ value: v.trim(), sortOrder: vIdx })),
          }));

        payload.variants = variants.map((v, idx) => ({
          id: v.id,
          sku: v.sku.trim() || `${trimmedName.slice(0, 4).toUpperCase()}-V${idx + 1}`,
          pricePaise: v.pricePaise !== null ? v.pricePaise : (basePaise || 0),
          compareAtPricePaise: v.compareAtPaise !== null ? v.compareAtPaise : comparePaise,
          stock: Number(v.inventoryQuantity) || 0,
          initialStock: Number(v.inventoryQuantity) || 0,
          optionValues: Object.values(v.optionValues),
          mediaAssetId: v.mediaAssetId || undefined,
          status: v.isActive ? 'ACTIVE' : 'INACTIVE',
        }));
      } else if (productId) {
        // If product was updated to simple without options, clear options explicitly
        payload.options = [];
        payload.variants = [
          {
            sku: sku.trim() || `${trimmedName.slice(0, 4).toUpperCase()}-001`,
            pricePaise: basePaise || 0,
            compareAtPricePaise: comparePaise,
            stock: Number(stock) || 0,
            initialStock: Number(stock) || 0,
            optionValues: [],
            status: 'ACTIVE',
          },
        ];
      }

      if (productId) {
        await api.catalog.updateProduct(productId, payload);
      } else {
        await api.catalog.createProduct(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Failed to save product', err);
      const msg = err.message || '';
      if (msg.includes('name') || msg.includes('title')) {
        setFormErrors({ name: 'Product name is required (min 2 characters).' });
      } else if (msg.includes('price') || msg.includes('paise')) {
        setFormErrors({ price: 'Enter a valid price.' });
      } else {
        setFormErrors({ general: msg || 'Error saving product. Please try again.' });
      }
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
      className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs"
    >
      <div className="w-full sm:max-w-3xl md:max-w-4xl bg-[var(--merchant-surface)] h-full flex flex-col shadow-2xl overflow-hidden border-l border-[var(--merchant-border)] animate-in slide-in-from-right duration-200 text-[var(--merchant-text)]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--merchant-border)] bg-[var(--merchant-surface-muted)]">
          <div>
            <h2 id="product-drawer-title" className="text-lg font-bold text-[var(--merchant-text)] tracking-tight">
              {productId ? 'Edit Product' : 'Add New Product'}
            </h2>
            <p className="text-xs text-[var(--merchant-text-muted)]">
              Configure product details, photo uploads, custom options & variant matrix
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] rounded-xl hover:bg-[var(--merchant-surface-raised)] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-8">
          {/* General Form Error Banner */}
          {formErrors.general && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formErrors.general}</span>
            </div>
          )}

          {/* SECTION 1: BASIC INFORMATION */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold text-[var(--merchant-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-[var(--merchant-primary)]" />
              <span>1. Basic Details</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[var(--merchant-text)] mb-1">
                  Product Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (formErrors.name) setFormErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder="e.g. Classic Cotton Shirt"
                  className={`w-full px-3.5 py-2.5 border rounded-xl text-xs sm:text-sm transition bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] ${
                    formErrors.name
                      ? 'border-rose-300 focus:border-rose-500 bg-rose-50/10'
                      : 'border-[var(--merchant-input-border)] focus:border-[var(--merchant-focus-ring)]'
                  }`}
                />
                {formErrors.name && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.name}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--merchant-text)] mb-1">Description</label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your product materials, fit, care instructions..."
                  className="w-full px-3.5 py-2 border border-[var(--merchant-input-border)] rounded-xl text-xs sm:text-sm bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)] resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-[var(--merchant-text)]">Category</label>
                    <button
                      type="button"
                      onClick={() => setShowQuickAddCategory(!showQuickAddCategory)}
                      className="text-[11px] font-semibold text-[var(--merchant-primary)] hover:underline flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      <span>{showQuickAddCategory ? 'Cancel' : 'New Category'}</span>
                    </button>
                  </div>

                  {showQuickAddCategory && (
                    <div className="flex items-center gap-2 mb-2 p-2 bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] rounded-xl">
                      <input
                        type="text"
                        placeholder="Category name (e.g. Shirts)"
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleQuickCreateCategory();
                          }
                        }}
                        className="flex-1 px-2.5 py-1.5 border border-[var(--merchant-input-border)] rounded-lg text-xs bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)]"
                      />
                      <button
                        type="button"
                        onClick={handleQuickCreateCategory}
                        disabled={creatingCategory || !newCatName.trim()}
                        className="px-3 py-1.5 bg-[var(--merchant-primary)] text-white text-xs font-bold rounded-lg disabled:opacity-50 hover:bg-[var(--merchant-primary-hover)] transition shrink-0"
                      >
                        {creatingCategory ? 'Adding...' : 'Add'}
                      </button>
                    </div>
                  )}

                  <select
                    value={categoryId}
                    onChange={(e) => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--merchant-input-border)] rounded-xl text-xs sm:text-sm bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)]"
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
                  <label className="block text-xs font-bold text-[var(--merchant-text)] mb-1">Selling Mode</label>
                  <select
                    value={mode}
                    onChange={(e) => setMode(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[var(--merchant-input-border)] rounded-xl text-xs sm:text-sm bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)]"
                  >
                    <option value="SELL_ONLINE">Sell Online (Direct Checkout)</option>
                    <option value="ENQUIRY_ONLY">Enquiry Only (Price on Request)</option>
                    <option value="SELL_AND_ENQUIRY">Sell Online & Allow Enquiries</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 2: PRODUCT PHOTOS */}
          <div className="space-y-4 pt-4 border-t border-[var(--merchant-border)]">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-bold text-[var(--merchant-text)] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-4 h-4 text-[var(--merchant-primary)]" />
                    <span>Product Photos</span>
                  </h3>
                  <span
                    className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                      mediaItems.length === 0
                        ? 'bg-rose-100 text-rose-700'
                        : mediaItems.length === 3
                        ? 'bg-[var(--merchant-primary-soft)] text-[var(--merchant-primary)]'
                        : 'bg-[var(--merchant-surface-raised)] text-[var(--merchant-text)]'
                    }`}
                  >
                    {mediaItems.length} / 3
                  </span>
                </div>
                <p className="text-xs text-[var(--merchant-text-muted)] mt-1">
                  Add 1–3 product images. The first image is used as the primary image.
                </p>
              </div>
            </div>

            {/* Dropzone - shown when < 3 images, hidden when 3 images reached */}
            {mediaItems.length < 3 ? (
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
                    ? 'border-[var(--merchant-primary)] bg-[var(--merchant-primary-soft)]/20'
                    : 'border-[var(--merchant-border)] hover:border-[var(--merchant-primary)] hover:bg-[var(--merchant-surface-muted)]'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => processFiles(e.target.files)}
                  className="hidden"
                />
                <UploadCloud className="w-8 h-8 text-[var(--merchant-primary)] mx-auto mb-2" />
                {uploadingImage ? (
                  <p className="text-xs sm:text-sm font-bold text-[var(--merchant-primary)] animate-pulse">
                    Uploading image to media library...
                  </p>
                ) : (
                  <p className="text-xs sm:text-sm font-bold text-[var(--merchant-text)]">
                    Click to upload product photo, or drag & drop file here
                  </p>
                )}
                <p className="text-[11px] text-[var(--merchant-text-muted)] mt-1">
                  JPG, PNG, WebP supported up to 5MB each ({mediaItems.length} / 3 uploaded).
                </p>
                {imageError && (
                  <p className="text-xs text-rose-600 font-medium mt-2">{imageError}</p>
                )}
              </div>
            ) : (
              <div className="bg-[var(--merchant-surface-muted)] border border-[var(--merchant-border)] rounded-xl p-3 text-center">
                <p className="text-xs font-medium text-[var(--merchant-text-secondary)]">
                  Maximum of 3 images reached (3 / 3). Remove an image to upload a different one.
                </p>
                {imageError && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{imageError}</p>
                )}
              </div>
            )}

            {/* Uploaded Photos Gallery */}
            {mediaItems.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-[var(--merchant-text-muted)] uppercase tracking-wide block">
                  Uploaded Product Photos
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {mediaItems.map((item, idx) => (
                    <div
                      key={item.id || idx}
                      className="group relative rounded-xl border border-[var(--merchant-border)] overflow-hidden bg-[var(--merchant-surface-muted)] shadow-2xs space-y-1 p-1.5"
                    >
                      <div className="aspect-square rounded-lg overflow-hidden bg-[var(--merchant-surface-raised)] relative">
                        <SafeImage
                          src={item.previewUrl || item.publicUrl}
                          alt={`Product photo ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        {item.isUploading && (
                          <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold animate-pulse">
                              Uploading...
                            </span>
                          </div>
                        )}
                        {idx === 0 && !item.isUploading && (
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
                            disabled={idx === mediaItems.length - 1}
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
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* SECTION 3: BASE PRICING & INVENTORY (Fallback / Baseline) */}
          <div className="space-y-4 pt-4 border-t border-[var(--merchant-border)]">
            <h3 className="text-xs font-bold text-[var(--merchant-text-muted)] uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-[var(--merchant-accent)]" />
              <span>3. Pricing & Baseline Inventory</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-[var(--merchant-text)] mb-1">
                  Base Price (₹) {mode !== 'ENQUIRY_ONLY' && <span className="text-rose-500">*</span>}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[var(--merchant-text-muted)] text-xs sm:text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={basePriceRupees}
                    onChange={(e) => {
                      setBasePriceRupees(e.target.value);
                      if (formErrors.price) setFormErrors((prev) => ({ ...prev, price: '' }));
                    }}
                    placeholder="799.00"
                    className="w-full pl-7 pr-3 py-2 border border-[var(--merchant-input-border)] bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)] rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>
                {formErrors.price && (
                  <p className="text-xs text-rose-600 font-medium mt-1">{formErrors.price}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--merchant-text)] mb-1">
                  Compare-at Price (₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-[var(--merchant-text-muted)] text-xs sm:text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={comparePriceRupees}
                    onChange={(e) => setComparePriceRupees(e.target.value)}
                    placeholder="999.00"
                    className="w-full pl-7 pr-3 py-2 border border-[var(--merchant-input-border)] bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)] rounded-xl text-xs sm:text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--merchant-text)] mb-1">Stock Units</label>
                <input
                  type="number"
                  min="0"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="10"
                  className="w-full px-3 py-2 border border-[var(--merchant-input-border)] bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)] rounded-xl text-xs sm:text-sm font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[var(--merchant-text)] mb-1">Base SKU</label>
                <input
                  type="text"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  placeholder="e.g. SHIRT-001"
                  className="w-full px-3 py-2 border border-[var(--merchant-input-border)] bg-[var(--merchant-input-bg)] text-[var(--merchant-text)] focus:border-[var(--merchant-focus-ring)] rounded-xl text-xs sm:text-sm font-mono uppercase"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: PRODUCT OPTIONS & VARIANTS */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>4. Product Options & Variants</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Enable if this item has customizable options (Colour, Size, Material, Storage, Pack, etc.).
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
                {/* Options Error Banner */}
                {formErrors.options && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formErrors.options}</span>
                  </div>
                )}

                {/* Variant Limit Error Banner */}
                {variantLimitError && (
                  <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{variantLimitError}</span>
                  </div>
                )}

                {/* Option Types Definition */}
                <div className="space-y-4">
                  {options.map((opt, optIdx) => (
                    <div
                      key={optIdx}
                      className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 flex-1 max-w-sm">
                          <span className="text-xs font-bold text-slate-500 uppercase whitespace-nowrap">
                            Option {optIdx + 1}:
                          </span>
                          <input
                            type="text"
                            value={opt.name}
                            onChange={(e) => handleOptionNameChange(optIdx, e.target.value)}
                            placeholder="e.g. Colour, Size, Material, Storage..."
                            className="flex-1 px-2.5 py-1 text-xs sm:text-sm font-semibold text-slate-800 border border-slate-300 rounded-lg focus:border-blue-500"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveOption(optIdx)}
                          className="text-[11px] text-rose-600 hover:underline flex items-center gap-1 self-end sm:self-center"
                        >
                          <Trash2 className="w-3 h-3" /> Remove Option
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
                        {opt.values.length === 0 && (
                          <span className="text-xs text-slate-400 italic">No values added yet</span>
                        )}
                      </div>

                      {/* Add Value Input */}
                      <div className="flex gap-2 max-w-md pt-1">
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
                          placeholder={`Add value to ${opt.name || 'option'} (e.g. ${opt.name === 'Colour' ? 'Crimson' : opt.name === 'Size' ? 'XL' : 'Value'})`}
                          className="flex-1 px-3 py-1.5 border border-slate-300 rounded-lg text-xs"
                        />
                        <button
                          type="button"
                          onClick={() => handleAddOptionValue(optIdx)}
                          className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition"
                        >
                          Add Value
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Add Option & Common Suggestions */}
                  {options.length < 3 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddOption('')}
                        className="px-3 py-1.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-xl text-xs font-semibold hover:bg-blue-100 transition flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5" /> Add Option
                      </button>

                      <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
                        <span className="hidden sm:inline">Suggestions:</span>
                        {COMMON_OPTION_SUGGESTIONS.filter(
                          (s) => !options.some((o) => o.name.toLowerCase() === s.toLowerCase())
                        )
                          .slice(0, 4)
                          .map((sug) => (
                            <button
                              key={sug}
                              type="button"
                              onClick={() => handleAddOption(sug)}
                              className="px-2 py-0.5 bg-white border border-slate-200 rounded-md text-slate-600 hover:border-blue-400 hover:text-blue-600 transition"
                            >
                              + {sug}
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Variant Matrix Table / Cards */}
                {variants.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                        Generated Variants ({variants.length})
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleApplyBasePriceToAll}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                        >
                          Sync Base Price to All
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplyStockToAll(10)}
                          className="px-2.5 py-1 text-[11px] font-semibold bg-white border border-slate-200 rounded-lg hover:bg-slate-100 text-slate-700 transition"
                        >
                          Set Stock (10) All
                        </button>
                      </div>
                    </div>

                    {/* Mobile Variant Cards (<768px) */}
                    <div className="block md:hidden space-y-3">
                      {variants.map((v, vIdx) => (
                        <div
                          key={vIdx}
                          className={`p-3 rounded-xl border ${
                            v.isActive ? 'bg-white border-slate-200' : 'bg-slate-100/60 border-slate-200 opacity-70'
                          } shadow-2xs space-y-2`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-slate-900">{v.title}</span>
                            <label className="flex items-center gap-1.5 text-[11px] text-slate-600 cursor-pointer">
                              <input
                                type="checkbox"
                                checked={v.isActive}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx].isActive = e.target.checked;
                                  setVariants(updated);
                                }}
                                className="rounded text-blue-600"
                              />
                              <span>Active</span>
                            </label>
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Price (₹)</span>
                              <div className="flex items-center gap-1 font-mono">
                                <span>₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.pricePaise !== null ? v.pricePaise / 100 : ''}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx].pricePaise = e.target.value
                                      ? parseRupeesToPaise(Number(e.target.value) || 0)
                                      : null;
                                    setVariants(updated);
                                  }}
                                  className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Compare-at (₹)</span>
                              <div className="flex items-center gap-1 font-mono">
                                <span>₹</span>
                                <input
                                  type="number"
                                  min="0"
                                  value={v.compareAtPaise !== null ? v.compareAtPaise / 100 : ''}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx].compareAtPaise = e.target.value
                                      ? parseRupeesToPaise(Number(e.target.value) || 0)
                                      : null;
                                    setVariants(updated);
                                  }}
                                  className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                                />
                              </div>
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">SKU</span>
                              <input
                                type="text"
                                value={v.sku}
                                onChange={(e) => {
                                  const updated = [...variants];
                                  updated[vIdx].sku = e.target.value;
                                  setVariants(updated);
                                }}
                                className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs font-mono uppercase"
                              />
                            </div>

                            <div>
                              <span className="text-[10px] text-slate-400 block mb-0.5">Stock</span>
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
                                className="w-full px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                              />
                            </div>
                          </div>

                          {/* Variant Photo Selector on mobile */}
                          {mediaItems.length > 0 && (
                            <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between">
                              <span className="text-[10px] text-slate-400">Variant Photo:</span>
                              <div className="flex items-center gap-1.5">
                                {v.mediaAssetId && (
                                  <div className="w-5 h-5 rounded overflow-hidden border border-slate-200 shrink-0">
                                    <SafeImage
                                      src={
                                        mediaItems.find((m) => m.mediaAssetId === v.mediaAssetId)
                                          ?.previewUrl ||
                                        mediaItems.find((m) => m.mediaAssetId === v.mediaAssetId)
                                          ?.publicUrl
                                      }
                                      className="w-full h-full object-cover"
                                      alt="Variant preview"
                                    />
                                  </div>
                                )}
                                <select
                                  value={v.mediaAssetId || ''}
                                  onChange={(e) => {
                                    const updated = [...variants];
                                    updated[vIdx].mediaAssetId = e.target.value || undefined;
                                    setVariants(updated);
                                  }}
                                  className="text-[10px] py-0.5 px-1 border border-slate-200 rounded bg-white text-slate-700"
                                >
                                  <option value="">No photo tagged</option>
                                  {mediaItems
                                    .filter((m) => m.mediaAssetId)
                                    .map((m, mIdx) => (
                                      <option key={m.id || `${m.mediaAssetId}-${mIdx}`} value={m.mediaAssetId}>
                                        Photo {mIdx + 1}
                                      </option>
                                    ))}
                                </select>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Desktop/Tablet Variant Table (>=768px) */}
                    <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-x-auto shadow-2xs">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider">
                          <tr>
                            <th className="py-2.5 px-3">Variant</th>
                            <th className="py-2.5 px-3">Photo</th>
                            <th className="py-2.5 px-3">SKU</th>
                            <th className="py-2.5 px-3">Price (₹)</th>
                            <th className="py-2.5 px-3">Compare (₹)</th>
                            <th className="py-2.5 px-3">Stock</th>
                            <th className="py-2.5 px-3 text-center">Active</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {variants.map((v, vIdx) => (
                            <tr key={vIdx} className="hover:bg-slate-50/60">
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {v.title}
                              </td>

                              {/* Variant Photo Tagging */}
                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1.5">
                                  {v.mediaAssetId && (
                                    <div className="w-6 h-6 rounded overflow-hidden border border-slate-200 shrink-0">
                                      <SafeImage
                                        src={
                                          mediaItems.find((m) => m.mediaAssetId === v.mediaAssetId)
                                            ?.previewUrl ||
                                          mediaItems.find((m) => m.mediaAssetId === v.mediaAssetId)
                                            ?.publicUrl
                                        }
                                        className="w-full h-full object-cover"
                                        alt="Variant photo"
                                      />
                                    </div>
                                  )}
                                  <select
                                    value={v.mediaAssetId || ''}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[vIdx].mediaAssetId = e.target.value || undefined;
                                      setVariants(updated);
                                    }}
                                    className="text-[11px] py-1 px-1.5 border border-slate-200 rounded text-slate-600 bg-white max-w-[110px]"
                                  >
                                    <option value="">None</option>
                                    {mediaItems
                                      .filter((m) => m.mediaAssetId)
                                      .map((m, mIdx) => (
                                        <option key={m.id || `${m.mediaAssetId}-${mIdx}`} value={m.mediaAssetId}>
                                          Photo {mIdx + 1}
                                        </option>
                                      ))}
                                  </select>
                                </div>
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
                                  className="w-28 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono uppercase"
                                />
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1 font-mono">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.pricePaise !== null ? v.pricePaise / 100 : ''}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[vIdx].pricePaise = e.target.value
                                        ? parseRupeesToPaise(Number(e.target.value) || 0)
                                        : null;
                                      setVariants(updated);
                                    }}
                                    className="w-20 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
                                  />
                                </div>
                              </td>

                              <td className="py-2.5 px-3">
                                <div className="flex items-center gap-1 font-mono">
                                  <span>₹</span>
                                  <input
                                    type="number"
                                    min="0"
                                    value={v.compareAtPaise !== null ? v.compareAtPaise / 100 : ''}
                                    onChange={(e) => {
                                      const updated = [...variants];
                                      updated[vIdx].compareAtPaise = e.target.value
                                        ? parseRupeesToPaise(Number(e.target.value) || 0)
                                        : null;
                                      setVariants(updated);
                                    }}
                                    placeholder="—"
                                    className="w-16 px-1.5 py-1 border border-slate-200 rounded text-xs font-mono"
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
        <div className="px-6 py-4 border-t border-[var(--merchant-border)] bg-[var(--merchant-surface-muted)] flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-[var(--merchant-text-muted)] hover:text-[var(--merchant-text)] transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving || uploadingImage}
            className="px-6 py-2.5 bg-[var(--merchant-primary)] hover:bg-[var(--merchant-primary-hover)] text-white rounded-xl text-xs font-bold shadow-xs transition disabled:opacity-50 flex items-center gap-2"
          >
            {saving ? (
              <span>Saving Product...</span>
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>{productId ? 'Update Product' : 'Create Product'}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
