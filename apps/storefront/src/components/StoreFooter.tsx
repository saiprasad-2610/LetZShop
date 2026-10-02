import React from 'react';
import Link from 'next/link';
import { ShieldCheck, Truck, CreditCard, Heart, MapPin, Phone, Mail } from 'lucide-react';
import { getWordmark } from '@simply/ui';

interface StoreFooterProps {
  store: any;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({ store }) => {
  const wordmark = getWordmark(store.name || 'Store');
  const slug = store.slug;

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Value Proposition Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-12 border-b border-gray-800 text-sm">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-800 text-emerald-400">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Secure Indian Payments</p>
              <p className="text-xs text-gray-400">UPI, Netbanking & Cards via Razorpay</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-800 text-amber-400">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Reliable Pan-India Delivery</p>
              <p className="text-xs text-gray-400">Doorstep tracking via premier couriers</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gray-800 text-indigo-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="font-bold text-white">Verified Authentic Goods</p>
              <p className="text-xs text-gray-400">Direct from certified merchant business</p>
            </div>
          </div>
        </div>

        {/* Business Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-3 md:col-span-2">
            <div className="flex items-center gap-2">
              <span
                className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-xs text-white"
                style={{ backgroundColor: 'var(--theme-accent, #D97706)' }}
              >
                {wordmark.monogram}
              </span>
              <span className="font-bold text-lg text-white">{store.name}</span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm">
              Official digital storefront. Order genuine products online directly with transparent pricing and doorstep delivery.
            </p>
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <p className="font-bold text-xs uppercase tracking-wider text-gray-400">Navigation</p>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>
                <Link href={`/store/${slug}`} className="hover:text-white transition">
                  Storefront Home
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/search`} className="hover:text-white transition">
                  Browse Catalog
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/cart`} className="hover:text-white transition">
                  Shopping Cart
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/search?featured=true`} className="hover:text-white transition">
                  Featured Products
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <p className="font-bold text-xs uppercase tracking-wider text-gray-400">Contact Us</p>
            <ul className="space-y-2 text-xs text-gray-400">
              {store.contactPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span>{store.contactPhone}</span>
                </li>
              )}
              {store.contactEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span>{store.contactEmail}</span>
                </li>
              )}
              {store.address && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <span>{store.address}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Compliance */}
        <div className="pt-8 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} {store.name}. All rights reserved. DPDPA 2023 Compliant.</p>
          <p className="flex items-center gap-1 text-[11px]">
            Powered by <span className="font-semibold text-gray-400">Simply E-Commerce SaaS</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
