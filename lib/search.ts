import { SEARCH } from "@/constants/search";
import { CONFIG } from "@/constants/config";
import type { Property, SearchParams } from "./types";
export function normalizeArabic(text: string) {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 1632));
}
export function parseSearch(query: string): SearchParams {
  let q = normalizeArabic(query);
  const p: SearchParams = { lifestyle: [], features: [] };
  for (const [word, n] of Object.entries(SEARCH.numbers).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    q = q.replace(new RegExp(`(^|[\\sب])${word}(?=\\s|$)`, "g"), `$1${n}`);
  }
  const bedroom = q.match(/(\d+)\s*(?:bed(?:room)?s?|غرف)/);
  if (bedroom) p.bedrooms = Number(bedroom[1]);
  for (const [type, words] of Object.entries(SEARCH.types)) {
    if (words.some((w) => q.includes(w))) p.type = type as Property["type"];
  }
  for (const [life, words] of Object.entries(SEARCH.lifestyle)) {
    if (words.some((w) => q.includes(w))) p.lifestyle.push(life);
  }
  if (SEARCH.waterfront.some((w) => q.includes(w))) p.waterfront = true;
  for (const [loc, words] of Object.entries(SEARCH.locations)) {
    if (words.some((w) => q.includes(w))) p.location = loc;
  }
  for (const [feature, words] of Object.entries(SEARCH.features)) {
    if (words.some((w) => q.includes(w))) p.features.push(feature);
  }
  return p;
}
export function searchDistance(p: Property, s: SearchParams) {
  let d = 0;
  if (s.type && p.type !== s.type) d += 40;
  if (s.bedrooms !== undefined) d += Math.abs(p.bedrooms - s.bedrooms) * 10;
  if (s.waterfront && p.location.waterfront_min > CONFIG.waterfrontThreshold)
    d += p.location.waterfront_min - CONFIG.waterfrontThreshold;
  if (
    s.location &&
    !normalizeArabic(
      p.location.district.en + " " + p.location.city.en,
    ).includes(s.location)
  )
    d += 25;
  for (const x of s.lifestyle) {
    const v =
      x === "quiet"
        ? p.scores.privacy
        : x === "family"
          ? p.scores.family
          : p.scores.investment;
    d += Math.max(0, CONFIG.scoreThreshold - v);
  }
  for (const f of s.features) if (!p.tags.includes(f)) d += 20;
  return d;
}
export function filterProperties(properties: Property[], params: SearchParams) {
  return properties.filter(
    (p) => !p.is_private && searchDistance(p, params) === 0,
  );
}
export const closestProperties = (p: Property[], s: SearchParams) =>
  p
    .filter((x) => !x.is_private)
    .sort((a, b) => searchDistance(a, s) - searchDistance(b, s))
    .slice(0, 3);
