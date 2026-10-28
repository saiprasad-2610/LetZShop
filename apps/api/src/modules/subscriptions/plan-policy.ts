export function planAvailability(plan: {
  code: string;
  isPublic: boolean;
  pricePaise: number;
  paymentType?: string | null;
  status?: string | null;
}) {
  if (plan.status === 'INACTIVE') {
    return { availability: 'HIDDEN' as const, purchasable: false };
  }
  if (plan.paymentType === 'CONTACT_TEAM') {
    return { availability: 'CONTACT' as const, purchasable: false };
  }
  if (plan.paymentType === 'ONLINE_INSTANT') {
    return {
      availability: plan.isPublic ? ('AVAILABLE' as const) : ('HIDDEN' as const),
      purchasable: Boolean(plan.isPublic && plan.pricePaise > 0),
    };
  }
  if (plan.code.toUpperCase().includes('GROWTH'))
    return { availability: 'COMING_SOON' as const, purchasable: false };
  if (plan.code.toUpperCase().includes('CUSTOM'))
    return { availability: 'CONTACT' as const, purchasable: false };
  return {
    availability: plan.isPublic ? ('AVAILABLE' as const) : ('HIDDEN' as const),
    purchasable: Boolean(plan.isPublic && plan.pricePaise > 0),
  };
}
