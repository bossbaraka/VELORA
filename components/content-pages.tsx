"use client";
import Image from "next/image";
import Link from "next/link";
import { useExperience } from "./experience-provider";
import { Eyebrow, ButtonLink, TextLink, Arrow, Monogram } from "./ui";
import { ConsultationBand } from "./chrome";
import { getAdvisors, getJournal, getPropertyById } from "@/lib/data";
import { number } from "@/lib/format";
import type { Article } from "@/lib/types";
import { EnquiryForm } from "./enquiry-form";
export function Contact({
  purpose,
  propertyId,
}: {
  purpose?: string;
  propertyId?: string;
}) {
  const { t, locale } = useExperience();
  const residence = propertyId ? getPropertyById(propertyId) : undefined;
  return (
    <section className="contact-page section-pad">
      <div className="contact-intro">
        <Eyebrow>{t("consultation")}</Eyebrow>
        <h1>{t("contactTitle")}</h1>
        <p>{t("contactCopy")}</p>
        <div className="contact-note">
          <Monogram />
          <p>{t("tagline")}</p>
          <small>{t("footerLocation")}</small>
        </div>
      </div>
      <div>
        {residence && (
          <div className="contact-residence">
            <p className="eyebrow">{t("formResidence")}</p>
            <h2>
              {residence.is_private
                ? t("privateTitle")
                : residence.name[locale]}
            </h2>
          </div>
        )}
        <EnquiryForm initialPurpose={purpose} propertyId={propertyId} />
      </div>
    </section>
  );
}
export function Story() {
  const { t, locale } = useExperience();
  return (
    <>
      <section className="story-intro section-pad">
        <Eyebrow>{t("story")}</Eyebrow>
        <h1>{t("storyTitle")}</h1>
        <p>{t("storyIntro")}</p>
      </section>
      <div className="story-wide-image">
        <Image
          src="/images/editorial/material-matters.jpg"
          alt={t("architecture")}
          fill
          priority
          sizes="100vw"
        />
      </div>
      <section className="principles section-pad">
        {[1, 2, 3].map((n) => (
          <div key={n}>
            <span>0{n}</span>
            <h2>{t(`principle${n}` as "principle1")}</h2>
            <p>{t(`principle${n}Copy` as "principle1Copy")}</p>
          </div>
        ))}
      </section>
      <section className="story-conclusion section-pad">
        <Monogram />
        <h2>{t("tagline")}</h2>
        <TextLink href={`/${locale}/collection`}>
          {t("exploreCollection")}
        </TextLink>
      </section>
      <ConsultationBand />
    </>
  );
}
export function Services() {
  const { t, locale } = useExperience();
  return (
    <>
      <section className="page-intro section-pad">
        <Eyebrow>{t("services")}</Eyebrow>
        <h1>{t("servicesTitle")}</h1>
        <p>{t("servicesCopy")}</p>
      </section>
      <section className="services-detail section-pad">
        {(
          [
            "sales",
            "advice",
            "viewing",
            "commercial",
            "sell",
            "investment",
          ] as const
        ).map((s, i) => (
          <div id={s} key={s}>
            <span className="service-index">0{i + 1}</span>
            <h2>{t(`service_${s}`)}</h2>
            <div>
              <p>{t(`service_${s}Copy`)}</p>
              <TextLink
                href={`/${locale}/contact?purpose=${s === "viewing" ? "viewing" : s === "sell" ? "sell" : s === "advice" || s === "investment" ? "invest" : "find"}`}
              >
                {t("contact")}
              </TextLink>
            </div>
          </div>
        ))}
      </section>
      <ConsultationBand />
    </>
  );
}
export function Advisors() {
  const { t, locale } = useExperience();
  return (
    <>
      <section className="page-intro section-pad">
        <Eyebrow>{t("advisors")}</Eyebrow>
        <h1>{t("advisorsTitle")}</h1>
        <p>{t("advisorsCopy")}</p>
      </section>
      <section className="advisors-grid section-pad">
        {getAdvisors().map((a) => (
          <article key={a.id}>
            <div className="advisor-portrait">
              <span>{a.monogram}</span>
              <small>{t("fictionalAdvisor")}</small>
            </div>
            <div className="advisor-heading">
              <h2>{a.name[locale]}</h2>
              <p>{a.role[locale]}</p>
            </div>
            <p>{a.bio[locale]}</p>
            <p className="small-note">{a.languages[locale]}</p>
            <TextLink href={`/${locale}/contact?advisor=${a.id}`}>
              {t("speakAdvisor")}
            </TextLink>
          </article>
        ))}
      </section>
      <ConsultationBand />
    </>
  );
}
export function Journal() {
  const { t, locale } = useExperience();
  return (
    <>
      <section className="page-intro section-pad">
        <Eyebrow>{t("journalEyebrow")}</Eyebrow>
        <h1>{t("journalTitle")}</h1>
        <p>{t("journalCopy")}</p>
      </section>
      <section className="journal-list section-pad">
        {getJournal().map((a) => (
          <article key={a.slug}>
            <Link
              className="journal-image"
              href={`/${locale}/journal/${a.slug}`}
            >
              <Image
                src={a.cover}
                alt={a.title[locale]}
                fill
                sizes="(max-width:700px) 100vw,50vw"
              />
            </Link>
            <div className="journal-meta">
              <span>{a.category[locale]}</span>
              <span>{t("readTime", { n: number(a.readingTime, locale) })}</span>
            </div>
            <Link href={`/${locale}/journal/${a.slug}`}>
              <h2>{a.title[locale]}</h2>
            </Link>
            <p>{a.excerpt[locale]}</p>
            <TextLink href={`/${locale}/journal/${a.slug}`}>
              {t("readStory")}
            </TextLink>
          </article>
        ))}
      </section>
      <ConsultationBand />
    </>
  );
}
export function JournalArticle({ article: a }: { article: Article }) {
  const { t, locale } = useExperience();
  return (
    <>
      <article>
        <header className="article-header section-pad">
          <TextLink href={`/${locale}/journal`}>{t("backJournal")}</TextLink>
          <Eyebrow>{a.category[locale]}</Eyebrow>
          <h1>{a.title[locale]}</h1>
          <p>{a.excerpt[locale]}</p>
          <small>{t("readTime", { n: number(a.readingTime, locale) })}</small>
        </header>
        <div className="article-image">
          <Image
            src={a.cover}
            alt={a.title[locale]}
            fill
            priority
            sizes="100vw"
          />
        </div>
        <div className="article-body">
          {a.body.map((paragraph, i) => (
            <p key={i}>{paragraph[locale]}</p>
          ))}
          <div className="article-end">
            <Monogram />
            <p>{t("footerDisclaimer")}</p>
          </div>
        </div>
      </article>
      <ConsultationBand />
    </>
  );
}
