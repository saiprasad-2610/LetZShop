export function planAvailability(plan: {
  code: string;
  isPublic: boolean;
  pricePaise: number;
}) {
  if (plan.code.toUpperCase().includes('GROWTH'))
    return { availability: 'COMING_SOON', purchasable: false };
  if (plan.code.toUpperCase().includes('CUSTOM'))
    return { availability: 'CONTACT', purchasable: false };
  return {
    availability: plan.isPublic ? 'AVAILABLE' : 'HIDDEN',
    purchasable: plan.isPublic && plan.pricePaise > 0,
  };
}
