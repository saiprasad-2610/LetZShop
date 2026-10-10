import React from 'react';
import Link from 'next/link';
import { 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Heart, 
  MapPin, 
  Phone, 
  Mail,
  Instagram,
  Facebook,
  Twitter,
  Youtube,
  Linkedin,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import { getWordmark } from '@simply/ui';

interface StoreFooterProps {
  store: any;
  themeConfig?: any;
}

export const StoreFooter: React.FC<StoreFooterProps> = ({ store, themeConfig }) => {
  const wordmark = getWordmark(store.name || 'Store');
  const slug = store.slug;

  const footerConfig = themeConfig?.footer || {};
  const socialLinks = footerConfig.socialLinks !== undefined ? (footerConfig.socialLinks || {}) : (store.socialLinks || {});

  const cleanUrl = (
    rawUrl?: string | null,
    type?: 'instagram' | 'facebook' | 'twitter' | 'youtube' | 'linkedin' | 'whatsapp'
  ): string => {
    if (!rawUrl || typeof rawUrl !== 'string') return '';
    const trimmed = rawUrl.trim();
    if (!trimmed) return '';
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return trimmed;
    }
    if (type === 'whatsapp') {
      const digits = trimmed.replace(/\D/g, '');
      return digits.length >= 7 ? `https://wa.me/${digits}` : '';
    }
    if (type === 'instagram') {
      const handle = trimmed.replace(/^@/, '').trim();
      return handle ? `https://instagram.com/${handle}` : '';
    }
    if (type === 'twitter') {
      const handle = trimmed.replace(/^@/, '').trim();
      return handle ? `https://x.com/${handle}` : '';
    }
    if (type === 'facebook') {
      const user = trimmed.replace(/^@/, '').trim();
      return user ? `https://facebook.com/${user}` : '';
    }
    if (type === 'youtube') {
      const handle = trimmed.startsWith('@') ? trimmed : `@${trimmed}`;
      return trimmed ? `https://youtube.com/${handle}` : '';
    }
    if (type === 'linkedin') {
      const handle = trimmed.replace(/^@/, '').trim();
      return handle ? `https://linkedin.com/company/${handle}` : '';
    }
    return `https://${trimmed}`;
  };

  const instagramUrl = cleanUrl(socialLinks?.instagram, 'instagram');
  const facebookUrl = cleanUrl(socialLinks?.facebook, 'facebook');
  const whatsappUrl = cleanUrl(socialLinks?.whatsapp, 'whatsapp');
  const youtubeUrl = cleanUrl(socialLinks?.youtube, 'youtube');
  const twitterUrl = cleanUrl(socialLinks?.twitter, 'twitter');
  const linkedinUrl = cleanUrl(socialLinks?.linkedin, 'linkedin');

  const hasAnySocial = Boolean(
    instagramUrl || facebookUrl || whatsappUrl || youtubeUrl || twitterUrl || linkedinUrl
  );

  const footerDescription =
    footerConfig.description ||
    store.description ||
    'Official digital storefront. Order genuine products online directly with transparent pricing and doorstep delivery.';

  const contactPhone = footerConfig.contactPhone || store.contactPhone || store.supportPhone;
  const contactEmail = footerConfig.contactEmail || store.contactEmail || store.supportEmail;
  const contactAddress = footerConfig.address || store.address || store.businessAddress;

  const showTrustBadges = footerConfig.showTrustBadges ?? true;
  const trustBadge1Title = footerConfig.trustBadge1Title || 'Secure Indian Payments';
  const trustBadge1Subtitle = footerConfig.trustBadge1Subtitle || 'UPI, Netbanking & Cards via Razorpay';
  const trustBadge2Title = footerConfig.trustBadge2Title || 'Reliable Pan-India Delivery';
  const trustBadge2Subtitle = footerConfig.trustBadge2Subtitle || 'Doorstep tracking via premier couriers';
  const trustBadge3Title = footerConfig.trustBadge3Title || 'Verified Authentic Goods';
  const trustBadge3Subtitle = footerConfig.trustBadge3Subtitle || 'Direct from certified merchant business';

  const rawCopyright =
    footerConfig.copyrightText ||
    `© ${new Date().getFullYear()} ${store.name}. All rights reserved.`;
  const copyrightText = rawCopyright.replace(/\.?\s*DPDPA\s*2023\s*Compliant\.?/gi, '').trim();

  return (
    <footer className="bg-gray-900 text-white border-t border-gray-800 pt-12 pb-8 mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        {/* Value Proposition Strip */}
        {showTrustBadges && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pb-12 border-b border-gray-800 text-sm">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gray-800 text-emerald-400 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">{trustBadge1Title}</p>
                <p className="text-xs text-gray-400">{trustBadge1Subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gray-800 text-amber-400 shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">{trustBadge2Title}</p>
                <p className="text-xs text-gray-400">{trustBadge2Subtitle}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gray-800 text-indigo-400 shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <p className="font-bold text-white">{trustBadge3Title}</p>
                <p className="text-xs text-gray-400">{trustBadge3Subtitle}</p>
              </div>
            </div>
          </div>
        )}

        {/* Business Columns */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-sm">
          <div className="space-y-4 md:col-span-2">
            <div className="flex items-center gap-2">
              <span
                className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-xs text-white"
                style={{ backgroundColor: 'var(--theme-accent, #D97706)' }}
              >
                {wordmark.monogram}
              </span>
              <span className="font-bold text-lg text-white">{store.name}</span>
            </div>
            <p className="text-xs text-gray-400 max-w-sm leading-relaxed">
              {footerDescription}
            </p>

            {/* Social Media Links Section */}
            {hasAnySocial && (
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                  Connect With Us
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  {instagramUrl && (
                    <a
                      href={instagramUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gray-800/90 text-gray-300 hover:text-pink-400 hover:bg-pink-500/10 hover:border-pink-500/30 border border-gray-700/80 transition shadow-xs flex items-center gap-1.5 text-xs font-semibold group"
                      title="Follow on Instagram"
                    >
                      <Instagram className="w-4 h-4 text-pink-400 group-hover:scale-110 transition" />
                      <span className="text-[11px]">Instagram</span>
                    </a>
                  )}

                  {whatsappUrl && (
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gray-800/90 text-gray-300 hover:text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 border border-gray-700/80 transition shadow-xs flex items-center gap-1.5 text-xs font-semibold group"
                      title="Chat on WhatsApp"
                    >
                      <MessageCircle className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                      <span className="text-[11px]">WhatsApp</span>
                    </a>
                  )}

                  {facebookUrl && (
                    <a
                      href={facebookUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gray-800/90 text-gray-300 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 border border-gray-700/80 transition shadow-xs flex items-center gap-1.5 text-xs font-semibold group"
                      title="Follow on Facebook"
                    >
                      <Facebook className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                      <span className="text-[11px]">Facebook</span>
                    </a>
                  )}

                  {youtubeUrl && (
                    <a
                      href={youtubeUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gray-800/90 text-gray-300 hover:text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/30 border border-gray-700/80 transition shadow-xs flex items-center gap-1.5 text-xs font-semibold group"
                      title="Subscribe on YouTube"
                    >
                      <Youtube className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
                      <span className="text-[11px]">YouTube</span>
                    </a>
                  )}

                  {twitterUrl && (
                    <a
                      href={twitterUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gray-800/90 text-gray-300 hover:text-sky-400 hover:bg-sky-500/10 hover:border-sky-500/30 border border-gray-700/80 transition shadow-xs flex items-center gap-1.5 text-xs font-semibold group"
                      title="Follow on Twitter / X"
                    >
                      <Twitter className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
                      <span className="text-[11px]">Twitter</span>
                    </a>
                  )}

                  {linkedinUrl && (
                    <a
                      href={linkedinUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl bg-gray-800/90 text-gray-300 hover:text-blue-400 hover:bg-blue-500/10 hover:border-blue-500/30 border border-gray-700/80 transition shadow-xs flex items-center gap-1.5 text-xs font-semibold group"
                      title="Connect on LinkedIn"
                    >
                      <Linkedin className="w-4 h-4 text-blue-400 group-hover:scale-110 transition" />
                      <span className="text-[11px]">LinkedIn</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Quick Links */}
          <div className="space-y-2">
            <p className="font-bold text-xs uppercase tracking-wider text-gray-400">Navigation</p>
            <ul className="space-y-1.5 text-xs text-gray-400">
              <li>
                <Link href={`/store/${slug}`} className="hover:text-white transition">
                  Home
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/products`} className="hover:text-white transition">
                  All Products
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/about`} className="hover:text-white transition">
                  About Us
                </Link>
              </li>
              <li>
                <Link href={`/store/${slug}/cart`} className="hover:text-white transition">
                  Shopping Cart
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-2">
            <p className="font-bold text-xs uppercase tracking-wider text-gray-400">Contact Us</p>
            <ul className="space-y-2 text-xs text-gray-400">
              {contactPhone && (
                <li className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono">{contactPhone}</span>
                </li>
              )}
              {contactEmail && (
                <li className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono">{contactEmail}</span>
                </li>
              )}
              {contactAddress && (
                <li className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  <span>{contactAddress}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Compliance */}
        <div className="pt-8 border-t border-gray-800 text-xs text-gray-500 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>{copyrightText}</p>
          <p className="flex items-center gap-1 text-[11px]">
            Powered by <span className="font-semibold text-gray-400">Simply E-Commerce SaaS</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
