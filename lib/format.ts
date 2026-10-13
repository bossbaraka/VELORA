import { CONFIG } from "@/constants/config";
import type { Locale } from "./types";
export const number = (n: number, l: Locale) =>
  new Intl.NumberFormat(l === "ar" ? "ar-AE-u-nu-arab" : "en-AE", {
    maximumFractionDigits: 0,
  }).format(n);
export const price = (n: number, l: Locale) =>
  new Intl.NumberFormat(l === "ar" ? "ar-AE-u-nu-arab" : "en-AE", {
    style: "currency",
    currency: "AED",
    maximumFractionDigits: 0,
  }).format(n);
export const areaValue = (sqft: number, l: Locale) =>
  l === "ar" ? Math.round(sqft * CONFIG.sqftToSqm) : sqft;
export const area = (sqft: number, l: Locale) =>
  `${number(areaValue(sqft, l), l)} ${l === "ar" ? "م²" : "sq ft"}`;
