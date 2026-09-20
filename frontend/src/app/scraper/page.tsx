'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ScraperRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/scrape');
  }, [router]);

  return null;
}
