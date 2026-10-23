export interface DirectCheckoutSelection {
  storeId: string;
  productId: string;
  variantId: string;
  quantity: number;
  expiresAt: number;
}
const key = (token: string) => `simply_direct_checkout_${token}`;
export function beginDirectCheckout(
  selection: Omit<DirectCheckoutSelection, "expiresAt">,
) {
  if (
    !Number.isInteger(selection.quantity) ||
    selection.quantity < 1 ||
    selection.quantity > 999
  )
    throw new Error("Invalid quantity");
  const token = crypto.randomUUID();
  sessionStorage.setItem(
    key(token),
    JSON.stringify({ ...selection, expiresAt: Date.now() + 20 * 60_000 }),
  );
  return token;
}
export function readDirectCheckout(
  token: string,
  storeId: string,
): DirectCheckoutSelection | null {
  try {
    const value = JSON.parse(sessionStorage.getItem(key(token)) || "null");
    return value &&
      value.storeId === storeId &&
      value.expiresAt > Date.now() &&
      Number.isInteger(value.quantity) &&
      value.quantity >= 1 &&
      value.quantity <= 999
      ? value
      : null;
  } catch {
    return null;
  }
}
export function clearDirectCheckout(token: string) {
  try {
    sessionStorage.removeItem(key(token));
  } catch {}
}
