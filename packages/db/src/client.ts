import { PrismaClient } from '@prisma/client';

declare global {
  // eslint-disable-next-line no-var
  var __prismaClient: PrismaClient | undefined;
}

export function createPrismaClient(): PrismaClient {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
  });
}

export const prisma = global.__prismaClient || createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  global.__prismaClient = prisma;
}

export { PrismaClient };
