"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Bookmark, Menu, X, ArrowUpRight } from "lucide-react";
import { useExperience } from "./experience-provider";
import { NAV_ITEMS } from "@/constants/config";
import { Monogram, Arrow, ButtonLink } from "./ui";
export function Header() {
  const { locale, t, saved } = useExperience();
  const pathname = usePathname();
  const home = pathname === `/${locale}`;
  const [open, setOpen] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const [query, setQuery] = useState("");
  useEffect(() => {
    setQuery(window.location.search);
    setOpen(false);
  }, [pathname]);
  useEffect(() => {
    if (open) {
      dialog.current?.showModal();
      document.body.style.overflow = "hidden";
    } else {
      dialog.current?.close();
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);
  const lang = (l: string) =>
    `${pathname.replace(/^\/(en|ar)/, `/${l}`)}${query}`;
  return (
    <>
      <a className="skip-link" href="#main-content">
        {t("skip")}
      </a>
      <header className={`site-header ${home ? "on-hero" : ""}`}>
        <Link href={`/${locale}`} className="wordmark">
          <span>{t("brand")}</span>
          <small>{t("estates")}</small>
        </Link>
        <nav className="desktop-nav" aria-label={t("menu")}>
          {NAV_ITEMS.map((item) => (
            <Link
              key={item}
              href={`/${locale}/${item}`}
              className={pathname.includes(`/${item}`) ? "active" : ""}
            >
              {t(item)}
            </Link>
          ))}
        </nav>
        <div className="header-actions">
          <div className="language-switch">
            <Link
              lang="en"
              href={lang("en")}
              onClick={(e) => {
                e.currentTarget.href =
                  pathname.replace(/^\/(en|ar)/, "/en") +
                  window.location.search;
              }}
              className={locale === "en" ? "selected" : ""}
            >
              EN
            </Link>
            <i />
            <Link
              lang="ar"
              href={lang("ar")}
              onClick={(e) => {
                e.currentTarget.href =
                  pathname.replace(/^\/(en|ar)/, "/ar") +
                  window.location.search;
              }}
              className={locale === "ar" ? "selected" : ""}
            >
              AR
            </Link>
          </div>
          <Link
            className="header-saved"
            href={`/${locale}/shortlist`}
            aria-label={`${t("shortlist")} (${saved.length})`}
          >
            <Bookmark size={17} strokeWidth={1.3} />
            {saved.length > 0 && <span>{saved.length}</span>}
          </Link>
          <Link className="header-cta" href={`/${locale}/advisor`}>
            {t("advisorCta")}
            <ArrowUpRight className="directional" size={14} />
          </Link>
          <button
            className="menu-toggle"
            ref={trigger}
            onClick={() => setOpen(true)}
            aria-label={t("menu")}
          >
            <Menu size={25} />
          </button>
        </div>
      </header>
      <dialog
        className="mobile-menu"
        ref={dialog}
        onCancel={() => setOpen(false)}
        aria-label={t("menu")}
      >
        <div className="mobile-menu-head">
          <Monogram />
          <button
            onClick={() => {
              setOpen(false);
              trigger.current?.focus();
            }}
            aria-label={t("close")}
          >
            <X />
          </button>
        </div>
        <nav>
          {NAV_ITEMS.map((item, i) => (
            <Link
              key={item}
              onClick={() => setOpen(false)}
              href={`/${locale}/${item}`}
            >
              <small>0{i + 1}</small>
              {t(item)}
              <Arrow />
            </Link>
          ))}
          <Link onClick={() => setOpen(false)} href={`/${locale}/shortlist`}>
            {t("shortlist")} ({saved.length})
          </Link>
          <Link onClick={() => setOpen(false)} href={`/${locale}/advisor`}>
            {t("advisorCta")}
            <Arrow />
          </Link>
          <Link onClick={() => setOpen(false)} href={`/${locale}/contact`}>
            {t("consultation")}
            <Arrow />
          </Link>
        </nav>
        <p>{t("tagline")}</p>
      </dialog>
    </>
  );
}
export function ConsultationBand() {
  const { locale, t } = useExperience();
  return (
    <section className="consultation-band">
      <div>
        <p className="eyebrow">{t("ctaEyebrow")}</p>
        <h2>{t("ctaTitle")}</h2>
      </div>
      <div className="consultation-action">
        <p>{t("ctaCopy")}</p>
        <ButtonLink href={`/${locale}/contact`} light>
          {t("contactDemo")}
        </ButtonLink>
      </div>
    </section>
  );
}
export function Footer() {
  const { locale, t } = useExperience();
  return (
    <footer className="site-footer">
      <div className="footer-top">
        <div>
          <Link className="wordmark" href={`/${locale}`}>
            <span>{t("brand")}</span>
            <small>{t("estates")}</small>
          </Link>
          <p className="footer-tagline">{t("tagline")}</p>
          <p className="muted">{t("footerLocation")}</p>
        </div>
        <nav>
          {NAV_ITEMS.slice(0, 3).map((k) => (
            <Link href={`/${locale}/${k}`} key={k}>
              {t(k)}
            </Link>
          ))}
        </nav>
        <nav>
          {NAV_ITEMS.slice(3).map((k) => (
            <Link href={`/${locale}/${k}`} key={k}>
              {t(k)}
            </Link>
          ))}
          <Link href={`/${locale}/contact`}>{t("contact")}</Link>
        </nav>
        <div className="footer-philosophy">
          <Monogram />
          <p>{t("privacyNote")}</p>
        </div>
      </div>
      <div className="footer-bottom">
        <p>{t("footerCopyright")}</p>
        <div>
          <p>{t("footerDisclaimer")}</p>
          <p>{t("illustrative")}</p>
        </div>
        <Link href={`/${locale}/contact`}>
          {t("contact")}
          <Arrow />
        </Link>
      </div>
    </footer>
  );
}
