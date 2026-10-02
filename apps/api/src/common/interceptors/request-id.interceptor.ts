import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class RequestIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const existingId = request.headers['x-request-id'];
    const requestId = (typeof existingId === 'string' && existingId.length > 0)
      ? existingId
      : crypto.randomUUID();

    request.requestId = requestId;
    if (response.header) {
      response.header('x-request-id', requestId);
    }

    return next.handle();
  }
}
