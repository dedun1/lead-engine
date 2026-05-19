export const ONBOARDING_STEPS = {
  welcome: 1,
  profile: 2,
  apiKey: 3,
  niche: 4,
  done: 5,
} as const;

export type OnboardingStep = (typeof ONBOARDING_STEPS)[keyof typeof ONBOARDING_STEPS];

export type OnboardingContext = {
  memberId: string;
  email: string;
  displayName: string | null;
  role: string;
  completedOnboarding: boolean;
  anthropicKeyDeferred: boolean;
  /** First active member in the org — picks a niche in onboarding. */
  showNicheStep: boolean;
  isAdmin: boolean;
};
