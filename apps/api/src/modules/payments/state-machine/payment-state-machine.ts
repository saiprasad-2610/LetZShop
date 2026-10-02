import { PaymentStatus } from '@prisma/client';
import { IllegalPaymentTransitionException } from '../../../common/exceptions/domain.exceptions';

export class PaymentStateMachine {
  private static readonly ALLOWED_TRANSITIONS: Record<PaymentStatus, PaymentStatus[]> = {
    [PaymentStatus.PENDING]: [
      PaymentStatus.AUTHORIZED,
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
    ],
    [PaymentStatus.AUTHORIZED]: [
      PaymentStatus.PAID,
      PaymentStatus.FAILED,
    ],
    [PaymentStatus.PAID]: [
      PaymentStatus.PARTIALLY_REFUNDED,
      PaymentStatus.REFUNDED,
    ],
    [PaymentStatus.PARTIALLY_REFUNDED]: [
      PaymentStatus.REFUNDED,
    ],
    [PaymentStatus.FAILED]: [],
    [PaymentStatus.REFUNDED]: [],
  };

  /**
   * Validates whether transition from current status to next status is permitted.
   * Throws IllegalPaymentTransitionException if transition is invalid.
   */
  public static validateTransition(current: PaymentStatus, next: PaymentStatus): void {
    if (current === next) {
      return; // Idempotent no-op
    }

    const allowed = this.ALLOWED_TRANSITIONS[current] || [];
    if (!allowed.includes(next)) {
      throw new IllegalPaymentTransitionException(current, next);
    }
  }

  /**
   * Returns whether a transition is allowed without throwing.
   */
  public static canTransition(current: PaymentStatus, next: PaymentStatus): boolean {
    if (current === next) return true;
    const allowed = this.ALLOWED_TRANSITIONS[current] || [];
    return allowed.includes(next);
  }
}
