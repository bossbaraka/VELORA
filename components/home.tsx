"use client";
import Image from "next/image";
import { CURATED_IDS } from "@/constants/editorial";
import { HERO_IMAGES } from "@/data/images";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Pause } from "./experimental";
import { ContinueExploring, EditorialCollections } from "./intelligence";
import { useExperience } from "./experience-provider";
import { Arrow, ButtonLink, TextLink, Reveal, Eyebrow } from "./ui";
import { FindYourPlace } from "./intent-search";
import { PropertyCard } from "./property-card";
import { ConsultationBand } from "./chrome";
import { getProperties, getJournal } from "@/lib/data";
import { matchScore } from "@/lib/match";
import { MOTION } from "@/motion/tokens";
import { number } from "@/lib/format";
export function Home() {
  const { locale, intent, t } = useExperience();
  const reduce = useReducedMotion();
  const properties = getProperties();
  const hero = properties[0];
  const curated = properties
    .filter(
      (p) =>
        !p.is_private &&
        p.availability === "available" &&
        (CURATED_IDS as readonly string[]).includes(p.id),
    )
    .sort((a, b) => matchScore(b, intent) - matchScore(a, intent))
    .slice(0, 2);
  const featured = properties[1];
  return (
    <>
      <section className="hero">
        <picture>
          <source media="(max-width: 700px)" srcSet={HERO_IMAGES.mobile} />
          <Image
            className="hero-image"
            src={HERO_IMAGES.desktop}
            alt={hero.name[locale]}
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
            initial={reduce ? false : { y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: MOTION.entrance, ease: MOTION.ease }}
          >
            <span />
            {t("heroEyebrow")}
          </motion.p>
          <motion.h1
            initial={reduce ? false : { y: 12 }}
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
            initial={reduce ? false : { y: 12 }}
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
              <Link className="hero-secondary" href={`/${locale}/contact`}>
                {t("consultation")}
                <Arrow />
              </Link>
            </div>
          </motion.div>
        </div>
        <div className="hero-bottom">
          <a href="#find-your-place" className="hero-scroll">
            <span className="scroll-line" />
            {t("scroll")}
          </a>
          <Link
            href={`/${locale}/collection/${hero.slug}`}
            className="hero-featured"
          >
            <span>{t("heroCaption")}</span>
            <Arrow diagonal />
          </Link>
          <div className="hero-counter">
            <span>{t("heroIndex")}</span>
            <i />
          </div>
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
          {curated.map((p) => (
            <Reveal key={p.id}>
              <PropertyCard property={p} set={properties} />
            </Reveal>
          ))}
        </div>
      </section>
      <section className="brand-statement section-pad">
        <div className="statement-number">V / 01</div>
        <Reveal>
          <Eyebrow>{t("statementEyebrow")}</Eyebrow>
          <h2>
            {t("statementLine1")}
            <br />
            <em>{t("statementLine2")}</em>
          </h2>
          <div className="statement-lower">
            <span className="long-rule" />
            <div>
              <p>{t("statementCopy")}</p>
              <TextLink href={`/${locale}/story`}>
                {t("discoverStory")}
              </TextLink>
            </div>
          </div>
        </Reveal>
      </section>
      <section className="featured-residence">
        <div className="featured-image">
          <Image
            src={featured.images.day[0]}
            alt={featured.name[locale]}
            fill
            sizes="(max-width: 800px) 100vw, 62vw"
          />
          <span className="image-caption">
            {featured.location.district[locale]}
          </span>
        </div>
        <Reveal className="featured-content">
          <Eyebrow>{t("featuredEyebrow")}</Eyebrow>
          <h2>{t("featuredTitle")}</h2>
          <p>{t("featuredCopy")}</p>
          <div className="featured-name">
            <span>{featured.name[locale]}</span>
            <small>
              {number(featured.bedrooms, locale)} {t("beds")} ·{" "}
              {t(featured.type)}
            </small>
          </div>
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
          {(["sales", "advice", "viewing"] as const).map((s, i) => (
            <Link
              key={s}
              href={`/${locale}/services#${s}`}
              className="service-row"
            >
              <span className="service-index">0{i + 1}</span>
              <h3>{t(`service_${s}`)}</h3>
              <p>{t(`service_${s}Copy`)}</p>
              <Arrow diagonal size={25} />
            </Link>
          ))}
        </div>
      </section>
      <section className="architecture-editorial">
        <div className="architecture-image">
          <Image
            src="/images/editorial/material-matters.jpg"
            alt={t("imageNote")}
            fill
            sizes="(max-width: 800px) 100vw, 55vw"
          />
        </div>
        <Reveal className="architecture-text">
          <Eyebrow>{t("editorialEyebrow")}</Eyebrow>
          <h2>{t("editorialTitle")}</h2>
          <p>{t("editorialCopy")}</p>
          <TextLink href={`/${locale}/journal/material-matters`}>
            {t("readStory")}
          </TextLink>
        </Reveal>
      </section>
      <JournalPreview />
      <EditorialCollections />
      <Pause />
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
        {articles.map((a) => (
          <article key={a.slug}>
            <Link
              href={`/${locale}/journal/${a.slug}`}
              className="journal-image"
            >
              <Image
                src={a.cover}
                alt={a.title[locale]}
                fill
                sizes="(max-width: 700px) 100vw, 33vw"
              />
            </Link>
            <div className="journal-meta">
              <span>{a.category[locale]}</span>
              <span>{t("readTime", { n: number(a.readingTime, locale) })}</span>
            </div>
            <Link href={`/${locale}/journal/${a.slug}`}>
              <h3>
                {a.title[locale]}
                <Arrow diagonal size={19} />
              </h3>
            </Link>
            <p>{a.excerpt[locale]}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
