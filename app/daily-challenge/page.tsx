import type { Metadata } from "next";
import { DailyChallengeClient } from "./DailyChallengeClient";

export const metadata: Metadata = {
  title: "每日一题",
  description: "每天 3 道随机题, 巩固学习成果, 30 秒一道。",
};

export default function DailyChallengePage() {
  return <DailyChallengeClient />;
}
