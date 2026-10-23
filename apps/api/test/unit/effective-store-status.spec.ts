import { SubscriptionVisibilityService } from '../../src/modules/subscriptions/subscription-visibility.service';

describe('canonical effective store status', () => {
  const store = (status = 'LIVE', subscriptionStatus = 'ACTIVE', end = Date.now() + 60_000) => ({ id: 'store', tenantId: 'tenant', status, isPubliclyAccessible: true, tenant: { status: 'ACTIVE', subscriptions: [{ status: subscriptionStatus, currentPeriodEnd: new Date(end) }] } });
  it.each([
    ['published + active', store(), true],
    ['inactive subscription', store('LIVE', 'CANCELED'), false],
    ['expired period', store('LIVE', 'ACTIVE', Date.now() - 60_000), false],
    ['unpublished', store('PRIVATE_PREVIEW'), false],
    ['suspended', store('SUSPENDED'), false],
    ['publication flag off', { ...store(), isPubliclyAccessible: false }, false],
  ])('%s', async (_name, record, isPublic) => {
    const service = new SubscriptionVisibilityService({ store: { findFirst: async () => record }, platformSetting: { findUnique: async () => null } } as any);
    expect((await service.getEffectivePublicStatus('store')).isPublic).toBe(isPublic);
  });
  it('does not turn infrastructure failures into a misleading private badge', async () => {
    const service = new SubscriptionVisibilityService({ store: { findFirst: async () => { throw new Error('database unavailable'); } } } as any);
    await expect(service.getEffectivePublicStatus('store')).rejects.toThrow('database unavailable');
  });
});
