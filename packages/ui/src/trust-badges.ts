export const TRUST_BADGE_ICONS = [
  { id: 'shield', label: 'Shield / Verified' },
  { id: 'payment', label: 'Secure Payment / Card' },
  { id: 'truck', label: 'Delivery Truck' },
  { id: 'package', label: 'Package / Box' },
  { id: 'check', label: 'Quality / Check' },
  { id: 'star', label: 'Star' },
  { id: 'heart', label: 'Heart' },
  { id: 'leaf', label: 'Leaf / Natural' },
  { id: 'award', label: 'Award / Badge' },
  { id: 'support', label: 'Customer Support' },
  { id: 'lock', label: 'Lock / Secure' },
  { id: 'store', label: 'Store / Merchant' },
] as const;

export type TrustBadgeIconId = typeof TRUST_BADGE_ICONS[number]['id'];
export function resolveTrustBadgeIcon(value: unknown, fallback: TrustBadgeIconId): TrustBadgeIconId {
  return TRUST_BADGE_ICONS.some((icon) => icon.id === value) ? value as TrustBadgeIconId : fallback;
}
