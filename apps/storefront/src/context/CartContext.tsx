import { COUPON_KEY, ORDER_NOTES_KEY, guestTokenKey, newGuestToken, persistStoreValue, readStoreCartState } from '../utils/cart-storage';
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
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
    label: '10% Off â€” Welcome Discount',
    minOrderPaise: 50000, // â‚¹500 minimum
    maxDiscountPaise: 20000, // max â‚¹200 off
  },
  FLAT50: {
    code: 'FLAT50',
    type: 'FLAT',
    value: 5000, // â‚¹50 flat off
    label: 'â‚¹50 Off on Your Order',
    minOrderPaise: 30000, // â‚¹300 minimum
  },
  SAVE20: {
    code: 'SAVE20',
    type: 'PERCENTAGE',
    value: 20,
    label: '20% Off â€” Limited Offer',
    minOrderPaise: 100000, // â‚¹1000 minimum
    maxDiscountPaise: 50000, // max â‚¹500 off
  },
  FIRST100: {
    code: 'FIRST100',
    type: 'FLAT',
    value: 10000, // â‚¹100 off
    label: 'â‚¹100 Off â€” First Order',
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
  isCheckingCoupon: boolean;
  applyCoupon: (code: string) => Promise<boolean>;
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
  isCheckingCoupon: false,
  applyCoupon: async () => false,
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
  const [guestIdentity, setGuestIdentity] = useState<{ storeId: string; token: string } | null>(null);
  const guestToken = guestIdentity?.token || '';
  const activeStoreRef = useRef<string | null>(null);
  const previewRef = useRef(false);
  const recoveredTokens = useRef(new Set<string>());
  const pendingCarts = useRef(new Map<string, Promise<any>>());
  const [storeId, setStoreIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

  // Coupon state
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setIsCheckingCoupon] = useState(false);

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
    const activeStore = sId || activeStoreRef.current;
    if (!norm || !activeStore || activeStore !== activeStoreRef.current || (norm.storeId && norm.storeId !== activeStore)) return;
    setCart(norm);
    if (typeof window !== 'undefined') {
      try { if (norm.id) localStorage.setItem(`simply_cart_${activeStore}`, JSON.stringify(norm)); } catch {}
      if (norm.guestToken) {
        setGuestIdentity(previous => previous?.storeId === activeStore && previous.token === norm.guestToken ? previous : {storeId:activeStore,token:norm.guestToken});
        try { localStorage.setItem(guestTokenKey(activeStore), norm.guestToken); } catch {}
      }
    }
  }, []);

  // Check preview mode state
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isQueryPreview = router.query.preview === 'true';
      let isSessionPreview = false;
      try { isSessionPreview = sessionStorage.getItem('simply_merchant_preview') === 'true'; } catch {}
      const active = isQueryPreview || isSessionPreview;
      previewRef.current = active;
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

  const setStoreId = useCallback((id: string) => {
    if (activeStoreRef.current === id) return;
    activeStoreRef.current = id;
    setStoreIdState(id);
    let saved = { token: newGuestToken(), cart: null as any, coupon: null as any, notes: '' };
    try { saved = readStoreCartState(localStorage, id); } catch {}
    setGuestIdentity({storeId:id,token:saved.token});
    if (!previewRef.current) setCart(saved.cart);
    setAppliedCoupon(saved.coupon);
    setCouponError(null);
    setOrderNotesState(saved.notes);
  }, []);

  useEffect(() => {
    try { const saved = localStorage.getItem('simply_active_store_id'); if (saved) setStoreId(saved); } catch {}
  }, [setStoreId]);

  const requestCart = useCallback((id: string, token?: string) => {
    const key = `${id}:${token || ''}`;
    const pending = pendingCarts.current.get(key);
    if (pending) return pending;
    const request = apiClient.cart.init(id, token).finally(() => pendingCarts.current.delete(key));
    pendingCarts.current.set(key, request);
    return request;
  }, []);

  const initCart = useCallback(async (sId: string, gToken: string) => {
    setLoading(true);
    try {
      const c = await requestCart(sId, gToken);
      updateCartState(c, sId);
    } catch (err: any) {
      if (err?.status === 404 && activeStoreRef.current === sId && !recoveredTokens.current.has(sId)) {
        recoveredTokens.current.add(sId);
        const token = newGuestToken();
        try { localStorage.setItem(guestTokenKey(sId), token); } catch {}
        setCart(null);
        setGuestIdentity({storeId:sId,token});
      } else console.error('Failed to init cart', err);
    } finally {
      if (activeStoreRef.current === sId) setLoading(false);
    }
  }, [updateCartState, requestCart]);

  useEffect(() => {
    if (storeId && guestIdentity?.storeId === storeId && guestToken && !isPreview) {
      initCart(storeId, guestToken);
    }
  }, [storeId, guestToken, guestIdentity?.storeId, isPreview, initCart]);

  const savePreviewCart = (updatedCart: any) => {
    setCart(updatedCart);
    try {
      sessionStorage.setItem(PREVIEW_CART_KEY, JSON.stringify(updatedCart));
    } catch {}
  };

  const addItem = async (variantId: string, quantity = 1, itemDetails?: CartItemDetails) => {
    if (isPreview) {
      // Completely isolated client-side preview cart â€” Zero API / DB mutations
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
        const gToken = guestIdentity?.storeId === sId ? guestToken : (sId && typeof window !== 'undefined' ? localStorage.getItem(guestTokenKey(sId)) : null) || undefined;
        if (sId) {
          const initRes = await requestCart(sId, gToken);
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
        persistStoreValue(localStorage, storeId, ORDER_NOTES_KEY, null);
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
  // Computed Cart Quantities & Subtotals
  // ====================================================================
  const itemCount = (cart?.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0);
  const subtotalCalc = cart?.subtotalPaise || (cart?.items || []).reduce(
    (acc: number, item: any) => acc + item.quantity * (item.variant?.pricePaise || 0),
    0
  );

  // ====================================================================
  // Coupon Engine (Server-Side Authoritative + Client Safe Fallback)
  // ====================================================================
  const applyCoupon = useCallback(
    async (code: string): Promise<boolean> => {
      setCouponError(null);
      const normalizedCode = code.trim().toUpperCase();

      if (!normalizedCode) {
        setCouponError('Please enter a coupon code');
        return false;
      }

      setIsCheckingCoupon(true);
      try {
        const currentSubtotal = subtotalCalc;

        // In preview mode or without store context, validate using built-in engine
        if (isPreview || !storeId) {
          let couponDef: any = BUILT_IN_COUPONS[normalizedCode];

          // Check merchant-created custom coupons
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

          if (couponDef.minOrderPaise && currentSubtotal < couponDef.minOrderPaise) {
            const minAmount = (couponDef.minOrderPaise / 100).toFixed(0);
            setCouponError(`Minimum order value for this coupon is â‚¹${minAmount}`);
            return false;
          }

          const disc = calculateCouponDiscount(couponDef, currentSubtotal);
          const applied: AppliedCoupon = {
            ...couponDef,
            discountPaise: disc,
          };
          if (activeStoreRef.current === storeId) setAppliedCoupon(applied);
          try {
            persistStoreValue(localStorage, storeId, COUPON_KEY, JSON.stringify(applied));
          } catch {}
          return true;
        }

        // Production Server-Side Authoritative Validation
        const res: any = await apiClient.orders.validateCoupon({
          storeId,
          code: normalizedCode,
          subtotalPaise: currentSubtotal,
        });

        if (!res || !res.valid) {
          setCouponError(res?.reason || `Coupon "${normalizedCode}" is not valid or has expired`);
          return false;
        }

        const applied: AppliedCoupon = {
          code: res.coupon.code,
          type: res.coupon.type,
          value: res.coupon.value,
          label: res.coupon.label,
          discountPaise: res.coupon.discountPaise,
          minOrderPaise: res.coupon.minOrderPaise,
          maxDiscountPaise: res.coupon.maxDiscountPaise,
        };
        if (activeStoreRef.current === storeId) setAppliedCoupon(applied);
        try {
          persistStoreValue(localStorage, storeId, COUPON_KEY, JSON.stringify(applied));
        } catch {}
        return true;
      } catch (err: any) {
        console.error('Coupon validation failed', err);
        setCouponError(err.message || 'Failed to validate coupon code');
        return false;
      } finally {
        setIsCheckingCoupon(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [cart, isPreview, storeId, subtotalCalc]
  );

  const removeCoupon = useCallback(() => {
    setAppliedCoupon(null);
    setCouponError(null);
    try {
      persistStoreValue(localStorage, storeId, COUPON_KEY, null);
    } catch {}
  }, [storeId]);

  const setOrderNotes = useCallback((notes: string) => {
    setOrderNotesState(notes);
    try {
      persistStoreValue(localStorage, storeId, ORDER_NOTES_KEY, notes);
    } catch {}
  }, [storeId]);

  // ====================================================================
  // Computed Coupon, Shipping & Grand Totals
  // ====================================================================
  // Recalculate coupon discount when subtotal changes with minimum spend validation
  const isCouponMinOrderSatisfied =
    !appliedCoupon?.minOrderPaise || subtotalCalc >= appliedCoupon.minOrderPaise;

  const discountPaise =
    appliedCoupon && isCouponMinOrderSatisfied
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
        isCheckingCoupon,
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
