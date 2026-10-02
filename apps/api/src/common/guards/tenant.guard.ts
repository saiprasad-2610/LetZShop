import {
  Injectable,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { AuthenticatedUser, UserRole } from '@simply/types';
import { TenantAccessDeniedException } from '../exceptions/domain.exceptions';

@Injectable()
export class TenantGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user as AuthenticatedUser | undefined;

    if (!user) {
      throw new TenantAccessDeniedException('Unauthenticated request cannot access tenant resources.');
    }

    // Platform SuperAdmin can bypass or impersonate for system administration
    if (user.isPlatformAdmin || user.role === UserRole.PLATFORM_ADMIN) {
      const paramTenantId = request.params?.tenantId || request.headers?.['x-tenant-id'];
      request.tenantContext = {
        tenantId: paramTenantId || user.tenantId,
        storeId: request.params?.storeId || user.storeId,
      };
      return true;
    }

    // For standard sellers & staff: user MUST belong to an active tenant
    if (!user.tenantId) {
      throw new TenantAccessDeniedException('User does not belong to any active merchant tenant.');
    }

    // Security Defense: If a route parameter contains :tenantId, verify it strictly matches user.tenantId
    const targetTenantId = request.params?.tenantId;
    if (targetTenantId && targetTenantId !== user.tenantId) {
      throw new TenantAccessDeniedException('Tenant mismatch: Cross-tenant resource access is strictly forbidden.');
    }

    // Attach verified server-side tenant context. Downstream services must NEVER trust client-provided tenantId!
    request.tenantContext = {
      tenantId: user.tenantId,
      storeId: user.storeId || request.params?.storeId,
    };

    return true;
  }
}
