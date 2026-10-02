import { StorageProvider } from './storage-provider.interface';
import { LocalDiskStorageProvider, LocalDiskStorageConfig } from './local-disk-storage.provider';
import { S3StorageProvider, S3StorageConfig } from './s3-storage.provider';

export type StorageDriver = 'local' | 's3' | 'r2' | 'gcs';

export interface StorageFactoryOptions {
  driver: StorageDriver;
  localConfig?: LocalDiskStorageConfig;
  s3Config?: S3StorageConfig;
}

export class StorageFactory {
  public static create(options: StorageFactoryOptions): StorageProvider {
    switch (options.driver) {
      case 'local':
        if (!options.localConfig) {
          throw new Error('LocalDiskStorageConfig is required when storage driver is "local"');
        }
        return new LocalDiskStorageProvider(options.localConfig);

      case 's3':
      case 'r2':
      case 'gcs':
        if (!options.s3Config) {
          throw new Error(`S3StorageConfig is required when storage driver is "${options.driver}"`);
        }
        return new S3StorageProvider(options.s3Config);

      default:
        throw new Error(`Unsupported storage driver: ${options.driver}`);
    }
  }
}
