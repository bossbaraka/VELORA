"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, Bookmark, Check, Info, Plus, RotateCcw, Send, X } from "lucide-react";
import { useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { useExperience } from "@/components/experience-provider";
import { getProperties } from "@/lib/data";
import {
  advisorBriefFields,
  advisorEvidenceLabelKey,
  advisorFieldLabel,
  advisorFieldRemovableKey,
  advisorFieldValues,
  buildAdvisorExchange,
  createEmptyAdvisorBrief,
  intentSuggestions,
  localizedPropertyPlace,
  respondToAdvisorAction,
  respondToAdvisorMessage,
} from "@/lib/advisor";
import { area, number, price } from "@/lib/format";
import type {
  AdvisorAction,
  AdvisorBrief,
  AdvisorConstraintKey,
  AdvisorCopyKey,
  AdvisorEvidence,
  AdvisorExchange,
  AdvisorMessage,
  AdvisorRecommendation,
  AdvisorSuggestion,
  Property,
} from "@/lib/types";
import type { TranslationKey } from "@/i18n";
import { Eyebrow } from "@/components/ui";

const tKey = (key: string, t: (key: TranslationKey, vars?: Record<string, string | number>) => string, vars?: Record<string, string | number>) =>
  t(key as TranslationKey, vars);

function formatEvidence(
  item: AdvisorEvidence,
  locale: "en" | "ar",
  properties: Property[],
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
) {
  const values: Record<string, string | number> = { ...(item.values ?? {}) };
  for (const key of ["city", "district"] as const) {
    if (typeof values[key] === "string") {
      values[key] = String(values[key]).split(",").map((place) => localizedPropertyPlace(properties, place.trim(), locale, key)).join(locale === "ar" ? "، " : ", ");
    }
  }
  if (typeof values.type === "string") {
    values.type = String(values.type).split(",").map((type) => t(type.trim() as TranslationKey)).join(locale === "ar" ? "، " : ", ");
  }
  if (typeof values.feature === "string") {
    values.feature = String(values.feature)
      .split(",")
      .map((feature) => {
        const key = advisorEvidenceLabelKey(feature.trim());
        return key ? t(key as TranslationKey) : t(`advisorFeature${feature.trim().charAt(0).toUpperCase()}${feature.trim().slice(1)}` as TranslationKey);
      })
      .join(locale === "ar" ? "، " : ", ");
  }
  if (item.key.toLowerCase().includes("budget")) {
    for (const key of ["price", "max", "min"]) {
      if (typeof values[key] === "number") values[key] = price(Number(values[key]), locale);
    }
  }
  if (item.key.toLowerCase().includes("area")) {
    for (const key of ["area", "min"]) {
      if (typeof values[key] === "number") values[key] = area(Number(values[key]), locale);
    }
  }
  for (const key of ["n", "max", "min"]) {
    if (typeof values[key] === "number" && !item.key.toLowerCase().includes("budget") && !item.key.toLowerCase().includes("area")) {
      values[key] = number(Number(values[key]), locale);
    }
  }
  return tKey(item.key, t, values);
}

function featureTranslationKey(feature: string): string {
  return `advisorFeature${feature.charAt(0).toUpperCase()}${feature.slice(1)}`;
}

function briefRows(
  brief: AdvisorBrief,
  locale: "en" | "ar",
  properties: Property[],
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string,
) {
  const rows: { field: AdvisorConstraintKey | "objective" | "preferences" | "investmentFocus" | "timeline"; label: string; value: string; source?: "stated" | "inferred"; firmness?: "required" | "preferred" }[] = [];
  if (brief.objective) rows.push({ field: "objective", label: tKey("advisorObjective", t), value: t(`intent_${brief.objective.value}` as TranslationKey), source: brief.objective.source });
  for (const field of advisorBriefFields(brief)) {
    const selected = advisorFieldValues(brief, field);
    if (!selected) continue;
    let value = "";
    switch (field) {
      case "budget": {
        const budget = brief.budget!.value;
        if (budget.currency !== "AED") value = [budget.min, budget.max].filter((n) => n !== undefined).map((n) => price(Number(n), locale)).join(" – ") + ` ${budget.currency}`;
        else if (budget.min !== undefined && budget.max !== undefined) value = tKey("advisorBudgetRange", t, { min: price(budget.min, locale), max: price(budget.max, locale) });
        else if (budget.max !== undefined) value = tKey("advisorBudgetCeiling", t, { amount: price(budget.max, locale) });
        else if (budget.min !== undefined) value = tKey("advisorBudgetFloor", t, { amount: price(budget.min, locale) });
        break;
      }
      case "cities":
      case "excludedCities":
        value = brief[field]!.value.map((name) => localizedPropertyPlace(properties, name, locale, "city")).join(locale === "ar" ? "، " : ", ");
        break;
      case "districts":
      case "excludedDistricts":
        value = brief[field]!.value.map((name) => localizedPropertyPlace(properties, name, locale, "district")).join(locale === "ar" ? "، " : ", ");
        break;
      case "propertyTypes":
      case "excludedPropertyTypes":
        value = brief[field]!.value.map((type) => t(type as TranslationKey)).join(locale === "ar" ? "، " : ", ");
        break;
      case "minBedrooms":
        value = tKey("advisorAtLeastBeds", t, { n: number(brief.minBedrooms!.value, locale) });
        break;
      case "minAreaSqft":
        value = tKey("advisorAtLeastArea", t, { area: area(brief.minAreaSqft!.value, locale) });
        break;
      case "maxDowntownMinutes":
      case "maxWaterfrontMinutes":
      case "maxAirportMinutes":
      case "maxDiningMinutes":
        value = tKey("advisorAtMostMinutes", t, { n: number((brief[field] as { value: number }).value, locale) });
        break;
      case "mustHave":
        value = brief.mustHave!.value.map((feature) => tKey(featureTranslationKey(feature), t)).join(locale === "ar" ? "، " : ", ");
        break;
      case "excludedFeatures":
        value = brief.excludedFeatures!.value.map((feature) => tKey(featureTranslationKey(feature), t)).join(locale === "ar" ? "، " : ", ");
        break;
      default:
        value = "";
    }
    if (!value) continue;
    const label = tKey(advisorFieldLabel(field), t);
    const excluded = field.startsWith("excluded");
    rows.push({
      field,
      label,
      value: excluded ? tKey("advisorExcludeValue", t, { value }) : value,
      source: selected.source,
      firmness: selected.firmness,
    });
  }
  if (brief.preferences?.value.length) {
    rows.push({
      field: "preferences",
      label: tKey("advisorConstraintPreferences", t),
      value: brief.preferences.value.map((preference) => tKey(`advisorPreference${preference.charAt(0).toUpperCase()}${preference.slice(1)}`, t)).join(locale === "ar" ? "، " : ", "),
      source: brief.preferences.source,
      firmness: "preferred",
    });
  }
  if (brief.investmentFocus) {
    const key = brief.investmentFocus.value === "rental" ? "advisorInvestmentRental" : brief.investmentFocus.value === "resale" ? "advisorInvestmentResale" : "advisorInvestmentLongTerm";
    rows.push({ field: "investmentFocus", label: tKey("advisorInvestmentFocusLabel", t), value: tKey(key, t), source: brief.investmentFocus.source });
  }
  if (brief.timeline) rows.push({ field: "timeline", label: tKey("advisorTimelineLabel", t), value: brief.timeline.value, source: brief.timeline.source });
  return rows;
}

function openBriefItems(brief: AdvisorBrief, t: (key: TranslationKey, vars?: Record<string, string | number>) => string) {
  const items: string[] = [];
  if (!brief.objective) items.push(tKey("advisorObjectiveUnknown", t));
  if (!brief.budget && !brief.declinedQuestions.includes("budget")) items.push(tKey("advisorBudgetUnknown", t));
  if (!brief.cities && !brief.districts) items.push(tKey("advisorLocationUnknown", t));
  if (brief.objective?.value === "family" && !brief.minBedrooms) items.push(tKey("advisorBedroomsUnknown", t));
  if (brief.objective?.value === "private" || brief.preferences?.value.includes("privacy")) items.push(tKey("advisorPrivacyUnknown", t));
  if (brief.objective?.value === "investment") items.push(tKey("advisorFinancialUnknown", t));
  return items.slice(0, 4);
}

function lastExchange(messages: AdvisorMessage[]): AdvisorExchange | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const message = messages[i];
    if (message.role === "advisor") return message.exchange;
  }
  return undefined;
}

function AdvisorRecommendationCard({
  property,
  recommendation,
  properties,
  locale,
  t,
}: {
  property: Property;
  recommendation: AdvisorRecommendation;
  properties: Property[];
  locale: "en" | "ar";
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  const { saved, compared, toggleSave, toggleCompare } = useExperience();
  const isSaved = saved.includes(property.id);
  const isCompared = compared.includes(property.id);
  const href = `/${locale}/collection/${property.slug}`;
  return (
    <article className="advisor-property">
      <div className="advisor-property-image">
        <Link href={href} aria-label={`${property.name[locale]} — ${t("advisorOpenProperty")}`}>
          <Image
            src={property.images.day[0]}
            alt={t("illustrativePhotoAlt")}
            fill
            sizes="(max-width: 760px) 100vw, (max-width: 1100px) 35vw, 340px"
          />
        </Link>
        <span>{t("illustrativeResidence")}</span>
      </div>
      <div className="advisor-property-body">
        <div className="advisor-property-meta">
          <span>{property.location.district[locale]}{locale === "ar" ? "، " : ", "}{property.location.city[locale]}</span>
          <span>{t(property.type as TranslationKey)}</span>
        </div>
        <h3 dir="auto"><Link href={href}>{property.name[locale]}</Link></h3>
        <dl className="advisor-property-facts">
          <div><dt>{t("advisorIllustrativePrice")}</dt><dd><bdi>{price(property.price.amount, locale)}</bdi></dd></div>
          <div><dt>{t("bedrooms")}</dt><dd>{number(property.bedrooms, locale)}</dd></div>
          <div><dt>{t("area")}</dt><dd>{area(property.area_sqft, locale)}</dd></div>
        </dl>
        <div className="advisor-evidence-block">
          <h4>{t("advisorReasonLabel")}</h4>
          <ul>
            {recommendation.reasons.map((reason, index) => <li key={`${reason.key}-${index}`} dir="auto">{formatEvidence(reason, locale, properties, t)}</li>)}
          </ul>
        </div>
        {recommendation.tradeoffs.length > 0 && (
          <div className="advisor-evidence-block advisor-caveats">
            <h4>{t("advisorTradeoffLabel")}</h4>
            <ul>
              {recommendation.tradeoffs.map((item, index) => <li key={`${item.key}-${index}`} dir="auto">{formatEvidence(item, locale, properties, t)}</li>)}
            </ul>
          </div>
        )}
        <div className="advisor-property-actions">
          <Link className="advisor-open-link" href={href}>
            {t("advisorOpenProperty")} <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
          <button type="button" aria-pressed={isSaved} onClick={() => toggleSave(property.id)}>
            {isSaved ? <Check size={15} aria-hidden="true" /> : <Bookmark size={15} aria-hidden="true" />}
            {t(isSaved ? "advisorSaved" : "advisorSave")}
          </button>
          <button type="button" aria-pressed={isCompared} onClick={() => toggleCompare(property.id)}>
            {isCompared ? <Check size={15} aria-hidden="true" /> : <Plus size={15} aria-hidden="true" />}
            {t(isCompared ? "advisorCompared" : "advisorCompare")}
          </button>
        </div>
      </div>
    </article>
  );
}

function BriefPanel({
  brief,
  properties,
  locale,
  onRemove,
  t,
}: {
  brief: AdvisorBrief;
  properties: Property[];
  locale: "en" | "ar";
  onRemove: (field: AdvisorConstraintKey | "objective" | "preferences" | "investmentFocus" | "timeline", label: string) => void;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
}) {
  const rows = briefRows(brief, locale, properties, t);
  const unknown = openBriefItems(brief, t);
  return (
    <aside className="advisor-brief-panel" aria-labelledby="advisor-brief-title">
      <div className="advisor-brief-head">
        <div>
          <p className="eyebrow"><span />{t("advisorBriefEyebrow")}</p>
          <h2 id="advisor-brief-title">{t("advisorBriefTitle")}</h2>
        </div>
      </div>
      <p className="advisor-edit-hint">{t("advisorEditHint")}</p>
      {rows.length === 0 ? (
        <p className="advisor-brief-empty">{t("advisorBriefEmpty")}</p>
      ) : (
        <div className="advisor-brief-section">
          <h3>{t("advisorUnderstood")}</h3>
          <ul className="advisor-brief-list">
            {rows.map((row) => {
              const fieldName = row.field as AdvisorConstraintKey | "objective" | "preferences" | "investmentFocus" | "timeline";
              const fieldLabel = row.label;
              return (
                <li key={row.field}>
                  <div>
                    <span className="advisor-brief-label">{fieldLabel}</span>
                    <p dir="auto">{row.value}</p>
                    <small>
                      {row.source === "inferred" ? t("advisorSourceInferred") : t("advisorSourceStated")}
                      {row.firmness && ` · ${t(row.firmness === "required" ? "advisorRequired" : "advisorPreferred")}`}
                    </small>
                  </div>
                  <button type="button" onClick={() => onRemove(fieldName, fieldLabel)} aria-label={t("advisorRemoveField", { field: fieldLabel })}>
                    <X size={14} aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
      <div className="advisor-brief-section advisor-open-questions">
        <h3>{t("advisorStillOpen")}</h3>
        {unknown.length ? (
          <ul>{unknown.map((item) => <li key={item}>{item}</li>)}</ul>
        ) : (
          <p>{t("advisorBriefComplete")}</p>
        )}
      </div>
      {brief.relaxedConstraints.length > 0 && (
        <p className="advisor-relaxed-note" role="status">{t("advisorRelaxedNote")}</p>
      )}
      {brief.objective?.value === "investment" && <p className="advisor-brief-note">{t("advisorFinancialUnknown")}</p>}
    </aside>
  );
}

export function Advisor() {
  const {
    locale,
    t,
    advisorMessages,
    setAdvisorMessages,
    resetAdvisor,
    setIntent,
    saved,
    compared,
  } = useExperience();
  const properties = useMemo(() => getProperties(), []);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [input, setInput] = useState("");
  const [error, setError] = useState("");
  const reduced = useReducedMotion();
  const exchange = lastExchange(advisorMessages);
  const brief = exchange?.updatedBrief ?? createEmptyAdvisorBrief();
  const response = exchange?.response;
  const records = useMemo(() => new Map(properties.map((p) => [p.id, p])), [properties]);
  const recommendedProperties = (response?.recommendationIds ?? [])
    .map((id) => records.get(id))
    .filter((p): p is Property => !!p && !p.is_private && p.availability === "available");
  const hasClientTurn = advisorMessages.some((message) => message.role === "client");

  const appendExchange = (label: string, next: AdvisorExchange, preserveHistory = true) => {
    const nextIntent = next.updatedBrief.objective?.value;
    if (nextIntent) setIntent(nextIntent);
    const clientMessage: AdvisorMessage = { id: `${Date.now()}-client`, role: "client", text: label };
    const advisorMessage: AdvisorMessage = { id: `${Date.now()}-advisor`, role: "advisor", exchange: next };
    setAdvisorMessages((current) => (preserveHistory ? [...current, clientMessage, advisorMessage].slice(-40) : [advisorMessage]));
    setError("");
  };

  const submit = (text: string) => {
    const clean = text.trim().slice(0, 1_000);
    if (!clean) return;
    try {
      const next = respondToAdvisorMessage(clean, brief, properties);
      if (next.response.reply.key === "advisorResponseReset") {
        setAdvisorMessages([{ id: `${Date.now()}-advisor`, role: "advisor", exchange: next }]);
        setError("");
      } else appendExchange(clean, next);
      setInput("");
    } catch {
      setError(t("advisorResponseError"));
    }
  };

  const sendAction = (action: AdvisorAction, visibleText: string) => {
    try {
      const next = respondToAdvisorAction(action, brief, properties);
      appendExchange(visibleText, next);
    } catch {
      setError(t("advisorResponseError"));
    }
  };

  const handleRemove = (field: AdvisorConstraintKey | "objective" | "preferences" | "investmentFocus" | "timeline", label: string) => {
    const action: AdvisorAction = { type: "clear", field };
    sendAction(action, t("advisorRemoveFieldMessage", { field: label }));
  };

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    submit(input);
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit(input);
    }
  };

  const onReset = () => {
    resetAdvisor();
    setInput("");
    setError("");
    inputRef.current?.focus();
  };

  const renderSuggestion = (suggestion: AdvisorSuggestion, index: number) => {
    const labelValues = { ...(suggestion.label.values ?? {}) };
    if (typeof labelValues.n === "number") labelValues.n = number(labelValues.n, locale);
    const label = tKey(suggestion.label.key, t, labelValues);
    return (
      <button
        className="advisor-quick-reply"
        type="button"
        key={`${suggestion.label.key}-${index}`}
        onClick={() => sendAction(suggestion.action, label)}
      >
        {label}
      </button>
    );
  };

  return (
    <div className="advisor-page section-pad">
      <header className="advisor-page-heading">
        <div className="advisor-heading-copy">
          <Eyebrow>{t("advisorEyebrow")}</Eyebrow>
          <h1>{t("advisorTitle")}</h1>
          <p>{t("advisorIntro")}</p>
        </div>
        <aside className="advisor-disclosure" aria-label={t("advisorModeDisclosure")}>
          <Info size={17} aria-hidden="true" />
          <div>
            <strong>{t("advisorModeTitle")}</strong>
            <p>{t("advisorModeDisclosure")}</p>
            <p>{t("advisorSessionOnly")}</p>
          </div>
        </aside>
      </header>

      <div className="advisor-layout">
        <section className="advisor-consultation" aria-labelledby="advisor-conversation-title">
          <div className="advisor-conversation-head">
            <div>
              <p className="eyebrow"><span />{t("advisorConversation")}</p>
              <h2 id="advisor-conversation-title">{t("advisorConversationTitle")}</h2>
            </div>
            <button className="advisor-reset" type="button" onClick={onReset} title={t("advisorResetLabel")}>
              <RotateCcw size={15} aria-hidden="true" />
              <span>{t("advisorReset")}</span>
            </button>
          </div>

          <div className="advisor-thread" role="log" aria-live="polite" aria-relevant="additions text" aria-label={t("advisorConversation")}>
            {!hasClientTurn && (
              <div className="advisor-welcome">
                <div className="advisor-avatar" aria-hidden="true">V</div>
                <div>
                  <h3>{t("advisorWelcomeTitle")}</h3>
                  <p>{t("advisorWelcomeCopy")}</p>
                  <p className="advisor-welcome-hint">{t("advisorStartPrompt")}</p>
                  <div className="advisor-intent-choices">
                    {intentSuggestions().map((item, index) => renderSuggestion(item, index))}
                  </div>
                </div>
              </div>
            )}
            <ol className="advisor-message-list">
              {advisorMessages.map((message, index) => {
                const latestAdvisorIndex = advisorMessages.reduce((last, entry, entryIndex) => entry.role === "advisor" ? entryIndex : last, -1);
                const latest = message.role === "advisor" && index === latestAdvisorIndex;
                return (
                  <motion.li
                    key={message.id}
                    className={`advisor-message advisor-message-${message.role}`}
                    initial={reduced ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reduced ? 0 : 0.2 }}
                  >
                    {message.role === "client" ? (
                      <div className="advisor-user-bubble" dir="auto">
                        <span className="sr-only">{t("advisorUserMessage")}</span>
                        {message.text}
                      </div>
                    ) : (
                      <div className="advisor-assistant-bubble">
                        <span className="sr-only">{t("advisorAssistantMessage")}</span>
                        <div className="advisor-avatar" aria-hidden="true">V</div>
                        <div className="advisor-assistant-content">
                          <p dir="auto">{tKey(message.exchange.response.reply.key, t, message.exchange.response.reply.values)}</p>
                          {latest && message.exchange.response.notes.length > 0 && (
                            <div className="advisor-response-notes">
                              {message.exchange.response.notes.map((note, noteIndex) => <p key={`${note.key}-${noteIndex}`} dir="auto">{formatEvidence(note, locale, properties, t)}</p>)}
                            </div>
                          )}
                          {latest && message.exchange.response.followUp && (
                            <div className="advisor-follow-up">
                              <h3>{tKey(message.exchange.response.followUp.key, t)}</h3>
                              {!message.exchange.response.noResults && message.exchange.response.followUp.choices.length > 0 && (
                                <div className="advisor-quick-replies">
                                  {message.exchange.response.followUp.choices.map(renderSuggestion)}
                                </div>
                              )}
                            </div>
                          )}
                          {latest && message.exchange.response.noResults && (
                            <div className="advisor-no-results">
                              <p>{t("advisorNoResultsKeptStrict")}</p>
                              {message.exchange.response.noResults.strictCriteria.length > 0 && (
                                <ul>{message.exchange.response.noResults.strictCriteria.map((item, itemIndex) => <li key={`${item.key}-${itemIndex}`} dir="auto">{formatEvidence(item, locale, properties, t)}</li>)}</ul>
                              )}
                              {message.exchange.response.noResults.alternatives.length > 0 && (
                                <div className="advisor-quick-replies">
                                  {message.exchange.response.noResults.alternatives.map(renderSuggestion)}
                                </div>
                              )}
                            </div>
                          )}
                          {latest && message.exchange.response.orderNote && (
                            <p className="advisor-order-note">{tKey(message.exchange.response.orderNote, t)}</p>
                          )}
                          {latest && message.exchange.response.recommendations.length > 0 && (
                            <div className="advisor-recommendations">
                              <h3>{t("advisorResults")}</h3>
                              <div className="advisor-recommendation-list">
                                {message.exchange.response.recommendations.map((recommendation) => {
                                  const property = records.get(recommendation.propertyId);
                                  if (!property || property.is_private || property.availability !== "available") return null;
                                  return <AdvisorRecommendationCard key={property.id} property={property} recommendation={recommendation} properties={properties} locale={locale} t={t} />;
                                })}
                              </div>
                              {compared.filter((id) => message.exchange.response.recommendationIds.includes(id)).length >= 2 && (
                                <Link className="advisor-compare-link" href={`/${locale}/compare`}>
                                  {t("advisorCompareSelected", { n: number(compared.filter((id) => message.exchange.response.recommendationIds.includes(id)).length, locale) })}
                                  <ArrowUpRight size={15} aria-hidden="true" />
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </motion.li>
                );
              })}
            </ol>
          </div>

          {error && <p className="advisor-error" role="alert">{error}</p>}
          <form className="advisor-composer" onSubmit={onSubmit}>
            <label htmlFor="advisor-message">{t("advisorComposeLabel")}</label>
            <textarea
              id="advisor-message"
              ref={inputRef}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={onKeyDown}
              placeholder={t("advisorPlaceholder")}
              maxLength={1_000}
              rows={3}
              dir="auto"
              aria-describedby="advisor-input-hint"
            />
            <div className="advisor-composer-footer">
              <p id="advisor-input-hint">{t("advisorInputHint")}</p>
              <button type="submit" disabled={!input.trim()}>
                {t("advisorSend")} <Send size={15} aria-hidden="true" />
              </button>
            </div>
          </form>
          <p className="advisor-data-note"><Info size={14} aria-hidden="true" />{t("advisorNoLiveData")}</p>
          {recommendedProperties.length > 1 && <p className="sr-only" aria-live="polite">{t("advisorRecommendationCount", { n: number(recommendedProperties.length, locale) })}</p>}
        </section>

        <BriefPanel
          brief={brief}
          properties={properties}
          locale={locale}
          t={t}
          onRemove={handleRemove}
        />
      </div>
    </div>
  );
}
