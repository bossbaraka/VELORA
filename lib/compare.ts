import type { Property } from "./types";
export const COMPARE_METRICS = [
  "privacy",
  "outdoor",
  "family",
  "investment",
  "waterfront",
  "downtown",
] as const;
export type Difference = {
  winner: string;
  loser: string;
  metric: (typeof COMPARE_METRICS)[number];
  delta: number;
};
export function differences(a: Property, b: Property): Difference[] {
  const all = COMPARE_METRICS.map((metric) => {
    const av =
      metric === "waterfront"
        ? a.location.waterfront_min
        : metric === "downtown"
          ? a.location.downtown_min
          : a.scores[metric];
    const bv =
      metric === "waterfront"
        ? b.location.waterfront_min
        : metric === "downtown"
          ? b.location.downtown_min
          : b.scores[metric];
    const lower = metric === "waterfront" || metric === "downtown";
    const aWins = lower ? av < bv : av > bv;
    return {
      winner: aWins ? a.id : b.id,
      loser: aWins ? b.id : a.id,
      metric,
      delta: Math.abs(av - bv),
    };
  })
    .filter((d) => d.delta > 0)
    .sort((a, b) => b.delta - a.delta);
  const first = all[0];
  if (!first) return [];
  const other = all.find((d) => d.winner !== first.winner);
  return [first, ...(other ? [other] : all.slice(1, 2))];
}
