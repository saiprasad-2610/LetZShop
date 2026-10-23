import { useEffect, useState, useRef } from "react";
import {
  readDirectCheckout,
  clearDirectCheckout,
  DirectCheckoutSelection,
} from "../utils/direct-checkout";
import { apiClient } from "../context/CartContext";

/** Session-only selection; server re-resolves prices, options and stock at order creation. */
export function useDirectCheckout(
  token: string,
  storeData: any,
  preview?: string,
) {
  const activeKey = useRef("");
  activeKey.current = `${token}:${storeData?.store?.id || ""}`;
  const [selection, setSelection] = useState<DirectCheckoutSelection | null>(
    null,
  );
  const [cart, setCart] = useState<any>(null);
  const [appliedCoupon, setCoupon] = useState<any>(null);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [isCheckingCoupon, setChecking] = useState(false);
  const [orderNotes, setOrderNotes] = useState("");
  useEffect(() => {
    let alive = true;
    setSelection(null);
    setCart(null);
    setCoupon(null);
    setCouponError(null);
    setChecking(false);
    setOrderNotes("");
    if (!token || !storeData?.store?.id) return;
    const saved = readDirectCheckout(token, storeData.store.id);
    if (!saved) return;
    const loadedProduct = storeData.products?.find(
      (p: any) => p.id === saved.productId,
    );
    Promise.resolve(
      loadedProduct
        ? { product: loadedProduct }
        : apiClient.stores.getPublicProduct(
            storeData.store.slug,
            saved.productId,
            preview,
          ),
    )
      .then((response: any) => {
        if (!alive) return;
        const product = response.product || response;
        const variant = product.variants?.find(
          (v: any) =>
            v.id === saved.variantId && !v.deletedAt && v.status === "ACTIVE",
        );
        if (!variant || product.id !== saved.productId) return;
        setSelection(saved);
        setCart({
          items: [
            {
              id: token,
              variantId: variant.id,
              productName: product.name || product.title,
              quantity: saved.quantity,
              unitPricePaise: variant.pricePaise,
              variant: { ...variant, product },
            },
          ],
          subtotalPaise: variant.pricePaise * saved.quantity,
        });
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [token, storeData?.store?.id, preview]);
  const subtotalPaise = cart?.subtotalPaise || 0;
  const discountPaise = appliedCoupon?.discountPaise || 0;
  const flatRatePaise = storeData?.store?.shippingSettings?.flatRatePaise || 0;
  const freeShippingThresholdPaise =
    storeData?.store?.shippingSettings?.freeShippingThresholdPaise ?? null;
  const isFreeDeliveryQualified =
    freeShippingThresholdPaise === null
      ? flatRatePaise === 0
      : subtotalPaise >= freeShippingThresholdPaise;
  return {
    selection,
    cart,
    api: apiClient,
    guestToken: "",
    itemCount: selection?.quantity || 0,
    subtotalPaise,
    appliedCoupon,
    couponError,
    isCheckingCoupon,
    discountPaise,
    flatRatePaise,
    freeShippingThresholdPaise,
    isFreeDeliveryQualified,
    shippingPaise: isFreeDeliveryQualified ? 0 : flatRatePaise,
    freeDeliveryRemainingPaise: Math.max(
      0,
      (freeShippingThresholdPaise || 0) - subtotalPaise,
    ),
    grandTotalPaise:
      subtotalPaise -
      discountPaise +
      (isFreeDeliveryQualified ? 0 : flatRatePaise),
    orderNotes,
    setOrderNotes,
    removeCoupon: () => {
      setCoupon(null);
      setCouponError(null);
    },
    applyCoupon: async (code: string) => {
      const requestKey = activeKey.current;
      setChecking(true);
      setCouponError(null);
      try {
        const result: any = await apiClient.orders.validateCoupon({
          storeId: storeData.store.id,
          code: code.trim().toUpperCase(),
          subtotalPaise,
        });
        if (activeKey.current !== requestKey) return false;
        if (!result.valid) {
          setCouponError(result.reason);
          return false;
        }
        setCoupon(result.coupon);
        return true;
      } catch (error: any) {
        if (activeKey.current === requestKey) setCouponError(error.message);
        return false;
      } finally {
        if (activeKey.current === requestKey) setChecking(false);
      }
    },
    clearCart: () => {
      clearDirectCheckout(token);
      setSelection(null);
      setCart(null);
    },
  };
}
