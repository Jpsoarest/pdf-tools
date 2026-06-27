'use client';

import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { canAccessGeneralModule, readSessionUser, SESSION_CHANGE_EVENT } from './session';

const MODULE_CONTEXT_KEY = 'pdf-tools-module-context';

export function useOficioMode() {
  const pathname = usePathname();
  const [enabled, setEnabled] = useState(pathname?.startsWith('/4oficio') ?? false);

  useEffect(() => {
    const sync = () => {
      const pathIsOficio = pathname === '/4oficio' || pathname?.startsWith('/4oficio/');
      const queryIsOficio = new URLSearchParams(window.location.search).get('module') === '4oficio';
      const user = readSessionUser();
      const restrictedToOficio = Boolean(user && !canAccessGeneralModule(user));

      if (pathIsOficio || queryIsOficio) {
        sessionStorage.setItem(MODULE_CONTEXT_KEY, '4oficio');
      } else if (pathname === '/' || pathname === '/geral') {
        sessionStorage.removeItem(MODULE_CONTEXT_KEY);
      }

      const savedContext = sessionStorage.getItem(MODULE_CONTEXT_KEY) === '4oficio';
      setEnabled(Boolean(pathIsOficio || queryIsOficio || restrictedToOficio || savedContext));
    };

    sync();
    window.addEventListener(SESSION_CHANGE_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(SESSION_CHANGE_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [pathname]);

  return enabled;
}
