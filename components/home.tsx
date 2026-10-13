"use client";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { CURATED_IDS } from "@/constants/editorial";
import { HERO_IMAGES } from "@/data/images";
import { ContinueExploring } from "./intelligence";
import { useExperience } from "./experience-provider";
import { Arrow, ButtonLink, TextLink, Reveal, Eyebrow } from "./ui";
import { FindYourPlace } from "./intent-search";
import { PropertyCard } from "./property-card";
import { ConsultationBand } from "./chrome";
import { getProperties, getJournal } from "@/lib/data";
import { matchScore } from "@/lib/match";
import { MOTION } from "@/motion/tokens";
import { area, number, price } from "@/lib/format";

export function Home() {
  const { locale, intent, t } = useExperience();
  const reduce = useReducedMotion();
  const properties = getProperties();
  const featured = properties.find((property) => property.id === "vela")!;
  const curated = properties
    .filter(
      (property) =>
        !property.is_private &&
        property.availability === "available" &&
        property.id !== featured.id &&
        (CURATED_IDS as readonly string[]).includes(property.id),
    )
    .sort((a, b) => matchScore(b, intent) - matchScore(a, intent))
    .slice(0, 2);

  return (
    <>
      <section className="hero">
        <picture>
          <source media="(max-width: 700px)" srcSet={HERO_IMAGES.mobile} />
          <Image
            className="hero-image"
            src={HERO_IMAGES.desktop}
            alt={t("illustrativePhotoAlt")}
            fill
            unoptimized
            loading="eager"
            fetchPriority="high"
            sizes="100vw"
          />
        </picture>
        <div className="hero-shade" />
        <div className="hero-content">
          <motion.p
            className="hero-eyebrow"
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.entrance, ease: MOTION.ease }}
          >
            <span />
            {t("heroEyebrow")}
          </motion.p>
          <motion.h1
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: MOTION.entrance,
              delay: MOTION.stagger,
              ease: MOTION.ease,
            }}
          >
            {t("heroLine1")}
            <br />
            <em>{t("heroLine2")}</em>
          </motion.h1>
          <motion.div
            initial={reduce ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: MOTION.entrance,
              delay: MOTION.stagger * 2,
              ease: MOTION.ease,
            }}
          >
            <p className="hero-copy">{t("heroCopy")}</p>
            <div className="hero-buttons">
              <ButtonLink href={`/${locale}/collection`} light>
                {t("exploreCollection")}
              </ButtonLink>
            </div>
          </motion.div>
        </div>
        <div className="hero-bottom">
          <a href="#find-your-place" className="hero-scroll">
            <span className="scroll-line" />
            {t("scroll")}
          </a>
          <p className="hero-disclaimer">{t("heroDisclaimer")}</p>
        </div>
      </section>

      <FindYourPlace />
      <ContinueExploring />

      <section className="curated-section section-pad">
        <Reveal className="section-heading">
          <div>
            <Eyebrow>{t("curatedEyebrow")}</Eyebrow>
            <h2>{t("curatedTitle")}</h2>
          </div>
          <div>
            <p>{t("curatedCopy")}</p>
            <TextLink href={`/${locale}/collection`}>{t("viewAll")}</TextLink>
          </div>
        </Reveal>
        <p className="intent-note" aria-live="polite">
          {t(`intentNote_${intent}`)}
        </p>
        <div className="editorial-properties">
          {curated.map((property) => (
            <Reveal key={property.id}>
              <PropertyCard
                property={property}
                set={properties}
                showMatch={false}
              />
            </Reveal>
          ))}
        </div>
      </section>

      <section className="featured-residence">
        <div className="featured-image">
          <Image
            src={featured.images.day[0]}
            alt={t("illustrativePhotoAlt")}
            fill
            sizes="(max-width: 800px) 100vw, 62vw"
          />
          <div className="image-caption">
            <span>{t("imageNote")}</span>
            <span>{featured.location.district[locale]}</span>
          </div>
        </div>
        <Reveal className="featured-content">
          <Eyebrow>{t("featuredEyebrow")}</Eyebrow>
          <h2>{t("featuredTitle")}</h2>
          <p className="featured-copy">{t("featuredCopy")}</p>
          <div className="featured-identity">
            <small>{t("illustrativeResidence")}</small>
            <h3 dir="auto">{featured.name[locale]}</h3>
          </div>
          <dl className="featured-facts">
            <div>
              <dt>{t("location")}</dt>
              <dd dir="auto">
                {featured.location.district[locale]}, {featured.location.city[locale]}
              </dd>
            </div>
            <div>
              <dt>{t("price")}</dt>
              <dd>
                <bdi>{price(featured.price.amount, locale)}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t("beds")} · {t(featured.type)}</dt>
              <dd>
                <bdi>{number(featured.bedrooms, locale)}</bdi>
              </dd>
            </div>
            <div>
              <dt>{t("area")}</dt>
              <dd>
                <bdi>{area(featured.area_sqft, locale)}</bdi>
              </dd>
            </div>
          </dl>
          <TextLink href={`/${locale}/collection/${featured.slug}`}>
            {t("exploreResidence")}
          </TextLink>
        </Reveal>
      </section>

      <section className="services-section section-pad">
        <Reveal>
          <Eyebrow>{t("servicesEyebrow")}</Eyebrow>
          <div className="section-heading">
            <h2>{t("servicesTitle")}</h2>
            <p>{t("servicesCopy")}</p>
          </div>
        </Reveal>
        <div className="service-list">
          {(["sales", "advice", "viewing"] as const).map((service, i) => (
            <Link
              key={service}
              href={`/${locale}/services#${service}`}
              className="service-row"
            >
              <span className="service-index">0{i + 1}</span>
              <h3>{t(`service_${service}`)}</h3>
              <p>{t(`service_${service}Copy`)}</p>
              <Arrow diagonal size={25} />
            </Link>
          ))}
        </div>
      </section>

      <JournalPreview />
      <ConsultationBand />
    </>
  );
}

export function JournalPreview() {
  const { locale, t } = useExperience();
  const articles = getJournal().slice(0, 3);
  return (
    <section className="journal-section section-pad">
      <div className="section-heading">
        <div>
          <Eyebrow>{t("journalEyebrow")}</Eyebrow>
          <h2>{t("journalTitle")}</h2>
        </div>
        <TextLink href={`/${locale}/journal`}>{t("allStories")}</TextLink>
      </div>
      <div className="journal-grid">
        {articles.map((article) => (
          <article key={article.slug}>
            <Link
              href={`/${locale}/journal/${article.slug}`}
              className="journal-image"
              aria-label={`${article.title[locale]} — ${t("illustrativePhotoAlt")}`}
            >
              <Image
                src={article.cover}
                alt={t("illustrativePhotoAlt")}
                fill
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </Link>
            <div className="journal-meta">
              <span>{article.category[locale]}</span>
              <span>
                {t("readTime", { n: number(article.readingTime, locale) })}
              </span>
            </div>
            <Link href={`/${locale}/journal/${article.slug}`}>
              <h3>
                {article.title[locale]}
                <Arrow diagonal size={19} />
              </h3>
            </Link>
            <p>{article.excerpt[locale]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
