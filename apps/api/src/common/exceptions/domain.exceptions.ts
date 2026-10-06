import { HttpException, HttpStatus } from '@nestjs/common';
import { ErrorCode } from '@simply/api-contracts';

export class DomainException extends HttpException {
  constructor(
    code: ErrorCode | string,
    message: string,
    statusCode: HttpStatus = HttpStatus.BAD_REQUEST,
    details?: any
  ) {
    super({ code, message, details }, statusCode);
  }
}

export class TenantNotFoundException extends DomainException {
  constructor(message = 'The specified merchant tenant was not found.') {
    super(ErrorCode.TENANT_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class TenantAccessDeniedException extends DomainException {
  constructor(message = 'Access denied: You do not have permissions for this merchant tenant.') {
    super(ErrorCode.TENANT_ACCESS_DENIED, message, HttpStatus.FORBIDDEN);
  }
}

export class StoreNotFoundException extends DomainException {
  constructor(message = 'Store not found.') {
    super(ErrorCode.STORE_NOT_FOUND, message, HttpStatus.NOT_FOUND);
  }
}

export class StoreNotLiveException extends DomainException {
  constructor(
    message = 'This store is currently not accessible to the public. Please contact the store owner.'
  ) {
    super(ErrorCode.STORE_NOT_LIVE, message, HttpStatus.FORBIDDEN);
  }
}

export class StoreSubscriptionRequiredException extends DomainException {
  constructor(
    message = 'Store is currently unavailable as it requires an active paid subscription.'
  ) {
    super(ErrorCode.SUBSCRIPTION_REQUIRED, message, HttpStatus.PAYMENT_REQUIRED);
  }
}

export class StoreSubscriptionExpiredException extends DomainException {
  constructor(
    message = 'Store subscription has expired. Public access is temporarily paused until renewal.'
  ) {
    super(ErrorCode.STORE_SUBSCRIPTION_EXPIRED, message, HttpStatus.PAYMENT_REQUIRED);
  }
}

export class ProductOutOfStockException extends DomainException {
  constructor(message = 'The selected variant is no longer available.') {
    super(ErrorCode.PRODUCT_OUT_OF_STOCK, message, HttpStatus.UNPROCESSABLE_ENTITY);
  }
}

export class InsufficientStockException extends DomainException {
  constructor(available: number, requested: number) {
    super(
      ErrorCode.INSUFFICIENT_STOCK,
      `Insufficient stock available. Requested ${requested}, but only ${available} left.`,
      HttpStatus.UNPROCESSABLE_ENTITY,
      { available, requested }
    );
  }
}

export class PaymentVerificationFailedException extends DomainException {
  constructor(message = 'Payment signature verification failed.') {
    super(ErrorCode.PAYMENT_VERIFICATION_FAILED, message, HttpStatus.BAD_REQUEST);
  }
}

export class IdempotencyConflictException extends DomainException {
  constructor(message = 'A request with this idempotency key is already being processed or completed.') {
    super(ErrorCode.IDEMPOTENCY_CONFLICT, message, HttpStatus.CONFLICT);
  }
}

export class IllegalPaymentBoundaryException extends DomainException {
  constructor(message = 'Security violation: Attempted to mix platform billing credentials with merchant ecommerce payments.') {
    super('ILLEGAL_PAYMENT_BOUNDARY', message, HttpStatus.FORBIDDEN);
  }
}

export class IllegalPaymentTransitionException extends DomainException {
  constructor(fromStatus: string, toStatus: string) {
    super(
      'ILLEGAL_PAYMENT_TRANSITION',
      `Illegal payment status transition from ${fromStatus} to ${toStatus}.`,
      HttpStatus.BAD_REQUEST,
      { fromStatus, toStatus }
    );
  }
}

export class InvalidTrackingTokenException extends DomainException {
  constructor(message = 'Access denied: A valid tracking token is required to view order status.') {
    super('INVALID_TRACKING_TOKEN', message, HttpStatus.FORBIDDEN);
  }
}

