import { normalizeSlug, isReservedSlug } from '@simply/validation';
import { getPublicStoreUrl } from '@simply/types';
import { StoresController } from '../../src/modules/stores/stores.controller';
import {
  storeSlugBase,
  withUniqueStoreSlug,
} from '../../src/modules/stores/store-identity';

describe('public store identity', () => {
  it('keeps an authenticated account without a tenant in onboarding rather than logging it out', async () => {
    const stores = { getStoreByTenantId: jest.fn() };
    const controller = new StoresController(stores as any, {} as any);
    await expect(controller.getMyStore({ userId:'new-account' } as any)).rejects.toMatchObject({status:404});
    expect(stores.getStoreByTenantId).not.toHaveBeenCalled();
  });
  it('uses the authenticated tenant when looking up an existing merchant store', async () => {
    const stores = { getStoreByTenantId: jest.fn().mockResolvedValue({id:'own-store'}) };
    const controller = new StoresController(stores as any, {} as any);
    expect(await controller.getMyStore({tenantId:'own-tenant'} as any)).toEqual({id:'own-store'});
    expect(stores.getStoreByTenantId).toHaveBeenCalledWith('own-tenant');
  });
  it.each(['Royal Bakery', 'ROYAL BAKERY', 'royal bakery'])(
    'normalizes %s independently of its display name',
    (name) => {
      expect(normalizeSlug(name)).toBe('royal-bakery');
    },
  );
  it('normalizes diacritics and unsafe separators', () => {
    expect(normalizeSlug(' Royal Bakery & Café / Pune ')).toBe(
      'royal-bakery-cafe-pune',
    );
  });
  it.each([
    'www',
    'api',
    'admin',
    'seller',
    'merchant',
    'login',
    'logout',
    'signup',
    'register',
    'store',
    'stores',
    'checkout',
    'cart',
    'payment',
    'payments',
    'orders',
    'static',
    'assets',
    'cdn',
    'support',
    'help',
    'status',
    'mail',
    'app',
    'dashboard',
    'system',
  ])('protects %s', (slug) => {
    expect(isReservedSlug(slug)).toBe(true);
    expect(storeSlugBase(slug)).toBe(`${slug}-store`);
  });
  it('retries only slug conflicts and uses the database as final authority', async () => {
    const insert = jest
      .fn()
      .mockRejectedValueOnce({ code: 'P2002', meta: { target: ['slug'] } })
      .mockRejectedValueOnce({ code: 'P2002', meta: { target: ['slug'] } })
      .mockImplementation(async (slug) => slug);
    expect(await withUniqueStoreSlug('Royal Bakery', insert)).toBe(
      'royal-bakery-3',
    );
    expect(insert.mock.calls.map((args) => args[0])).toEqual([
      'royal-bakery',
      'royal-bakery-2',
      'royal-bakery-3',
    ]);
  });
  it('does not hide unrelated uniqueness or database failures', async () => {
    for (const error of [
      { code: 'P2002', meta: { target: ['phone'] } },
      { code: 'P1001' },
    ]) {
      const insert = jest.fn().mockRejectedValue(error);
      await expect(withUniqueStoreSlug('Royal Bakery', insert)).rejects.toBe(
        error,
      );
      expect(insert).toHaveBeenCalledTimes(1);
    }
  });
  it('bounds collision retries', async () => {
    const insert = jest
      .fn()
      .mockRejectedValue({ code: 'P2002', meta: { target: ['slug'] } });
    await expect(withUniqueStoreSlug('Royal Bakery', insert)).rejects.toThrow(
      'Could not reserve',
    );
    expect(insert).toHaveBeenCalledTimes(24);
  });
  it('keeps path routing and preview/query encoding consistent', () => {
    expect(
      getPublicStoreUrl(
        { slug: 'sk-general-stores' },
        'https://letzshop.store/',
      ),
    ).toBe('https://letzshop.store/store/sk-general-stores');
    expect(getPublicStoreUrl('shop', '', { preview: true, page: 'products' })).toBe('/store/shop/products?preview=true');
    expect(getPublicStoreUrl('shop', '', { preview: true })).toBe(
      '/store/shop?preview=true',
    );
    expect(getPublicStoreUrl('shop', '', { previewSecret: 'a&b' })).toBe(
      '/store/shop?previewSecret=a%26b',
    );
  });
});
