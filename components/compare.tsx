"use client";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";
import { useExperience } from "./experience-provider";
import { getProperties } from "@/lib/data";
import { differences } from "@/lib/compare";
import { price, area, number } from "@/lib/format";
import { Eyebrow, ButtonLink } from "./ui";
import type { Property } from "@/lib/types";
import type { TranslationKey } from "@/i18n";
export function Compare() {
  const { locale, t, compared, toggleCompare } = useExperience();
  const properties = getProperties().filter(
    (p) => compared.includes(p.id) && !p.is_private,
  );
  const fields = [
    "type",
    "price",
    "area",
    "bedrooms",
    "bathrooms",
    "privacy",
    "outdoor",
    "family",
    "investment",
    "waterfrontDistance",
    "downtown",
  ] as const;
  function value(p: Property, k: (typeof fields)[number]) {
    if (k === "type") return t(p.type);
    if (k === "price") return price(p.price.amount, locale);
    if (k === "area") return area(p.area_sqft, locale);
    if (k === "bedrooms" || k === "bathrooms") return number(p[k], locale);
    if (k === "waterfrontDistance" || k === "downtown")
      return t("minutes", {
        n: number(
          p.location[k === "downtown" ? "downtown_min" : "waterfront_min"],
          locale,
        ),
      });
    return `${number(p.scores[k], locale)} / ${number(100, locale)}`;
  }
  return (
    <>
      <section className="page-intro section-pad">
        <Eyebrow>{t("compare")}</Eyebrow>
        <h1>{t("compareIntro")}</h1>
        <p>{t("compareEmpty")}</p>
      </section>
      <section className="comparison-section section-pad">
        {properties.length < 2 ? (
          <div className="empty-state">
            <p>{t("compareEmpty")}</p>
            <ButtonLink href={`/${locale}/collection`}>
              {t("exploreCollection")}
            </ButtonLink>
          </div>
        ) : (
          <>
            <div
              className="comparison-scroll"
              tabIndex={0}
              role="region"
              aria-label={t("compare")}
            >
              <table className="comparison-table">
                <caption className="sr-only">{t("compare")}</caption>
                <thead>
                  <tr>
                    <th scope="col">{t("collection")}</th>
                    {properties.map((p) => (
                      <th scope="col" key={p.id}>
                        <div className="comparison-photo">
                          <Image
                            src={p.images.day[0]}
                            alt={t("illustrativePhotoAlt")}
                            width={500}
                            height={340}
                          />
                          <button
                            onClick={() => toggleCompare(p.id)}
                            aria-label={`${t("remove")} ${p.name[locale]}`}
                          >
                            <X size={18} />
                          </button>
                        </div>
                        <Link href={`/${locale}/collection/${p.slug}`}>
                          {p.name[locale]}
                        </Link>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {fields.map((k) => (
                    <tr key={k}>
                      <th scope="row">{t(k)}</th>
                      {properties.map((p) => (
                        <td key={p.id}>{value(p, k)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="difference-panel">
              <Eyebrow>{t("difference")}</Eyebrow>
              {properties.slice(1).map((p) => (
                <div key={p.id}>
                  <h3>
                    {properties[0].name[locale]} / {p.name[locale]}
                  </h3>
                  {differences(properties[0], p).length === 0 ? (
                    <p>{t("noDifference")}</p>
                  ) : (
                    differences(properties[0], p).map((d) => (
                      <p key={d.metric}>
                        {t(
                          d.metric === "waterfront" || d.metric === "downtown"
                            ? "differenceTime"
                            : "differenceScore",
                          {
                            winner: properties.find((x) => x.id === d.winner)!
                              .name[locale],
                            loser: properties.find((x) => x.id === d.loser)!
                              .name[locale],
                            delta: number(d.delta, locale),
                            metric: t(d.metric as TranslationKey),
                          },
                        )}
                      </p>
                    ))
                  )}
                </div>
              ))}
              <p className="small-note">{t("scoreNote")}</p>
            </div>
            <ButtonLink href={`/${locale}/contact`}>{t("contact")}</ButtonLink>
          </>
        )}
      </section>
    </>
  );
}
