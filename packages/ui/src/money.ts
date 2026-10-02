// ==============================================================================
// Simply E-Commerce: Indian Rupee Currency Formatter
// Integer Minor Units (Paise: ₹1,299.50 = 129950 paise)
// ==============================================================================

export function formatPaise(amountPaise: number | null | undefined, forceDecimals = false): string {
  if (amountPaise == null || isNaN(amountPaise)) {
    return '₹0';
  }

  const rupees = amountPaise / 100;
  const hasSubRupee = amountPaise % 100 !== 0;

  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: forceDecimals || hasSubRupee ? 2 : 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function parseRupeesToPaise(rupeeStringOrNumber: string | number): number {
  if (typeof rupeeStringOrNumber === 'number') {
    return Math.round(rupeeStringOrNumber * 100);
  }

  const clean = rupeeStringOrNumber.replace(/[^0-9.]/g, '');
  const val = parseFloat(clean);
  if (isNaN(val)) return 0;
  return Math.round(val * 100);
}
