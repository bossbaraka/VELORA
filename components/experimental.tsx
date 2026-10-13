"use client";
import Image from "next/image";
import { getPropertyById } from "@/lib/data";
import { useExperience } from "./experience-provider";
import { TextLink } from "./ui";
export function Pause() {
  const { t, locale } = useExperience();
  const p = getPropertyById("marin")!;
  return (
    <section className="pause-section section-pad">
      <p>{t("pause")}</p>
      <div className="pause-image">
        <Image
          src={p.images.day[0]}
          alt={p.name[locale]}
          fill
          sizes="(max-width:700px) 100vw, 75vw"
        />
      </div>
      <TextLink href={`/${locale}/collection/${p.slug}`}>
        {t("exploreResidence")}
      </TextLink>
    </section>
  );
}
