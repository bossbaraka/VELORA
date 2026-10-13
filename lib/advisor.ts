import { CONFIG } from "@/constants/config";
import { SEARCH } from "@/constants/search";
import { getProperties } from "@/lib/data";
import { normalizeArabic } from "@/lib/search";
import type {
  AdvisorAction,
  AdvisorBrief,
  AdvisorBudget,
  AdvisorConstraintKey,
  AdvisorCopyKey,
  AdvisorCriterion,
  AdvisorEvidence,
  AdvisorEvidenceKey,
  AdvisorExchange,
  AdvisorFeature,
  AdvisorField,
  AdvisorInvestmentFocus,
  AdvisorPreference,
  AdvisorQuestion,
  AdvisorQuestionKey,
  AdvisorRecommendation,
  AdvisorResponse,
  AdvisorSuggestion,
  Property,
} from "@/lib/types";

const EMPTY_LIST: readonly string[] = [];
const FEATURE_KEYS: readonly AdvisorFeature[] = [
  "pool",
  "garden",
  "terrace",
  "waterfront",
  "quiet",
  "family",
  "privacy",
];
const PREFERENCES: readonly AdvisorPreference[] = [
  "quiet",
  "privacy",
  "family",
  "outdoor",
  "waterfront",
  "cityProximity",
  "airportProximity",
  "diningProximity",
  "pool",
  "garden",
  "terrace",
];
const TYPES = [
  "villa",
  "apartment",
  "penthouse",
  "townhouse",
  "commercial",
] as const;
const BUDGET_CUE =
  /\b(?:budget|price range|spend|maximum|max|under|up to|no more than|not above|less than|at most|million|millions|mn)\b|\bm\b|\bAED\b|د\.?إ|درهم|ميزاني(?:ه|تي)|حد اقصي|لا يتجاوز|اقل من|حتى|مليون|ملايين/i;
const ARABIC_WORD_NUMBERS: Record<string, number> = {
  واحد: 1,
  واحدة: 1,
  وحده: 1,
  اثنان: 2,
  اثنين: 2,
  اثنتان: 2,
  اثنتين: 2,
  ثلاث: 3,
  ثلاثة: 3,
  ثلاثه: 3,
  اربع: 4,
  اربعة: 4,
  اربعه: 4,
  خمس: 5,
  خمسة: 5,
  خمسه: 5,
  ست: 6,
  ستة: 6,
  سته: 6,
  سبع: 7,
  سبعة: 7,
  سبعه: 7,
  ثمان: 8,
  ثمانية: 8,
  ثمانيه: 8,
  تسع: 9,
  تسعة: 9,
  تسعه: 9,
  عشر: 10,
  عشرة: 10,
  عشره: 10,
  عشرون: 20,
};
const ENGLISH_WORD_NUMBERS: Record<string, number> = {
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
};
const FEATURE_ALIASES: Record<AdvisorFeature, readonly string[]> = {
  pool: ["pool", "swimming pool", "مسبح", "بركة سباحة"],
  garden: ["garden", "landscaped garden", "حديقة", "حديقه"],
  terrace: ["terrace", "balcony", "تراس", "شرفة"],
  waterfront: [
    "waterfront",
    "beachfront",
    "near the sea",
    "near the beach",
    "by the sea",
    "coast",
    "شاطئ",
    "البحر",
    "واجهة بحرية",
  ],
  quiet: ["quiet", "peaceful", "tranquil", "calm", "هادئ", "هادئة", "هدوء", "سكينة"],
  family: ["family", "children", "kids", "my family", "أطفال", "اطفال", "عائلة", "أسرة", "اسره"],
  privacy: ["privacy", "private residence", "private home", "secluded", "خصوصية", "خصوصيه", "خصوصي"],
};
const LOCATION_ALIASES: Record<string, readonly string[]> = {
  palm: ["palm", "نخله"],
  hills: ["hills", "هيلز"],
  jumeirah: ["jumeirah", "جميرا"],
  downtown: ["downtown", "داون تاون", "وسط المدينة"],
  saadiyat: ["saadiyat", "سعديات"],
  "abu dhabi": ["abu dhabi", "ابو ظبي"],
  "business bay": ["business bay", "خليج الاعمال"],
};
const TYPE_ALIASES: Record<Property["type"], readonly string[]> = {
  villa: SEARCH.types.villa,
  apartment: SEARCH.types.apartment,
  penthouse: SEARCH.types.penthouse,
  townhouse: SEARCH.types.townhouse,
  commercial: SEARCH.types.commercial,
};
const SOFT_MATCH_WORDS =
  /\b(?:prefer|ideally|rather|instead|change|switch|actually|open to|flexible|any|no longer|not necessarily)\b|(?:أفضل|بدلاً|بدل|تغيير|غيرت|مرن|أي|اي|ليس بالضرورة)/i;
const CLEAR_BUDGET_WORDS =
  /\b(?:no budget|open budget|budget is open|flexible on budget|skip the budget|without (?:giving|sharing|a) ?budget|prefer not to share)\b|(?:بدون ميزانيه|ميزانيتي مفتوحه|لا اريد مشاركه الميزانيه|لا ارغب بمشاركه الميزانيه)/i;
const RESET_WORDS =
  /\b(?:start over|start again|restart(?: the)? consultation|reset(?: the)? consultation|clear (?:the )?(?:chat|consultation|brief)|forget (?:everything|my preferences))\b|(?:ابدأ من جديد|ابدأ الاستشارة من جديد|أعد الاستشارة|اعد الاستشارة|امسح المحادثة|امسح التفضيلات)/i;

const copy = (key: AdvisorCopyKey, values?: Record<string, string | number>) =>
  values ? { key, values } : { key };
const evidence = (
  key: AdvisorEvidenceKey,
  values?: Record<string, string | number>,
): AdvisorEvidence => (values ? { key, values } : { key });
const field = <T>(
  value: T,
  source: "stated" | "inferred" = "stated",
  firmness?: "required" | "preferred",
): AdvisorField<T> => ({ value, source, ...(firmness ? { firmness } : {}) });
const unique = <T,>(values: T[]) => [...new Set(values)];
const normalize = (value: string) => normalizeArabic(value).replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 1776));
const fold = (value: string) => normalize(value).replace(/[.,،؛:!?؟()[\]{}]/g, " ").replace(/\s+/g, " ").trim();

export function createEmptyAdvisorBrief(): AdvisorBrief {
  return {
    priorities: {},
    unresolvedQuestions: [],
    declinedQuestions: [],
    relaxedConstraints: [],
  };
}

function normalizeNumberWords(value: string) {
  let output = fold(value);
  for (const [word, number] of Object.entries(ENGLISH_WORD_NUMBERS).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    output = output.replace(new RegExp(`\\b${word}\\b`, "g"), String(number));
  }
  for (const [word, number] of Object.entries(ARABIC_WORD_NUMBERS).sort(
    (a, b) => b[0].length - a[0].length,
  )) {
    output = output.replace(new RegExp(`(^|\\s)(?:ب)?${word}(?=\\s|$)`, "g"), `$1${number}`);
  }
  return output;
}

function removeQuestion(brief: AdvisorBrief, question: AdvisorQuestionKey) {
  brief.unresolvedQuestions = brief.unresolvedQuestions.filter((q) => q !== question);
  brief.declinedQuestions = brief.declinedQuestions.filter((q) => q !== question);
}

function declineQuestion(brief: AdvisorBrief, question: AdvisorQuestionKey) {
  brief.unresolvedQuestions = brief.unresolvedQuestions.filter((q) => q !== question);
  if (!brief.declinedQuestions.includes(question)) brief.declinedQuestions.push(question);
}

function markQuestionAnswered(brief: AdvisorBrief, question: AdvisorQuestionKey) {
  removeQuestion(brief, question);
}

function mergeValues<T>(previous: AdvisorField<T[]> | undefined, values: T[], firmness?: "required" | "preferred") {
  return field(
    unique([...(previous?.value ?? []), ...values]),
    "stated",
    firmness ?? previous?.firmness,
  );
}

function replaceOrMergeValues<T>(
  previous: AdvisorField<T[]> | undefined,
  values: T[],
  normalizedText: string,
  firmness?: "required" | "preferred",
) {
  const unionCue = /\b(?:also|either|or|both|as well)\b|(?:أيضا|أيضاً|او|أو|كلاهما)/i.test(normalizedText);
  if (previous && unionCue && values.length === 1) return mergeValues(previous, values, firmness);
  return field(unique(values), "stated", firmness ?? previous?.firmness);
}

function phraseIsNegated(text: string, phrase: string) {
  const at = text.indexOf(phrase);
  if (at < 0) return false;
  const before = text.slice(Math.max(0, at - 42), at);
  return /(?:\b(?:not in|not have|not live in|don't have|do not have|cannot have|can't have|not|no|avoid|exclude|excluding|without|don't want|do not want|never|rather than|instead of)\s*(?:(?:the|a|an)\s+)?|(?:لا اريد|لا ارغب|بدون|ليس|استبعد|باستثناء|باستثنا|تجنب|اتجنب|افضل الابتعاد عن|افضل البعد عن|ابتعد عن)\s*)$/i.test(before);
}

function phrasePolarities(text: string, phrases: readonly string[]) {
  const normalized = fold(text);
  let positive = false;
  let negative = false;
  let notNeeded = false;
  let positiveMention: { index: number; length: number } | undefined;
  for (const phrase of unique(phrases.map((value) => fold(value)).filter(Boolean))) {
    let at = normalized.indexOf(phrase);
    while (at >= 0) {
      const before = normalized.slice(Math.max(0, at - 42), at);
      const unnecessary = /(?:\b(?:don't need|do not need|no need for|not necessary(?: to have)?|not a requirement)\s*(?:(?:the|a|an)\s+)?|(?:لا أحتاج|لا احتاج|ليس ضروريا|ليس ضرورياً|غير ضروري)\s*)$/i.test(before);
      const negated = /(?:\b(?:not in|not have|not live in|don't have|do not have|cannot have|can't have|not|no|avoid|exclude|excluding|without|don't want|do not want|never|rather than|instead of)\s*(?:(?:the|a|an)\s+)?|(?:لا اريد|لا ارغب|بدون|ليس|استبعد|باستثناء|باستثنا|تجنب|اتجنب|افضل الابتعاد عن|افضل البعد عن|ابتعد عن)\s*)$/i.test(before);
      if (unnecessary) notNeeded = true;
      else if (negated) negative = true;
      else {
        positive = true;
        if (!positiveMention || at < positiveMention.index || (at === positiveMention.index && phrase.length > positiveMention.length)) {
          positiveMention = { index: at, length: phrase.length };
        }
      }
      at = normalized.indexOf(phrase, at + Math.max(phrase.length, 1));
    }
  }
  return { positive, negative, notNeeded, positiveMention };
}

function findMention(text: string, aliases: readonly string[]) {
  return phrasePolarities(text, aliases).positiveMention;
}

function firmnessNear(text: string, index: number, length: number, fallback: "required" | "preferred" = "preferred", includeBudgetCues = false) {
  const start = Math.max(0, index);
  const end = start + length;
  const requiredCues = includeBudgetCues
    ? /\b(?:must|need|needs|required?|require|requirement|at least|minimum|min|no fewer than|not less than|only|essential|non[- ]negotiable|maximum|max|under|up to|no more than|not above|less than|at most)\b|(?:يجب|لا بد|احتاج|علي الاقل|حد ادني|ضروري|اساسي|حصرا|فقط|حد اقصي|لا يتجاوز|اقل من|حتى)/gi
    : /\b(?:must|need|needs|required?|require|requirement|at least|minimum|min|no fewer than|not less than|only|essential|non[- ]negotiable)\b|(?:يجب|لا بد|احتاج|علي الاقل|حد ادني|ضروري|اساسي|حصرا|فقط)/gi;
  const cueTypes: [RegExp, "required" | "preferred"][] = [
    [requiredCues, "required"],
    [/\b(?:prefer|ideally|would like|like to|open to|flexible|nice to have|if possible|approximately|around)\b|(?:افضل|يفضل|ان امكن|مرن|ممكن)/gi, "preferred"],
  ];
  let best: { distance: number; firmness: "required" | "preferred" } | undefined;
  for (const [pattern, firmness] of cueTypes) {
    for (const match of text.matchAll(pattern)) {
      const cueStart = match.index ?? 0;
      const cueEnd = cueStart + match[0].length;
      const distance = cueEnd <= start ? start - cueEnd : cueStart >= end ? cueStart - end : 0;
      if (distance > 48) continue;
      const between = cueEnd <= start ? text.slice(cueEnd, start) : text.slice(end, cueStart);
      if (/\b(?:but|however|instead|except|although|whereas|while)\b|(?:لكن|ولكن|بل|بينما)|[.;]/i.test(between)) continue;
      if (!best || distance < best.distance || (distance === best.distance && firmness === "required")) best = { distance, firmness };
    }
  }
  return best?.firmness ?? fallback;
}

function locationsMentioned(text: string, properties: Property[]) {
  const normalized = fold(text);
  const all = unique(properties.flatMap((p) => [p.location.city.en, p.location.district.en]));
  const districts = unique(
    properties
      .map((p) => p.location.district.en)
      .filter((name) => {
        const ar = properties.find((p) => p.location.district.en === name)?.location.district.ar;
        return normalized.includes(fold(name)) || (ar ? normalized.includes(fold(ar)) : false);
      }),
  );
  const cities = unique(
    properties
      .map((p) => p.location.city.en)
      .filter((name) => {
        const ar = properties.find((p) => p.location.city.en === name)?.location.city.ar;
        const inText = normalized.includes(fold(name)) || (ar ? normalized.includes(fold(ar)) : false);
        if (!inText) return false;
        // “Dubai Hills” names a district; do not silently add the city as a second filter.
        return !districts.some((district) => fold(district).includes(fold(name)));
      }),
  );
  const locationAliases = (name: string, fieldName: "city" | "district") => {
    const matching = properties.filter((p) => p.location[fieldName].en === name);
    const aliases = matching.flatMap((p) => [p.location[fieldName].en, p.location[fieldName].ar]);
    for (const [key, words] of Object.entries(LOCATION_ALIASES)) {
      if (matching.some((p) => fold(p.location[fieldName].en).includes(key))) aliases.push(...words);
    }
    return unique(aliases);
  };
  const polaritiesForLocation = (name: string, fieldName: "city" | "district") =>
    phrasePolarities(normalized, locationAliases(name, fieldName));

  const aliasDistricts: string[] = [];
  const aliasCities: string[] = [];
  const aliasNegativeDistricts: string[] = [];
  const aliasNegativeCities: string[] = [];
  if (!districts.length && !cities.length) {
    const aliases = Object.entries(LOCATION_ALIASES).filter(([, words]) =>
      words.some((word) => normalized.includes(fold(word))),
    );
    for (const [key, words] of aliases) {
      const proximityOnly = key === "downtown" && (/\b(?:not far from|far from|close to|near|within|under|up to|no more than|at most)\b.{0,20}\b(?:the )?downtown\b/i.test(normalized) || /(?:قريب(?:ا|ه)? من|قرب|بالقرب من)\s*(?:وسط المدينه|الداون تاون)/i.test(normalized));
      if (proximityOnly) continue;
      const matching = properties.filter((p) => {
        const city = fold(p.location.city.en);
        const district = fold(p.location.district.en);
        if (key === "abu dhabi") return city.includes("abu dhabi");
        if (key === "business bay") return district.includes("business bay");
        if (key === "palm") return district.includes("palm");
        if (key === "hills") return district.includes("hill");
        if (key === "jumeirah") return district.includes("jumeirah");
        if (key === "downtown") return district.includes("downtown");
        if (key === "saadiyat") return district.includes("saadiyat");
        return false;
      });
      const polarity = phrasePolarities(normalized, words);
      if (key === "abu dhabi") {
        if (polarity.positive) aliasCities.push(...matching.map((p) => p.location.city.en));
        if (polarity.negative) aliasNegativeCities.push(...matching.map((p) => p.location.city.en));
      } else {
        if (polarity.positive) aliasDistricts.push(...matching.map((p) => p.location.district.en));
        if (polarity.negative) aliasNegativeDistricts.push(...matching.map((p) => p.location.district.en));
      }
    }
  }
  const positiveDistricts = unique([
    ...districts.filter((name) => polaritiesForLocation(name, "district").positive),
    ...aliasDistricts,
  ]);
  const negativeDistricts = unique([
    ...districts.filter((name) => polaritiesForLocation(name, "district").negative),
    ...aliasNegativeDistricts,
  ]);
  const positiveCities = unique([
    ...cities.filter((name) => polaritiesForLocation(name, "city").positive),
    ...aliasCities,
  ]);
  const negativeCities = unique([
    ...cities.filter((name) => polaritiesForLocation(name, "city").negative),
    ...aliasNegativeCities,
  ]);
  return { positiveCities, positiveDistricts, negativeCities, negativeDistricts, all };
}

function locationFirmness(text: string, name: string, fieldName: "city" | "district", properties: Property[]) {
  const matching = properties.filter((p) => p.location[fieldName].en === name);
  const aliases = matching.flatMap((p) => [p.location[fieldName].en, p.location[fieldName].ar]);
  for (const [key, words] of Object.entries(LOCATION_ALIASES)) {
    if (matching.some((p) => fold(p.location[fieldName].en).includes(key))) aliases.push(...words);
  }
  const mention = findMention(text, unique(aliases));
  return mention ? firmnessNear(fold(text), mention.index, mention.length) : "preferred";
}

function parsePropertyTypes(text: string) {
  const normalized = fold(text);
  const found = TYPES.filter((type) => TYPE_ALIASES[type].some((alias) => normalized.includes(fold(alias))));
  const positive = found.filter((type) => phrasePolarities(normalized, TYPE_ALIASES[type]).positive);
  const negative = found.filter((type) => phrasePolarities(normalized, TYPE_ALIASES[type]).negative);
  return { positive, negative };
}

function parseMoneyToken(token: string, inheritedMultiplier: number) {
  const match = token.match(/(\d[\d,.]*)(?:\s*(million(?:s)?|mn|m|thousand|k|مليون(?:ات)?|الاف|ألف|آلاف))?/i);
  if (!match) return undefined;
  const base = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(base)) return undefined;
  const unit = normalize(match[2] ?? "");
  const multiplier = /^(?:million|millions|mn|m|مليون|مليونان|ملايين)$/.test(unit)
    ? 1_000_000
    : /^(?:thousand|k|الاف|ألف|آلاف)$/.test(unit)
      ? 1_000
      : inheritedMultiplier;
  return Math.round(base * multiplier);
}

function budgetMultiplier(text: string) {
  if (/\b(?:million|millions|mn|m)\b|مليون|ملايين/i.test(text)) return 1_000_000;
  if (/\b(?:thousand|k)\b|ألف|الاف|آلاف/i.test(text)) return 1_000;
  return 1;
}

function budgetIsLowerBound(text: string, index: number, length: number) {
  const cues: { index: number; end: number; kind: "minimum" | "maximum" }[] = [];
  for (const match of text.matchAll(/at least|minimum|\bmin\b|no less than|not less than|علي الاقل|حد ادني/gi)) {
    const start = match.index ?? 0;
    cues.push({ index: start, end: start + match[0].length, kind: "minimum" });
  }
  for (const match of text.matchAll(/maximum|\bmax\b|under|up to|no more than|not above|at most|حد اقصي|لا يتجاوز|اقل من|حتى/gi)) {
    const start = match.index ?? 0;
    cues.push({ index: start, end: start + match[0].length, kind: "maximum" });
  }
  for (const match of text.matchAll(/less than/gi)) {
    const start = match.index ?? 0;
    if (/\b(?:no|not)\s+$/.test(text.slice(Math.max(0, start - 5), start))) continue;
    cues.push({ index: start, end: start + match[0].length, kind: "maximum" });
  }
  const closest = cues
    .map((cue) => ({
      ...cue,
      distance: cue.end <= index ? index - cue.end : cue.index >= index + length ? cue.index - (index + length) : 0,
    }))
    .filter((cue) => cue.distance <= 36)
    .sort((a, b) => a.distance - b.distance)[0];
  if (!closest || closest.kind !== "minimum") return false;
  const gap = closest.end <= index
    ? text.slice(closest.end, index)
    : text.slice(index + length, closest.index);
  if (/\b(?:bed(?:room)?s?|beds?|rooms?)\b|غرف(?:ة)?(?:\s*نوم)?|غرفتين/i.test(gap)) return false;
  if (closest.index >= index + length && /\b(?:bed(?:room)?s?|beds?|rooms?)\b|غرف(?:ة)?(?:\s*نوم)?|غرفتين/i.test(text.slice(closest.end, closest.end + 36))) return false;
  return true;
}

function parseBudget(text: string, brief: AdvisorBrief) {
  const normalized = normalizeNumberWords(text);
  if (CLEAR_BUDGET_WORDS.test(normalized)) {
    const next = { ...brief };
    delete next.budget;
    declineQuestion(next, "budget");
    return { brief: next, changed: true, unsupportedCurrency: false };
  }
  if (!BUDGET_CUE.test(normalized)) return { brief, changed: false, unsupportedCurrency: false };
  const currency = /\bUSD\b|\$|\bUS dollars?\b|دولار/i.test(normalized)
    ? "USD"
    : /\bEUR\b|€|euros?/i.test(normalized)
      ? "EUR"
      : /\bGBP\b|£|pounds?/i.test(normalized)
        ? "GBP"
        : /\bSAR\b|\briyal\b|ريال/i.test(normalized)
          ? "SAR"
          : "AED";
  const multiplier = budgetMultiplier(normalized);
  const amountToken = String.raw`\d[\d,.]*(?:\s*(?:million(?:s)?|mn|m|thousand|k|مليون(?:ات)?|الاف|ألف|آلاف))?`;
  const rangePattern = new RegExp(`(${amountToken})\\s*(?:to|[-–]|إلى|الى|و|and)\\s*(${amountToken})`, "i");
  const range = normalized.match(rangePattern);
  let min: number | undefined;
  let max: number | undefined;
  if (range) {
    const a = parseMoneyToken(range[1], multiplier);
    const b = parseMoneyToken(range[2], multiplier);
    if (a !== undefined && b !== undefined) {
      min = Math.min(a, b);
      max = Math.max(a, b);
    }
  }
  if (max === undefined) {
    const amountMatches = [...normalized.matchAll(new RegExp(amountToken, "gi"))];
    const unitMatches = amountMatches.filter((match) => /million|mn|thousand|مليون|ألف|الاف|آلاف/i.test(match[0]) || /m\s*$/i.test(match[0]) || /k\s*$/i.test(match[0]));
    const prefixCue = normalized.match(/budget|price range|spend|maximum|max|under|up to|no more than|not above|less than|at most|ميزاني(?:ه|تي)|حد اقصي|لا يتجاوز|اقل من|حتى/i);
    const currencyCue = normalized.match(/AED|د\.?إ|درهم|USD|EUR|GBP|SAR|[$€£]/i);
    let chosen = unitMatches.at(-1) ?? amountMatches.at(-1);
    if (prefixCue) {
      const afterCue = amountMatches.find((match) => (match.index ?? 0) >= (prefixCue.index ?? 0));
      if (afterCue) chosen = unitMatches.find((match) => (match.index ?? 0) >= (prefixCue.index ?? 0)) ?? afterCue;
    } else if (currencyCue && amountMatches.length) {
      const cueIndex = currencyCue.index ?? 0;
      const afterCurrency = amountMatches.find((match) => (match.index ?? 0) >= cueIndex);
      const beforeCurrency = amountMatches.filter((match) => (match.index ?? 0) < cueIndex).at(-1);
      chosen = afterCurrency ?? beforeCurrency ?? chosen;
    }
    const amount = chosen ? parseMoneyToken(chosen[0], multiplier) : undefined;
    if (amount !== undefined) {
      const index = chosen?.index ?? 0;
      const isMinimum = budgetIsLowerBound(normalized, index, chosen![0].length);
      const isPreferred = firmnessNear(normalized, index, chosen![0].length, "required", true) === "preferred";
      if (isMinimum) min = amount;
      else max = amount;
      const next = { ...brief, budget: field<AdvisorBudget>({ min, max, currency }, "stated", isPreferred ? "preferred" : "required") };
      if (currency !== "AED") removeQuestion(next, "budget");
      else markQuestionAnswered(next, "budget");
      return { brief: next, changed: true, unsupportedCurrency: currency !== "AED" };
    }
  }
  if (max !== undefined || min !== undefined) {
    const isPreferred = range ? firmnessNear(normalized, range.index ?? 0, range[0].length, "required") === "preferred" : false;
    const next = { ...brief, budget: field<AdvisorBudget>({ min, max, currency }, "stated", isPreferred ? "preferred" : "required") };
    if (currency !== "AED") removeQuestion(next, "budget");
    else markQuestionAnswered(next, "budget");
    return { brief: next, changed: true, unsupportedCurrency: currency !== "AED" };
  }
  return { brief, changed: false, unsupportedCurrency: currency !== "AED" };
}

function parseBedroomMention(text: string) {
  const normalized = normalizeNumberWords(text);
  const matches = [...normalized.matchAll(/(?:^|\s)(\d+)\s*(?:bed(?:room)?s?|beds?|br\b|rooms?|غرف(?:ة)?(?:\s*نوم)?|غرفتين)(?=\s|$|[-,.;])/g)];
  const last = matches.at(-1);
  if (!last) return undefined;
  const offset = last[0].indexOf(last[1]);
  return { value: Number(last[1]), index: (last.index ?? 0) + offset, length: last[1].length };
}

function parseAreaMention(text: string) {
  const normalized = normalizeNumberWords(text);
  const match = normalized.match(/(\d[\d,.]*)\s*(sq\.?\s*ft|sqft|square feet|square foot|ft2|ft²|متر مربع|متر²|م²|sqm|sq\.?\s*m|m2|m²)/i);
  if (!match) return undefined;
  const numeric = Number(match[1].replace(/,/g, ""));
  if (!Number.isFinite(numeric)) return undefined;
  const value = /متر|sqm|sq\.?\s*m|m2|m²/i.test(match[2]) ? Math.round(numeric / CONFIG.sqftToSqm) : Math.round(numeric);
  return { value, index: match.index ?? 0, length: match[0].length };
}

type DistanceKey = keyof Pick<AdvisorBrief, "maxDowntownMinutes" | "maxWaterfrontMinutes" | "maxAirportMinutes" | "maxDiningMinutes">;
function parseDistances(text: string): Partial<Record<DistanceKey, { value: number; index: number; length: number; bounded: boolean }>> {
  const normalized = normalizeNumberWords(text);
  const rules: [DistanceKey, RegExp][] = [
    ["maxDowntownMinutes", /(?:within|up to|under|no more than|at most|أقل من|خلال|على بعد|ضمن)?\s*(\d+)\s*(?:min(?:ute)?s?|دقيق(?:ة|تين|تان)?|دقائق)\s*(?:from|to|of|away from|من|عن|إلى|الى)?\s*(?:downtown|the city|city centre|city center|وسط المدينة|الداون تاون|المدينة)/i],
    ["maxWaterfrontMinutes", /(?:within|up to|under|no more than|at most|أقل من|خلال|على بعد|ضمن)?\s*(\d+)\s*(?:min(?:ute)?s?|دقيق(?:ة|تين|تان)?|دقائق)\s*(?:from|to|of|away from|من|عن|إلى|الى)?\s*(?:the )?(?:waterfront|sea|beach|coast|البحر|الشاطئ|الواجهة البحرية)/i],
    ["maxAirportMinutes", /(?:within|up to|under|no more than|at most|أقل من|خلال|على بعد|ضمن)?\s*(\d+)\s*(?:min(?:ute)?s?|دقيق(?:ة|تين|تان)?|دقائق)\s*(?:from|to|of|away from|من|عن|إلى|الى)?\s*(?:the )?airport|airport\s*(?:within|under|less than)?\s*(\d+)\s*(?:min(?:ute)?s?|دقيق(?:ة|تين|تان)?|دقائق)/i],
    ["maxDiningMinutes", /(?:within|up to|under|no more than|at most|أقل من|خلال|على بعد|ضمن)?\s*(\d+)\s*(?:min(?:ute)?s?|دقيق(?:ة|تين|تان)?|دقائق)\s*(?:from|to|of|away from|من|عن|إلى|الى)?\s*(?:dining|restaurants|restaurants and cafes|المطاعم|المقاهي)/i],
  ];
  const values: Partial<Record<DistanceKey, { value: number; index: number; length: number; bounded: boolean }>> = {};
  for (const [key, regex] of rules) {
    const match = normalized.match(regex);
    const amount = match?.[1] ?? match?.[2];
    if (!match || !amount) continue;
    const local = normalized.slice(Math.max(0, (match.index ?? 0) - 16), (match.index ?? 0) + match[0].length);
    values[key] = { value: Number(amount), index: match.index ?? 0, length: match[0].length, bounded: /within|up to|under|no more than|at most|less than|أقل من|خلال|ضمن/i.test(local) };
  }
  return values;
}

function priorityUpdates(text: string): Partial<Record<AdvisorCriterion, number>> {
  const normalized = fold(text);
  const result: Partial<Record<AdvisorCriterion, number>> = {};
  const quietFirst = /(?:quiet|peace|calm|الهدوء|السكينة).{0,50}(?:more important|matters more|priority|first|over|rather than|أهم من|الأولوية|أولوية)/i.test(normalized);
  const cityFirst = /(?:city|downtown|city centre|city center|القرب من المدينة|وسط المدينة).{0,50}(?:more important|matters more|priority|first|over|rather than|أهم من|الأولوية|أولوية)/i.test(normalized);
  const quietBeforeCity = /(?:quiet|peace|calm|الهدوء|السكينة).{0,60}(?:more important|matters more|over|rather than|أهم من).{0,30}(?:city|downtown|وسط المدينة|المدينة)/i.test(normalized);
  const cityBeforeQuiet = /(?:city|downtown|وسط المدينة|المدينة).{0,60}(?:more important|matters more|over|rather than|أهم من).{0,30}(?:quiet|peace|calm|الهدوء|السكينة)/i.test(normalized);
  if (quietBeforeCity || (quietFirst && !cityBeforeQuiet)) {
    result.quiet = 3;
    result.cityProximity = 1;
  } else if (cityBeforeQuiet || (cityFirst && !quietBeforeCity)) {
    result.cityProximity = 3;
    result.quiet = 1;
  } else if (/\b(?:equally|both equal|same priority)\b|متساوي|بنفس الأهمية|بنفس الاهمية/i.test(normalized)) {
    result.quiet = 1;
    result.cityProximity = 1;
  }
  return result;
}

function detectObjective(text: string): AdvisorBrief["objective"] | undefined {
  const normalized = fold(text);
  const candidates: { intent: NonNullable<AdvisorBrief["objective"]>["value"]; at: number; length: number }[] = [];
  const rules: [NonNullable<AdvisorBrief["objective"]>["value"], RegExp][] = [
    ["investment", /\b(?:investment|investing|investor|rental investment|buy to let|yield|roi|resale|rental income)\b|(?:استثمار|استثماري|عائد|إيجار|الايجار|إعادة البيع)/gi],
    ["retreat", /\b(?:retreat|weekend home|weekend escape|getaway|holiday home|second home|escape)\b|(?:استراحة|ملاذ|عطلة|منزل للعطلات|بيت للعطلات)/gi],
    ["family", /\b(?:family home|family living|home for my family|family residence)\b|(?:سكن عائلي|منزل عائلي|بيت عائلي)/gi],
    ["private", /\b(?:private residence|private home|privacy|secluded home)\b|(?:خصوصية|خصوصي|منزل خاص|مسكن خاص)/gi],
    ["home", /\b(?:primary residence|everyday home|a home|looking for a home|buy a home|place to live|for living)\b|(?:سكن|منزل|بيت|مكان للعيش)/gi],
  ];
  for (const [intent, regex] of rules) {
    for (const match of normalized.matchAll(regex)) {
      const at = match.index ?? 0;
      const phrase = match[0];
      if (!phraseIsNegated(normalized, phrase)) candidates.push({ intent, at, length: phrase.length });
    }
  }
  const selected = candidates.sort((a, b) => a.at - b.at || a.length - b.length).at(-1);
  return selected ? field(selected.intent, "stated") : undefined;
}

function parseInvestmentFocus(text: string): AdvisorInvestmentFocus | undefined {
  const normalized = fold(text);
  if (/\b(?:rental|rent(?:al)? income|let it|rent out|yield|roi)\b|(?:إيجار|الايجار|دخل إيجاري|عائد إيجاري)/i.test(normalized)) return "rental";
  if (/\b(?:resale|resell|sell on|resale flexibility)\b|(?:إعادة البيع|إعادة بيعه|إعادة بيع)/i.test(normalized)) return "resale";
  if (/\b(?:long[- ]term|hold long|long ownership|hold for years)\b|(?:طويل الأمد|على المدى الطويل|احتفاظ طويل)/i.test(normalized)) return "longTerm";
  return undefined;
}

function addPreference(brief: AdvisorBrief, preference: AdvisorPreference) {
  const previous = brief.preferences;
  brief.preferences = mergeValues(previous, [preference]);
}

function removePreference(brief: AdvisorBrief, preference: AdvisorPreference) {
  const values = (brief.preferences?.value ?? []).filter((v) => v !== preference);
  if (values.length) brief.preferences = field(values, "stated");
  else delete brief.preferences;
}

function removeFeatureFromFields(brief: AdvisorBrief, feature: AdvisorFeature) {
  const required = (brief.mustHave?.value ?? []).filter((v) => v !== feature);
  if (required.length) brief.mustHave = field(required, "stated", "required");
  else delete brief.mustHave;
  removePreference(brief, feature as AdvisorPreference);
  const excluded = (brief.excludedFeatures?.value ?? []).filter((v) => v !== feature);
  if (excluded.length) brief.excludedFeatures = field(excluded, "stated", "required");
  else delete brief.excludedFeatures;
}

export function parseAdvisorMessage(
  input: string,
  current: AdvisorBrief = createEmptyAdvisorBrief(),
  properties: Property[] = getProperties(),
) {
  const text = input.slice(0, 1_000);
  const normalized = normalizeNumberWords(text);
  const brief: AdvisorBrief = {
    ...current,
    priorities: { ...current.priorities },
    unresolvedQuestions: [...current.unresolvedQuestions],
    declinedQuestions: [...current.declinedQuestions],
    relaxedConstraints: [...current.relaxedConstraints],
  };
  if (RESET_WORDS.test(normalized)) {
    return { brief: createEmptyAdvisorBrief(), changed: true, reset: true, recognized: true, unsupportedCurrency: false };
  }
  if (!text.trim()) return { brief, changed: false, reset: false, recognized: false, unsupportedCurrency: false };
  let changed = false;
  let recognized = false;
  let unsupportedCurrency = false;
  const clearOpenLocations = /\b(?:anywhere|any city|open on location|flexible on location|no location preference)\b|(?:أي مكان|أي مدينة|لا أفضل موقعاً|الموقع مرن|الموقع مفتوح)/i.test(normalized);
  if (clearOpenLocations) {
    delete brief.cities;
    delete brief.districts;
    removeQuestion(brief, "primaryNeed");
    changed = recognized = true;
  }
  if (/\b(?:any type|open to any type|flexible on type)\b|(?:أي نوع|مرن في نوع العقار)/i.test(normalized)) {
    delete brief.propertyTypes;
    changed = recognized = true;
  }
  if (/\b(?:flexible on bedrooms|any number of bedrooms|bedroom count is flexible)\b|(?:عدد الغرف مرن|مرن في عدد الغرف)/i.test(normalized)) {
    delete brief.minBedrooms;
    declineQuestion(brief, "bedrooms");
    changed = recognized = true;
  }

  const objective = detectObjective(normalized);
  if (objective && objective.value !== brief.objective?.value) {
    brief.objective = objective;
    if (objective.value !== "investment") delete brief.investmentFocus;
    if (objective.value === "investment") removeQuestion(brief, "investmentFocus");
    changed = recognized = true;
  }
  const investmentFocus = parseInvestmentFocus(normalized);
  if (investmentFocus) {
    brief.investmentFocus = field(investmentFocus, "stated");
    markQuestionAnswered(brief, "investmentFocus");
    changed = recognized = true;
  }
  if (/\b(?:i am flexible|i'm flexible|not sure yet|i do not know yet|i don't know yet|undecided|either is fine)\b|(?:لست متأكداً|لست متأكده|لا أعرف بعد|غير محدد بعد|مرن)/i.test(normalized)) {
    if (brief.unresolvedQuestions.includes("investmentFocus")) declineQuestion(brief, "investmentFocus");
    if (brief.unresolvedQuestions.includes("budget")) declineQuestion(brief, "budget");
    if (brief.unresolvedQuestions.includes("bedrooms")) declineQuestion(brief, "bedrooms");
    changed = recognized = true;
  }

  const budget = parseBudget(normalized, brief);
  if (budget.changed) {
    Object.assign(brief, budget.brief);
    changed = recognized = true;
    unsupportedCurrency = budget.unsupportedCurrency;
    if (brief.budget && brief.budget.firmness === "required") {
      brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== "budget");
    }
  }

  const locations = locationsMentioned(normalized, properties);
  const conflictingCities = new Set(locations.positiveCities.filter((city) => locations.negativeCities.includes(city)));
  const conflictingDistricts = new Set(locations.positiveDistricts.filter((district) => locations.negativeDistricts.includes(district)));
  if (locations.positiveCities.length || locations.negativeCities.length) {
    if (locations.positiveCities.length) {
      const firmness = locationFirmness(normalized, locations.positiveCities[0], "city", properties);
      brief.cities = replaceOrMergeValues(brief.cities, locations.positiveCities, normalized, firmness);
      brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== "cities");
    }
    if (locations.negativeCities.length) {
      brief.excludedCities = mergeValues(brief.excludedCities, locations.negativeCities, "required");
      if (brief.cities) {
        const remaining = brief.cities.value.filter((v) => !locations.negativeCities.includes(v) || conflictingCities.has(v));
        if (remaining.length) brief.cities = field(remaining, "stated", brief.cities.firmness);
        else delete brief.cities;
      }
    }
    markQuestionAnswered(brief, "primaryNeed");
    changed = recognized = true;
  }
  if (locations.positiveDistricts.length || locations.negativeDistricts.length) {
    if (locations.positiveDistricts.length) {
      const firmness = locationFirmness(normalized, locations.positiveDistricts[0], "district", properties);
      brief.districts = replaceOrMergeValues(brief.districts, locations.positiveDistricts, normalized, firmness);
      brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== "districts");
    }
    if (locations.negativeDistricts.length) {
      brief.excludedDistricts = mergeValues(brief.excludedDistricts, locations.negativeDistricts, "required");
      if (brief.districts) {
        const remaining = brief.districts.value.filter((v) => !locations.negativeDistricts.includes(v) || conflictingDistricts.has(v));
        if (remaining.length) brief.districts = field(remaining, "stated", brief.districts.firmness);
        else delete brief.districts;
      }
    }
    markQuestionAnswered(brief, "primaryNeed");
    changed = recognized = true;
  }
  if (/\b(?:anywhere|any city|open on location|flexible on location|no location preference)\b|(?:أي مكان|أي مدينة|الموقع مرن|الموقع مفتوح)/i.test(normalized)) {
    delete brief.excludedCities;
    delete brief.excludedDistricts;
  }

  const types = parsePropertyTypes(normalized);
  const conflictingTypes = new Set(types.positive.filter((type) => types.negative.includes(type)));
  if (types.positive.length) {
    const typeMention = findMention(normalized, types.positive.flatMap((type) => TYPE_ALIASES[type]));
    const firmness = typeMention ? firmnessNear(normalized, typeMention.index, typeMention.length) : "preferred";
    brief.propertyTypes = replaceOrMergeValues(brief.propertyTypes, [...types.positive], normalized, firmness);
    brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== "propertyTypes");
    changed = recognized = true;
  }
  if (types.negative.length) {
    brief.excludedPropertyTypes = mergeValues(brief.excludedPropertyTypes, types.negative, "required");
    if (brief.propertyTypes) {
      const remaining = brief.propertyTypes.value.filter((v) => !types.negative.includes(v) || conflictingTypes.has(v));
      if (remaining.length) brief.propertyTypes = field(remaining, "stated", brief.propertyTypes.firmness);
      else delete brief.propertyTypes;
    }
    changed = recognized = true;
  }

  const normalizedForBedrooms = normalizeNumberWords(normalized);
  const bedroomMention = parseBedroomMention(normalizedForBedrooms);
  const bedrooms = bedroomMention?.value;
  if (bedroomMention && bedrooms !== undefined && bedrooms >= 0 && bedrooms <= 20) {
    const firmness = firmnessNear(normalizedForBedrooms, bedroomMention.index, bedroomMention.length);
    brief.minBedrooms = field(bedrooms, "stated", firmness);
    if (firmness === "required") brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== "minBedrooms");
    markQuestionAnswered(brief, "bedrooms");
    changed = recognized = true;
  }
  const areaMention = parseAreaMention(normalized);
  if (areaMention && areaMention.value > 0) {
    const areaSqft = areaMention.value;
    brief.minAreaSqft = field(areaSqft, "stated", firmnessNear(normalized, areaMention.index, areaMention.length));
    if (brief.minAreaSqft.firmness === "required") brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== "minAreaSqft");
    changed = recognized = true;
  }

  for (const [key, mention] of Object.entries(parseDistances(normalized)) as [DistanceKey, NonNullable<ReturnType<typeof parseDistances>[DistanceKey]>][]) {
    const firmness = mention.bounded ? "required" : firmnessNear(normalized, mention.index, mention.length);
    brief[key] = field(mention.value, "stated", firmness) as never;
    const distanceField = brief[key] as AdvisorField<number> | undefined;
    if (distanceField?.firmness === "required") brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== key);
    changed = recognized = true;
  }

  const mentionedFeatures: AdvisorFeature[] = [];
  const requiredFeatures: AdvisorFeature[] = [];
  const negatedFeatures: AdvisorFeature[] = [];
  const notNeededFeatures: AdvisorFeature[] = [];
  for (const feature of FEATURE_KEYS) {
    const aliases = FEATURE_ALIASES[feature];
    const polarity = phrasePolarities(normalized, aliases);
    if (!polarity.positive && !polarity.negative && !polarity.notNeeded) continue;
    if (polarity.notNeeded) notNeededFeatures.push(feature);
    if (polarity.negative) negatedFeatures.push(feature);
    if (polarity.positive && polarity.positiveMention) {
      mentionedFeatures.push(feature);
      if (firmnessNear(normalized, polarity.positiveMention.index, polarity.positiveMention.length) === "required") requiredFeatures.push(feature);
    }
  }
  const conflictingFeatures = new Set(mentionedFeatures.filter((feature) => negatedFeatures.includes(feature)));
  for (const feature of notNeededFeatures) removeFeatureFromFields(brief, feature);
  if (negatedFeatures.length) {
    for (const feature of negatedFeatures) removeFeatureFromFields(brief, feature);
    brief.excludedFeatures = mergeValues(brief.excludedFeatures, negatedFeatures, "required");
    changed = recognized = true;
  }
  if (mentionedFeatures.length) {
    const required = mentionedFeatures.filter((v) => requiredFeatures.includes(v));
    const preferred = mentionedFeatures.filter((v) => !required.includes(v));
    if (required.length) {
      brief.mustHave = mergeValues(brief.mustHave, required, "required");
      brief.relaxedConstraints = brief.relaxedConstraints.filter((r) => r.field !== "mustHave");
    }
    for (const feature of preferred) {
      const preference = feature as AdvisorPreference;
      if (PREFERENCES.includes(preference)) addPreference(brief, preference);
      else addPreference(brief, "outdoor");
    }
    brief.excludedFeatures = brief.excludedFeatures
      ? field(brief.excludedFeatures.value.filter((v) => !mentionedFeatures.includes(v) || conflictingFeatures.has(v)), "stated", "required")
      : undefined;
    if (!brief.excludedFeatures?.value.length) delete brief.excludedFeatures;
    changed = recognized = true;
  }
  if (notNeededFeatures.length) {
    changed = recognized = true;
  }

  const prefRules: [AdvisorPreference, RegExp][] = [
    ["quiet", /\b(?:quiet|peaceful|tranquil|calm|a quiet setting|quiet area)\b|(?:هادئ|هادئة|هدوء|سكينة)/i],
    ["privacy", /\b(?:privacy|private residence|private home|secluded)\b|(?:خصوصية|خصوصيه|مسكن خاص|منزل خاص)/i],
    ["family", /\b(?:family[- ]friendly|room for (?:my )?family|space for (?:my )?family|family living|children|kids)\b|(?:عائلتي|أطفالي|اطفالي|أولادي|اولادي|مساحة للعائلة|مساحة للأسرة)/i],
    ["outdoor", /\b(?:outdoor space|outdoor living|outdoors)\b|(?:مساحة خارجية|مساحات خارجية)/i],
    ["waterfront", /\b(?:waterfront|beachfront|near (?:the )?(?:sea|beach)|by the sea|near the coast|coastal)\b|(?:قريب من البحر|قريبة من البحر|شاطئ|واجهة بحرية|قرب البحر)/i],
    ["cityProximity", /\b(?:not far from (?:the )?(?:city|downtown)|close to (?:the )?(?:city|downtown)|near downtown|city access|city-cent(?:er|re)|urban access)\b|(?:قريب(?:ا|ه)? من وسط المدينه|قرب وسط المدينه|قريب(?:ا|ه)? من المدينه|لا اريد الابتعاد عن المدينه|قرب المدينه)/i],
    ["airportProximity", /\b(?:close to (?:the )?airport|near (?:the )?airport|airport access)\b|(?:قريب من المطار|قرب المطار)/i],
    ["diningProximity", /\b(?:close to (?:restaurants|dining)|near (?:restaurants|dining)|dining nearby)\b|(?:قريب من المطاعم|قرب المطاعم)/i],
  ];
  for (const [preference, regex] of prefRules) {
    if (!regex.test(normalized)) continue;
    const negationPattern = preference === "cityProximity"
      ? /\b(?:prefer to be far from (?:the )?(?:city|downtown)|want to be far from (?:the )?(?:city|downtown)|avoid downtown|away from downtown)\b|(?:أفضّل البعد عن المدينة|افضل الابتعاد عن المدينة|أتجنب وسط المدينة)/i
      : preference === "waterfront"
        ? /\b(?:prefer to be away from the (?:sea|beach)|avoid the (?:sea|beach)|far from the water)\b|(?:أفضل الابتعاد عن البحر|افضل الابتعاد عن البحر|أتجنب الشاطئ)/i
        : undefined;
    if (negationPattern?.test(normalized)) {
      removePreference(brief, preference);
      changed = recognized = true;
      continue;
    }
    const aliases = FEATURE_ALIASES[preference as AdvisorFeature] ?? [];
    const negated = aliases.some((alias) => phraseIsNegated(fold(normalized), fold(alias))) && preference !== "privacy";
    if (negated) {
      removePreference(brief, preference);
      continue;
    }
    addPreference(brief, preference);
    if (preference === "privacy") markQuestionAnswered(brief, "privacyEvidence");
    if (preference !== "privacy") markQuestionAnswered(brief, "primaryNeed");
    changed = recognized = true;
  }

  const priorities = priorityUpdates(normalized);
  if (Object.keys(priorities).length) {
    brief.priorities = { ...brief.priorities, ...priorities };
    markQuestionAnswered(brief, "quietVsCity");
    changed = recognized = true;
  }
  if (/\b(?:equally important|both equally|neither matters more)\b|(?:متساويان|متساوية الأهمية|كلاهما بنفس الأهمية)/i.test(normalized)) {
    brief.priorities = { ...brief.priorities, quiet: 1, cityProximity: 1 };
    markQuestionAnswered(brief, "quietVsCity");
    changed = recognized = true;
  }

  if (/\b(?:within|in)\s*(?:the next )?(?:\d+\s*)?(?:months?|weeks?|year)|\b(?:ready soon|move soon|this year|next year)\b|(?:خلال الأشهر|خلال الشهور|خلال وقت قريب|هذا العام|العام القادم)/i.test(normalized)) {
    brief.timeline = field(text.trim(), "stated");
    changed = recognized = true;
  }

  if (CLEAR_BUDGET_WORDS.test(normalized)) {
    delete brief.budget;
    declineQuestion(brief, "budget");
    changed = recognized = true;
  }
  if (brief.objective?.value === "investment" && /\b(?:yield|roi|return|rental|rent)\b|(?:عائد|إيجار|الايجار)/i.test(normalized) && !brief.investmentFocus) {
    const focus = parseInvestmentFocus(normalized);
    if (focus) {
      brief.investmentFocus = field(focus, "stated");
      markQuestionAnswered(brief, "investmentFocus");
    }
    recognized = true;
  }

  if (brief.objective?.value === "investment" && hasSupportedAdvisorCriteria(brief, properties)) {
    markQuestionAnswered(brief, "investmentCriteria");
  }

  if (changed) {
    brief.relaxedConstraints = brief.relaxedConstraints.filter((item) => {
      if (item.field === "budget" && brief.budget?.firmness === "required") return false;
      if (item.field === "cities" && brief.cities?.firmness === "required") return false;
      if (item.field === "districts" && brief.districts?.firmness === "required") return false;
      if (item.field === "propertyTypes" && brief.propertyTypes?.firmness === "required") return false;
      if (item.field === "minBedrooms" && brief.minBedrooms?.firmness === "required") return false;
      if (item.field === "minAreaSqft" && brief.minAreaSqft?.firmness === "required") return false;
      if (item.field === "mustHave" && brief.mustHave?.firmness === "required") return false;
      return true;
    });
  }
  return { brief, changed, reset: false, recognized, unsupportedCurrency };
}

function updateFieldFirmness<T>(value: AdvisorField<T> | undefined) {
  return value ? field(value.value, value.source, "preferred") : undefined;
}

function removeField(brief: AdvisorBrief, name: keyof AdvisorBrief) {
  const next = { ...brief };
  delete (next as Partial<AdvisorBrief>)[name];
  return next;
}

function pushRelaxed(brief: AdvisorBrief, key: AdvisorConstraintKey, values?: Array<string | number>) {
  const existing = brief.relaxedConstraints.filter((entry) => entry.field !== key);
  existing.push({ field: key, ...(values?.length ? { values } : {}) });
  brief.relaxedConstraints = existing;
}

export function applyAdvisorAction(current: AdvisorBrief, action: AdvisorAction): AdvisorBrief {
  const brief: AdvisorBrief = {
    ...current,
    priorities: { ...current.priorities },
    unresolvedQuestions: [...current.unresolvedQuestions],
    declinedQuestions: [...current.declinedQuestions],
    relaxedConstraints: [...current.relaxedConstraints],
  };
  if (action.type === "setObjective") {
    brief.objective = field(action.objective, "stated");
    if (action.objective !== "investment") delete brief.investmentFocus;
    markQuestionAnswered(brief, "primaryNeed");
    if (action.objective === "investment") markQuestionAnswered(brief, "investmentFocus");
  } else if (action.type === "setPreference") {
    addPreference(brief, action.preference);
    markQuestionAnswered(brief, "primaryNeed");
    if (action.preference === "quiet" && brief.objective?.value === "private") markQuestionAnswered(brief, "privacyEvidence");
  } else if (action.type === "answer") {
    const { question, value } = action;
    markQuestionAnswered(brief, question);
    if (value === "skip") {
      if (question === "budget") delete brief.budget;
      declineQuestion(brief, question);
    } else if (question === "investmentFocus" && ["rental", "longTerm", "resale"].includes(value)) {
      brief.investmentFocus = field(value as AdvisorInvestmentFocus, "stated");
    } else if (question === "quietVsCity") {
      if (value === "quiet") brief.priorities = { ...brief.priorities, quiet: 3, cityProximity: 1 };
      else if (value === "city") brief.priorities = { ...brief.priorities, cityProximity: 3, quiet: 1 };
      else brief.priorities = { ...brief.priorities, quiet: 1, cityProximity: 1 };
    } else if (question === "bedrooms") {
      const count = Number(value);
      if (Number.isInteger(count) && count >= 0 && count <= 20) brief.minBedrooms = field(count, "stated", "required");
      else if (value === "flexible") declineQuestion(brief, question);
    } else if (question === "privacyEvidence") {
      if (brief.mustHave?.value.includes("privacy")) {
        const remaining = brief.mustHave.value.filter((feature) => feature !== "privacy");
        if (remaining.length) brief.mustHave = field(remaining, "stated", brief.mustHave.firmness);
        else delete brief.mustHave;
      }
      if (value === "quiet") addPreference(brief, "quiet");
      else if (value === "unknown") addPreference(brief, "privacy");
      declineQuestion(brief, question);
    } else if (question === "primaryNeed" && ["quiet", "outdoor", "cityProximity"].includes(value)) {
      addPreference(brief, value as AdvisorPreference);
    }
  } else if (action.type === "relax") {
    const key = action.field;
    const currentValue = brief[key] as AdvisorField<unknown> | undefined;
    const values = Array.isArray(currentValue?.value) ? currentValue.value as Array<string | number> : currentValue ? [currentValue.value as string | number] : [];
    if (key === "excludedFeatures" || key === "excludedCities" || key === "excludedDistricts" || key === "excludedPropertyTypes") {
      const next = removeField(brief, key);
      pushRelaxed(next, key, values);
      next.unresolvedQuestions = next.unresolvedQuestions.filter((q) => q !== "refineResults");
      return next;
    }
    const next = { ...brief };
    switch (key) {
      case "budget": next.budget = updateFieldFirmness(brief.budget); break;
      case "cities": next.cities = updateFieldFirmness(brief.cities); break;
      case "districts": next.districts = updateFieldFirmness(brief.districts); break;
      case "propertyTypes": next.propertyTypes = updateFieldFirmness(brief.propertyTypes); break;
      case "minBedrooms": next.minBedrooms = updateFieldFirmness(brief.minBedrooms); break;
      case "minAreaSqft": next.minAreaSqft = updateFieldFirmness(brief.minAreaSqft); break;
      case "maxDowntownMinutes": next.maxDowntownMinutes = updateFieldFirmness(brief.maxDowntownMinutes); break;
      case "maxWaterfrontMinutes": next.maxWaterfrontMinutes = updateFieldFirmness(brief.maxWaterfrontMinutes); break;
      case "maxAirportMinutes": next.maxAirportMinutes = updateFieldFirmness(brief.maxAirportMinutes); break;
      case "maxDiningMinutes": next.maxDiningMinutes = updateFieldFirmness(brief.maxDiningMinutes); break;
      case "mustHave": next.mustHave = updateFieldFirmness(brief.mustHave); break;
    }
    pushRelaxed(next, key, values);
    next.unresolvedQuestions = next.unresolvedQuestions.filter((q) => q !== "refineResults");
    return next;
  } else if (action.type === "clear") {
    const key = action.field as keyof AdvisorBrief;
    const next = removeField(brief, key);
    next.unresolvedQuestions = next.unresolvedQuestions.filter((q) => !(key === "budget" && q === "budget"));
    if (key === "budget") declineQuestion(next, "budget");
    return next;
  }
  return brief;
}

function publicInventory(properties: Property[]) {
  return properties.filter((p) => !p.is_private && p.availability === "available");
}

function normalizedEqual(a: string, b: string) {
  return fold(a) === fold(b);
}

function matchesAll<T>(actual: T, expected: T[] | undefined) {
  return !expected?.length || expected.some((item) => normalizedEqual(String(actual), String(item)));
}

function isExcluded<T>(actual: T, excluded: T[] | undefined) {
  return !!excluded?.some((item) => normalizedEqual(String(actual), String(item)));
}

function hasTag(property: Property, tag: AdvisorFeature) {
  if (tag === "privacy") return false;
  return property.tags.includes(tag);
}

function filterProperty(
  property: Property,
  brief: AdvisorBrief,
  ignored?: AdvisorConstraintKey,
) {
  if (property.is_private || property.availability !== "available") return false;
  // A residential brief must never return commercial space as a home.
  if (["home", "family", "retreat", "private"].includes(brief.objective?.value ?? "") && property.type === "commercial") return false;
  const required = (name: AdvisorConstraintKey) => name !== ignored;
  if (required("budget") && brief.budget?.firmness === "required" && brief.budget.value.currency === "AED") {
    if (brief.budget.value.max !== undefined && property.price.amount > brief.budget.value.max) return false;
    if (brief.budget.value.min !== undefined && property.price.amount < brief.budget.value.min) return false;
  }
  if (required("cities") && brief.cities?.firmness === "required" && !matchesAll(property.location.city.en, brief.cities.value)) return false;
  if (required("districts") && brief.districts?.firmness === "required" && !matchesAll(property.location.district.en, brief.districts.value)) return false;
  if (required("propertyTypes") && brief.propertyTypes?.firmness === "required" && !matchesAll(property.type, brief.propertyTypes.value)) return false;
  if (required("minBedrooms") && brief.minBedrooms?.firmness === "required" && property.bedrooms < brief.minBedrooms.value) return false;
  if (required("minAreaSqft") && brief.minAreaSqft?.firmness === "required" && property.area_sqft < brief.minAreaSqft.value) return false;
  if (required("maxDowntownMinutes") && brief.maxDowntownMinutes?.firmness === "required" && property.location.downtown_min > brief.maxDowntownMinutes.value) return false;
  if (required("maxWaterfrontMinutes") && brief.maxWaterfrontMinutes?.firmness === "required" && property.location.waterfront_min > brief.maxWaterfrontMinutes.value) return false;
  if (required("maxAirportMinutes") && brief.maxAirportMinutes?.firmness === "required" && property.location.airport_min > brief.maxAirportMinutes.value) return false;
  if (required("maxDiningMinutes") && brief.maxDiningMinutes?.firmness === "required" && (property.location.dining_min === undefined || property.location.dining_min > brief.maxDiningMinutes.value)) return false;
  if (required("mustHave") && brief.mustHave?.firmness === "required" && brief.mustHave.value.some((feature) => !hasTag(property, feature))) return false;
  if (required("excludedFeatures") && brief.excludedFeatures?.value.some((feature) => hasTag(property, feature))) return false;
  if (required("excludedCities") && isExcluded(property.location.city.en, brief.excludedCities?.value)) return false;
  if (required("excludedDistricts") && isExcluded(property.location.district.en, brief.excludedDistricts?.value)) return false;
  if (required("excludedPropertyTypes") && isExcluded(property.type, brief.excludedPropertyTypes?.value)) return false;
  return true;
}

export function eligibleAdvisorProperties(
  properties: Property[],
  brief: AdvisorBrief,
  ignored?: AdvisorConstraintKey,
) {
  return publicInventory(properties).filter((p) => filterProperty(p, brief, ignored));
}

function distanceScore(value: number | undefined, all: Property[], accessor: (p: Property) => number | undefined) {
  if (value === undefined || !Number.isFinite(value)) return undefined;
  const values = all.map(accessor).filter((v): v is number => v !== undefined && Number.isFinite(v));
  if (!values.length) return undefined;
  const min = Math.min(...values);
  const max = Math.max(...values);
  return min === max ? 1 : Math.max(0, Math.min(1, 1 - (value - min) / (max - min)));
}

type ScoringSignal = { criterion: AdvisorCriterion; value?: number; source: "stated" | "inferred"; weight: number };

function calculateSignals(property: Property, brief: AdvisorBrief, inventory: Property[]): ScoringSignal[] {
  const signals: ScoringSignal[] = [];
  const add = (criterion: AdvisorCriterion, value: number | undefined, source: "stated" | "inferred" = "stated", baseWeight = 1) => {
    const priority = brief.priorities[criterion] ?? 1;
    const confidenceWeight = source === "inferred" ? 0.65 : 1;
    signals.push({ criterion, value: value === undefined ? undefined : Math.max(0, Math.min(1, value)), source, weight: baseWeight * confidenceWeight * priority });
  };
  const selected = (name: AdvisorPreference) => brief.preferences?.value.includes(name) ?? false;
  const soft = (value: AdvisorField<unknown> | undefined) => value?.firmness !== "required";
  const budget = brief.budget?.value;
  if (budget && budget.currency === "AED" && soft(brief.budget)) {
    let value: number | undefined;
    if (budget.min !== undefined && property.price.amount < budget.min) value = property.price.amount / budget.min;
    else if (budget.max !== undefined && property.price.amount > budget.max) value = budget.max / property.price.amount;
    else value = 1;
    add("budget", value, brief.budget?.source);
  }
  if (brief.cities && soft(brief.cities)) add("location", matchesAll(property.location.city.en, brief.cities.value) ? 1 : 0, brief.cities.source);
  if (brief.districts && soft(brief.districts)) add("location", matchesAll(property.location.district.en, brief.districts.value) ? 1 : 0, brief.districts.source);
  if (brief.propertyTypes && soft(brief.propertyTypes)) add("propertyType", matchesAll(property.type, brief.propertyTypes.value) ? 1 : 0, brief.propertyTypes.source);
  if (brief.minBedrooms && soft(brief.minBedrooms)) add("bedrooms", Math.min(1, property.bedrooms / Math.max(1, brief.minBedrooms.value)), brief.minBedrooms.source);
  if (brief.minAreaSqft && soft(brief.minAreaSqft)) add("area", Math.min(1, property.area_sqft / Math.max(1, brief.minAreaSqft.value)), brief.minAreaSqft.source);
  const distanceFields: [keyof Pick<AdvisorBrief, "maxDowntownMinutes" | "maxWaterfrontMinutes" | "maxAirportMinutes" | "maxDiningMinutes">, (p: Property) => number | undefined, AdvisorCriterion][] = [
    ["maxDowntownMinutes", (p) => p.location.downtown_min, "cityProximity"],
    ["maxWaterfrontMinutes", (p) => p.location.waterfront_min, "waterfront"],
    ["maxAirportMinutes", (p) => p.location.airport_min, "airportProximity"],
    ["maxDiningMinutes", (p) => p.location.dining_min, "diningProximity"],
  ];
  for (const [key, accessor, criterion] of distanceFields) {
    const setting = brief[key];
    if (!setting || !soft(setting)) continue;
    const value = accessor(property);
    const satisfaction = value === undefined ? undefined : value <= setting.value ? 1 : setting.value / Math.max(1, value);
    add(criterion, satisfaction, setting.source);
  }
  if (brief.mustHave && soft(brief.mustHave)) {
    const target = brief.mustHave.value;
    const met = target.filter((feature) => hasTag(property, feature)).length;
    add("features", target.length ? met / target.length : undefined, brief.mustHave.source);
  }
  const explicitPreferences = brief.preferences?.value ?? [];
  const inferredPreferences: AdvisorPreference[] = [];
  if (brief.objective?.value === "family" && !selected("family")) inferredPreferences.push("family");
  if (brief.objective?.value === "retreat") {
    if (!selected("quiet")) inferredPreferences.push("quiet");
    if (!selected("outdoor")) inferredPreferences.push("outdoor");
  }
  const allPreferences = unique([...explicitPreferences, ...inferredPreferences]);
  for (const preference of allPreferences) {
    let value: number | undefined;
    if (preference === "quiet" || preference === "family" || preference === "pool" || preference === "garden" || preference === "terrace") {
      value = hasTag(property, preference as AdvisorFeature) ? 1 : 0;
    } else if (preference === "privacy") {
      // is_private marks a confidential catalogue record, not the privacy of a residence.
      value = undefined;
    } else if (preference === "outdoor") {
      const tags = ["garden", "terrace", "pool"];
      value = tags.filter((tag) => property.tags.includes(tag)).length / tags.length;
    } else if (preference === "waterfront") {
      value = distanceScore(property.location.waterfront_min, inventory, (p) => p.location.waterfront_min);
    } else if (preference === "cityProximity") {
      value = distanceScore(property.location.downtown_min, inventory, (p) => p.location.downtown_min);
    } else if (preference === "airportProximity") {
      value = distanceScore(property.location.airport_min, inventory, (p) => p.location.airport_min);
    } else if (preference === "diningProximity") {
      value = distanceScore(property.location.dining_min, inventory, (p) => p.location.dining_min);
    }
    const source = explicitPreferences.includes(preference) ? brief.preferences?.source ?? "stated" : "inferred";
    add(preference, value, source);
  }
  return signals;
}

export function scoreAdvisorProperty(property: Property, brief: AdvisorBrief, properties: Property[] = getProperties()) {
  const inventory = publicInventory(properties);
  const signals = calculateSignals(property, brief, inventory);
  const totalWeight = signals.reduce((sum, item) => sum + item.weight, 0);
  if (!totalWeight) return { score: 0.5, coverage: 0, criterionCount: 0 };
  const known = signals.filter((item) => item.value !== undefined);
  const knownWeight = known.reduce((sum, item) => sum + item.weight, 0);
  const unknownWeight = totalWeight - knownWeight;
  const weightedKnown = known.reduce((sum, item) => sum + (item.value ?? 0) * item.weight, 0);
  // Missing evidence receives a neutral value. It neither rewards nor punishes a listing.
  const score = (weightedKnown + unknownWeight * 0.5) / totalWeight;
  return { score, coverage: knownWeight / totalWeight, criterionCount: signals.length };
}

export function hasSupportedAdvisorCriteria(brief: AdvisorBrief, properties: Property[] = getProperties()) {
  const available = publicInventory(properties);
  if (brief.budget?.value.currency === "AED" && (brief.budget.value.max !== undefined || brief.budget.value.min !== undefined)) return true;
  if (brief.cities || brief.districts || brief.propertyTypes || brief.minBedrooms || brief.minAreaSqft || brief.maxDowntownMinutes || brief.maxWaterfrontMinutes || brief.maxAirportMinutes || brief.maxDiningMinutes || brief.mustHave || brief.excludedFeatures || brief.excludedCities || brief.excludedDistricts || brief.excludedPropertyTypes) return true;
  if (brief.preferences?.value.some((p) => p !== "privacy")) return true;
  if (brief.objective?.value === "family" || brief.objective?.value === "retreat") return true;
  return available.length > 0 && brief.preferences?.value.some((p) => p === "privacy") === false;
}

export interface RankedAdvisorProperty {
  property: Property;
  score: number;
  coverage: number;
}

export function rankAdvisorProperties(properties: Property[], brief: AdvisorBrief): RankedAdvisorProperty[] {
  const inventory = publicInventory(properties);
  return eligibleAdvisorProperties(inventory, brief)
    .map((property) => ({ property, ...scoreAdvisorProperty(property, brief, inventory) }))
    .sort((a, b) => b.score - a.score || b.coverage - a.coverage || a.property.price.amount - b.property.price.amount || a.property.id.localeCompare(b.property.id));
}

function localizedDistrictValue(p: Property, name: string, fieldName: "city" | "district") {
  const match = p.location[fieldName];
  return normalizedEqual(match.en, name) ? match.en : name;
}

function makeReasons(property: Property, brief: AdvisorBrief): AdvisorRecommendation {
  const reasons: AdvisorEvidence[] = [evidence("advisorEvidenceAvailable")];
  const tradeoffs: AdvisorEvidence[] = [];
  const addFit = (key: AdvisorEvidenceKey, values?: Record<string, string | number>) => reasons.push(evidence(key, values));
  const addTradeoff = (key: AdvisorEvidenceKey, values?: Record<string, string | number>) => tradeoffs.push(evidence(key, values));
  const budget = brief.budget?.value;
  if (budget?.currency === "AED" && budget.max !== undefined) {
    if (property.price.amount <= budget.max) addFit("advisorEvidenceWithinBudget", { price: property.price.amount, max: budget.max });
    else addTradeoff("advisorTradeoffBudget", { price: property.price.amount, max: budget.max });
  }
  if (budget?.currency === "AED" && budget.min !== undefined) {
    if (property.price.amount >= budget.min) addFit("advisorEvidenceBudgetFloor", { price: property.price.amount, min: budget.min });
    else addTradeoff("advisorTradeoffBudget", { price: property.price.amount, min: budget.min });
  }
  if (brief.minBedrooms) {
    if (property.bedrooms >= brief.minBedrooms.value) addFit("advisorEvidenceBedroomMinimum", { n: property.bedrooms, min: brief.minBedrooms.value });
    else addTradeoff("advisorTradeoffBedrooms", { n: property.bedrooms, min: brief.minBedrooms.value });
  }
  if (brief.cities) {
    const matches = matchesAll(property.location.city.en, brief.cities.value);
    if (matches) addFit("advisorEvidenceCity", { city: property.location.city.en });
    else addTradeoff("advisorTradeoffLocation", { city: property.location.city.en });
  }
  if (brief.districts) {
    const matches = matchesAll(property.location.district.en, brief.districts.value);
    if (matches) addFit("advisorEvidenceDistrict", { district: property.location.district.en });
    else addTradeoff("advisorTradeoffDistrict", { district: property.location.district.en });
  }
  if (brief.propertyTypes) {
    if (matchesAll(property.type, brief.propertyTypes.value)) addFit("advisorEvidenceType", { type: property.type });
    else addTradeoff("advisorTradeoffType", { type: property.type });
  }
  if (brief.minAreaSqft) {
    if (property.area_sqft >= brief.minAreaSqft.value) addFit("advisorEvidenceArea", { area: property.area_sqft, min: brief.minAreaSqft.value });
    else addTradeoff("advisorTradeoffArea", { area: property.area_sqft, min: brief.minAreaSqft.value });
  }
  if (brief.mustHave?.value.length) {
    for (const feature of brief.mustHave.value) {
      if (hasTag(property, feature)) addFit("advisorEvidenceFeature", { feature });
      else addTradeoff("advisorTradeoffFeature", { feature });
    }
  }
  if (brief.excludedFeatures?.value.length) {
    addFit("advisorEvidenceExclusion", { feature: brief.excludedFeatures.value.join(", ") });
  }
  const explicitPreferences = brief.preferences?.value ?? [];
  const inferredPreferences: AdvisorPreference[] = [];
  if (brief.objective?.value === "family" && !explicitPreferences.includes("family")) inferredPreferences.push("family");
  if (brief.objective?.value === "retreat") {
    if (!explicitPreferences.includes("quiet")) inferredPreferences.push("quiet");
    if (!explicitPreferences.includes("outdoor")) inferredPreferences.push("outdoor");
  }
  const preferences = unique([...explicitPreferences, ...inferredPreferences]);
  if (preferences.includes("quiet")) {
    if (property.tags.includes("quiet")) addFit("advisorEvidenceQuietTag");
    else addTradeoff("advisorTradeoffQuiet");
  }
  if (preferences.includes("family")) {
    if (property.tags.includes("family")) addFit("advisorEvidenceFamilyTag");
    else addTradeoff("advisorTradeoffFamily");
  }
  if (preferences.includes("outdoor")) {
    const features = property.tags.filter((tag) => ["garden", "terrace", "pool"].includes(tag));
    if (features.length) addFit("advisorEvidenceFeature", { feature: features.join(", ") });
    else addTradeoff("advisorTradeoffOutdoor");
  }
  if (preferences.includes("pool") && !brief.mustHave?.value.includes("pool")) {
    if (property.tags.includes("pool")) addFit("advisorEvidenceFeature", { feature: "pool" });
    else addTradeoff("advisorTradeoffFeature", { feature: "pool" });
  }
  if (preferences.includes("garden") && !brief.mustHave?.value.includes("garden")) {
    if (property.tags.includes("garden")) addFit("advisorEvidenceFeature", { feature: "garden" });
    else addTradeoff("advisorTradeoffFeature", { feature: "garden" });
  }
  if (preferences.includes("terrace") && !brief.mustHave?.value.includes("terrace")) {
    if (property.tags.includes("terrace")) addFit("advisorEvidenceFeature", { feature: "terrace" });
    else addTradeoff("advisorTradeoffFeature", { feature: "terrace" });
  }
  if (preferences.includes("waterfront")) {
    addFit("advisorEvidenceWaterfront", { n: property.location.waterfront_min });
  }
  if (preferences.includes("cityProximity")) addFit("advisorEvidenceDowntown", { n: property.location.downtown_min });
  if (preferences.includes("airportProximity")) addFit("advisorEvidenceAirport", { n: property.location.airport_min });
  if (preferences.includes("diningProximity") && property.location.dining_min !== undefined) addFit("advisorEvidenceDining", { n: property.location.dining_min });
  if (brief.maxDowntownMinutes) {
    if (property.location.downtown_min <= brief.maxDowntownMinutes.value) addFit("advisorEvidenceDowntown", { n: property.location.downtown_min });
    else addTradeoff("advisorTradeoffDowntown", { n: property.location.downtown_min, max: brief.maxDowntownMinutes.value });
  }
  if (brief.maxWaterfrontMinutes) {
    if (property.location.waterfront_min <= brief.maxWaterfrontMinutes.value) addFit("advisorEvidenceWaterfront", { n: property.location.waterfront_min });
    else addTradeoff("advisorTradeoffWaterfront", { n: property.location.waterfront_min, max: brief.maxWaterfrontMinutes.value });
  }
  if (brief.maxAirportMinutes) {
    if (property.location.airport_min <= brief.maxAirportMinutes.value) addFit("advisorEvidenceAirport", { n: property.location.airport_min });
    else addTradeoff("advisorTradeoffAirport", { n: property.location.airport_min, max: brief.maxAirportMinutes.value });
  }
  if (brief.maxDiningMinutes) {
    if (property.location.dining_min === undefined) addTradeoff("advisorTradeoffDining");
    else if (property.location.dining_min <= brief.maxDiningMinutes.value) addFit("advisorEvidenceDining", { n: property.location.dining_min });
    else addTradeoff("advisorTradeoffDining", { n: property.location.dining_min, max: brief.maxDiningMinutes.value });
  }
  if (preferences.includes("privacy") || brief.objective?.value === "private" || brief.mustHave?.value.includes("privacy")) {
    addTradeoff("advisorTradeoffPrivacyUnknown");
  }
  for (const relaxation of brief.relaxedConstraints) {
    const relaxedValues = relaxation.values ?? [];
    if (relaxation.field === "excludedFeatures" && relaxedValues.some((value) => hasTag(property, value as AdvisorFeature))) {
      const matched = relaxedValues.filter((value) => hasTag(property, value as AdvisorFeature)).join(", ");
      addTradeoff("advisorTradeoffRelaxedExcludedFeature", { feature: matched });
    } else if (relaxation.field === "excludedCities" && relaxedValues.some((value) => normalizedEqual(property.location.city.en, String(value)))) {
      addTradeoff("advisorTradeoffRelaxedLocation", { city: property.location.city.en });
    } else if (relaxation.field === "excludedDistricts" && relaxedValues.some((value) => normalizedEqual(property.location.district.en, String(value)))) {
      addTradeoff("advisorTradeoffRelaxedDistrict", { district: property.location.district.en });
    } else if (relaxation.field === "excludedPropertyTypes" && relaxedValues.includes(property.type)) {
      addTradeoff("advisorTradeoffRelaxedType", { type: property.type });
    }
  }
  if (!brief.minBedrooms && !brief.minAreaSqft && !brief.propertyTypes && !brief.cities && !brief.districts && preferences.length === 0 && !budget) {
    // This branch should not normally be recommended, but avoids an empty explanation if a future brief allows it.
    addFit("advisorEvidenceLocation", { district: property.location.district.en });
  }
  return { propertyId: property.id, reasons, tradeoffs };
}

function constraintEvidence(brief: AdvisorBrief): AdvisorEvidence[] {
  const result: AdvisorEvidence[] = [];
  const add = (key: AdvisorEvidenceKey, values?: Record<string, string | number>) => result.push(evidence(key, values));
  if (brief.budget?.firmness === "required" && brief.budget.value.currency === "AED") {
    if (brief.budget.value.max !== undefined) add("advisorStrictBudget", { max: brief.budget.value.max });
    if (brief.budget.value.min !== undefined) add("advisorStrictBudgetFloor", { min: brief.budget.value.min });
  }
  if (brief.cities?.firmness === "required") add("advisorStrictCity", { city: brief.cities.value.join(", ") });
  if (brief.districts?.firmness === "required") add("advisorStrictDistrict", { district: brief.districts.value.join(", ") });
  if (brief.propertyTypes?.firmness === "required") add("advisorStrictType", { type: brief.propertyTypes.value.join(", ") });
  if (brief.minBedrooms?.firmness === "required") add("advisorStrictBedrooms", { min: brief.minBedrooms.value });
  if (brief.minAreaSqft?.firmness === "required") add("advisorStrictArea", { min: brief.minAreaSqft.value });
  if (brief.maxDowntownMinutes?.firmness === "required") add("advisorStrictDowntown", { max: brief.maxDowntownMinutes.value });
  if (brief.maxWaterfrontMinutes?.firmness === "required") add("advisorStrictWaterfront", { max: brief.maxWaterfrontMinutes.value });
  if (brief.maxAirportMinutes?.firmness === "required") add("advisorStrictAirport", { max: brief.maxAirportMinutes.value });
  if (brief.maxDiningMinutes?.firmness === "required") add("advisorStrictDining", { max: brief.maxDiningMinutes.value });
  if (brief.mustHave?.firmness === "required") brief.mustHave.value.forEach((feature) => add("advisorStrictFeature", { feature }));
  brief.excludedFeatures?.value.forEach((feature) => add("advisorStrictExcludedFeature", { feature }));
  brief.excludedCities?.value.forEach((city) => add("advisorStrictExcludedCity", { city }));
  brief.excludedDistricts?.value.forEach((district) => add("advisorStrictExcludedDistrict", { district }));
  brief.excludedPropertyTypes?.value.forEach((type) => add("advisorStrictExcludedType", { type }));
  return result;
}

const RELAX_COPY: Partial<Record<AdvisorConstraintKey, AdvisorCopyKey>> = {
  budget: "advisorRelaxBudget",
  cities: "advisorRelaxLocation",
  districts: "advisorRelaxDistrict",
  propertyTypes: "advisorRelaxType",
  minBedrooms: "advisorRelaxBedrooms",
  minAreaSqft: "advisorRelaxArea",
  maxDowntownMinutes: "advisorRelaxDowntown",
  maxWaterfrontMinutes: "advisorRelaxWaterfront",
  maxAirportMinutes: "advisorRelaxAirport",
  maxDiningMinutes: "advisorRelaxDining",
  mustHave: "advisorRelaxFeature",
  excludedFeatures: "advisorRelaxExcludedFeature",
  excludedCities: "advisorRelaxExcludedLocation",
  excludedDistricts: "advisorRelaxExcludedLocation",
  excludedPropertyTypes: "advisorRelaxExcludedType",
};

function relaxationActions(properties: Property[], brief: AdvisorBrief): AdvisorSuggestion[] {
  const possible = new Set<AdvisorConstraintKey>();
  if (brief.budget?.firmness === "required" && (brief.budget.value.max !== undefined || brief.budget.value.min !== undefined)) possible.add("budget");
  if (brief.cities?.firmness === "required") possible.add("cities");
  if (brief.districts?.firmness === "required") possible.add("districts");
  if (brief.propertyTypes?.firmness === "required") possible.add("propertyTypes");
  if (brief.minBedrooms?.firmness === "required") possible.add("minBedrooms");
  if (brief.minAreaSqft?.firmness === "required") possible.add("minAreaSqft");
  if (brief.maxDowntownMinutes?.firmness === "required") possible.add("maxDowntownMinutes");
  if (brief.maxWaterfrontMinutes?.firmness === "required") possible.add("maxWaterfrontMinutes");
  if (brief.maxAirportMinutes?.firmness === "required") possible.add("maxAirportMinutes");
  if (brief.maxDiningMinutes?.firmness === "required") possible.add("maxDiningMinutes");
  if (brief.mustHave?.firmness === "required" && brief.mustHave.value.length) possible.add("mustHave");
  if (brief.excludedFeatures?.value.length) possible.add("excludedFeatures");
  if (brief.excludedCities?.value.length) possible.add("excludedCities");
  if (brief.excludedDistricts?.value.length) possible.add("excludedDistricts");
  if (brief.excludedPropertyTypes?.value.length) possible.add("excludedPropertyTypes");
  return [...possible].flatMap((key) => {
    const count = eligibleAdvisorProperties(properties, brief, key).length;
    const label = RELAX_COPY[key];
    return count && label ? [{ label: copy(label, { n: count }), action: { type: "relax", field: key } as AdvisorAction }] : [];
  });
}

function question(
  id: AdvisorQuestionKey,
  key: AdvisorCopyKey,
  choices: AdvisorSuggestion[] = [],
): AdvisorQuestion {
  return { id, key, choices };
}

export function intentSuggestions(): AdvisorSuggestion[] {
  const values: [AdvisorCopyKey, NonNullable<AdvisorBrief["objective"]>["value"]][] = [
    ["advisorQuickHome", "home"],
    ["advisorQuickInvestment", "investment"],
    ["advisorQuickRetreat", "retreat"],
    ["advisorQuickFamily", "family"],
    ["advisorQuickPrivate", "private"],
  ];
  return values.map(([key, objective]) => ({ label: copy(key), action: { type: "setObjective", objective } }));
}

function followUpFor(brief: AdvisorBrief, properties: Property[], hasResults: boolean): AdvisorQuestion | undefined {
  const unresolved = brief.unresolvedQuestions[0];
  if (brief.mustHave?.firmness === "required" && brief.mustHave.value.includes("privacy") && !brief.declinedQuestions.includes("privacyEvidence")) {
    return question("privacyEvidence", "advisorAskPrivacy", privacyChoices());
  }
  const strictNoMatches = hasSupportedAdvisorCriteria(brief, properties) && eligibleAdvisorProperties(properties, brief).length === 0;
  if (strictNoMatches) {
    return question("refineResults", "advisorAskRefine", relaxationActions(properties, brief));
  }
  if (unresolved === "refineResults" && !hasResults) {
    return question("refineResults", "advisorAskRefine", relaxationActions(properties, brief));
  }
  if (unresolved === "budget" && !hasResults) return question("budget", "advisorAskBudget", [{ label: copy("advisorQuickOpenBudget"), action: { type: "answer", question: "budget", value: "skip" } }]);
  if (unresolved === "investmentFocus") return question("investmentFocus", "advisorAskInvestmentFocus", investmentChoices());
  if (unresolved === "investmentCriteria") return question("investmentCriteria", "advisorAskInvestmentCriteria");
  if (unresolved === "quietVsCity") return question("quietVsCity", "advisorAskQuietCity", priorityChoices());
  if (unresolved === "bedrooms") return question("bedrooms", "advisorAskBedrooms", bedroomChoices());
  if (unresolved === "privacyEvidence") return question("privacyEvidence", "advisorAskPrivacy", privacyChoices());
  if (unresolved === "primaryNeed") return question("primaryNeed", "advisorAskPrimary", primaryChoices());
  if (unresolved === "budget") return question("budget", "advisorAskBudget", [{ label: copy("advisorQuickOpenBudget"), action: { type: "answer", question: "budget", value: "skip" } }]);
  if (unresolved === "refineResults" && hasResults) return undefined;

  if (brief.objective?.value === "investment" && !brief.investmentFocus && !brief.declinedQuestions.includes("investmentFocus")) {
    return question("investmentFocus", "advisorAskInvestmentFocus", investmentChoices());
  }
  if (brief.objective?.value === "investment" && !hasSupportedAdvisorCriteria(brief, properties)) {
    return question("investmentCriteria", "advisorAskInvestmentCriteria");
  }
  if (brief.objective?.value === "family" && !brief.minBedrooms && !brief.declinedQuestions.includes("bedrooms")) {
    return question("bedrooms", "advisorAskBedrooms", bedroomChoices());
  }
  if (
    brief.preferences?.value.includes("quiet") &&
    brief.preferences.value.includes("cityProximity") &&
    brief.priorities.quiet === undefined &&
    brief.priorities.cityProximity === undefined &&
    !brief.declinedQuestions.includes("quietVsCity")
  ) {
    return question("quietVsCity", "advisorAskQuietCity", priorityChoices());
  }
  if ((brief.objective?.value === "private" || brief.preferences?.value.includes("privacy")) && !brief.declinedQuestions.includes("privacyEvidence")) {
    return question("privacyEvidence", "advisorAskPrivacy", privacyChoices());
  }
  if (!hasResults && !hasSupportedAdvisorCriteria(brief, properties) && !brief.declinedQuestions.includes("primaryNeed")) {
    return question("primaryNeed", "advisorAskPrimary", primaryChoices());
  }
  if (
    hasResults &&
    !brief.budget &&
    !brief.declinedQuestions.includes("budget") &&
    !brief.unresolvedQuestions.includes("budget")
  ) {
    return question("budget", "advisorAskBudget", [{ label: copy("advisorQuickOpenBudget"), action: { type: "answer", question: "budget", value: "skip" } }]);
  }
  return undefined;
}

function investmentChoices(): AdvisorSuggestion[] {
  return [
    { label: copy("advisorQuickRental"), action: { type: "answer", question: "investmentFocus", value: "rental" } },
    { label: copy("advisorQuickLongTerm"), action: { type: "answer", question: "investmentFocus", value: "longTerm" } },
    { label: copy("advisorQuickResale"), action: { type: "answer", question: "investmentFocus", value: "resale" } },
    { label: copy("advisorQuickFlexible"), action: { type: "answer", question: "investmentFocus", value: "skip" } },
  ];
}
function priorityChoices(): AdvisorSuggestion[] {
  return [
    { label: copy("advisorQuickQuietLeads"), action: { type: "answer", question: "quietVsCity", value: "quiet" } },
    { label: copy("advisorQuickCityLeads"), action: { type: "answer", question: "quietVsCity", value: "city" } },
    { label: copy("advisorQuickEqual"), action: { type: "answer", question: "quietVsCity", value: "equal" } },
  ];
}
function bedroomChoices(): AdvisorSuggestion[] {
  const choices: AdvisorSuggestion[] = [3, 4, 5].map((n) => ({
    label: copy("advisorQuickBedroomChoice", { n }),
    action: { type: "answer", question: "bedrooms", value: String(n) },
  }));
  choices.push({ label: copy("advisorQuickFlexible"), action: { type: "answer", question: "bedrooms", value: "flexible" } });
  return choices;
}
function privacyChoices(): AdvisorSuggestion[] {
  return [
    { label: copy("advisorQuickUseQuiet"), action: { type: "answer", question: "privacyEvidence", value: "quiet" } },
    { label: copy("advisorQuickKeepUnknown"), action: { type: "answer", question: "privacyEvidence", value: "unknown" } },
  ];
}
function primaryChoices(): AdvisorSuggestion[] {
  return [
    { label: copy("advisorQuickQuiet"), action: { type: "setPreference", preference: "quiet" } },
    { label: copy("advisorQuickOutdoor"), action: { type: "setPreference", preference: "outdoor" } },
    { label: copy("advisorQuickCity"), action: { type: "setPreference", preference: "cityProximity" } },
  ];
}

function notesFor(brief: AdvisorBrief, unsupportedCurrency = false): AdvisorEvidence[] {
  const notes: AdvisorEvidence[] = [];
  if (brief.objective?.value === "investment") notes.push(evidence("advisorInvestmentDisclosure"));
  if (brief.objective?.value === "family" || brief.objective?.value === "retreat") notes.push(evidence("advisorInferredSignalsDisclosure"));
  if (brief.objective?.value === "private" || brief.preferences?.value.includes("privacy") || brief.mustHave?.value.includes("privacy")) notes.push(evidence("advisorPrivacyDisclosure"));
  if (brief.timeline) notes.push(evidence("advisorTimelineDisclosure"));
  if (unsupportedCurrency || (brief.budget && brief.budget.value.currency !== "AED")) notes.push(evidence("advisorCurrencyDisclosure"));
  return notes;
}

function responseCopy(brief: AdvisorBrief, ready: boolean, hasResults: boolean, unsupportedCurrency: boolean, recognized: boolean): AdvisorCopyKey {
  if (unsupportedCurrency || (brief.budget && brief.budget.value.currency !== "AED")) return "advisorResponseUnsupportedCurrency";
  if (ready && !hasResults) return "advisorResponseNoResults";
  if (!recognized) return "advisorResponseScope";
  if (brief.objective?.value === "investment") return "advisorResponseInvestment";
  if (brief.objective?.value === "private" && !brief.preferences?.value.includes("quiet") && !hasResults) return "advisorResponsePrivacy";
  if (!ready) return "advisorResponseNeedMore";
  if (!brief.budget && brief.declinedQuestions.includes("budget")) return "advisorResponseNoBudget";
  return "advisorResponseReady";
}

function responseWithQuestion(brief: AdvisorBrief, properties: Property[], ready: boolean, hasResults: boolean, unsupportedCurrency: boolean, recognized: boolean): AdvisorExchange {
  const updatedBrief: AdvisorBrief = {
    ...brief,
    priorities: { ...brief.priorities },
    unresolvedQuestions: [...brief.unresolvedQuestions],
    declinedQuestions: [...brief.declinedQuestions],
    relaxedConstraints: [...brief.relaxedConstraints],
  };
  const followUp = unsupportedCurrency
    ? question("budget", "advisorAskBudget", [{ label: copy("advisorQuickOpenBudget"), action: { type: "answer", question: "budget", value: "skip" } }])
    : followUpFor(updatedBrief, properties, hasResults);
  if (followUp && !updatedBrief.unresolvedQuestions.includes(followUp.id)) updatedBrief.unresolvedQuestions.push(followUp.id);
  const ranked = hasResults ? rankAdvisorProperties(properties, updatedBrief).slice(0, 3) : [];
  const recommendations = ranked.map(({ property }) => makeReasons(property, updatedBrief));
  const alternatives = !hasResults ? relaxationActions(properties, updatedBrief) : [];
  const noResults = !hasResults && ready
    ? { strictCriteria: constraintEvidence(updatedBrief), alternatives }
    : undefined;
  const response: AdvisorResponse = {
    reply: copy(responseCopy(updatedBrief, ready, hasResults, unsupportedCurrency, recognized)),
    recommendations,
    recommendationIds: recommendations.map((item) => item.propertyId).filter((id) => properties.some((p) => p.id === id && !p.is_private && p.availability === "available")),
    followUp,
    noResults,
    notes: notesFor(updatedBrief, unsupportedCurrency),
    ...(recommendations.length ? { orderNote: "advisorPriorityOrder" as const } : {}),
  };
  // Strict matching is evaluated before a record enters the ranking and response.
  return { updatedBrief, response };
}

function hasOnlyUnsupportedPrivacy(brief: AdvisorBrief) {
  const wantsPrivacy = brief.objective?.value === "private" || brief.preferences?.value.includes("privacy") || brief.mustHave?.value.includes("privacy");
  const other = brief.preferences?.value.filter((p) => p !== "privacy") ?? [];
  return !!wantsPrivacy && !other.length && !brief.budget && !brief.cities && !brief.districts && !brief.propertyTypes && !brief.minBedrooms && !brief.minAreaSqft && !brief.maxDowntownMinutes && !brief.maxWaterfrontMinutes && !brief.maxAirportMinutes && !brief.maxDiningMinutes && !brief.mustHave?.value.some((f) => f !== "privacy") && !brief.excludedFeatures && !brief.excludedCities && !brief.excludedDistricts && !brief.excludedPropertyTypes;
}

export function buildAdvisorExchange(
  brief: AdvisorBrief,
  properties: Property[] = getProperties(),
  options: { unsupportedCurrency?: boolean; recognized?: boolean; replyOverride?: AdvisorCopyKey } = {},
): AdvisorExchange {
  const currencyBlocked = !!brief.budget && brief.budget.value.currency !== "AED";
  const privacyBlocked = brief.mustHave?.firmness === "required" && brief.mustHave.value.includes("privacy") && !brief.declinedQuestions.includes("privacyEvidence");
  const ready = !currencyBlocked && !privacyBlocked && hasSupportedAdvisorCriteria(brief, properties);
  const matches = ready ? rankAdvisorProperties(properties, brief) : [];
  const hasResults = matches.length > 0;
  const recognized = options.recognized ?? true;
  const exchange = responseWithQuestion(brief, properties, ready, hasResults, currencyBlocked || !!options.unsupportedCurrency, recognized);
  if (options.replyOverride) exchange.response.reply = copy(options.replyOverride);
  if (ready && !hasResults && !exchange.response.noResults) {
    exchange.response.noResults = { strictCriteria: constraintEvidence(exchange.updatedBrief), alternatives: relaxationActions(properties, exchange.updatedBrief) };
  }
  if (!ready && hasOnlyUnsupportedPrivacy(exchange.updatedBrief) && exchange.response.followUp?.id !== "privacyEvidence" && !exchange.updatedBrief.declinedQuestions.includes("privacyEvidence")) {
    exchange.response.followUp = question("privacyEvidence", "advisorAskPrivacy", privacyChoices());
    if (!exchange.updatedBrief.unresolvedQuestions.includes("privacyEvidence")) exchange.updatedBrief.unresolvedQuestions.push("privacyEvidence");
  }
  return exchange;
}

export function respondToAdvisorMessage(input: string, brief: AdvisorBrief, properties: Property[] = getProperties()): AdvisorExchange {
  const parsed = parseAdvisorMessage(input, brief, properties);
  if (parsed.reset) {
    const reset = buildAdvisorExchange(parsed.brief, properties, { recognized: true, replyOverride: "advisorResponseReset" });
    reset.response.recommendations = [];
    reset.response.recommendationIds = [];
    reset.response.followUp = undefined;
    return reset;
  }
  if (!input.trim()) return buildAdvisorExchange(brief, properties, { recognized: false, replyOverride: "advisorResponseEmpty" });
  const exchange = buildAdvisorExchange(parsed.brief, properties, { unsupportedCurrency: parsed.unsupportedCurrency, recognized: parsed.recognized });
  if (parsed.recognized && parsed.changed && !exchange.response.recommendationIds.length && !exchange.response.noResults && exchange.response.reply.key === "advisorResponseScope") {
    exchange.response.reply = copy("advisorResponseNeedMore");
  }
  return exchange;
}

export function respondToAdvisorAction(action: AdvisorAction, brief: AdvisorBrief, properties: Property[] = getProperties()): AdvisorExchange {
  const updated = applyAdvisorAction(brief, action);
  const unsupportedCurrency = updated.budget !== undefined && updated.budget.value.currency !== "AED";
  return buildAdvisorExchange(updated, properties, { unsupportedCurrency, recognized: true });
}

export function advisorBriefFields(brief: AdvisorBrief): AdvisorConstraintKey[] {
  const fields: AdvisorConstraintKey[] = [];
  const keys: AdvisorConstraintKey[] = [
    "budget", "cities", "districts", "propertyTypes", "minBedrooms", "minAreaSqft",
    "maxDowntownMinutes", "maxWaterfrontMinutes", "maxAirportMinutes", "maxDiningMinutes",
    "mustHave", "excludedFeatures", "excludedCities", "excludedDistricts", "excludedPropertyTypes",
  ];
  for (const key of keys) if (brief[key]) fields.push(key);
  return fields;
}

export function advisorFieldLabel(key: AdvisorConstraintKey): AdvisorCopyKey {
  const labels: Record<AdvisorConstraintKey, AdvisorCopyKey> = {
    budget: "advisorConstraintBudget",
    cities: "advisorConstraintLocation",
    districts: "advisorConstraintDistrict",
    propertyTypes: "advisorConstraintType",
    minBedrooms: "advisorConstraintBedrooms",
    minAreaSqft: "advisorConstraintArea",
    maxDowntownMinutes: "advisorConstraintDowntown",
    maxWaterfrontMinutes: "advisorConstraintWaterfront",
    maxAirportMinutes: "advisorConstraintAirport",
    maxDiningMinutes: "advisorConstraintDining",
    mustHave: "advisorConstraintFeature",
    excludedFeatures: "advisorConstraintExcludedFeature",
    excludedCities: "advisorConstraintExcludedLocation",
    excludedDistricts: "advisorConstraintExcludedLocation",
    excludedPropertyTypes: "advisorConstraintExcludedType",
  };
  return labels[key];
}

export function advisorFieldValues(brief: AdvisorBrief, key: AdvisorConstraintKey) {
  return brief[key] as AdvisorField<unknown> | undefined;
}

export function advisorFieldRemovableKey(key: AdvisorConstraintKey): AdvisorAction {
  return { type: "clear", field: key };
}

export function localizedPropertyPlace(properties: Property[], value: string, locale: "en" | "ar", fieldName: "city" | "district") {
  for (const property of properties) {
    if (normalizedEqual(property.location[fieldName].en, value)) return property.location[fieldName][locale];
  }
  return value;
}

export function advisorEvidenceLabelKey(feature: string): AdvisorCopyKey | undefined {
  const key = `advisorFeature${feature.charAt(0).toUpperCase()}${feature.slice(1)}` as AdvisorCopyKey;
  return key;
}

export function selectedObjectiveSuggestion(objective: NonNullable<AdvisorBrief["objective"]>["value"]) {
  return intentSuggestions().find((item) => item.action.type === "setObjective" && item.action.objective === objective);
}

export function propertyTypeIsResidential(type: Property["type"]) {
  return type !== "commercial";
}

export function isAdvisorQuestion(key: string): key is AdvisorQuestionKey {
  return ["primaryNeed", "budget", "investmentFocus", "quietVsCity", "bedrooms", "privacyEvidence", "refineResults"].includes(key);
}

export function advisorEvidenceKeyIsFinancial(key: AdvisorEvidenceKey) {
  return key === "advisorTradeoffInvestmentUnknown";
}

export function normalizeAdvisorTextForTest(value: string) {
  return normalizeNumberWords(value);
}
