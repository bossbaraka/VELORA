import raw from "@/data/properties.json";
import advisors from "@/data/advisors.json";
import journal from "@/data/journal.json";
import { IMAGES } from "@/data/images";
import type { Property, Advisor, Article } from "./types";
export function getProperties(): Property[] {
  return (raw as Property[]).map((p) => ({
    ...p,
    images: IMAGES[
      p.id as keyof typeof IMAGES
    ] as unknown as Property["images"],
  }));
}
export const getPropertyById = (id: string) =>
  getProperties().find((p) => p.id === id || p.slug === id);
export const getAdvisors = () => advisors as Advisor[];
export const getAdvisorById = (id: string) =>
  getAdvisors().find((a) => a.id === id);
export const getJournal = () => journal as Article[];
export const getArticle = (slug: string) =>
  getJournal().find((a) => a.slug === slug);
