'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import {
  ONBOARDING_STEPS,
  type OnboardingContext,
  type OnboardingStep,
} from '@/lib/onboarding/state';
import type { NicheRecord } from '@/lib/niches/types';
import { StepWelcome } from './step-1-welcome';
import { StepProfile } from './step-2-profile';
import { StepApiKey } from './step-3-api-key';
import { StepNiche } from './step-4-niche';
import { StepDone } from './step-5-done';

const TITLES: Record<number, string> = {
  1: 'Welcome',
  2: 'Your profile',
  3: 'Anthropic API key',
  4: 'Pick a niche',
  5: 'All set',
};

export function OnboardingModal({
  ctx,
  niches,
}: {
  ctx: OnboardingContext;
  niches: NicheRecord[];
}) {
  const steps = useMemo((): OnboardingStep[] => {
    const list: OnboardingStep[] = [
      ONBOARDING_STEPS.welcome,
      ONBOARDING_STEPS.profile,
      ONBOARDING_STEPS.apiKey,
    ];
    if (ctx.showNicheStep) list.push(ONBOARDING_STEPS.niche);
    list.push(ONBOARDING_STEPS.done);
    return list;
  }, [ctx.showNicheStep]);

  const [stepIndex, setStepIndex] = useState(0);
  const [open, setOpen] = useState(true);
  const current = steps[stepIndex] ?? ONBOARDING_STEPS.done;
  const progress = ((stepIndex + 1) / steps.length) * 100;

  const next = () => setStepIndex((i) => Math.min(i + 1, steps.length - 1));

  if (!open) return null;

  return (
    <Dialog open={open} onOpenChange={() => undefined}>
      <DialogContent
        className="sm:max-w-lg"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>{TITLES[current] ?? 'Setup'}</DialogTitle>
          <DialogDescription>
            Step {stepIndex + 1} of {steps.length}
          </DialogDescription>
        </DialogHeader>
        <Progress value={progress} className="h-1" />
        {current === ONBOARDING_STEPS.welcome && <StepWelcome onContinue={next} />}
        {current === ONBOARDING_STEPS.profile && (
          <StepProfile ctx={ctx} onContinue={next} />
        )}
        {current === ONBOARDING_STEPS.apiKey && (
          <StepApiKey isAdmin={ctx.isAdmin} onContinue={next} />
        )}
        {current === ONBOARDING_STEPS.niche && (
          <StepNiche niches={niches} onContinue={next} />
        )}
        {current === ONBOARDING_STEPS.done && (
          <StepDone onFinished={() => setOpen(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
