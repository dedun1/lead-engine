'use client';

import { useEffect, useState } from 'react';
import { elapsedSecondsSince, formatDurationHms } from '@/lib/calls/format-duration';

/** Ticking call timer; stops updating when frozen is true. */
export function useCallDurationTimer(
  startedAt: string | null,
  frozen: boolean,
  frozenSeconds: number | null,
) {
  const [display, setDisplay] = useState('00:00:00');

  useEffect(() => {
    if (!startedAt) {
      setDisplay('00:00:00');
      return;
    }

    const update = () => {
      const secs = elapsedSecondsSince(
        startedAt,
        frozen && frozenSeconds != null ? frozenSeconds : undefined,
      );
      setDisplay(formatDurationHms(secs));
    };

    update();
    if (frozen) return;

    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [startedAt, frozen, frozenSeconds]);

  return display;
}
