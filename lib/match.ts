import { INTENT_WEIGHTS } from "@/constants/intents";
import { CONFIG } from "@/constants/config";
import type { Intent, Property, Scores } from "./types";
export function matchScore(p: Property, intent: Intent) {
  return Math.round(
    Object.entries(INTENT_WEIGHTS[intent]).reduce(
      (sum, [k, w]) => sum + w * p.scores[k as keyof Scores],
      0,
    ),
  );
}
export function contributors(p: Property, intent: Intent) {
  return (Object.keys(p.scores) as (keyof Scores)[])
    .sort(
      (a, b) =>
        p.scores[b] * INTENT_WEIGHTS[intent][b] -
        p.scores[a] * INTENT_WEIGHTS[intent][a],
    )
    .slice(0, 2);
}
export function contextualLabel(p: Property, set: Property[], intent: Intent) {
  if (p.is_private) return "private";
  if (p.availability !== "available") return p.availability;
  if (
    intent === "private" &&
    p.scores.privacy === Math.max(...set.map((x) => x.scores.privacy))
  )
    return "privacy";
  if (intent === "family" && p.scores.family >= CONFIG.scoreThreshold)
    return "family";
  if (intent === "investment" && p.scores.investment >= CONFIG.scoreThreshold)
    return "investment";
  if (p.location.waterfront_min <= CONFIG.waterfrontThreshold)
    return "waterfront";
  return p.label === "new" ? "new" : "selected";
}
