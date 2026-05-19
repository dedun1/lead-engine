'use client';

import { useState } from 'react';
import { OnboardingModal } from '@/app/(app)/onboarding/onboarding-modal';
import { KeyboardShortcutsDialog } from '@/components/keyboard-shortcuts-dialog';
import { useGlobalKeyboardShortcuts } from '@/hooks/use-global-keyboard-shortcuts';
import type { OnboardingContext } from '@/lib/onboarding/state';
import type { NicheRecord } from '@/lib/niches/types';

type Props = {
  children: React.ReactNode;
  onboarding: OnboardingContext | null;
  shortlistNiches: NicheRecord[];
};

export function AppShell({ children, onboarding, shortlistNiches }: Props) {
  const [helpOpen, setHelpOpen] = useState(false);
  useGlobalKeyboardShortcuts(() => setHelpOpen(true));

  const showOnboarding =
    onboarding != null && !onboarding.completedOnboarding;

  return (
    <>
      {children}
      <KeyboardShortcutsDialog open={helpOpen} onOpenChange={setHelpOpen} />
      {showOnboarding && (
        <OnboardingModal ctx={onboarding} niches={shortlistNiches} />
      )}
    </>
  );
}
