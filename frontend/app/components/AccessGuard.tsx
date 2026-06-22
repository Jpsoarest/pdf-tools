'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { canAccessGeneralModule, readSessionUser } from '../lib/session';

function isPublicPath(pathname: string) {
  return pathname === '/';
}

function isOficioPath(pathname: string) {
  return pathname === '/4oficio' || pathname.startsWith('/4oficio/');
}

export default function AccessGuard() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || isPublicPath(pathname) || isOficioPath(pathname)) return;

    const user = readSessionUser();
    if (!user) {
      router.replace('/');
      return;
    }

    if (pathname === '/geral' && !canAccessGeneralModule(user)) {
      router.replace('/4oficio');
    }
  }, [pathname, router]);

  return null;
}
