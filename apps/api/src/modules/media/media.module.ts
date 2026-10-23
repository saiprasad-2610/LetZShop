import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MediaService, STORAGE_PROVIDER_TOKEN } from './media.service';
import { MediaController } from './media.controller';
import { StorageFactory } from '@simply/storage';
import { localMediaRoot } from './local-media-root';

@Global()
@Module({
  controllers: [MediaController],
  providers: [
    {
      provide: STORAGE_PROVIDER_TOKEN,
      useFactory: (configService: ConfigService) => {
        const rawDriver = (configService.get<string>('MEDIA_STORAGE_DRIVER') || 'local').toLowerCase();
        const driver = (rawDriver === 'r2' || rawDriver === 's3' ? rawDriver : 'local') as any;
        const rootDir = localMediaRoot(configService.get<string>('MEDIA_STORAGE_LOCAL_ROOT', './media-storage'));
        const publicUrlPrefix = configService.get<string>('MEDIA_PUBLIC_URL_PREFIX', 'http://localhost:4000/media/file');
        const maxSizeBytes = configService.get<number>('MEDIA_MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024);

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
          configService.get<string>('R2_PUBLIC_BUCKET') ||
          configService.get<string>('R2_BUCKET') ||
          configService.get<string>('S3_BUCKET') ||
          'letzshop-public-media';

        const region =
          configService.get<string>('R2_REGION') ||
          configService.get<string>('AWS_REGION') ||
          'auto';

        const r2PublicUrlPrefix =
          configService.get<string>('R2_PUBLIC_URL_PREFIX') ||
          publicUrlPrefix;

        return StorageFactory.create({
          driver,
          localConfig: {
            rootDir,
            publicUrlPrefix,
            maxSizeBytes,
          },
          s3Config: {
            bucket,
            region,
            endpoint,
            accountId,
            accessKeyId,
            secretAccessKey,
            publicUrlPrefix: r2PublicUrlPrefix,
            driver: driver === 's3' ? 's3' : 'r2',
            maxSizeBytes,
          },
        });
      },
      inject: [ConfigService],
    },
    MediaService,
  ],
  exports: [MediaService, STORAGE_PROVIDER_TOKEN],
})
export class MediaModule {}
