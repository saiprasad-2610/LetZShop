import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Optional } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient } from '@prisma/client';
import { ROLES_KEY, ADMIN_PERMISSION_KEY } from '../decorators';
import { AuthenticatedUser, UserRole } from '@simply/types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    @Optional() private prisma?: PrismaClient
  ) {}

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
        : Array.isArray((user as any).permissions)
        ? (user as any).permissions
        : [];
      const hasPermission =
        permissions.includes(requiredPermission) ||
        (requiredPermission === 'BUSINESS_VERIFICATION_VIEW' && permissions.includes('VERIFICATION_VIEW')) ||
        (requiredPermission === 'VERIFICATION_VIEW' && permissions.includes('BUSINESS_VERIFICATION_VIEW')) ||
        (requiredPermission === 'BUSINESS_VERIFICATION_APPROVE' && permissions.includes('VERIFICATION_APPROVE')) ||
        (requiredPermission === 'VERIFICATION_APPROVE' && permissions.includes('BUSINESS_VERIFICATION_APPROVE')) ||
        (requiredPermission === 'ORDERS_VIEW' && permissions.includes('ORDERS_MANAGE')) ||
        (requiredPermission === 'SUBSCRIPTIONS_VIEW' && permissions.includes('SUBSCRIPTIONS_MANAGE')) ||
        (requiredPermission === 'USERS_VIEW' && permissions.includes('USERS_MANAGE')) ||
        (requiredPermission === 'SETTINGS_VIEW' && permissions.includes('SETTINGS_MANAGE')) ||
        (requiredPermission === 'THEMES_VIEW' && permissions.includes('THEMES_MANAGE'));
      if (!hasPermission) {
        if (this.prisma) {
          this.prisma.auditLog
            .create({
              data: {
                actorId: user.userId,
                actorType: 'ADMIN',
                action: 'ADMIN_ACTION_UNAUTHORIZED',
                entityType: 'Permission',
                entityId: requiredPermission,
                ipAddress:
                  (request.headers?.['x-forwarded-for'] as string) ||
                  request.ip ||
                  null,
                userAgent: (request.headers?.['user-agent'] as string) || null,
                metadata: {
                  requiredPermission,
                  grantedPermissions: permissions,
                  endpoint: request.url,
                  method: request.method,
                  module: 'Permissions',
                  result: 'DENIED',
                  reason: `Administrator denied access: missing required permission ${requiredPermission}`,
                },
              },
            })
            .catch(() => {});
        }
        throw new ForbiddenException(`Forbidden resource: required permission [${requiredPermission}]`);
      }
    }

    return true;
  }
}
