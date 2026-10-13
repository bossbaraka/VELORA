"use client";
import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { X, ArrowUpRight } from "lucide-react";
import { useExperience } from "./experience-provider";
import { IntentPicker, SearchBox } from "./intent-search";
import { PropertyCard } from "./property-card";
import { Eyebrow, Arrow, ButtonLink } from "./ui";
import { getProperties } from "@/lib/data";
import { parseSearch, filterProperties, closestProperties } from "@/lib/search";
import { matchScore } from "@/lib/match";
import { number } from "@/lib/format";
import { INTENTS } from "@/constants/intents";
import type { Intent, SearchParams, Property } from "@/lib/types";
import type { TranslationKey } from "@/i18n";
const EMPTY: SearchParams = { lifestyle: [], features: [] };
export function Collection({ shortlist = false }: { shortlist?: boolean }) {
  const { locale, t, intent, setIntent, saved, compared, setCompared } =
    useExperience();
  const sp = useSearchParams();
  const router = useRouter();
  const query = sp.get("q") || "";
  const [params, setParams] = useState<SearchParams>(EMPTY);
  const [similar, setSimilar] = useState(false);
  const all = useMemo(() => getProperties(), []);
  useEffect(() => {
    const parsed = parseSearch(query);
    if (sp.get("type")) parsed.type = sp.get("type") as Property["type"];
    if (sp.get("beds")) parsed.bedrooms = Number(sp.get("beds"));
    if (sp.get("location")) parsed.location = sp.get("location")!;
    if (sp.get("intent") && INTENTS.includes(sp.get("intent") as Intent))
      setIntent(sp.get("intent") as Intent);
    setParams(parsed);
    setSimilar(false);
  }, [sp]);
  const filtered = shortlist
    ? all.filter((p) => saved.includes(p.id))
    : similar
      ? closestProperties(all, params)
      : query || params.type || params.bedrooms !== undefined || params.location
        ? filterProperties(all, params)
        : all;
  const results = [...filtered].sort(
    (a, b) => matchScore(b, intent) - matchScore(a, intent),
  );
  function update(next: SearchParams) {
    setParams(next);
    setSimilar(false);
    const url = new URLSearchParams();
    url.set("intent", intent);
    if (next.type) url.set("type", next.type);
    if (next.bedrooms !== undefined) url.set("beds", String(next.bedrooms));
    if (next.location) url.set("location", next.location);
    const words = [
      ...next.lifestyle,
      ...next.features,
      ...(next.waterfront ? ["waterfront"] : []),
    ];
    if (words.length) url.set("q", words.join(" "));
    router.replace(`/${locale}/collection?${url}`, { scroll: false });
  }
  function changeIntent(v: Intent) {
    const url = new URLSearchParams(sp.toString());
    url.set("intent", v);
    router.replace(`/${locale}/collection?${url}`, { scroll: false });
  }
  const chips: [string, string][] = [];
  if (params.type) chips.push(["type", t(params.type)]);
  if (params.bedrooms !== undefined)
    chips.push([
      "bedrooms",
      `${number(params.bedrooms, locale)} ${t("bedrooms")}`,
    ]);
  if (params.waterfront) chips.push(["waterfront", t("waterfront")]);
  if (params.location)
    chips.push(["location", t(params.location as TranslationKey)]);
  params.lifestyle.forEach((x) =>
    chips.push([`lifestyle:${x}`, t(x as TranslationKey)]),
  );
  params.features.forEach((x) =>
    chips.push([`features:${x}`, t(x as TranslationKey)]),
  );
  return (
    <>
      <section className="page-intro section-pad">
        <Eyebrow>{t(shortlist ? "shortlist" : "collection")}</Eyebrow>
        <h1>{t(shortlist ? "shortlistEmpty" : "collectionTitle")}</h1>
        <p>{t(shortlist ? "shortlistEmptyCopy" : "collectionCopy")}</p>
      </section>
      {!shortlist && (
        <section className="collection-search section-pad">
          <IntentPicker compact onChange={changeIntent} />
          <p className="intent-note" aria-live="polite">
            {t(`intentNote_${intent}`)}
          </p>
          <SearchBox
            initialValue={query}
            onSearch={(q) =>
              router.replace(
                `/${locale}/collection?q=${encodeURIComponent(q)}&intent=${intent}`,
                { scroll: false },
              )
            }
          />
          <div className="filter-row">
            <label>
              <span>{t("type")}</span>
              <select
                value={params.type || ""}
                onChange={(e) =>
                  update({
                    ...params,
                    type: (e.target.value as Property["type"]) || undefined,
                  })
                }
              >
                <option value="">{t("allTypes")}</option>
                {[
                  "villa",
                  "apartment",
                  "penthouse",
                  "townhouse",
                  "commercial",
                ].map((v) => (
                  <option key={v} value={v}>
                    {t(v as TranslationKey)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("bedrooms")}</span>
              <select
                value={params.bedrooms ?? ""}
                onChange={(e) =>
                  update({
                    ...params,
                    bedrooms:
                      e.target.value === ""
                        ? undefined
                        : Number(e.target.value),
                  })
                }
              >
                <option value="">{t("allBeds")}</option>
                {[0, 1, 2, 3, 4, 5, 6].map((v) => (
                  <option value={v} key={v}>
                    {number(v, locale)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("location")}</span>
              <select
                value={params.location || ""}
                onChange={(e) =>
                  update({ ...params, location: e.target.value || undefined })
                }
              >
                <option value="">{t("allLocations")}</option>
                {[
                  "palm",
                  "hills",
                  "jumeirah",
                  "downtown",
                  "saadiyat",
                  "abu dhabi",
                  "business bay",
                ].map((v) => (
                  <option value={v} key={v}>
                    {t(v as TranslationKey)}
                  </option>
                ))}
              </select>
            </label>
            <button className="text-link" onClick={() => update(EMPTY)}>
              {t("clearFilters")}
              <X size={14} />
            </button>
          </div>
          {chips.length > 0 && (
            <div className="search-chips" aria-label={t("understood")}>
              {chips.map(([key, label]) => (
                <button
                  key={key}
                  onClick={() => {
                    const n = { ...params };
                    if (key.startsWith("lifestyle:"))
                      n.lifestyle = n.lifestyle.filter(
                        (x) => x !== key.split(":")[1],
                      );
                    else if (key.startsWith("features:"))
                      n.features = n.features.filter(
                        (x) => x !== key.split(":")[1],
                      );
                    else
                      delete n[
                        key as "type" | "bedrooms" | "waterfront" | "location"
                      ];
                    update(n);
                  }}
                >
                  {label}
                  <X size={12} />
                  <span className="sr-only">{t("remove")}</span>
                </button>
              ))}
            </div>
          )}
        </section>
      )}
      <section className="collection-results section-pad">
        {saved.length === 3 && (
          <div className="shortlist-prompt">
            <p>{t("comparePrompt")}</p>
            <Link
              onClick={() => setCompared(saved)}
              href={`/${locale}/compare`}
              className="text-link"
            >
              {t("compare")}
              <Arrow />
            </Link>
          </div>
        )}
        <div className="results-heading">
          <p aria-live="polite">
            {similar
              ? t("similarTitle")
              : t(chips.length ? "resultCount" : "allCount", {
                  n: number(results.length, locale),
                })}
          </p>
          <Link
            className="text-link"
            href={`/${locale}/${shortlist ? "collection" : "shortlist"}`}
          >
            {t(shortlist ? "exploreCollection" : "shortlist")}
            {!shortlist && ` (${number(saved.length, locale)})`}
            <Arrow />
          </Link>
        </div>
        {similar && <p>{t("similarCopy")}</p>}
        {results.length === 0 ? (
          <div className="empty-state">
            <span className="empty-mark">V</span>
            <h2>{t(shortlist ? "shortlistEmpty" : "emptyTitle")}</h2>
            <p>{t(shortlist ? "shortlistEmptyCopy" : "emptyCopy")}</p>
            {shortlist ? (
              <ButtonLink href={`/${locale}/collection`}>
                {t("exploreCollection")}
              </ButtonLink>
            ) : (
              <button className="button" onClick={() => setSimilar(true)}>
                {t("showSimilar")}
                <Arrow />
              </button>
            )}
          </div>
        ) : (
          <div className="collection-grid">
            {results.map((p) => (
              <PropertyCard property={p} set={all} key={p.id} />
            ))}
          </div>
        )}
      </section>
      {compared.length > 0 && (
        <div className="compare-tray">
          <span>
            {t("compareSelected", { n: number(compared.length, locale) })}
          </span>
          <Link href={`/${locale}/compare`}>
            {t("compare")}
            <ArrowUpRight size={17} />
          </Link>
          <button
            onClick={() => setCompared([])}
            aria-label={t("clearFilters")}
          >
            <X size={17} />
          </button>
        </div>
      )}
    </>
  );
}
