import { BadRequestException } from '@nestjs/common';
import {
  isValidRazorpayKeyId,
  isValidUdyamNumber,
  normalizeUdyamNumber,
  isValidProductName,
  normalizeProductName,
  countGraphemes,
  isValidProductDescription,
  PRODUCT_DESCRIPTION_MAX_CHARS,
} from '@simply/validation';
import {
  encryptSecret,
  decryptSecret,
} from '../../src/common/crypto/encryption.util';
import { verifyRazorpayCredentials } from '../../src/modules/payments/razorpay-verification.util';

describe('Production Bugs 006 - 010 Verification Suite', () => {
  describe('BUG-006 & BUG-008: Razorpay Credentials Validation & Authenticated Encryption', () => {
    it('validates Razorpay Key ID format correctly', () => {
      // Valid formats
      expect(isValidRazorpayKeyId('rzp_test_1DP5mmOlF5G5ag')).toBe(true);
      expect(isValidRazorpayKeyId('rzp_live_abc123XYZ456')).toBe(true);
      expect(isValidRazorpayKeyId('  rzp_test_fixture123  ')).toBe(true);

      // Invalid formats
      expect(isValidRazorpayKeyId('')).toBe(false);
      expect(isValidRazorpayKeyId('   ')).toBe(false);
      expect(isValidRazorpayKeyId('key_test_12345')).toBe(false);
      expect(isValidRazorpayKeyId('rzp_stage_12345')).toBe(false);
      expect(isValidRazorpayKeyId('rzp_test_')).toBe(false);
      expect(isValidRazorpayKeyId('rzp_test_!@#$%')).toBe(false);
      expect(isValidRazorpayKeyId('random_string')).toBe(false);
    });

    it('rejects invalid Razorpay credentials via server-side verification', async () => {
      await expect(
        verifyRazorpayCredentials('rzp_test_invalid_key_999', 'invalid_secret_key_888')
      ).rejects.toThrow(BadRequestException);

      await expect(
        verifyRazorpayCredentials('rzp_test_invalid_key_999', 'invalid_secret_key_888')
      ).rejects.toThrow('Invalid Razorpay Key ID or Secret Key. Please verify your credentials and try again.');
    });

    it('verifies valid mock/fixture test credentials without throwing', async () => {
      const result = await verifyRazorpayCredentials(
        'rzp_test_mock_merchant_key',
        'mock_secret_abc123'
      );
      expect(result.verified).toBe(true);
      expect(result.mode).toBe('test');
      expect(result.keyId).toBe('rzp_test_mock_merchant_key');
    });

    it('correctly encrypts and decrypts secret keys using AES-256-GCM', () => {
      const plaintext = 'rzp_sec_SuperSecretKey123!@#';
      const encrypted = encryptSecret(plaintext);

      // Format must start with enc:v1:
      expect(encrypted.startsWith('enc:v1:')).toBe(true);
      // Plaintext must not be exposed in ciphertext
      expect(encrypted).not.toContain(plaintext);

      // Decryption must restore original plaintext
      const decrypted = decryptSecret(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('preserves backwards compatibility for legacy plaintext records', () => {
      // Legacy records that do not start with enc:v1: should be returned as-is
      expect(decryptSecret('legacy_plaintext_secret')).toBe('legacy_plaintext_secret');
      expect(decryptSecret('pending_setup')).toBe('pending_setup');
      expect(decryptSecret('')).toBe('');
      expect(decryptSecret(null)).toBe('');
    });
  });

  describe('BUG-007: Udyam Registration Number Validation', () => {
    it('accepts valid Udyam Registration Numbers in official format UDYAM-XX-00-0000000', () => {
      expect(isValidUdyamNumber('UDYAM-MH-26-1234567')).toBe(true);
      expect(isValidUdyamNumber('UDYAM-DL-01-0012345')).toBe(true);
      expect(isValidUdyamNumber('UDYAM-KA-03-9999999')).toBe(true);
    });

    it('normalizes lowercase and surrounding whitespace', () => {
      expect(normalizeUdyamNumber('  udyam-mh-26-1234567  ')).toBe('UDYAM-MH-26-1234567');
      expect(isValidUdyamNumber('  udyam-mh-26-1234567  ')).toBe(true);
    });

    it('rejects malformed Udyam Registration Numbers', () => {
      // Missing prefix
      expect(isValidUdyamNumber('MH-26-1234567')).toBe(false);
      // Incorrect state length
      expect(isValidUdyamNumber('UDYAM-M-26-1234567')).toBe(false);
      expect(isValidUdyamNumber('UDYAM-MAH-26-1234567')).toBe(false);
      // Incorrect district code digits
      expect(isValidUdyamNumber('UDYAM-MH-2-1234567')).toBe(false);
      expect(isValidUdyamNumber('UDYAM-MH-260-1234567')).toBe(false);
      // Incorrect sequence digits count
      expect(isValidUdyamNumber('UDYAM-MH-26-123456')).toBe(false);
      expect(isValidUdyamNumber('UDYAM-MH-26-12345678')).toBe(false);
      // Incorrect separators or letters in numeric portions
      expect(isValidUdyamNumber('UDYAM/MH/26/1234567')).toBe(false);
      expect(isValidUdyamNumber('UDYAM_MH_26_1234567')).toBe(false);
      expect(isValidUdyamNumber('UDYAM-MH-AB-1234567')).toBe(false);
      expect(isValidUdyamNumber('INVALID-TEXT')).toBe(false);
      expect(isValidUdyamNumber('@#$%^&*')).toBe(false);
    });
  });

  describe('BUG-009: Product Name Validation', () => {
    it('rejects product names containing only special characters or punctuation', () => {
      expect(isValidProductName('@#$%^&*')).toBe(false);
      expect(isValidProductName('!!!')).toBe(false);
      expect(isValidProductName('₹₹₹')).toBe(false);
      expect(isValidProductName('...')).toBe(false);
      expect(isValidProductName('---')).toBe(false);
      expect(isValidProductName('---///@@@')).toBe(false);
    });

    it('rejects empty, whitespace-only, or emoji-only product names', () => {
      expect(isValidProductName('')).toBe(false);
      expect(isValidProductName('   ')).toBe(false);
      expect(isValidProductName('😀🎉🔥')).toBe(false);
    });

    it('accepts legitimate product names with symbols and punctuation', () => {
      expect(isValidProductName("Men's Formal Shirt")).toBe(true);
      expect(isValidProductName("Women's Saree")).toBe(true);
      expect(isValidProductName('A&B Gift Box')).toBe(true);
      expect(isValidProductName('100% Cotton Shirt')).toBe(true);
      expect(isValidProductName('24K Gold-Plated Necklace')).toBe(true);
      expect(isValidProductName('iPhone 17 Pro')).toBe(true);
      expect(isValidProductName("Men's T-Shirt (Pack of 2)")).toBe(true);
      expect(isValidProductName('5-Star Chocolate')).toBe(true);
      expect(isValidProductName('C++ Programming Book')).toBe(true);
      expect(isValidProductName('Vitamin B12')).toBe(true);
      expect(isValidProductName('₹100 Gift Voucher')).toBe(true);
    });

    it('accepts legitimate multilingual and Indian script product names', () => {
      expect(isValidProductName('श्री गणेश मसाले')).toBe(true);
      expect(isValidProductName('महिला साडी')).toBe(true);
      expect(isValidProductName('कापूस कुर्ता (Cotton Kurta)')).toBe(true);
    });

    it('normalizes internal whitespace properly', () => {
      expect(normalizeProductName('  Men    Cotton    Shirt  ')).toBe('Men Cotton Shirt');
      expect(normalizeProductName('श्री    गणेश   मसाले')).toBe('श्री गणेश मसाले');
    });
  });

  describe('BUG-010: Product Description Length Limit (5,000 characters per language)', () => {
    it('correctly counts user-perceived Unicode graphemes for English, Marathi, Hindi and emojis', () => {
      expect(countGraphemes('Hello World')).toBe(11);
      // Devanagari text with matras / combining marks
      const marathiText = 'उत्तम दर्जाचे कॉटन शर्ट';
      expect(countGraphemes(marathiText)).toBeGreaterThan(0);
      expect(countGraphemes(marathiText)).toBeLessThanOrEqual(marathiText.length);
      // Emojis with modifiers (2 emojis + 14 ascii characters = 16 user-perceived graphemes vs 18 UTF-16 code units)
      expect(countGraphemes('👕 Modern Shirt 🔥')).toBe(16);
    });

    it('accepts descriptions up to 5,000 characters', () => {
      const shortDesc = 'A premium handcrafted pure linen shirt.';
      expect(isValidProductDescription(shortDesc)).toBe(true);

      const exact5000 = 'A'.repeat(5000);
      expect(countGraphemes(exact5000)).toBe(5000);
      expect(isValidProductDescription(exact5000)).toBe(true);

      const marathiDesc = 'उत्कृष्ट सुती कापड, आरामदायक वापर आणि दीर्घकाळ टिकणारा रंग. '.repeat(50);
      expect(isValidProductDescription(marathiDesc)).toBe(true);
    });

    it('rejects descriptions exceeding 5,000 characters', () => {
      const overLimitDesc = 'A'.repeat(5001);
      expect(countGraphemes(overLimitDesc)).toBe(5001);
      expect(isValidProductDescription(overLimitDesc)).toBe(false);

      const longHindiDesc = 'शुद्ध सूती कुर्ता '.repeat(600); // Exceeds 5000 characters
      expect(countGraphemes(longHindiDesc)).toBeGreaterThan(5000);
      expect(isValidProductDescription(longHindiDesc)).toBe(false);
    });

    it('allows empty or null product descriptions (optional field)', () => {
      expect(isValidProductDescription('')).toBe(true);
      expect(isValidProductDescription(null)).toBe(true);
      expect(isValidProductDescription(undefined)).toBe(true);
    });
  });
});
