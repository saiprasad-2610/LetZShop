import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VerificationService, PRIVATE_STORAGE_PROVIDER_TOKEN } from './verification.service';
import { VerificationController } from './verification.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { StorageFactory } from '@simply/storage';
import { localMediaRoot } from '../media/local-media-root';
import * as path from 'path';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [VerificationController],
  providers: [
    {
      provide: PRIVATE_STORAGE_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService) => {
        const rawDriver = (configService.get<string>('MEDIA_STORAGE_DRIVER') || 'local').toLowerCase();
        const driver = (rawDriver === 'r2' || rawDriver === 's3' ? rawDriver : 'local') as any;
        const rootDir = path.resolve(
          localMediaRoot(configService.get<string>('MEDIA_STORAGE_LOCAL_ROOT', './media-storage')),
          'private-documents',
        );
        const maxSizeBytes = configService.get<number>(
          'MEDIA_MAX_FILE_SIZE_BYTES',
          10 * 1024 * 1024,
        );

        const accountId =
          configService.get<string>('R2_ACCOUNT_ID') ||
          configService.get<string>('CLOUDFLARE_ACCOUNT_ID');

        const endpoint =
          configService.get<string>('R2_ENDPOINT') ||
          configService.get<string>('S3_ENDPOINT') ||
          (accountId ? `https://${accountId}.r2.cloudflarestorage.com` : undefined);

        const accessKeyId =
          configService.get<string>('R2_ACCESS_KEY_ID') ||
          configService.get<string>('AWS_ACCESS_KEY_ID') ||
          configService.get<string>('S3_ACCESS_KEY_ID');

        const secretAccessKey =
          configService.get<string>('R2_SECRET_ACCESS_KEY') ||
          configService.get<string>('AWS_SECRET_ACCESS_KEY') ||
          configService.get<string>('S3_SECRET_ACCESS_KEY');

        const bucket =
          configService.get<string>('R2_PRIVATE_BUCKET') ||
          configService.get<string>('S3_PRIVATE_BUCKET') ||
          'letzshop-private-documents';

        const region =
          configService.get<string>('R2_REGION') ||
          configService.get<string>('AWS_REGION') ||
          'auto';

        return StorageFactory.create({
          driver,
          localConfig: {
            rootDir,
            publicUrlPrefix: '', // Strictly private, no public exposure
            maxSizeBytes,
          },
          s3Config: {
            bucket,
            region,
            endpoint,
            accountId,
            accessKeyId,
            secretAccessKey,
            publicUrlPrefix: '', // Strictly private, no public exposure
            driver: driver === 's3' ? 's3' : 'r2',
            maxSizeBytes,
          },
        });
      },
      inject: [ConfigService],
    },
    VerificationService,
  ],
  exports: [VerificationService, PRIVATE_STORAGE_PROVIDER_TOKEN],
})
export class VerificationModule {}
