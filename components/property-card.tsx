"use client";
import { motion, useReducedMotion } from "framer-motion";
import { MOTION } from "@/motion/tokens";
import { useResidenceTransition } from "./residence-transition";
import { MatchPanel, WhyProperty } from "./intelligence";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Plus, Check, BedDouble, Scan } from "lucide-react";
import type { Property } from "@/lib/types";
import { useExperience } from "./experience-provider";
import { contextualLabel } from "@/lib/match";
import { area, number, price } from "@/lib/format";
import { Arrow } from "./ui";
import type { TranslationKey } from "@/i18n";
export function PropertyCard({
  property: p,
  set,
  priority = false,
}: {
  property: Property;
  set: Property[];
  priority?: boolean;
}) {
  const { locale, intent, t, saved, compared, toggleSave, toggleCompare } =
    useExperience();
  const { openResidence, overlay } = useResidenceTransition();
  const reduced = useReducedMotion();
  const label = contextualLabel(
    p,
    set.filter((x) => !x.is_private),
    intent,
  );
  if (p.is_private)
    return (
      <article className="property-card private-card">
        <div className="private-visual">
          <span>V</span>
          <small>{t("label_private")}</small>
        </div>
        <h3>{t("privateTitle")}</h3>
        <p>{t("privateCopy")}</p>
        <Link
          className="text-link"
          href={`/${locale}/contact?purpose=general&property=${p.id}`}
        >
          {t("privateAccess")}
          <Arrow />
        </Link>
      </article>
    );
  return (
    <article className="property-card">
      <Link
        href={`/${locale}/collection/${p.slug}`}
        onClick={(e) => openResidence(e, p)}
        data-residence={p.id}
        className="property-image"
        aria-label={`${t(`label_${label}` as TranslationKey)} — ${t("exploreResidence")} — ${p.name[locale]}`}
      >
        <motion.div
          className="shared-image"
          layoutId={reduced ? undefined : `residence-${p.id}`}
          transition={{ duration: MOTION.image, ease: MOTION.ease }}
        >
          <Image
            src={p.images.day[0]}
            alt={`${p.name[locale]} · ${p.location.district[locale]}`}
            fill
            sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 60vw"
            priority={priority}
          />
        </motion.div>
        <span className="property-label">
          {t(`label_${label}` as TranslationKey)}
        </span>
        <span className="image-open">
          <Arrow diagonal size={22} />
        </span>
      </Link>
      <div className="property-meta">
        <span>
          {p.location.district[locale]}, {p.location.city[locale]}
        </span>
        <span>{t(p.type)}</span>
      </div>
      <Link
        onClick={(e) => openResidence(e, p)}
        href={`/${locale}/collection/${p.slug}`}
      >
        <h3>{p.name[locale]}</h3>
      </Link>
      <p className="property-tagline">{p.editorialTags[0][locale]}</p>
      <div className="property-facts">
        <span>
          <BedDouble size={15} />
          {number(p.bedrooms, locale)} {t("beds")}
        </span>
        <span>
          {number(p.bathrooms, locale)} {t("baths")}
        </span>
        <span>
          <Scan size={14} />
          {area(p.area_sqft, locale)}
        </span>
      </div>
      <div className="property-bottom">
        <strong>{price(p.price.amount, locale)}</strong>
        <Link
          onClick={(e) => openResidence(e, p)}
          className="text-link"
          href={`/${locale}/collection/${p.slug}`}
        >
          {t("exploreResidence")}
          <Arrow />
        </Link>
      </div>
      <div className="card-intelligence">
        <MatchPanel property={p} compact />
        <WhyProperty property={p} />
      </div>
      <div className="property-tools">
        <button
          aria-pressed={saved.includes(p.id)}
          onClick={() => toggleSave(p.id)}
        >
          {saved.includes(p.id) ? <Check size={14} /> : <Bookmark size={14} />}
          <span>{t(saved.includes(p.id) ? "saved" : "save")}</span>
        </button>
        <button
          aria-pressed={compared.includes(p.id)}
          onClick={() => toggleCompare(p.id)}
        >
          {compared.includes(p.id) ? <Check size={14} /> : <Plus size={14} />}
          <span>
            {t(compared.includes(p.id) ? "removeCompare" : "addCompare")}
          </span>
        </button>
      </div>
    </article>
  );
}
