import {
  COUPON_KEY,
  ORDER_NOTES_KEY,
  guestTokenKey,
  persistStoreValue,
  readStoreCartState,
} from '../../../storefront/src/utils/cart-storage';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, String(value));
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}
describe('buyer state across stores', () => {
  it('migrates the existing cart, token, coupon and notes only to their saved store', () => {
    const storage = memoryStorage({
      simply_active_store_id: 'a',
      simply_guest_token: 'legacy-a',
      simply_cart_a: JSON.stringify({
        id: 'cart-a',
        storeId: 'a',
        guestToken: 'legacy-a',
      }),
      [COUPON_KEY]: JSON.stringify({ code: 'A' }),
      [ORDER_NOTES_KEY]: 'Notes for A',
    });
    const a = readStoreCartState(storage, 'a', () => 'new-a');
    expect(a).toMatchObject({
      token: 'legacy-a',
      cart: { id: 'cart-a' },
      coupon: { code: 'A' },
      notes: 'Notes for A',
    });
    const b = readStoreCartState(storage, 'b', () => 'new-b');
    expect(b).toEqual({ token: 'new-b', cart: null, coupon: null, notes: '' });
    expect(readStoreCartState(storage, 'a', () => 'unexpected')).toMatchObject({
      token: 'legacy-a',
      coupon: { code: 'A' },
      notes: 'Notes for A',
    });
  });
  it('preserves independent tokens and checkout state on A â†’ B â†’ A â†’ B', () => {
    const storage = memoryStorage();
    readStoreCartState(storage, 'a', () => 'token-a');
    persistStoreValue(storage, 'a', COUPON_KEY, JSON.stringify({ code: 'A' }));
    persistStoreValue(storage, 'a', ORDER_NOTES_KEY, 'A only');
    readStoreCartState(storage, 'b', () => 'token-b');
    persistStoreValue(storage, 'b', COUPON_KEY, JSON.stringify({ code: 'B' }));
    expect(readStoreCartState(storage, 'a', () => 'wrong')).toMatchObject({
      token: 'token-a',
      coupon: { code: 'A' },
      notes: 'A only',
    });
    expect(readStoreCartState(storage, 'b', () => 'wrong')).toMatchObject({
      token: 'token-b',
      coupon: { code: 'B' },
      notes: '',
    });
  });
  it('does not adopt a legacy cart known to belong to another store', () => {
    const storage = memoryStorage({
      simply_active_store_id: 'b',
      simply_guest_token: 'token-a',
      simply_cart_b: JSON.stringify({
        id: 'cart-a',
        storeId: 'a',
        guestToken: 'token-a',
      }),
      [ORDER_NOTES_KEY]: 'Private A note',
    });
    expect(readStoreCartState(storage, 'b', () => 'fresh-b')).toEqual({
      token: 'fresh-b',
      cart: null,
      coupon: null,
      notes: '',
    });
  });
  it('keeps the token usable in memory when browser storage is disabled', () => {
    const storage = {
      getItem() {
        throw new Error('Storage blocked');
      },
      setItem() {
        throw new Error('Storage blocked');
      },
    } as any;
    expect(readStoreCartState(storage, 'a', () => 'memory-token')).toEqual({
      token: 'memory-token',
      cart: null,
      coupon: null,
      notes: '',
    });
  });
  it('does not remove another storeâ€™s coupon or notes', () => {
    const storage = memoryStorage({
      [`${COUPON_KEY}_a`]: '{"code":"A"}',
      [`${COUPON_KEY}_b`]: '{"code":"B"}',
    });
    persistStoreValue(storage, 'b', COUPON_KEY, null);
    expect(storage.getItem(`${COUPON_KEY}_a`)).toBe('{"code":"A"}');
    expect(storage.getItem(`${COUPON_KEY}_b`)).toBeNull();
  });
  it('does not restore a removed coupon from legacy global state', () => {
    const storage = memoryStorage({ simply_active_store_id: 'a', simply_guest_token: 'legacy-a', [COUPON_KEY]: '{"code":"OLD"}' });
    expect(readStoreCartState(storage, 'a').coupon).toEqual({code:'OLD'});
    persistStoreValue(storage, 'a', COUPON_KEY, null);
    expect(readStoreCartState(storage, 'a').coupon).toBeNull();
  });
  it('ignores malformed legacy JSON and retains the storeâ€™s existing scoped token', () => {
    const storage = memoryStorage({
      [guestTokenKey('a')]: 'existing-a',
      simply_cart_a: 'broken',
      [`${COUPON_KEY}_a`]: 'broken',
    });
    expect(readStoreCartState(storage, 'a', () => 'unexpected')).toEqual({
      token: 'existing-a',
      cart: null,
      coupon: null,
      notes: '',
    });
  });
});
