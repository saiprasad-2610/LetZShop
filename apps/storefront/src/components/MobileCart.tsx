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
      className={'fixed right-3.5 z-40 md:hidden h-12 min-h-[46px] min-w-[46px] flex items-center justify-center gap-2 rounded-full border border-white/40 px-3.5 text-white shadow-xl backdrop-blur-md transition-all active:scale-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 ' +
        (hasProductActions
          ? 'bottom-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]'
          : 'bottom-[calc(env(safe-area-inset-bottom,0px)+1rem)] sm:bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]')}
      style={{ backgroundColor: 'var(--theme-primary, #111827)', color: 'var(--theme-on-primary, #ffffff)' }}
    >
      <ShoppingBag className="h-5 w-5 shrink-0" aria-hidden="true" />
      <span className="text-xs font-bold tracking-tight">{t('storefront.cart')}</span>
      <span data-cart-count aria-hidden="true" className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[var(--store-surface)] store-surface px-1.5 text-[11px] font-black text-[var(--store-text-primary)] shadow-xs">{itemCount}</span>
    </Link>
  );
}
