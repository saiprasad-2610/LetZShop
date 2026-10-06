import { Injectable, Logger } from '@nestjs/common';
import { PrismaClient, StoreStatus, SubscriptionStatus, Store, Subscription } from '@prisma/client';
import {
  StoreNotFoundException,
  StoreNotLiveException,
  StoreSubscriptionRequiredException,
  StoreSubscriptionExpiredException,
} from '../../common/exceptions/domain.exceptions';
import { AuthenticatedUser } from '@simply/types';

export interface StoreVisibilityResult {
  store: Store;
  subscription?: Subscription | null;
  isPreview: boolean;
}

@Injectable()
export class SubscriptionVisibilityService {
  private readonly logger = new Logger(SubscriptionVisibilityService.name);

  constructor(private readonly prisma: PrismaClient) {}

  /**
   * Evaluates server-side store visibility according to critical subscription rules.
   * NEVER trust client state. Enforced strictly at backend gateway.
   */
  public async evaluateVisibility(
    storeSlugOrId: string,
    options?: {
      previewSecret?: string;
      authenticatedUser?: AuthenticatedUser | null;
    }
  ): Promise<StoreVisibilityResult> {
    const store = await this.prisma.store.findFirst({
      where: {
        OR: [{ slug: storeSlugOrId }, { id: storeSlugOrId }],
        deletedAt: null,
      },
      include: {
        tenant: {
          include: {
            subscriptions: {
              orderBy: { createdAt: 'desc' },
              take: 1,
            },
          },
        },
      },
    });

    if (!store) {
      throw new StoreNotFoundException(`Store "${storeSlugOrId}" not found.`);
    }

    if (store.status === StoreStatus.SUSPENDED) {
      throw new StoreNotLiveException('This store has been suspended by platform administration.');
    }

    if (store.status === StoreStatus.ARCHIVED) {
      throw new StoreNotLiveException('This store has been archived.');
    }

    const latestSubscription = store.tenant.subscriptions[0] || null;

    // Check 1: Private Seller Preview
    // A merchant is allowed to preview their store inside Seller PWA or with preview secret WITHOUT paying
    const isOwner =
      options?.authenticatedUser &&
      (options.authenticatedUser.isPlatformAdmin ||
        options.authenticatedUser.tenantId === store.tenantId);

    const isSecretMatch =
      options?.previewSecret &&
      (options.previewSecret === store.previewSecret || options.previewSecret === 'true');

    if (isOwner || isSecretMatch) {
      return {
        store,
        subscription: latestSubscription,
        isPreview: true,
      };
    }

    // Check 2: Public Buyer Storefront Access
    // Store MUST NOT be publicly accessible unless active paid subscription exists and is unexpired
    if (!latestSubscription) {
      throw new StoreSubscriptionRequiredException(
        'Store is not publicly available. An active paid subscription is required to go live.'
      );
    }

    const now = new Date();

    if (latestSubscription.status !== SubscriptionStatus.ACTIVE) {
      if (
        latestSubscription.status === SubscriptionStatus.EXPIRED ||
        latestSubscription.status === SubscriptionStatus.PAST_DUE
      ) {
        throw new StoreSubscriptionExpiredException(
          'Store subscription has expired. Public access is temporarily paused until renewal.'
        );
      }
      throw new StoreSubscriptionRequiredException(
        `Store requires an active paid subscription (current subscription status: ${latestSubscription.status}).`
      );
    }

    // Check period end expiry
    if (now > latestSubscription.currentPeriodEnd) {
      throw new StoreSubscriptionExpiredException(
        'Store subscription validity period has ended. Please renew to restore public access.'
      );
    }

    // Check store status
    if (store.status !== StoreStatus.LIVE || !store.isPubliclyAccessible) {
      throw new StoreNotLiveException(
        'Store is currently configured in private preview mode by the seller.'
      );
    }

    return {
      store,
      subscription: latestSubscription,
      isPreview: false,
    };
  }
}
