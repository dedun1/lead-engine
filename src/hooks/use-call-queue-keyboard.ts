'use client';

import { useEffect } from 'react';

function isTypingTarget(el: EventTarget | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  const tag = el.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true;
  return el.isContentEditable;
}

export type CallQueueKeyboardHandlers = {
  onNext: () => void;
  onPrev: () => void;
  onCall: () => void;
  onSkipDead: () => void;
  onFocusNotes: () => void;
  onShowHelp: () => void;
  enabled?: boolean;
};

export function useCallQueueKeyboard({
  onNext,
  onPrev,
  onCall,
  onSkipDead,
  onFocusNotes,
  onShowHelp,
  enabled = true,
}: CallQueueKeyboardHandlers) {
  useEffect(() => {
    if (!enabled) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const active = document.activeElement as HTMLElement | null;
        if (active && isTypingTarget(active)) {
          active.blur();
          e.preventDefault();
        }
        return;
      }

      if (isTypingTarget(e.target)) return;

      const key = e.key.toLowerCase();
      if (key === 'j' || e.key === 'ArrowDown') {
        e.preventDefault();
        onNext();
        return;
      }
      if (key === 'k' || e.key === 'ArrowUp') {
        e.preventDefault();
        onPrev();
        return;
      }
      if (key === 'c' || e.key === ' ') {
        e.preventDefault();
        onCall();
        return;
      }
      if (key === 'n') {
        e.preventDefault();
        onSkipDead();
        return;
      }
      if (key === 'f') {
        e.preventDefault();
        onFocusNotes();
        return;
      }
      if (e.key === '?' || (e.shiftKey && key === '/')) {
        e.preventDefault();
        onShowHelp();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    enabled,
    onNext,
    onPrev,
    onCall,
    onSkipDead,
    onFocusNotes,
    onShowHelp,
  ]);
}
