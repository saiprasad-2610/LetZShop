import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function ThemesAliasPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/brand-studio');
  }, [router]);

  return null;
}
