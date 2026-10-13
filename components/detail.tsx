"use client";
import { useState, useEffect, useRef } from "react";
import {
  AnimatePresence,
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "framer-motion";
import { MOTION } from "@/motion/tokens";
import { MatchPanel, WhyProperty } from "./intelligence";
import Image from "next/image";
import Link from "next/link";
import { Bookmark, Check, Plus, ArrowDown } from "lucide-react";
import type { Property } from "@/lib/types";
import { useExperience } from "./experience-provider";
import { Eyebrow, Arrow, TextLink, ButtonLink } from "./ui";
import { price, area, number } from "@/lib/format";
import { getAdvisorById, getProperties } from "@/lib/data";
import { EnquiryForm } from "./enquiry-form";
import { PropertyCard } from "./property-card";
export function ResidenceDetail({
  property: p,
  overlay = false,
}: {
  property: Property;
  overlay?: boolean;
}) {
  const {
    locale,
    t,
    saved,
    compared,
    toggleSave,
    toggleCompare,
    markViewed,
    notice,
  } = useExperience();
  const reduced = useReducedMotion();
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const [material, setMaterial] = useState(0);
  const [image, setImage] = useState(0);
  const [night, setNight] = useState(false);
  const [architectureOnly, setArchitectureOnly] = useState(false);
  const gallery = night && p.images.night ? p.images.night : p.images.day;
  useEffect(() => {
    if (!p.is_private) markViewed(p.id);
  }, [p.id, p.is_private, markViewed]);
  const advisor = getAdvisorById(p.advisorId)!;
  const all = getProperties();
  const selected = p.materials[material];
  if (p.is_private)
    return (
      <section className="private-detail section-pad">
        <Eyebrow>{t("label_private")}</Eyebrow>
        <h1>{t("privateTitle")}</h1>
        <p>{t("privateCopy")}</p>
        <ButtonLink
          href={`/${locale}/contact?property=${p.id}&purpose=general`}
        >
          {t("privateAccess")}
        </ButtonLink>
      </section>
    );
  return (
    <div
      className={`residence-content ${architectureOnly ? "architecture-only" : ""}`}
    >
      <div className="detail-breadcrumb">
        <Link href={`/${locale}/collection`}>{t("collection")}</Link>
        <span>/</span>
        <span>{p.name[locale]}</span>
      </div>
      <section ref={heroRef} className="detail-hero">
        <motion.div
          className="shared-image"
          layoutId={reduced ? undefined : `residence-${p.id}`}
          style={{ y: reduced || overlay ? 0 : heroY }}
          transition={{ duration: MOTION.image, ease: MOTION.ease }}
        >
          <Image
            src={gallery[image % gallery.length]}
            alt={t("illustrativePhotoAlt")}
            fill
            priority
            sizes="100vw"
          />
        </motion.div>
        <div className="detail-hero-shade" />
        <div className="detail-hero-content">
          <p className="eyebrow">
            {p.location.district[locale]} · {p.location.city[locale]}
          </p>
          <h1>{p.name[locale]}</h1>
          <p>{p.editorialTags[0][locale]}</p>
        </div>
        <div className="atmosphere-controls">
          {p.images.night && (
            <div
              className="atmosphere-switch"
              role="group"
              aria-label={t("day") + " / " + t("night")}
            >
              <button
                aria-pressed={!night}
                onClick={() => {
                  setNight(false);
                  setImage(0);
                }}
              >
                {t("day")}
              </button>
              <button
                aria-pressed={night}
                onClick={() => {
                  setNight(true);
                  setImage(0);
                }}
              >
                {t("night")}
              </button>
            </div>
          )}
          <button
            className="architecture-toggle"
            aria-pressed={architectureOnly}
            onClick={() => setArchitectureOnly((x) => !x)}
          >
            {t(architectureOnly ? "standardView" : "architectureView")}
          </button>
        </div>
        <div className="gallery-controls">
          <button
            onClick={() =>
              setImage((i) => (i + gallery.length - 1) % gallery.length)
            }
            aria-label={t("previousImage")}
            className="previous"
          >
            <Arrow />
          </button>
          <span className="cinematic-counter">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={`${night}-${image}`}
                initial={reduced ? false : { opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: reduced ? 0 : -5 }}
                transition={{ duration: MOTION.hover, ease: MOTION.ease }}
              >
                {number(image + 1, locale)}
              </motion.span>
            </AnimatePresence>{" "}
            / {number(gallery.length, locale)}
          </span>
          <button
            onClick={() => setImage((i) => (i + 1) % gallery.length)}
            aria-label={t("nextImage")}
          >
            <Arrow />
          </button>
        </div>
        {night && <p className="atmosphere-note">{t("atmosphereNote")}</p>}
      </section>
      <nav className="detail-nav" aria-label={t("exploreResidence")}>
        <div>
          <a href="#residence-story">{t("storySection")}</a>
          <a href="#materials">{t("materials")}</a>
          <a href="#floorplan">{t("floorplan")}</a>
        </div>
        <a className="text-link" href="#viewing">
          {t(p.availability === "available" ? "viewing" : "registerInterest")}
          <Arrow />
        </a>
      </nav>
      <section className="detail-information section-pad">
        <div className="detail-title">
          <Eyebrow>{t(p.availability)}</Eyebrow>
          <h2>{p.editorialTags[0][locale]}</h2>
          <div className="detail-actions">
            <button
              className="text-link"
              onClick={() => toggleSave(p.id)}
              aria-pressed={saved.includes(p.id)}
            >
              {saved.includes(p.id) ? (
                <Check size={16} />
              ) : (
                <Bookmark size={16} />
              )}{" "}
              {t(saved.includes(p.id) ? "saved" : "save")}
            </button>
            <button
              className="text-link"
              onClick={() => toggleCompare(p.id)}
              aria-pressed={compared.includes(p.id)}
            >
              <Plus size={16} />
              {t(compared.includes(p.id) ? "removeCompare" : "addCompare")}
            </button>
            {compared.length >= 2 && (
              <TextLink href={`/${locale}/compare`}>{t("compare")}</TextLink>
            )}
          </div>
        </div>
        {notice && (
          <p role="status" className="inline-notice">
            {notice}
          </p>
        )}
        <dl className="detail-stats">
          <div>
            <dt>{t("price")}</dt>
            <dd>{price(p.price.amount, locale)}</dd>
          </div>
          <div>
            <dt>{t("area")}</dt>
            <dd>{area(p.area_sqft, locale)}</dd>
          </div>
          <div>
            <dt>{t("bedrooms")}</dt>
            <dd>{number(p.bedrooms, locale)}</dd>
          </div>
          <div>
            <dt>{t("bathrooms")}</dt>
            <dd>{number(p.bathrooms, locale)}</dd>
          </div>
        </dl>
      </section>
      <section className="detail-match section-pad">
        <MatchPanel property={p} />
        <WhyProperty property={p} />
      </section>
      <section className="detail-story section-pad" id="residence-story">
        <Eyebrow>{t("storySection")}</Eyebrow>
        <div>
          <h2>{p.editorialTags[0][locale]}</h2>
          <p className="large-copy">{p.story[locale]}</p>
          <h3>{t("designedFor")}</h3>
          <ul className="designed-list">
            {p.designed_for.map((d, i) => (
              <li key={i}>
                <span>0{i + 1}</span>
                {d[locale]}
              </li>
            ))}
          </ul>
          {p.orientation && (
            <details className="orientation-detail">
              <summary>{t(`orientation_${p.orientation}`)}</summary>
              <p>{t("orientationNote")}</p>
            </details>
          )}
          <div className="feature-tags">
            {p.features.map((f, i) => (
              <span key={i}>{f[locale]}</span>
            ))}
          </div>
        </div>
      </section>
      <section className="detail-architecture">
        <Image
          src={p.images.day[1]}
          alt={t("illustrativePhotoAlt")}
          fill
          sizes="100vw"
        />
        <div>
          <p className="eyebrow">{t("architecture")}</p>
          <p>{t("architectureCopy")}</p>
        </div>
      </section>
      <section className="material-section section-pad" id="materials">
        <div>
          <Eyebrow>{t("editorialEyebrow")}</Eyebrow>
          <h2>{t("materials")}</h2>
          <div
            className="material-tabs"
            role="tablist"
            aria-label={t("materials")}
          >
            {p.materials.map((m, i) => (
              <button
                key={m.id}
                id={`material-tab-${i}`}
                role="tab"
                aria-selected={material === i}
                aria-controls="material-panel"
                tabIndex={material === i ? 0 : -1}
                onClick={() => setMaterial(i)}
                onKeyDown={(e) => {
                  if (
                    ["ArrowRight", "ArrowLeft", "Home", "End"].includes(e.key)
                  ) {
                    e.preventDefault();
                    const n =
                      e.key === "Home"
                        ? 0
                        : e.key === "End"
                          ? p.materials.length - 1
                          : (i +
                              (e.key === "ArrowRight"
                                ? locale === "ar"
                                  ? -1
                                  : 1
                                : locale === "ar"
                                  ? 1
                                  : -1) +
                              p.materials.length) %
                            p.materials.length;
                    setMaterial(n);
                    document.getElementById(`material-tab-${n}`)?.focus();
                  }
                }}
              >
                {m.name[locale]}
                <Arrow />
              </button>
            ))}
          </div>
          <div
            role="tabpanel"
            id="material-panel"
            aria-labelledby={`material-tab-${material}`}
            tabIndex={0}
          >
            <small className="eyebrow">{t("usedIn")}</small>
            <p>{selected.usedIn[locale]}</p>
            <small className="eyebrow">{t("materialRole")}</small>
            <p>{selected.role[locale]}</p>
          </div>
        </div>
        <div className="material-image">
          <Image
            src={selected.image}
            alt={t("illustrativePhotoAlt")}
            fill
            sizes="(max-width: 700px) 100vw, 50vw"
          />
        </div>
      </section>
      <section className="life-section section-pad">
        <Eyebrow>{t("location")}</Eyebrow>
        <h2>{t("lifeAround")}</h2>
        <div className="life-timeline">
          {(["waterfront", "downtown", "airport", "dining"] as const).map(
            (k) => (
              <div key={k}>
                <span className="timeline-dot" />
                <p>{t(k)}</p>
                <strong>
                  {t("minutes", {
                    n: number(p.location[`${k}_min`] || 0, locale),
                  })}
                </strong>
              </div>
            ),
          )}
        </div>
        <p className="small-note">{t("travelNote")}</p>
      </section>
      <section className="detail-gallery section-pad">
        <div className="section-heading">
          <h2>{t("gallery")}</h2>
          <span className="small-note">{t("imageNote")}</span>
        </div>
        <div>
          {p.images.day.slice(1).map((src, i) => (
            <figure key={src}>
              <Image
                src={src}
                alt={t("illustrativePhotoAlt")}
                width={1000}
                height={720}
                sizes="(max-width:700px) 100vw,50vw"
              />
            </figure>
          ))}
        </div>
      </section>
      <section className="floorplan-section section-pad" id="floorplan">
        <div>
          <Eyebrow>{t("architecture")}</Eyebrow>
          <h2>{t("floorplan")}</h2>
          <p>{area(p.area_sqft, locale)}</p>
          <p className="small-note">{t("floorplanNote")}</p>
        </div>
        <Image
          src={p.floorplan!}
          alt={t("floorplanNote")}
          width={1000}
          height={600}
        />
      </section>
      <section className="location-section section-pad">
        <div>
          <Eyebrow>{t("location")}</Eyebrow>
          <h2>{p.location.district[locale]}</h2>
          <p>{p.location.city[locale]}</p>
          <p className="small-note">{t("locationNote")}</p>
        </div>
        <div className="location-abstract" aria-hidden="true">
          <span>V</span>
          <div />
          <i />
        </div>
      </section>
      <section className="advisor-section section-pad">
        <Eyebrow>{t("advisors")}</Eyebrow>
        <h2>{t("yourAdvisor")}</h2>
        <div className="advisor-inline">
          <div className="advisor-monogram">{advisor.monogram}</div>
          <div>
            <h3>{advisor.name[locale]}</h3>
            <p>{advisor.role[locale]}</p>
            <small>{advisor.languages[locale]}</small>
          </div>
          <div>
            <p>{advisor.bio[locale]}</p>
            <small>{t("fictionalAdvisor")}</small>
          </div>
          <TextLink href={`/${locale}/contact?advisor=${advisor.id}`}>
            {t("contact")}
          </TextLink>
        </div>
      </section>
      <section className="viewing-section section-pad" id="viewing">
        <div>
          <Eyebrow>{t("consultation")}</Eyebrow>
          <h2>
            {t(p.availability === "available" ? "viewing" : "registerInterest")}
          </h2>
          <p>
            {t(
              p.availability === "reserved"
                ? "reservedNote"
                : p.availability === "coming_soon"
                  ? "comingSoonNote"
                  : "viewingCopy",
            )}
          </p>
        </div>
        <EnquiryForm
          viewing={p.availability === "available"}
          initialPurpose="general"
          propertyId={p.id}
        />
      </section>
      {!overlay && (
        <section className="section-pad related-section">
          <h2>{t("related")}</h2>
          <div className="collection-grid">
            {all
              .filter(
                (x) => p.similarPropertyIds?.includes(x.id) && !x.is_private,
              )
              .map((x) => (
                <PropertyCard key={x.id} property={x} set={all} />
              ))}
          </div>
        </section>
      )}
    </div>
  );
}
