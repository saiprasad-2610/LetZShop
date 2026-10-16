import React from 'react';
import { ShieldCheck, CreditCard, Truck, Package, CircleCheck, Star, Heart, Leaf, Award, Headphones, Lock, Store } from 'lucide-react';
import { TrustBadgeIconId } from '@simply/ui';

const icons = { shield: ShieldCheck, payment: CreditCard, truck: Truck, package: Package, check: CircleCheck, star: Star, heart: Heart, leaf: Leaf, award: Award, support: Headphones, lock: Lock, store: Store };
export function TrustBadgeIcon({ id }: { id: TrustBadgeIconId }) {
  const Icon = icons[id];
  return <Icon className="w-5 h-5" aria-hidden="true" data-trust-icon={id} />;
}
