import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators';
import { AuthService } from '../../modules/auth/auth.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authService: AuthService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers['authorization'];

    let token: string | undefined;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (request.cookies?.['access_token']) {
      token = request.cookies['access_token'];
    }

    if (!token) {
      throw new UnauthorizedException('Authentication token missing. Please log in.');
    }

    try {
      const user = await this.authService.validateAccessToken(token);
      request.user = user;
      return true;
    } catch (err: any) {
      throw new UnauthorizedException(err.message || 'Invalid authentication token.');
    }
  }
}
