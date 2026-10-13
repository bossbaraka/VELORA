export type Locale = "en" | "ar";
export type L10n = Record<Locale, string>;
export type Scores = {
  privacy: number;
  outdoor: number;
  family: number;
  investment: number;
};
export type Intent = "home" | "investment" | "retreat" | "family" | "private";
export interface Property {
  id: string;
  slug: string;
  name: L10n;
  type: "villa" | "apartment" | "penthouse" | "townhouse" | "commercial";
  price: { amount: number; currency: "AED" };
  area_sqft: number;
  bedrooms: number;
  bathrooms: number;
  location: {
    city: L10n;
    district: L10n;
    waterfront_min: number;
    downtown_min: number;
    airport_min: number;
    dining_min?: number;
  };
  tags: string[];
  editorialTags: L10n[];
  scores: Scores;
  story: L10n;
  designed_for: L10n[];
  materials: {
    id: string;
    name: L10n;
    usedIn: L10n;
    role: L10n;
    image: string;
  }[];
  features: L10n[];
  images: { day: string[]; night?: string[] };
  floorplan?: string;
  orientation?: "north" | "south" | "east" | "west" | "corner";
  availability: "available" | "reserved" | "sold" | "coming_soon";
  is_private: boolean;
  label?: string;
  similarPropertyIds?: string[];
  advisorId: string;
}
export interface Advisor {
  id: string;
  name: L10n;
  monogram: string;
  role: L10n;
  languages: L10n;
  bio: L10n;
}
export interface Article {
  slug: string;
  title: L10n;
  excerpt: L10n;
  category: L10n;
  readingTime: number;
  cover: string;
  body: L10n[];
}
export interface SearchParams {
  type?: Property["type"];
  bedrooms?: number;
  lifestyle: string[];
  waterfront?: boolean;
  location?: string;
  features: string[];
}
