import { describe, it, expect } from "vitest";
import {
  parseSearch,
  normalizeArabic,
  filterProperties,
  closestProperties,
} from "@/lib/search";
import { getProperties } from "@/lib/data";
import { matchScore, contextualLabel, contributors } from "@/lib/match";
import { differences } from "@/lib/compare";
import { INTENT_WEIGHTS } from "@/constants/intents";
import { areaValue, area, price, number } from "@/lib/format";
import en from "@/i18n/en.json";
import ar from "@/i18n/ar.json";
const properties = getProperties();
describe("deterministic bilingual search", () => {
  const expected = {
    type: "villa" as const,
    bedrooms: 4,
    lifestyle: ["quiet"],
    waterfront: true,
    features: [],
  };
  it.each([
    "أريد فيلا هادئة قريبة من البحر بأربع غرف",
    "I want a quiet villa near the beach with 4 bedrooms",
    "I want a quiet villa near the beach with four bedrooms",
  ])("parses %s", (q) => expect(parseSearch(q)).toEqual(expected));
  it("normalizes Indic digits", () =>
    expect(parseSearch("فيلا ٤ غرف")).toEqual({
      type: "villa",
      bedrooms: 4,
      lifestyle: [],
      features: [],
    }));
  it("normalizes diacritics, tatweel, alif, ya, ta", () =>
    expect(normalizeArabic("إِقـامَة آلى ٤")).toBe("اقامه الي 4"));
  it("ignores unknown fragments", () =>
    expect(parseSearch("something entirely unknown")).toEqual({
      lifestyle: [],
      features: [],
    }));
  it("accepts Arabic number variants", () =>
    expect(parseSearch("فيلا بأربعة غرف").bedrooms).toBe(4));
  it("filters meaningful results", () => {
    const r = filterProperties(properties, expected);
    expect(r.length).toBeGreaterThan(0);
    r.forEach((p) => {
      expect(p.bedrooms).toBe(4);
      expect(p.scores.privacy).toBeGreaterThanOrEqual(75);
      expect(p.location.waterfront_min).toBeLessThanOrEqual(10);
    });
  });
  it("offers nearby alternatives for no exact match", () => {
    const p = parseSearch("villa 99 bedrooms");
    expect(filterProperties(properties, p)).toHaveLength(0);
    expect(closestProperties(properties, p)).toHaveLength(3);
  });
});
describe("transparent scores and labels", () => {
  it("weights each sum to one", () =>
    Object.values(INTENT_WEIGHTS).forEach((w) =>
      expect(Object.values(w).reduce((a, b) => a + b, 0)).toBeCloseTo(1),
    ));
  it("calculates an exact investment match", () =>
    expect(matchScore(properties[0], "investment")).toBe(
      Math.round(80 * 0.6 + 96 * 0.1 + 90 * 0.1 + 86 * 0.2),
    ));
  it("contributors are traceable", () =>
    expect(contributors(properties[0], "investment")[0]).toBe("investment"));
  it("waterfront labels require travel evidence", () =>
    expect(contextualLabel(properties[0], properties, "home")).toBe(
      "waterfront",
    ));
  it("highest privacy wins only when truly highest", () => {
    const visible = properties.filter((p) => !p.is_private);
    expect(contextualLabel(properties[2], visible, "private")).toBe("privacy");
  });
  it("reserved, coming soon and private override labels", () => {
    expect(contextualLabel(properties[3], properties, "home")).toBe("reserved");
    expect(contextualLabel(properties[5], properties, "home")).toBe(
      "coming_soon",
    );
    expect(contextualLabel(properties[4], properties, "home")).toBe("private");
  });
});
describe("difference generator", () => {
  it("provides both directions when both exist", () => {
    const d = differences(properties[0], properties[2]);
    expect(d).toHaveLength(2);
    expect(new Set(d.map((x) => x.winner)).size).toBe(2);
  });
  it("never invents equal-value differences", () =>
    expect(differences(properties[0], properties[0])).toEqual([]));
  it("uses real deltas and a lower travel time as better", () => {
    const b = {
      ...properties[0],
      id: "test",
      location: { ...properties[0].location, waterfront_min: 30 },
    };
    const d = differences(properties[0], b);
    expect(d).toEqual([
      { winner: "marin", loser: "test", metric: "waterfront", delta: 27 },
    ]);
  });
});
describe("localized units and content parity", () => {
  it("converts square feet once", () => {
    expect(areaValue(1000, "ar")).toBe(93);
    expect(areaValue(1000, "en")).toBe(1000);
    expect(area(1000, "en")).toBe("1,000 sq ft");
    expect(area(1000, "ar")).toContain("م²");
  });
  it("formats currency and digits", () => {
    expect(price(18500000, "en")).toContain("18,500,000");
    expect(number(4, "ar")).toBe("٤");
  });
  it("all UI keys have Arabic parity", () =>
    expect(Object.keys(ar).sort()).toEqual(Object.keys(en).sort()));
  it("has eight complete bilingual records", () => {
    expect(properties).toHaveLength(8);
    properties.forEach((p) => {
      expect(p.story.ar.length).toBeGreaterThan(60);
      expect(p.materials.length).toBe(3);
      expect(p.images.day.length).toBeGreaterThanOrEqual(3);
    });
  });
});

describe("atmosphere and inventory states", () => {
  it("at least two properties have evening atmosphere images", () =>
    expect(
      getProperties().filter((p) => p.images.night?.length).length,
    ).toBeGreaterThanOrEqual(2));
  it("never treats a commercial zero-bedroom filter as empty", () => {
    const p = { lifestyle: [], features: [], bedrooms: 0 };
    expect(filterProperties(properties, p).map((x) => x.id)).toEqual(["sable"]);
  });
});
