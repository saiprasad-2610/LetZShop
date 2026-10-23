import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShoppingBag } from 'lucide-react';
import { useStorefrontI18n } from '@simply/i18n';
import { useCart } from '../context/CartContext';
import { buildPreviewPath } from '../utils/preview';

export function MobileCart({ slug }: { slug: string }) {
  const router = useRouter();
  const { itemCount } = useCart();
  const { t } = useStorefrontI18n();
  if (router.pathname.endsWith('/cart') || router.pathname.endsWith('/checkout')) return null;
  const hasProductActions = router.pathname.endsWith('/product/[id]');

  return (
    <Link
      href={buildPreviewPath('/store/' + slug + '/cart', router.query)}
      data-mobile-cart
      aria-label={t('storefront.cart') + ' (' + itemCount + ')'}
      className={'fixed right-4 z-50 md:hidden min-h-14 min-w-14 flex items-center justify-center gap-2 rounded-full border border-white/70 px-4 text-white shadow-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
        (hasProductActions
          ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+6rem)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]'
          : 'bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]')}
      style={{ backgroundColor: 'var(--theme-primary, #111827)', color: 'var(--theme-on-primary, #ffffff)' }}
    >
      <ShoppingBag className="h-6 w-6" aria-hidden="true" />
      <span className="text-sm font-semibold">{t('storefront.cart')}</span>
      <span data-cart-count aria-hidden="true" className="flex min-h-6 min-w-6 items-center justify-center rounded-full bg-[var(--store-surface)] store-surface px-1.5 text-xs font-bold text-[var(--store-text-primary)]">{itemCount}</span>
    </Link>
  );
}
