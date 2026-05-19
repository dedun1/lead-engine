'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const G_SEQUENCE_MS = 1000;

const NAV_KEYS: Record<string, string> = {
  h: '/dashboard',
  p: '/pipeline',
  q: '/call-queue',
  n: '/niches',
  t: '/hot-list',
  s: '/settings',
};

export function useGlobalKeyboardShortcuts(onHelp: () => void) {
  const router = useRouter();
  const awaitingNav = useRef(false);
  const navTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const clearNavWait = () => {
      awaitingNav.current = false;
      if (navTimer.current) clearTimeout(navTimer.current);
      navTimer.current = null;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName?.toLowerCase();
      if (
        tag === 'input' ||
        tag === 'textarea' ||
        tag === 'select' ||
        target?.isContentEditable
      ) {
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        e.preventDefault();
        onHelp();
        return;
      }

      if (e.key === 'Escape') return;

      if (awaitingNav.current) {
        const href = NAV_KEYS[e.key.toLowerCase()];
        if (href) {
          e.preventDefault();
          clearNavWait();
          router.push(href);
        }
        return;
      }

      if (e.key.toLowerCase() === 'g' && !e.metaKey && !e.ctrlKey && !e.altKey) {
        awaitingNav.current = true;
        navTimer.current = setTimeout(clearNavWait, G_SEQUENCE_MS);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      clearNavWait();
    };
  }, [router, onHelp]);
}
