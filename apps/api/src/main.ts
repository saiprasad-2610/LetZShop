import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import fastifyCors from '@fastify/cors';

import { AppModule } from './app.module';
import { getBrandConfig } from '@simply/config';
import { validateProductionSecrets } from './common/config/security-audit';

async function bootstrap() {
  validateProductionSecrets();
  const logger = new Logger('Bootstrap');
  const brand = getBrandConfig();

  const fastifyAdapter = new FastifyAdapter({
    logger: process.env.NODE_ENV === 'development',
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
    { rawBody: true }
  );

  // Security Headers & Middlewares
  await app.register(fastifyHelmet as any, {
    contentSecurityPolicy: false, // Allows Swagger UI to render properly in local dev
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

  const port = process.env.PORT || 4000;
  await app.listen(port, '0.0.0.0');

  logger.log(`🚀 ${brand.brandName} API running at http://localhost:${port}`);
  logger.log(`📚 Swagger OpenAPI documentation available at http://localhost:${port}/docs`);
}

bootstrap();
