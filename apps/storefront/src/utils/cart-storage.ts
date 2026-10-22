export const COUPON_KEY = 'simply_applied_coupon';
export const ORDER_NOTES_KEY = 'simply_order_notes';
export const guestTokenKey = (storeId: string) =>
  `simply_guest_token_${storeId}`;

export function newGuestToken(): string {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  return (
    'gst_' +
    Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
  );
}

export function persistStoreValue(
  storage: Storage,
  storeId: string | null,
  key: string,
  value: string | null,
) {
  if (!storeId) return;
  try {
    value === null
      ? storage.removeItem(`${key}_${storeId}`)
      : storage.setItem(`${key}_${storeId}`, value);
  } catch {}
}

export function readStoreCartState(
  storage: Storage,
  storeId: string,
  tokenFactory = newGuestToken,
) {
  const read = (key: string) => {
    try {
      return storage.getItem(key);
    } catch {
      return null;
    }
  };
  const parse = (raw: string | null): any => {
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  };
  const cached = parse(read(`simply_cart_${storeId}`));
  const foreign = Boolean(cached?.storeId && cached.storeId !== storeId);
  const cart = !foreign && cached?.id ? cached : null;
  const scopedToken = read(guestTokenKey(storeId));
  const legacy = !scopedToken && read('simply_active_store_id') === storeId && !foreign;
  const token =
    scopedToken ||
    cart?.guestToken ||
    (legacy ? read('simply_guest_token') : null) ||
    tokenFactory();
  const coupon =
    read(`${COUPON_KEY}_${storeId}`) ?? (legacy ? read(COUPON_KEY) : null);
  const notes =
    read(`${ORDER_NOTES_KEY}_${storeId}`) ??
    (legacy ? read(ORDER_NOTES_KEY) : null);
  try {
    storage.setItem(guestTokenKey(storeId), token);
    storage.setItem('simply_active_store_id', storeId);
  } catch {}
  if (coupon !== null) persistStoreValue(storage, storeId, COUPON_KEY, coupon);
  if (notes !== null)
    persistStoreValue(storage, storeId, ORDER_NOTES_KEY, notes);
  return {
    token: String(token),
    cart,
    coupon: parse(coupon),
    notes: notes || '',
  };
}
