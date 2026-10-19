import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY, ADMIN_PERMISSION_KEY } from '../decorators';
import { AuthenticatedUser, UserRole } from '@simply/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const requiredPermission = this.reflector.getAllAndOverride<string>(ADMIN_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if ((!requiredRoles || requiredRoles.length === 0) && !requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new ForbiddenException('User authentication required to evaluate role permissions.');
    }

    const isPlatformAdmin = user.isPlatformAdmin || user.role === UserRole.PLATFORM_ADMIN;

    if (requiredRoles && requiredRoles.length > 0) {
      const hasRole = isPlatformAdmin ? true : requiredRoles.includes(user.role);
      if (!hasRole) {
        throw new ForbiddenException(`Forbidden resource: required roles [${requiredRoles.join(', ')}]`);
      }
    }

    if (requiredPermission) {
      if (user.isSuperAdmin) {
        return true;
      }
      if (!isPlatformAdmin) {
        throw new ForbiddenException('Platform administrator access required.');
      }
      const permissions: string[] = Array.isArray(user.adminPermissions)
        ? user.adminPermissions
        : [];
      if (!permissions.includes(requiredPermission)) {
        throw new ForbiddenException(`Forbidden resource: required permission [${requiredPermission}]`);
      }
    }

    return true;
  }
}
