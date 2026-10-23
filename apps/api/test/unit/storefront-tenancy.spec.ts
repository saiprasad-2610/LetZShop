import { CartService } from '../../src/modules/cart/cart.service';
import { StorefrontController } from '../../src/modules/stores/storefront.controller';
import { publicProduct } from '../../src/modules/stores/public-product';

describe('storefront tenant boundaries', () => {
  it('returns the winning same-store cart after concurrent initialization without losing its totals', async () => {
    const db = {
      store: { findUnique: jest.fn().mockResolvedValue({ id: 'a', tenantId: 'ta' }) },
      cart: {
        findUnique: jest.fn().mockResolvedValueOnce(null).mockResolvedValueOnce({ id: 'winner', storeId: 'a' }),
        create: jest.fn().mockRejectedValue({ code: 'P2002', meta: { target: ['guest_token'] } }),
      },
    };
    const service = new CartService(db as any);
    const winner = { id: 'winner', storeId: 'a', items: [{ quantity: 2 }], subtotalPaise: 2000 };
    jest.spyOn(service, 'getCart').mockResolvedValue(winner as any);
    expect(await service.getOrCreateCart('a', 'shared-token')).toBe(winner);
  });
  it('keeps merchant costs out of every public variant reference without changing buyer data', () => {
    const product = {
      id: 'p',
      variants: [
        {
          id: 'v',
          pricePaise: 1000,
          costPricePaise: 400,
          inventory: { stockOnHand: 3 },
          media: [{ variant: { id: 'v', costPricePaise: 400 } }],
        },
      ],
      media: [{ variant: { id: 'v', pricePaise: 1000, costPricePaise: 400 } }],
    };
    const publicData = publicProduct(product);
    expect(JSON.stringify(publicData)).not.toContain('costPricePaise');
    expect(publicData.variants[0]).toMatchObject({
      id: 'v',
      pricePaise: 1000,
      inventory: { stockOnHand: 3 },
    });
    expect(product.variants[0].costPricePaise).toBe(400);
  });
  it('rejects a guest token belonging to another store', async () => {
    const db = {
      store: {
        findUnique: jest.fn().mockResolvedValue({ id: 'a', tenantId: 'ta' }),
      },
      cart: {
        findUnique: jest.fn().mockResolvedValue({ id: 'cart-b', storeId: 'b' }),
      },
    };
    await expect(
      new CartService(db as any).getOrCreateCart('a', 'guest_b'),
    ).rejects.toThrow('this store');
  });
  it('rejects adding another merchantâ€™s variant before inventory or writes', async () => {
    const db = {
      cart: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ storeId: 'a', tenantId: 'ta' }),
      },
      productVariant: {
        findUnique: jest
          .fn()
          .mockResolvedValue({ storeId: 'b', tenantId: 'tb', deletedAt: null }),
      },
    };
    await expect(
      new CartService(db as any).addItem('cart-a', 'variant-b', 1),
    ).rejects.toThrow('this store');
  });
  it('scopes public cart reads to the URL store before calling the cart service', async () => {
    const db = {
      store: { findFirst: jest.fn().mockResolvedValue({ id: 'a' }) },
      cart: { findFirst: jest.fn().mockResolvedValue(null) },
    };
    const carts = { getCart: jest.fn() };
    const controller = new StorefrontController(
      db as any,
      {} as any,
      carts as any,
      {} as any,
    );
    await expect(controller.getCart('store-a', 'cart-b')).rejects.toThrow(
      'this store',
    );
    expect(carts.getCart).not.toHaveBeenCalled();
    expect(db.cart.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { storeId: 'a', id: 'cart-b' } }),
    );
  });
  it('checks visibility before querying products', async () => {
    const stores = {
      evaluatePublicVisibility: jest
        .fn()
        .mockRejectedValue(new Error('Private store')),
    };
    const db = { product: { findMany: jest.fn() } };
    const controller = new StorefrontController(
      db as any,
      stores as any,
      {} as any,
      {} as any,
    );
    await expect(controller.getProducts('private')).rejects.toThrow(
      'Private store',
    );
    expect(db.product.findMany).not.toHaveBeenCalled();
  });
  it('bounds malformed pagination while retaining store scope', async () => {
    const db = {
      product: {
        findMany: jest.fn().mockResolvedValue([]),
        count: jest.fn().mockResolvedValue(0),
      },
    };
    const stores = {
      evaluatePublicVisibility: jest
        .fn()
        .mockResolvedValue({ store: { id: 'a' } }),
    };
    const controller = new StorefrontController(
      db as any,
      stores as any,
      {} as any,
      {} as any,
    );
    const result = await controller.getProducts('a', undefined, NaN, -10);
    expect(result.pagination).toMatchObject({ page: 1, limit: 1 });
    expect(db.product.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ storeId: 'a' }),
        take: 1,
        skip: 0,
      }),
    );
  });
});
