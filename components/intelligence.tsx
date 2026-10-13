"use client";
import Link from "next/link";
import Image from "next/image";
import { X, Plus } from "lucide-react";
import { useExperience } from "./experience-provider";
import { getProperties } from "@/lib/data";
import { matchScore, contributors } from "@/lib/match";
import { area, number } from "@/lib/format";
import type { Property, Scores } from "@/lib/types";
import type { TranslationKey } from "@/i18n";
import { Arrow, Eyebrow } from "./ui";
export function MatchPanel({
  property: p,
  compact = false,
}: {
  property: Property;
  compact?: boolean;
}) {
  const { t, intent, locale } = useExperience();
  const [a, b] = contributors(p, intent);
  return (
    <div className={`match-panel ${compact ? "match-compact" : ""}`}>
      <div>
        <span>{t("match")}</span>
        <strong>{number(matchScore(p, intent), locale)}</strong>
        <small>{t("demoScoring")}</small>
      </div>
      {!compact && (
        <>
          <p>{t("matchExplanation", { a: t(a), b: t(b) })}</p>
          <details className="score-breakdown">
            <summary>{t("scoreNote")}</summary>
            <dl>
              {Object.entries(p.scores).map(([k, v]) => (
                <div key={k}>
                  <dt>{t(k as TranslationKey)}</dt>
                  <dd>
                    {number(v, locale)} / {number(100, locale)}
                  </dd>
                </div>
              ))}
            </dl>
          </details>
        </>
      )}
    </div>
  );
}
const explanationKeys: Record<keyof Scores, TranslationKey> = {
  privacy: "whyPrivacy",
  outdoor: "whyOutdoor",
  family: "whyFamily",
  investment: "whyInvestment",
};

export function WhyProperty({ property: p }: { property: Property }) {
  const { t, locale, intent } = useExperience();
  const priorities = contributors(p, intent);
  return (
    <details className="why-property">
      <summary>
        {t("why")}
        <Plus size={13} />
      </summary>
      <ul>
        {priorities.map((priority) => (
          <li key={priority}>
            {t(explanationKeys[priority], {
              n: number(p.scores[priority], locale),
            })}
          </li>
        ))}
        {p.tags.includes("waterfront") && (
          <li>
            {t("whyWaterfront", {
              n: number(p.location.waterfront_min, locale),
            })}
          </li>
        )}
        <li>{t("whySpace", { area: area(p.area_sqft, locale) })}</li>
      </ul>
      <small>{t("scoreNote")}</small>
    </details>
  );
}
export function ContinueExploring() {
  const { t, locale, viewed, saved, dismissed, dismiss, ready } =
    useExperience();
  if (!ready || dismissed || !viewed.length) return null;
  const all = getProperties();
  const history = viewed
    .map((id) => all.find((p) => p.id === id))
    .filter((p): p is Property => !!p && !p.is_private);
  if (!history.length) return null;
  const tags = history
    .flatMap((p) => p.tags)
    .filter((t) =>
      [
        "waterfront",
        "quiet",
        "family",
        "investment",
        "city",
        "retreat",
      ].includes(t),
    );
  const common =
    [...new Set(tags)].sort(
      (a, b) =>
        tags.filter((x) => x === b).length - tags.filter((x) => x === a).length,
    )[0] || "city";
  const last = history[0];
  const suggestion = all.find(
    (p) => last.similarPropertyIds?.includes(p.id) && !p.is_private,
  );
  const savedProperty = all.find(
    (p) => saved.includes(p.id) && p.id !== last.id && !p.is_private,
  );
  const items = [
    { p: last, label: t("lastViewed") },
    ...(savedProperty ? [{ p: savedProperty, label: t("shortlist") }] : []),
    ...(suggestion && suggestion.id !== savedProperty?.id
      ? [{ p: suggestion, label: t("related") }]
      : []),
  ];
  return (
    <section className="continue-section section-pad">
      <div className="continue-heading">
        <div>
          <Eyebrow>{t("continue")}</Eyebrow>
          <h2>{t("continueCopy", { tag: t(common as TranslationKey) })}</h2>
        </div>
        <button aria-label={t("dismiss")} onClick={dismiss}>
          <X size={18} />
        </button>
      </div>
      <div className="continue-grid">
        {items.map(({ p, label }) => (
          <Link key={p.id} href={`/${locale}/collection/${p.slug}`}>
            <div className="continue-image">
              <Image
                src={p.images.day[0]}
                alt={t("illustrativePhotoAlt")}
                fill
                sizes="150px"
              />
            </div>
            <div>
              <small>{label}</small>
              <h3>{p.name[locale]}</h3>
              <span>{p.location.district[locale]}</span>
            </div>
            <Arrow />
          </Link>
        ))}
      </div>
    </section>
  );
}
