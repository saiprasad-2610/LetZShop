import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { 
  ShoppingBag, 
  ArrowLeft, 
  Check, 
  ShieldCheck, 
  Truck, 
  MessageSquare, 
  Share2, 
  AlertTriangle,
  Send,
  X,
  Plus,
  Minus
} from 'lucide-react';
import { useCart } from '../../../../context/CartContext';
import { useToast } from '../../../../components/ui/Toast';
import { ThemeWrapper } from '../../../../components/ThemeWrapper';
import { StoreHeader } from '../../../../components/StoreHeader';
import { StoreFooter } from '../../../../components/StoreFooter';
import { SafeImage } from '../../../../components/ui/SafeImage';
import { formatPaise } from '@simply/ui';
import { getSellerStorePreviewUrl } from '../../../../utils/config';
import { ProductReviewsSection } from '../../../../components/ProductReviewsSection';

export default function ProductDetailPage() {
  const router = useRouter();
  const { slug, id, preview } = router.query;
  const { api, setStoreId, addItem } = useCart();
  const toast = useToast();

  const [loading, setLoading] = useState(true);
  const [storeData, setStoreData] = useState<any | null>(null);
  const [product, setProduct] = useState<any | null>(null);

  // Variant & Gallery State
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const [activeVariant, setActiveVariant] = useState<any | null>(null);
  const [activeGallery, setActiveGallery] = useState<string[]>([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [cartSuccess, setCartSuccess] = useState(false);

  // Enquiry Modal State
  const [enquiryModalOpen, setEnquiryModalOpen] = useState(false);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryPhone, setEnquiryPhone] = useState('');
  const [enquiryQty, setEnquiryQty] = useState(1);
  const [enquiryMsg, setEnquiryMsg] = useState('');
  const [submittingEnquiry, setSubmittingEnquiry] = useState(false);
  const [enquirySuccess, setEnquirySuccess] = useState(false);

  useEffect(() => {
    if (!slug || !id) return;
    loadData(String(slug), String(id), preview ? String(preview) : undefined);
  }, [slug, id, preview]);

  const loadData = async (storeSlug: string, productId: string, previewSecret?: string) => {
    setLoading(true);
    try {
      const sRes = await api.stores.getPublicStorefront(storeSlug, previewSecret);
      setStoreData(sRes);
      if (sRes.store?.id) {
        setStoreId(sRes.store.id);
      }

      const found = (sRes.products || []).find(
        (p: any) => p.id === productId || p.slug === productId
      );

      if (!found) {
        throw new Error('Product not found in store catalog');
      }

      // Format options
      const formattedOptions = (found.options || []).map((opt: any) => ({
        name: opt.name,
        values: (opt.values || []).map((v: any) => v.value),
      }));

      // Format variants and map optionValues to key-value pairs
      const formattedVariants = (found.variants || []).map((v: any) => {
        const optionMap: Record<string, string> = {};
        if (v.optionValues && Array.isArray(v.optionValues)) {
          v.optionValues.forEach((ov: any) => {
            const optName = ov.optionValue?.option?.name || ov.optionName;
            const optVal = ov.optionValue?.value || ov.value;
            if (optName && optVal) {
              optionMap[optName] = optVal;
            }
          });
        }
        return {
          ...v,
          optionValues: optionMap,
        };
      });

      // Format images
      const formattedImages = (found.media || []).map((m: any) => ({
        id: m.id,
        url:
          m.publicUrl ||
          (m.storageKey ? `/media/file/${m.storageKey}` : undefined) ||
          m.url,
        variantId: m.variantId,
        isPrimary: m.isPrimary,
      }));

      const fullProd = {
        ...found,
        title: found.name || found.title || 'Product',
        name: found.name || found.title || 'Product',
        options: formattedOptions,
        variants: formattedVariants,
        images: formattedImages,
      };

      setProduct(fullProd);

      // Initialize default selected options
      if (fullProd.options && fullProd.options.length > 0) {
        const initialOpts: Record<string, string> = {};
        fullProd.options.forEach((opt: any) => {
          if (opt.values && opt.values.length > 0) {
            initialOpts[opt.name] = opt.values[0];
          }
        });
        setSelectedOptions(initialOpts);
        resolveVariantAndGallery(fullProd, initialOpts);
      } else {
        const defaultImages = fullProd.images.map((img: any) => img.url);
        setActiveGallery(
          defaultImages.length > 0
            ? defaultImages
            : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80']
        );
        if (fullProd.variants && fullProd.variants.length > 0) {
          setActiveVariant(fullProd.variants[0]);
        }
      }
    } catch (err) {
      console.error('Failed to load product details', err);
    } finally {
      setLoading(false);
    }
  };

  // Resolve matching variant and update gallery according to selected colour
  const resolveVariantAndGallery = (prod: any, opts: Record<string, string>) => {
    if (!prod.variants || prod.variants.length === 0) return;

    // Find variant that matches selected options
    const matched = prod.variants.find((v: any) => {
      const vOpts = v.optionValues || {};
      return Object.entries(opts).every(([optName, optVal]) => vOpts[optName] === optVal);
    }) || prod.variants[0];

    setActiveVariant(matched);

    // CRITICAL: Colour-Specific Gallery Dynamic Switching
    // Check if the selected options include a Colour/Color option
    const colourOptKey = Object.keys(opts).find(
      (k) => k.toLowerCase() === 'colour' || k.toLowerCase() === 'color'
    );
    const selectedColour = colourOptKey ? opts[colourOptKey] : null;

    let gallery: string[] = [];

    // First priority: images attached specifically to this variant
    const variantImgs = prod.images
      ?.filter((img: any) => img.variantId === matched.id)
      .map((img: any) => img.url) || [];

    // Second priority: images attached to all variants of this colour
    if (variantImgs.length === 0 && selectedColour && colourOptKey) {
      const colourVariantIds = prod.variants
        .filter((v: any) => v.optionValues?.[colourOptKey] === selectedColour)
        .map((v: any) => v.id);

      const colImgs = prod.images
        ?.filter((img: any) => colourVariantIds.includes(img.variantId))
        .map((img: any) => img.url) || [];

      if (colImgs.length > 0) {
        gallery = colImgs;
      }
    } else {
      gallery = variantImgs;
    }

    // Fallback: general product images if variant has no custom pictures
    if (gallery.length === 0) {
      const general = prod.images
        ?.filter((img: any) => !img.variantId)
        .map((img: any) => img.url) || [];
      gallery = general.length > 0 ? general : (prod.images || []).map((img: any) => img.url);
    }

    if (gallery.length === 0) {
      gallery = ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80'];
    }

    setActiveGallery(gallery);
    setSelectedImageIndex(0);
  };

  const handleOptionChange = (optionName: string, value: string) => {
    const updated = { ...selectedOptions, [optionName]: value };
    setSelectedOptions(updated);
    if (product) {
      resolveVariantAndGallery(product, updated);
    }
  };

  const isEmbedded = router.query.embedded === 'true';
  const isPreviewMode = Boolean(
    storeData?.isPreview ||
    preview === 'true' ||
    (typeof window !== 'undefined' && sessionStorage.getItem('simply_merchant_preview') === 'true')
  );

  const getLink = (path: string) => {
    const params = new URLSearchParams();
    if (isPreviewMode) params.set('preview', 'true');
    if (isEmbedded) params.set('embedded', 'true');
    const qs = params.toString();
    return qs ? `${path}?${qs}` : path;
  };

  const handleAddToCart = async () => {
    const variant = activeVariant || product.variants?.[0];
    if (!variant?.id || variant.id.startsWith('var_')) {
      toast.warning('Variant Unavailable', 'Please select an available product variant/size.');
      return;
    }

    setAddingToCart(true);
    try {
      const primaryImg = activeGallery[0] || product.images?.[0]?.url;
      await addItem(variant.id, quantity, {
        productId: product.id,
        productName: product.title || product.name || 'Product',
        variantName: variant.title || variant.name || 'Standard',
        pricePaise: variant.pricePaise || product.basePricePaise || 0,
        compareAtPricePaise: variant.compareAtPricePaise || product.compareAtPricePaise,
        imageUrl: primaryImg,
        sku: variant.sku || '',
      });
      setCartSuccess(true);
      toast.success('Added to Cart', `${quantity} × ${product.title || 'Product'} added to your bag.`);
      setTimeout(() => setCartSuccess(false), 2500);
    } catch (err: any) {
      toast.error('Could Not Add Item', err.message || 'Failed to add item to cart');
    } finally {
      setAddingToCart(false);
    }
  };

  const handleBuyNow = async () => {
    const variant = activeVariant || product.variants?.[0];
    if (!variant?.id || variant.id.startsWith('var_')) {
      toast.warning('Variant Unavailable', 'Please select an available product variant/size.');
      return;
    }

    try {
      const primaryImg = activeGallery[0] || product.images?.[0]?.url;
      await addItem(variant.id, quantity, {
        productId: product.id,
        productName: product.title || product.name || 'Product',
        variantName: variant.title || variant.name || 'Standard',
        pricePaise: variant.pricePaise || product.basePricePaise || 0,
        compareAtPricePaise: variant.compareAtPricePaise || product.compareAtPricePaise,
        imageUrl: primaryImg,
        sku: variant.sku || '',
      });
      router.push(getLink(`/store/${slug}/checkout`));
    } catch (err: any) {
      toast.error('Checkout Error', err.message || 'Failed to initiate checkout');
    }
  };

  const handleSubmitEnquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !enquiryPhone) return;

    setSubmittingEnquiry(true);
    try {
      await api.enquiries.create({
        storeId: storeData.store.id,
        productId: product.id,
        customerName: enquiryName || 'Prospective Buyer',
        customerPhone: enquiryPhone,
        quantity: enquiryQty,
        message: enquiryMsg || `Inquiry for ${product.title} (${activeVariant?.title || 'Default'})`,
      });
      setEnquirySuccess(true);
      toast.success('Inquiry Submitted', 'The store merchant will get back to you soon.');
    } catch (err: any) {
      toast.error('Inquiry Failed', err.message || 'Failed to submit enquiry');
    } finally {
      setSubmittingEnquiry(false);
    }
  };

  if (loading || !storeData || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-gray-900 rounded-full animate-spin" />
      </div>
    );
  }

  const { store, themeConfig } = storeData;
  const isEnquiryOnly = product.productType === 'ENQUIRY_ONLY';
  const isSellAndEnquiry = product.productType === 'SELL_AND_ENQUIRY';
  const currentPricePaise = activeVariant?.pricePaise || product.basePricePaise;
  const comparePricePaise = activeVariant?.compareAtPricePaise || product.compareAtPricePaise;
  const stockQuantity = activeVariant?.inventory?.availableQuantity ?? 10;
  const isOutOfStock = stockQuantity <= 0;
  const isLowStock = stockQuantity > 0 && stockQuantity < 5;

  return (
    <ThemeWrapper themeConfig={themeConfig} branding={themeConfig?.branding}>
      <Head>
        <title>{product.title} | {store.name}</title>
        <meta name="description" content={product.description || `Buy ${product.title} from ${store.name}`} />
      </Head>

      {/* Persistent Merchant Preview Banner (Hidden when embedded in iframe) */}
      {isPreviewMode && !isEmbedded && (
        <div className="bg-slate-950 text-white font-medium text-xs py-2 px-4 sticky top-0 z-50 shadow-md flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span className="font-semibold text-white">Merchant Preview</span>
            <span className="text-slate-400 hidden sm:inline">— You're viewing your store exactly as customers will see it.</span>
          </div>
          <button
            type="button"
            onClick={() => {
              try {
                sessionStorage.removeItem('simply_merchant_preview');
              } catch {}
              if (window.opener) {
                window.close();
              } else {
                window.location.href = getSellerStorePreviewUrl();
              }
            }}
            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-lg border border-slate-700 transition"
          >
            Exit Preview
          </button>
        </div>
      )}

      <StoreHeader store={store} themeConfig={themeConfig} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <Link href={getLink(`/store/${slug}`)} className="hover:text-gray-900">
            Home
          </Link>
          <span>/</span>
          <Link href={getLink(`/store/${slug}/search`)} className="hover:text-gray-900">
            Products
          </Link>
          <span>/</span>
          <span className="font-semibold text-gray-800 line-clamp-1">{product.title}</span>
        </div>

        {/* Product Hero Split (Gallery Left / Commercials Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          {/* LEFT: Dynamic Image Gallery */}
          <div className="lg:col-span-5 xl:col-span-5 space-y-3 lg:sticky lg:top-24">
            {/* Primary Main Viewport */}
            <div className="aspect-square max-h-[460px] w-full bg-white rounded-2xl overflow-hidden border border-gray-200/90 shadow-xs relative group flex items-center justify-center p-4 sm:p-6">
              <SafeImage
                src={activeGallery[selectedImageIndex] || activeGallery[0]}
                alt={product.title}
                className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105"
                fallbackTitle={product.title}
              />
              {comparePricePaise && !isEnquiryOnly && (
                <span
                  className="absolute top-3.5 left-3.5 text-white text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full shadow-xs"
                  style={{ backgroundColor: 'var(--theme-accent, #D97706)' }}
                >
                  Save {Math.round(((comparePricePaise - currentPricePaise) / comparePricePaise) * 100)}%
                </span>
              )}
            </div>

            {/* Thumbnail Navigation Row */}
            {activeGallery.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {activeGallery.map((url, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border-2 flex-shrink-0 transition bg-white p-1.5 flex items-center justify-center ${
                      selectedImageIndex === idx
                        ? 'border-gray-900 ring-2 ring-gray-900/15 shadow-xs'
                        : 'border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100'
                    }`}
                  >
                    <SafeImage src={url} alt="thumbnail" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details, Variant Selectors, Pricing & CTA */}
          <div className="lg:col-span-7 xl:col-span-7 space-y-6">
            {/* Title & Category */}
            <div>
              {product.category?.name && (
                <span className="inline-block text-[11px] font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-full mb-2">
                  {product.category.name}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold font-theme-heading text-gray-900 tracking-tight leading-tight">
                {product.title}
              </h1>
            </div>

            {/* Price Display */}
            {!isEnquiryOnly && (
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-gray-900 font-mono">
                  {formatPaise(currentPricePaise)}
                </span>
                {comparePricePaise && (
                  <span className="text-base text-gray-400 font-mono line-through">
                    {formatPaise(comparePricePaise)}
                  </span>
                )}
                <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-semibold">
                  Inclusive of all taxes
                </span>
              </div>
            )}

            {/* Stock Availability Indicator */}
            {!isEnquiryOnly && (
              <div>
                {isOutOfStock ? (
                  <span className="text-xs font-bold text-red-600 flex items-center gap-1.5">
                    <X className="w-4 h-4" /> Currently Out of Stock
                  </span>
                ) : isLowStock ? (
                  <span className="text-xs font-bold text-amber-600 flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4" /> Only {stockQuantity} units left in stock!
                  </span>
                ) : (
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
                    <Check className="w-4 h-4" /> Ready for Immediate Dispatch
                  </span>
                )}
              </div>
            )}

            {/* DYNAMIC OPTION SELECTORS (Colour, Size, Material, Custom) */}
            {product.options && product.options.length > 0 && (
              <div className="space-y-4 pt-4 border-t border-gray-100">
                {product.options.map((opt: any) => {
                  const isColourOption =
                    opt.name.toLowerCase() === 'colour' || opt.name.toLowerCase() === 'color';
                  const selectedVal = selectedOptions[opt.name];

                  return (
                    <div key={opt.name} className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-bold text-gray-900 uppercase tracking-wide">
                          Select {opt.name}
                        </span>
                        <span className="font-semibold text-gray-600">{selectedVal}</span>
                      </div>

                      {/* Values Pills */}
                      <div className="flex flex-wrap gap-2">
                        {opt.values.map((val: string) => {
                          const isSelected = selectedVal === val;

                          return (
                            <button
                              key={val}
                              type="button"
                              onClick={() => handleOptionChange(opt.name, val)}
                              className={`px-4 py-2 rounded-xl text-xs font-semibold border transition ${
                                isSelected
                                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                                  : 'border-gray-200 bg-white text-gray-700 hover:border-gray-400'
                              }`}
                            >
                              {val}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Quantity Selector (for ecommerce products) */}
            {!isEnquiryOnly && !isOutOfStock && (
              <div className="flex items-center gap-4 pt-2">
                <span className="text-xs font-bold text-gray-700 uppercase">Quantity</span>
                <div className="flex items-center border border-gray-300 rounded-xl bg-white overflow-hidden shadow-sm">
                  <button
                    type="button"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-gray-500 hover:bg-gray-100 transition"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <span className="px-4 py-1.5 text-xs font-bold font-mono text-gray-900">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity(quantity + 1)}
                    className="p-2 text-gray-500 hover:bg-gray-100 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {/* Call to Actions */}
            <div className="space-y-3 pt-2">
              {/* SELL_ONLINE or SELL_AND_ENQUIRY: Add to Cart & Buy Now */}
              {!isEnquiryOnly && (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      disabled={addingToCart || isOutOfStock}
                      onClick={handleAddToCart}
                      className="w-full py-3.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      {cartSuccess ? 'Added to Cart ✓' : addingToCart ? 'Adding...' : 'Add to Cart'}
                    </button>

                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={handleBuyNow}
                      className="w-full py-3.5 px-4 text-white font-bold rounded-xl text-xs shadow-md transition hover:opacity-90 flex items-center justify-center gap-2 disabled:opacity-50"
                      style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
                    >
                      Buy Now
                    </button>
                  </div>
                </div>
              )}

              {/* ENQUIRY_ONLY or SELL_AND_ENQUIRY: Request Quotation / WhatsApp Enquiry */}
              {(isEnquiryOnly || isSellAndEnquiry) && (
                <button
                  type="button"
                  onClick={() => setEnquiryModalOpen(true)}
                  className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Request Bulk Quotation / Custom Enquiry
                </button>
              )}
            </div>

            {/* Merchant Guarantee & Logistics Trust */}
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5 text-xs text-gray-600">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>Pan-India Delivery via Shiprocket couriers</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-600 flex-shrink-0" />
                <span>100% Secure Razorpay checkout & Cash on Delivery</span>
              </div>
            </div>

            {/* Description Tab */}
            {product.description && (
              <div className="space-y-2 pt-4 border-t border-gray-100">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                  Product Overview & Specifications
                </h3>
                <div className="text-xs text-gray-600 leading-relaxed whitespace-pre-line">
                  {product.description}
                </div>
              </div>
            )}

            {/* Technical Specification Table for B2B/Foundry or Industrial items */}
            {(themeConfig?.themeId === 'foundry' || isEnquiryOnly) && (
              <div className="space-y-3 pt-4 border-t border-gray-200 font-mono">
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <span className="w-2 h-2 bg-sky-500 rounded-sm" />
                  Technical Datasheet & Compliance
                </h3>
                <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <tbody className="divide-y divide-slate-200">
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-500 w-1/3">Part ID / SKU</td>
                        <td className="p-2.5 text-slate-900 font-bold">PRD-{product.id.slice(0, 8).toUpperCase()}</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-500">Material Grade</td>
                        <td className="p-2.5 text-slate-900">AISI 316 / Industrial Standard</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-500">Standard MOQ</td>
                        <td className="p-2.5 text-slate-900 font-bold">25 Units</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-500">Dispatch Window</td>
                        <td className="p-2.5 text-slate-900">3-5 Business Days</td>
                      </tr>
                      <tr>
                        <td className="p-2.5 font-semibold text-slate-500">Quality Cert</td>
                        <td className="p-2.5 text-emerald-700 font-semibold">MTC Provided with Invoicing</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        </div>

        {/* Customer Reviews Section (Requirements 31, 32, 33, 64) */}
        <ProductReviewsSection
          slug={String(slug)}
          productId={product.id}
          productName={product.name || product.title}
        />
      </main>

      {/* MODAL: Request Quotation / Product Enquiry */}
      {enquiryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base font-bold text-gray-900">Request Commercial Quotation</h3>
                <p className="text-xs text-gray-500">Direct enquiry to {store.name}</p>
              </div>
              <button
                onClick={() => {
                  setEnquiryModalOpen(false);
                  setEnquirySuccess(false);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {enquirySuccess ? (
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <Check className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-gray-900">Enquiry Received!</h4>
                <p className="text-xs text-gray-500">
                  The merchant has received your quotation request and will contact you via WhatsApp / Phone shortly.
                </p>
                <button
                  onClick={() => {
                    setEnquiryModalOpen(false);
                    setEnquirySuccess(false);
                  }}
                  className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmitEnquiry} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={enquiryName}
                    onChange={(e) => setEnquiryName(e.target.value)}
                    placeholder="e.g. Ramesh Patel"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Mobile Number (for WhatsApp quote) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={enquiryPhone}
                    onChange={(e) => setEnquiryPhone(e.target.value)}
                    placeholder="e.g. 9876543210"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Estimated Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={enquiryQty}
                    onChange={(e) => setEnquiryQty(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Customization / Inquiries
                  </label>
                  <textarea
                    rows={3}
                    value={enquiryMsg}
                    onChange={(e) => setEnquiryMsg(e.target.value)}
                    placeholder="Dimensions, required delivery timeline, special packaging requirements..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setEnquiryModalOpen(false)}
                    className="px-4 py-2 border border-gray-300 text-xs font-medium rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingEnquiry}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-xs font-semibold rounded-lg text-white flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {submittingEnquiry ? 'Sending...' : 'Send Enquiry'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Mobile Sticky Bottom CTA Bar */}
      <div className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 p-3 shadow-2xl flex items-center justify-between gap-3">
        <div>
          <div className="text-[10px] text-gray-500 font-mono line-clamp-1">
            {activeVariant?.title || 'Selected'}
          </div>
          <div className="text-base font-black text-gray-900 font-mono">
            {formatPaise(currentPricePaise)}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isEnquiryOnly ? (
            <>
              <button
                type="button"
                disabled={addingToCart || isOutOfStock}
                onClick={handleAddToCart}
                className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold text-xs rounded-xl transition"
                aria-label="Add to cart"
              >
                {cartSuccess ? '✓ Added' : addingToCart ? '...' : <ShoppingBag className="w-4 h-4" />}
              </button>
              <button
                type="button"
                disabled={isOutOfStock}
                onClick={handleBuyNow}
                className="px-5 py-2.5 text-white font-bold text-xs rounded-xl shadow-md transition"
                style={{ backgroundColor: 'var(--theme-primary, #111827)' }}
              >
                Buy Now
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setEnquiryModalOpen(true)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
            >
              Request Quote
            </button>
          )}
        </div>
      </div>

      <StoreFooter store={store} themeConfig={themeConfig} />
    </ThemeWrapper>
  );
}
