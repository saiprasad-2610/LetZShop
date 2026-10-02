import React, { createContext, useContext, useState, useEffect } from 'react';
import { SimplyApiClient, createApiClient } from '@simply/api-contracts';

export const apiClient = createApiClient(
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
);

interface CartContextType {
  cart: any | null;
  guestToken: string;
  itemCount: number;
  subtotalPaise: number;
  loading: boolean;
  storeId: string | null;
  setStoreId: (storeId: string) => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateQuantity: (variantId: string, quantity: number) => Promise<void>;
  removeItem: (variantId: string) => Promise<void>;
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
  setStoreId: () => {},
  addItem: async () => {},
  updateQuantity: async () => {},
  removeItem: async () => {},
  refreshCart: async () => {},
  api: apiClient,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cart, setCart] = useState<any | null>(null);
  const [guestToken, setGuestToken] = useState<string>('');
  const [storeId, setStoreIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Generate or restore anonymous persistent guest token
    let token = localStorage.getItem('simply_guest_token');
    if (!token) {
      token = 'gst_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem('simply_guest_token', token);
    }
    setGuestToken(token);
  }, []);

  const setStoreId = (id: string) => {
    setStoreIdState(id);
  };

  useEffect(() => {
    if (storeId && guestToken) {
      initCart(storeId, guestToken);
    }
  }, [storeId, guestToken]);

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

  const addItem = async (variantId: string, quantity = 1) => {
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

  const refreshCart = async () => {
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
        setStoreId,
        addItem,
        updateQuantity,
        removeItem,
        refreshCart,
        api: apiClient,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
