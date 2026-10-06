import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger, ConsoleLogger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';

import { AppModule } from './app.module';
import { getBrandConfig } from '@simply/config';
import { validateProductionSecrets } from './common/config/security-audit';
import { PrismaService } from './prisma/prisma.service';

/**
 * Clean Merchant Development Logger
 * Suppresses repetitive route mapping and initialization noise while preserving all warnings and errors.
 */
class CleanMerchantDevLogger extends ConsoleLogger {
  override log(message: any, context?: string) {
    if (
      context === 'InstanceLoader' ||
      context === 'RouterExplorer' ||
      context === 'RoutesResolver' ||
      context === 'NestFactory' ||
      context === 'NestApplication'
    ) {
      return;
    }
    super.log(message, context);
  }
}

async function bootstrap() {
  validateProductionSecrets();
  const logger = new Logger('Bootstrap');
  const brand = getBrandConfig();

  const fastifyAdapter = new FastifyAdapter({
    // Only log warnings and errors from Fastify in development to suppress routine HTTP request noise
    logger: process.env.NODE_ENV === 'production' ? false : { level: 'warn' },
    bodyLimit: 15 * 1024 * 1024,
    rewriteUrl: (req: any) => {
      if (req.url && req.url.startsWith('/api/v1')) {
        const rewritten = req.url.replace('/api/v1', '');
        return rewritten === '' ? '/' : rewritten;
      }
      return req.url;
    },
  });

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    fastifyAdapter,
    {
      rawBody: true,
      logger: new CleanMerchantDevLogger(),
    }
  );

  // Security Headers & Middlewares
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false, // Allows Swagger UI to render properly in local dev
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  });

  await app.register(fastifyCors as any, {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  });

  await app.register(fastifyCookie as any, {
    secret: process.env.COOKIE_SECRET || 'dev-cookie-secret-change-in-prod-32!',
  });

  // Global Input Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  // OpenAPI / Swagger Documentation
  const swaggerConfig = new DocumentBuilder()
    .setTitle(`${brand.brandName} API`)
    .setDescription(
      `Production-grade multi-tenant SaaS ecommerce backend foundation for Indian businesses.\n\n` +
      `Features subscription-gated storefronts, guest-first checkout, multi-carrier shipping, and DPDPA privacy compliance.`
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'Input short-lived access JWT token obtained via /auth/otp/verify',
      },
      'bearer'
    )
    .addTag('Authentication', 'Seller OTP onboarding, rotating sessions, and logout')
    .addTag('Subscriptions', 'Tiered plans and store visibility controls')
    .addTag('Stores & Storefront', 'Merchant store configuration and public buyer storefront')
    .addTag('Catalog', 'Products, variants matrix, and categories')
    .addTag('Guest Cart', 'Guest-first shopping carts with no mandatory account')
    .addTag('Orders & Checkout', 'Transaction-safe order processing and state machine')
    .addTag('Payments', 'Razorpay & Mock multi-merchant payment gateways')
    .addTag('Shipping & Logistics', 'Shiprocket & Mock logistics fulfillment')
    .addTag('B2B Enquiries', 'Custom product quotation requests')
    .addTag('Privacy & DPDPA', 'Consent records, data export, and right-to-be-forgotten')
    .addTag('Observability & Health', 'Liveness and deep readiness probes')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  try {
    const prisma = app.get(PrismaService);
    await prisma.$connect();
  } catch (err: any) {
    console.error('✗ Database connection failed');
    console.error(err.message || err);
    process.exit(1);
  }

  const port = process.env.PORT || 4000;
  try {
    await app.listen(port, '0.0.0.0');
  } catch (err: any) {
    console.error('✗ API failed to start');
    console.error(err.message || err);
    process.exit(1);
  }

  logger.log(`🚀 ${brand.brandName} API running at http://localhost:${port}`);
  logger.log(`📚 Swagger OpenAPI documentation available at http://localhost:${port}/docs`);
}

bootstrap().catch((err) => {
  console.error('✗ API failed to start');
  console.error(err.message || err);
  process.exit(1);
});
