import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

export interface CreateAuditLogInput {
  actorId?: string;
  actorType?: 'USER' | 'ADMIN' | 'SYSTEM';
  tenantId?: string;
  storeId?: string;
  action: string;
  entityType: string;
  entityId?: string;
  metadata?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  requestId?: string;
}

@Injectable()
export class AuditService {
  constructor(private readonly prisma: PrismaClient) {}

  public async log(input: CreateAuditLogInput) {
    // Sanitize metadata: strictly strip passwords, tokens, secrets, or OTPs
    const safeMetadata = input.metadata ? this.sanitizeMetadata(input.metadata) : undefined;

    return this.prisma.auditLog.create({
      data: {
        actorId: input.actorId,
        actorType: input.actorType || 'USER',
        tenantId: input.tenantId,
        storeId: input.storeId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: safeMetadata,
        ipAddress: input.ipAddress,
        userAgent: input.userAgent,
        requestId: input.requestId,
      },
    });
  }

  public async getAuditLogs(tenantId?: string, limit = 50) {
    return this.prisma.auditLog.findMany({
      where: tenantId ? { tenantId } : {},
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }

  private sanitizeMetadata(data: Record<string, any>): Record<string, any> {
    const sensitiveKeys = ['password', 'token', 'secret', 'otp', 'code', 'pin', 'card', 'key'];
    const sanitized: Record<string, any> = {};

    for (const [key, value] of Object.entries(data)) {
      if (sensitiveKeys.some((s) => key.toLowerCase().includes(s))) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        sanitized[key] = this.sanitizeMetadata(value);
      } else {
        sanitized[key] = value;
      }
    }

    return sanitized;
  }
}
