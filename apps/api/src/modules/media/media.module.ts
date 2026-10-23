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
        const driver = configService.get<string>('MEDIA_STORAGE_DRIVER', 'local') as any;
        const rootDir = localMediaRoot(configService.get<string>('MEDIA_STORAGE_LOCAL_ROOT', './media-storage'));
        const publicUrlPrefix = configService.get<string>('MEDIA_PUBLIC_URL_PREFIX', 'http://localhost:4000/media/file');
        const maxSizeBytes = configService.get<number>('MEDIA_MAX_FILE_SIZE_BYTES', 10 * 1024 * 1024);

        return StorageFactory.create({
          driver,
          localConfig: {
            rootDir,
            publicUrlPrefix,
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
