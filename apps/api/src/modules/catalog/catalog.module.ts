import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { CategoriesController } from './categories.controller';

@Module({
  controllers: [CatalogController, CategoriesController],
  providers: [CatalogService],
  exports: [CatalogService],
})
export class CatalogModule {}
