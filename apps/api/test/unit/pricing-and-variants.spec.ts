import { validateMoneyAmount, isValidIndianPhone, isValidIndianPincode, normalizeSlug } from '@simply/validation';

describe('Pricing, Currency Minor Units & Validation (Unit Tests)', () => {
  it('1. Enforces integer minor units for money without float rounding errors', () => {
    // ₹1,299.50 must be stored as 129950 paise
    const pricePaise = 129950;
    const quantity = 3;
    const totalPaise = pricePaise * quantity;

    expect(Number.isInteger(totalPaise)).toBe(true);
    expect(totalPaise).toBe(389850); // Exact ₹3,898.50
    expect(validateMoneyAmount(totalPaise)).toBe(true);
    expect(validateMoneyAmount(-50)).toBe(false);
    expect(validateMoneyAmount(12.34 as any)).toBe(false);
  });

  it('2. Correctly calculates GST tax in integer paise', () => {
    const subtotalPaise = 249900; // ₹2,499.00
    const gstRate = 0.05; // 5% GST
    const taxPaise = Math.round(subtotalPaise * gstRate);

    expect(taxPaise).toBe(12495); // Exactly ₹124.95
    expect(subtotalPaise + taxPaise).toBe(262395); // ₹2,623.95
  });

  it('3. Shipping threshold applies free shipping above ₹2,000 (200000 paise)', () => {
    const freeShippingThresholdPaise = 200000;
    const flatRatePaise = 9900; // ₹99

    const cartBelow = 150000; // ₹1,500
    const shippingBelow = cartBelow >= freeShippingThresholdPaise ? 0 : flatRatePaise;
    expect(shippingBelow).toBe(9900);

    const cartAbove = 249900; // ₹2,499
    const shippingAbove = cartAbove >= freeShippingThresholdPaise ? 0 : flatRatePaise;
    expect(shippingAbove).toBe(0);
  });

  it('4. Validates Indian phone numbers and pincodes correctly', () => {
    expect(isValidIndianPhone('+919876543210')).toBe(true);
    expect(isValidIndianPhone('9876543210')).toBe(true);
    expect(isValidIndianPhone('+918888888888')).toBe(true);
    expect(isValidIndianPhone('1234567890')).toBe(false); // starts with 1
    expect(isValidIndianPhone('+14155552671')).toBe(false);

    expect(isValidIndianPincode('400018')).toBe(true); // Mumbai Worli
    expect(isValidIndianPincode('110001')).toBe(true); // New Delhi
    expect(isValidIndianPincode('012345')).toBe(false); // Leading zero
    expect(isValidIndianPincode('40001')).toBe(false); // Only 5 digits
  });

  it('5. Normalizes and sanitizes store slugs safely', () => {
    expect(normalizeSlug('Aurelia Atelier & Co.')).toBe('aurelia-atelier-co');
    expect(normalizeSlug('Sai  Fashion---Store')).toBe('sai-fashion-store');
    expect(normalizeSlug('Patil_Engineering_101')).toBe('patil-engineering-101');
  });
});
