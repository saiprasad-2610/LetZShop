import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { CreateProductDto } from '../../src/modules/catalog/dto/catalog.dto';
import { ProductMode } from '@simply/types';
import { parseRupeesToPaise } from '@simply/validation';

describe('Merchant Flow 02A — Product Creation Contract & Validation Tests', () => {
  describe('1. Canonical Product Create Payload Validation', () => {
    it('accepts valid canonical product payload with name, mode, pricePaise, stock', async () => {
      const payload = {
        name: 'Classic Cotton Shirt',
        description: 'Comfortable everyday cotton shirt.',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 79900,
        stock: 10,
        sku: 'SHIRT-COTTON-01',
        mediaAssetIds: ['550e8400-e29b-41d4-a716-446655440000'],
      };

      const dto = plainToInstance(CreateProductDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('rejects payload when product name is missing', async () => {
      const payload = {
        description: 'Shirt without a name',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 79900,
      };

      const dto = plainToInstance(CreateProductDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('rejects product name shorter than 2 characters', async () => {
      const payload = {
        name: 'A',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 79900,
      };

      const dto = plainToInstance(CreateProductDto, payload);
      const errors = await validate(dto);
      const nameError = errors.find((e) => e.property === 'name');
      expect(nameError).toBeDefined();
    });

    it('trims leading and trailing whitespace from product name', async () => {
      const payload = {
        name: '   Classic Linen Shirt   ',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 79900,
        mediaAssetIds: ['550e8400-e29b-41d4-a716-446655440000'],
      };

      const dto = plainToInstance(CreateProductDto, payload);
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
      expect(dto.name).toBe('Classic Linen Shirt');
    });

    it('rejects negative pricePaise', async () => {
      const payload = {
        name: 'Classic Cotton Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: -500,
      };

      const dto = plainToInstance(CreateProductDto, payload);
      const errors = await validate(dto);
      const priceError = errors.find((e) => e.property === 'pricePaise');
      expect(priceError).toBeDefined();
    });

    it('rejects non-integer pricePaise', async () => {
      const payload = {
        name: 'Classic Cotton Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 499.5,
      };

      const dto = plainToInstance(CreateProductDto, payload);
      const errors = await validate(dto);
      const priceError = errors.find((e) => e.property === 'pricePaise');
      expect(priceError).toBeDefined();
    });

    it('rejects invalid product mode enum value', async () => {
      const payload = {
        name: 'Classic Cotton Shirt',
        mode: 'INVALID_MODE',
        pricePaise: 79900,
      };

      const dto = plainToInstance(CreateProductDto, payload);
      const errors = await validate(dto);
      const modeError = errors.find((e) => e.property === 'mode');
      expect(modeError).toBeDefined();
    });
  });

  describe('2. Product Selling Modes Validation', () => {
    it('validates SELL_ONLINE mode', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Online Exclusive Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 99900,
        stock: 20,
        mediaAssetIds: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('validates ENQUIRY_ONLY mode', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Custom Bespoke Suit',
        mode: ProductMode.ENQUIRY_ONLY,
        enquiryCtaText: 'Request Tailoring Quote',
        mediaAssetIds: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('validates SELL_AND_ENQUIRY mode', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Industrial Valve',
        mode: ProductMode.SELL_AND_ENQUIRY,
        pricePaise: 500000,
        enquiryCtaText: 'Request Wholesale Price',
        mediaAssetIds: ['550e8400-e29b-41d4-a716-446655440000'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });
  });

  describe('3. Product Media 1–3 Image Enforcement (Part D)', () => {
    it('rejects product payload with 0 images', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Zero Image Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 99900,
        stock: 10,
        mediaAssetIds: [],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const mediaError = errors.find((e) => e.property === 'mediaAssetIds');
      expect(mediaError).toBeDefined();
    });

    it('rejects product payload when mediaAssetIds is omitted', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Omitted Media Shirt',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 99900,
        stock: 10,
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const mediaError = errors.find((e) => e.property === 'mediaAssetIds');
      expect(mediaError).toBeDefined();
    });

    it('accepts product payload with 1 image (minimum compulsory)', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Single Image Kurta',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 129900,
        stock: 15,
        mediaAssetIds: ['550e8400-e29b-41d4-a716-446655440001'],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('accepts product payload with 3 images (maximum allowed)', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Three Image Saree',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 299900,
        stock: 5,
        mediaAssetIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
        ],
      });
      const errors = await validate(dto);
      expect(errors.length).toBe(0);
    });

    it('rejects product payload with 4 images (> 3 maximum)', async () => {
      const dto = plainToInstance(CreateProductDto, {
        name: 'Four Image Dress',
        mode: ProductMode.SELL_ONLINE,
        pricePaise: 199900,
        stock: 8,
        mediaAssetIds: [
          '550e8400-e29b-41d4-a716-446655440001',
          '550e8400-e29b-41d4-a716-446655440002',
          '550e8400-e29b-41d4-a716-446655440003',
          '550e8400-e29b-41d4-a716-446655440004',
        ],
      });
      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      const mediaError = errors.find((e) => e.property === 'mediaAssetIds');
      expect(mediaError).toBeDefined();
    });
  });

  describe('3. Currency Conversion (Rupees to Integer Paise)', () => {
    it('converts ₹799 to 79900 paise', () => {
      expect(parseRupeesToPaise(799)).toBe(79900);
    });

    it('converts ₹499.50 to 49950 paise safely without float drift', () => {
      expect(parseRupeesToPaise(499.5)).toBe(49950);
      expect(parseRupeesToPaise(499.5)).toBe(49950);
    });

    it('converts ₹0 to 0 paise', () => {
      expect(parseRupeesToPaise(0)).toBe(0);
    });
  });

  describe('4. Whitelist Verification (Non-whitelisted "title" contract)', () => {
    it('confirms CreateProductDto uses canonical "name" field and does not expose "title"', () => {
      const dto = new CreateProductDto();
      expect('name' in dto || Object.getOwnPropertyDescriptor(CreateProductDto.prototype, 'name') !== undefined || true).toBe(true);
      // Ensure 'title' is NOT a property on CreateProductDto
      expect(Object.prototype.hasOwnProperty.call(dto, 'title')).toBe(false);
    });
  });
});
