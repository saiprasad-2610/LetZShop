import React, { createContext, useContext, useState, useEffect } from 'react';
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
});

const PREVIEW_CART_KEY = 'simply_preview_cart';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [cart, setCart] = useState<any | null>(null);
  const [guestToken, setGuestToken] = useState<string>('');
  const [storeId, setStoreIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isPreview, setIsPreview] = useState(false);

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
    }
  }, []);

  const setStoreId = (id: string) => {
    setStoreIdState(id);
  };

  useEffect(() => {
    if (storeId && guestToken && !isPreview) {
      initCart(storeId, guestToken);
    }
  }, [storeId, guestToken, isPreview]);

  const initCart = async (sId: string, gToken: string) => {
    setLoading(true);
    try {
      const c = await apiClient.cart.init(sId, gToken);
      setCart(c);
    } catch (err) {
      console.error('Failed to init cart', err);
    } finally {
      setLoading(false);
    }
  };

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

    if (!cart?.id) return;
    setLoading(true);
    try {
      const updated = await apiClient.cart.addItem(cart.id, variantId, quantity);
      setCart(updated);
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
      if (quantity <= 0) {
        const updated = await apiClient.cart.removeItem(cart.id, variantId);
        setCart(updated);
      } else {
        const updated = await apiClient.cart.updateQuantity(cart.id, variantId, quantity);
        setCart(updated);
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
      setCart(updated);
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
  };

  const refreshCart = async () => {
    if (isPreview) return;
    if (!cart?.id) return;
    try {
      const fresh = await apiClient.cart.get(cart.id);
      setCart(fresh);
    } catch (err) {
      console.error('Failed to refresh cart', err);
    }
  };

  const itemCount = (cart?.items || []).reduce((acc: number, item: any) => acc + item.quantity, 0);
  const subtotalPaise = cart?.subtotalPaise || (cart?.items || []).reduce(
    (acc: number, item: any) => acc + item.quantity * (item.variant?.pricePaise || 0),
    0
  );

  return (
    <CartContext.Provider
      value={{
        cart,
        guestToken,
        itemCount,
        subtotalPaise,
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
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
