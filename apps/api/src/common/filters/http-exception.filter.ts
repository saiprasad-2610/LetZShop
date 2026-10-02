import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ErrorCode } from '@simply/api-contracts';

@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    const requestId = request?.requestId || request?.headers?.['x-request-id'] || 'req_unknown';

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code: string = ErrorCode.INTERNAL_SERVER_ERROR;
    let message = 'An unexpected internal error occurred.';
    let details: any = undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const resObj = res as any;
        message = resObj.message || exception.message;
        code = resObj.code || this.mapStatusToErrorCode(status);
        details = resObj.details || (Array.isArray(resObj.message) ? resObj.message : undefined);
        if (Array.isArray(resObj.message)) {
          message = 'Validation failed for the submitted data.';
        }
      }
    } else if (exception instanceof Error) {
      // Internal unhandled errors - never leak database or stack details to client
      this.logger.error(`[${requestId}] Unhandled Error: ${exception.message}`, exception.stack);
      message = 'An unexpected server error occurred. Please contact support.';
      code = ErrorCode.INTERNAL_SERVER_ERROR;
    }

    const errorPayload = {
      error: {
        code,
        message,
        requestId,
        ...(details ? { details } : {}),
      },
    };

    if (response.status) {
      response.status(status).send(errorPayload);
    } else {
      response.writeHead(status, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(errorPayload));
    }
  }

  private mapStatusToErrorCode(status: number): string {
    switch (status) {
      case HttpStatus.BAD_REQUEST:
        return ErrorCode.VALIDATION_FAILED;
      case HttpStatus.UNAUTHORIZED:
        return ErrorCode.UNAUTHORIZED;
      case HttpStatus.FORBIDDEN:
        return ErrorCode.FORBIDDEN;
      case HttpStatus.NOT_FOUND:
        return ErrorCode.PRODUCT_NOT_FOUND;
      case HttpStatus.CONFLICT:
        return ErrorCode.IDEMPOTENCY_CONFLICT;
      case HttpStatus.TOO_MANY_REQUESTS:
        return ErrorCode.RATE_LIMIT_EXCEEDED;
      default:
        return ErrorCode.INTERNAL_SERVER_ERROR;
    }
  }
}
