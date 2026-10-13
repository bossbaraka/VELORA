import type { Metadata } from "next";
import { Advisor } from "@/components/advisor";

export const metadata: Metadata = {
  title: "Private Property Advisor",
  description:
    "A bilingual, catalogue-led way to clarify property preferences and compare VELORA’s illustrative residences.",
};

export default function Page() {
  return <Advisor />;
}
