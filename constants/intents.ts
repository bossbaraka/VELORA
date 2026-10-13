import type { Intent, Scores } from "@/lib/types";
export const INTENT_WEIGHTS: Record<Intent, Scores> = {
  home: { privacy: 0.15, outdoor: 0.45, family: 0.25, investment: 0.15 },
  investment: { investment: 0.6, outdoor: 0.1, privacy: 0.1, family: 0.2 },
  retreat: { privacy: 0.4, outdoor: 0.45, family: 0.1, investment: 0.05 },
  family: { family: 0.6, privacy: 0.15, outdoor: 0.2, investment: 0.05 },
  private: { privacy: 0.7, outdoor: 0.15, family: 0.1, investment: 0.05 },
};
export const INTENTS = Object.keys(INTENT_WEIGHTS) as Intent[];
