import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/router';
import { SimplyApiClient, createApiClient } from '@simply/api-contracts';

export const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
);

export interface CartItemDetails {
  productId: string;
  productName: string;
  variantName?: string;
  pricePaise: number;
  compareAtPricePaise?: number;
  imageUrl?: string;
  sku?: string;
}

export interface AppliedCoupon {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number; // percentage (e.g. 10) or flat paise
  discountPaise: number;
  label: string;
  minOrderPaise?: number;
  maxDiscountPaise?: number;
}

// -------------------------------------------------------------------
// Built-in Promotional Coupon Engine (client-side, extensible)
// In production, this should be validated server-side via API
// -------------------------------------------------------------------
const BUILT_IN_COUPONS: Record<string, Omit<AppliedCoupon, 'discountPaise'>> = {
  WELCOME10: {
    code: 'WELCOME10',
    type: 'PERCENTAGE',
    value: 10,
    label: '10% Off — Welcome Discount',
    minOrderPaise: 50000, // ₹500 minimum
    maxDiscountPaise: 20000, // max ₹200 off
  },
  FLAT50: {
    code: 'FLAT50',
    type: 'FLAT',
    value: 5000, // ₹50 flat off
    label: '₹50 Off on Your Order',
    minOrderPaise: 30000, // ₹300 minimum
  },
  SAVE20: {
    code: 'SAVE20',
    type: 'PERCENTAGE',
    value: 20,
    label: '20% Off — Limited Offer',
    minOrderPaise: 100000, // ₹1000 minimum
    maxDiscountPaise: 50000, // max ₹500 off
  },
  FIRST100: {
    code: 'FIRST100',
    type: 'FLAT',
    value: 10000, // ₹100 off
    label: '₹100 Off — First Order',
    minOrderPaise: 50000,
  },
  FREESHIP: {
    code: 'FREESHIP',
    type: 'FLAT',
    value: 0,
    label: 'Free Shipping',
    minOrderPaise: 0,
  },
};

function calculateCouponDiscount(
  couponDef: Omit<AppliedCoupon, 'discountPaise'>,
  subtotalPaise: number
): number {
  if (couponDef.type === 'FLAT') {
    return couponDef.value;
  }
  let disc = Math.round((subtotalPaise * couponDef.value) / 100);
  if (couponDef.maxDiscountPaise && disc > couponDef.maxDiscountPaise) {
    disc = couponDef.maxDiscountPaise;
  }
  return disc;
}

interface CartContextType {
  cart: any | null;
  guestToken: string;
  itemCount: number;
  subtotalPaise: number;
  loading: boolean;
  storeId: string | null;
  isPreview: boolean;
  setStoreId: (storeId: string) => void;
  addItem: (variantId: string, quantity?: number, itemDetails?: CartItemDetails) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
  clearCart: () => void;
  refreshCart: () => Promise<void>;
  api: SimplyApiClient;
  // Coupon
  appliedCoupon: AppliedCoupon | null;
  couponError: string | null;
  applyCoupon: (code: string) => boolean;
  removeCoupon: () => void;
  discountPaise: number;
  grandTotalPaise: number;
  shippingPaise: number;
  flatRatePaise: number;
  freeShippingThresholdPaise: number | null;
  freeDeliveryRemainingPaise: number;
  isFreeDeliveryQualified: boolean;
  shippingSettings: { flatRatePaise: number; freeShippingThresholdPaise: number | null } | null;
  setShippingSettings: (settings: { flatRatePaise: number; freeShippingThresholdPaise: number | null } | null) => void;
  // Order notes
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
}

const CartContext = createContext<CartContextType>({
  cart: null,
  guestToken: '',
  itemCount: 0,
  subtotalPaise: 0,
  loading: true,
  storeId: null,
  isPreview: false,
  setStoreId: () => {},
  addItem: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  clearCart: () => {},
  refreshCart: async () => {},
  api: apiClient,
  appliedCoupon: null,
  couponError: null,
  applyCoupon: () => false,
  removeCoupon: () => {},
  discountPaise: 0,
  grandTotalPaise: 0,
  shippingPaise: 0,
  flatRatePaise: 0,
  freeShippingThresholdPaise: null,
  freeDeliveryRemainingPaise: 0,
  isFreeDeliveryQualified: true,
  shippingSettings: null,
  setShippingSettings: () => {},
  orderNotes: '',
  setOrderNotes: () => {},
});

const PREVIEW_CART_KEY = 'simply_preview_cart';
const COUPON_KEY = 'simply_applied_coupon';
const ORDER_NOTES_KEY = 'simply_order_notes';

function normalizeCart(raw: any) {
  if (!raw) return null;
  // If response has nested cart property
  if (raw.cart && typeof raw.cart === 'object') {
    const inner = raw.cart;
    const items = Array.isArray(inner.items) ? inner.items : [];
    const subtotalPaise =
      raw.subtotalPaise ??
      inner.subtotalPaise ??
      items.reduce((sum: number, it: any) => sum + (it.quantity * (it.unitPricePaise || it.variant?.pricePaise || 0)), 0);
    const itemCount =
      raw.itemCount ??
      inner.itemCount ??
      items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

    return {
      ...inner,
      items,
      subtotalPaise,
      itemCount,
    };
  }

  // If response has items directly
  if (Array.isArray(raw.items)) {
    const subtotalPaise =
      raw.subtotalPaise ??
      raw.items.reduce((sum: number, it: any) => sum + (it.quantity * (it.unitPricePaise || it.variant?.pricePaise || 0)), 0);
    const itemCount =
      raw.itemCount ??
      raw.items.reduce((sum: number, it: any) => sum + (it.quantity || 1), 0);

    return {
      ...raw,
      subtotalPaise,
      itemCount,
    };
  }

  return raw;
}

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [cart, setCart] = useState<any | null>(null);
  const [guestToken, setGuestToken] = useState<string>('');
  const [storeId, setStoreIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Order notes
  const [orderNotes, setOrderNotesState] = useState('');

  // Shipping & Free Delivery Settings
  const [shippingSettings, setShippingSettingsState] = useState<{
    flatRatePaise: number;
    freeShippingThresholdPaise: number | null;
  } | null>(null);

  const setShippingSettings = useCallback((settings: { flatRatePaise: number; freeShippingThresholdPaise: number | null } | null) => {
    setShippingSettingsState(settings);
  }, []);

  const updateCartState = useCallback((raw: any, sId?: string | null) => {
    const norm = normalizeCart(raw);
    if (!norm) return;
    setCart(norm);

    if (typeof window !== 'undefined') {
      const activeStore = sId || storeId;
      if (activeStore && norm.id) {
        try {
          localStorage.setItem(`simply_cart_${activeStore}`, JSON.stringify(norm));
        } catch {}
      }
      if (norm.guestToken) {
        setGuestToken(norm.guestToken);
        try {
          localStorage.setItem('simply_guest_token', norm.guestToken);
        } catch {}
      }
    }
  }, [storeId]);

  // Check preview mode state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isQueryPreview = router.query.preview === 'true';
      const isSessionPreview = sessionStorage.getItem('simply_merchant_preview') === 'true';
      const active = isQueryPreview || isSessionPreview;
      setIsPreview(active);

      if (active) {
        // Load isolated preview cart from sessionStorage
        try {
          const raw = sessionStorage.getItem(PREVIEW_CART_KEY);
          if (raw) {
            setCart(JSON.parse(raw));
          } else {
            setCart({ id: 'preview-cart', items: [], subtotalPaise: 0 });
          }
        } catch {
          setCart({ id: 'preview-cart', items: [], subtotalPaise: 0 });
        }
      }
    }
  }, [router.query.preview]);

  useEffect(() => {
    // Generate or restore anonymous persistent guest token
    if (typeof window !== 'undefined') {
      let token = localStorage.getItem('simply_guest_token');
      if (!token) {
        token = 'gst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
        localStorage.setItem('simply_guest_token', token);
      }
      setGuestToken(token);

      // Restore saved active store id if available
      const savedStoreId = localStorage.getItem('simply_active_store_id');
      if (savedStoreId && !storeId) {
        setStoreIdState(savedStoreId);
        const cached = localStorage.getItem(`simply_cart_${savedStoreId}`);
        if (cached) {
          try {
            const parsed = JSON.parse(cached);
            if (parsed?.id) setCart(parsed);
          } catch {}
        }
      }

      // Restore coupon from localStorage
      try {
        const savedCoupon = localStorage.getItem(COUPON_KEY);
        if (savedCoupon) {
          setAppliedCoupon(JSON.parse(savedCoupon));
        }
      } catch {}

      // Restore order notes
      try {
        const savedNotes = localStorage.getItem(ORDER_NOTES_KEY);
        if (savedNotes) {
          setOrderNotesState(savedNotes);
        }
      } catch {}
    }
  }, []);

  const setStoreId = useCallback((id: string) => {
    setStoreIdState(id);
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('simply_active_store_id', id);
        const cached = localStorage.getItem(`simply_cart_${id}`);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed?.id) {
            setCart(parsed);
          }
        }
      } catch {}
    }
  }, []);

  const initCart = useCallback(async (sId: string, gToken: string) => {
    setLoading(true);
    try {
      const c = await apiClient.cart.init(sId, gToken);
      updateCartState(c, sId);
    } catch (err) {
      console.error('Failed to init cart', err);
    } finally {
      setLoading(false);
    }
  }, [updateCartState]);

  useEffect(() => {
    if (storeId && guestToken && !isPreview) {
      initCart(storeId, guestToken);
    }
  }, [storeId, guestToken, isPreview, initCart]);

  const savePreviewCart = (updatedCart: any) => {
    setCart(updatedCart);
    try {
      sessionStorage.setItem(PREVIEW_CART_KEY, JSON.stringify(updatedCart));
    } catch {}
  };

  const addItem = async (variantId: string, quantity = 1, itemDetails?: CartItemDetails) => {
    if (isPreview) {
      // Completely isolated client-side preview cart — Zero API / DB mutations
      const currentItems: any[] = [...(cart?.items || [])];
      const existingIdx = currentItems.findIndex((it) => it.variantId === variantId);

      if (existingIdx >= 0) {
        currentItems[existingIdx] = {
          ...currentItems[existingIdx],
          quantity: currentItems[existingIdx].quantity + quantity,
        };
      } else {
        currentItems.push({
          id: `prev_item_${variantId}_${Date.now()}`,
          variantId,
          quantity,
          variant: {
            id: variantId,
            pricePaise: itemDetails?.pricePaise || 0,
            compareAtPricePaise: itemDetails?.compareAtPricePaise,
            title: itemDetails?.variantName || 'Standard',
            sku: itemDetails?.sku || `SKU-${variantId.slice(0, 6)}`,
            product: {
              id: itemDetails?.productId,
              name: itemDetails?.productName || 'Product',
              title: itemDetails?.productName || 'Product',
              media: itemDetails?.imageUrl ? [{ publicUrl: itemDetails.imageUrl }] : [],
            },
          },
        });
      }

      const newSubtotal = currentItems.reduce(
        (sum, it) => sum + it.quantity * (it.variant?.pricePaise || 0),
        0
      );

      savePreviewCart({
        id: 'preview-cart',
        items: currentItems,
        subtotalPaise: newSubtotal,
      });
      return;
    }

    setLoading(true);
    try {
      let activeCart = cart;

      // Auto-initialize cart if not ready
      if (!activeCart?.id) {
        const sId = storeId || (typeof window !== 'undefined' ? localStorage.getItem('simply_active_store_id') : null);
        const gToken = guestToken || (typeof window !== 'undefined' ? localStorage.getItem('simply_guest_token') : null) || undefined;
        if (sId) {
          const initRes = await apiClient.cart.init(sId, gToken);
          activeCart = normalizeCart(initRes);
          updateCartState(activeCart, sId);
        }
      }

      if (!activeCart?.id) {
        throw new Error('Shopping cart could not be initialized. Please refresh and try again.');
      }

      const updated = await apiClient.cart.addItem(activeCart.id, variantId, quantity);
      const normalized = normalizeCart(updated);

      if (!normalized?.items || !Array.isArray(normalized.items)) {
        const fresh = await apiClient.cart.get(activeCart.id);
        updateCartState(fresh, storeId);
      } else {
        updateCartState(normalized, storeId);
      }
    } catch (err) {
      console.error('Failed to add item to cart', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (variantId: string, quantity: number) => {
    if (isPreview) {
      let currentItems: any[] = [...(cart?.items || [])];
      if (quantity <= 0) {
        currentItems = currentItems.filter((it) => it.variantId !== variantId);
      } else {
        currentItems = currentItems.map((it) =>
          it.variantId === variantId ? { ...it, quantity } : it
        );
      }
      const newSubtotal = currentItems.reduce(
        (sum, it) => sum + it.quantity * (it.variant?.pricePaise || 0),
        0
      );
      savePreviewCart({
        id: 'preview-cart',
        items: currentItems,
        subtotalPaise: newSubtotal,
      });
      return;
    }

    if (!cart?.id) return;
    setLoading(true);
    try {
      let updated;
      if (quantity <= 0) {
        updated = await apiClient.cart.removeItem(cart.id, variantId);
      } else {
        updated = await apiClient.cart.updateQuantity(cart.id, variantId, quantity);
      }
      const normalized = normalizeCart(updated);
      if (!normalized?.items || !Array.isArray(normalized.items)) {
        const fresh = await apiClient.cart.get(cart.id);
        updateCartState(fresh, storeId);
      } else {
        updateCartState(normalized, storeId);
      }
    } catch (err) {
      console.error('Failed to update cart quantity', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeItem = async (variantId: string) => {
    if (isPreview) {
      const currentItems = (cart?.items || []).filter((it: any) => it.variantId !== variantId);
      const newSubtotal = currentItems.reduce(
        (sum: number, it: any) => sum + it.quantity * (it.variant?.pricePaise || 0),
        0
      );
      savePreviewCart({
        id: 'preview-cart',
        items: currentItems,
        subtotalPaise: newSubtotal,
      });
      return;
    }

    if (!cart?.id) return;
    setLoading(true);
    try {
      const updated = await apiClient.cart.removeItem(cart.id, variantId);
      const normalized = normalizeCart(updated);
      if (!normalized?.items || !Array.isArray(normalized.items)) {
        const fresh = await apiClient.cart.get(cart.id);
        updateCartState(fresh, storeId);
      } else {
        updateCartState(normalized, storeId);
      }
    } catch (err) {
      console.error('Failed to remove cart item', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const clearCart = () => {
    if (isPreview) {
      savePreviewCart({
        id: 'preview-cart',
        items: [],
        subtotalPaise: 0,
      });
      try {
        sessionStorage.removeItem(PREVIEW_CART_KEY);
      } catch {}
      return;
    }
    setCart(null);
    removeCoupon();
    setOrderNotesState('');
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(ORDER_NOTES_KEY);
        if (storeId) {
          localStorage.removeItem(`simply_cart_${storeId}`);
        }
      } catch {}
    }
  };

  const refreshCart = async () => {
    if (isPreview) return;
    if (!cart?.id) return;
    try {
      const fresh = await apiClient.cart.get(cart.id);
      updateCartState(fresh, storeId);
    } catch (err) {
      console.error('Failed to refresh cart', err);
    }
  };

  // ====================================================================
  // Coupon Engine
  // ====================================================================
  const applyCoupon = useCallback(
    (code: string): boolean => {
      setCouponError(null);
      const normalizedCode = code.trim().toUpperCase();

      if (!normalizedCode) {
        setCouponError('Please enter a coupon code');
        return false;
      }

      let couponDef: any = BUILT_IN_COUPONS[normalizedCode];

      // Check merchant-created custom coupons from the admin panel
      if (!couponDef && typeof window !== 'undefined') {
        try {
          const customKey = storeId ? `simply_coupons_${storeId}` : 'simply_custom_coupons';
          const savedCustom = localStorage.getItem('simply_custom_coupons') || localStorage.getItem(customKey);
          if (savedCustom) {
            const list = JSON.parse(savedCustom);
            const found = list.find((c: any) => c.code === normalizedCode && c.isActive);
            if (found) {
              couponDef = {
                code: found.code,
                type: found.type,
                value: found.value,
                label: found.label,
                minOrderPaise: found.minOrderPaise,
                maxDiscountPaise: found.maxDiscountPaise,
              };
            }
          }
        } catch (e) {
          console.error('Failed to parse custom coupons', e);
        }
      }

      if (!couponDef) {
        setCouponError(`Coupon "${normalizedCode}" is not valid or has expired`);
        return false;
      }

      const currentSubtotal = subtotalCalc;
      if (couponDef.minOrderPaise && currentSubtotal < couponDef.minOrderPaise) {
        const minAmount = (couponDef.minOrderPaise / 100).toFixed(0);
        setCouponError(`Minimum order amount of ₹${minAmount} required for this coupon`);
        return false;
      }

      const disc = calculateCouponDiscount(couponDef, currentSubtotal);

      const applied: AppliedCoupon = {
        ...couponDef,
        discountPaise: disc,
      };
      setAppliedCoupon(applied);
      try {
        localStorage.setItem(COUPON_KEY, JSON.stringify(applied));
      } catch {}
      return true;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
    try {
      localStorage.removeItem(COUPON_KEY);
    } catch {}
  }, []);

  const setOrderNotes = useCallback((notes: string) => {
    setOrderNotesState(notes);
    try {
      localStorage.setItem(ORDER_NOTES_KEY, notes);
    } catch {}
  }, []);

  // ====================================================================
  // Computed Values
  // ====================================================================
  const itemCount = (cart?.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0);
  const subtotalCalc = cart?.subtotalPaise || (cart?.items || []).reduce(
    (acc: number, item: any) => acc + item.quantity * (item.variant?.pricePaise || 0),
    0
  );

  // Recalculate coupon discount when subtotal changes
  const discountPaise = appliedCoupon
    ? calculateCouponDiscount(appliedCoupon, subtotalCalc)
    : 0;

  const flatRatePaise = shippingSettings?.flatRatePaise ?? 0;
  const freeShippingThresholdPaise = shippingSettings?.freeShippingThresholdPaise ?? null;

  const isFreeDeliveryQualified = freeShippingThresholdPaise !== null
    ? subtotalCalc >= freeShippingThresholdPaise
    : (flatRatePaise === 0);

  const shippingPaise = isFreeDeliveryQualified ? 0 : flatRatePaise;
  const freeDeliveryRemainingPaise = freeShippingThresholdPaise !== null
    ? Math.max(0, freeShippingThresholdPaise - subtotalCalc)
    : 0;

  const grandTotalPaise = Math.max(0, subtotalCalc - discountPaise + shippingPaise);

  return (
    <CartContext.Provider
      value={{
        cart,
        guestToken,
        itemCount,
        subtotalPaise: subtotalCalc,
        loading,
        storeId,
        isPreview,
        setStoreId,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        refreshCart,
        api: apiClient,
        appliedCoupon,
        couponError,
        applyCoupon,
        removeCoupon,
        discountPaise,
        grandTotalPaise,
        shippingPaise,
        flatRatePaise,
        freeShippingThresholdPaise,
        freeDeliveryRemainingPaise,
        isFreeDeliveryQualified,
        shippingSettings,
        setShippingSettings,
        orderNotes,
        setOrderNotes,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
