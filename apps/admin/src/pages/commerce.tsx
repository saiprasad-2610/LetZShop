import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function CommerceRedirect() {
  const router = useRouter();

  useEffect(() => {
    if (router.isReady) {
      const query = { ...router.query };
      delete query.path;
      void router.replace({
        pathname: '/orders',
        query,
      });
    }
  }, [router.isReady, router.query, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-admin-bg text-admin-muted text-sm">
      Redirecting to Orders...
    </div>
  );
}
