"use client";

import { useAuth } from "@/components/auth-provider";
import { Onboarding } from "./Onboarding";

/** 在 AuthProvider 内部挂载 Onboarding, 自动拿 user.onboardingStep */
export function OnboardingMount() {
  const { user, ready } = useAuth();
  if (!ready) return null;
  return <Onboarding step={user?.onboardingStep ?? 0} isLoggedIn={!!user} />;
}
