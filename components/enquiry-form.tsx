"use client";
import { useState, useRef } from "react";
import { getProperties, getPropertyById } from "@/lib/data";
import { Check } from "lucide-react";
import { useExperience } from "./experience-provider";
import { sendEnquiry } from "@/lib/enquiry";
import { Arrow } from "./ui";
import type { TranslationKey } from "@/i18n";
const purposes = ["find", "sell", "invest", "viewing", "general"] as const;
type Purpose = (typeof purposes)[number];
export function EnquiryForm({
  viewing = false,
  propertyId,
  initialPurpose = "find",
}: {
  viewing?: boolean;
  propertyId?: string;
  initialPurpose?: string;
}) {
  const { t, locale } = useExperience();
  const [purpose, setPurpose] = useState<Purpose>(
    viewing
      ? "viewing"
      : purposes.includes(initialPurpose as Purpose)
        ? (initialPurpose as Purpose)
        : "find",
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const successRef = useRef<HTMLDivElement>(null);
  const today = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  };
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(e.currentTarget)) as Record<
      string,
      string
    >;
    const errs: Record<string, string> = {};
    [
      "name",
      "email",
      "phone",
      ...(purpose === "viewing" ? ["date", "time"] : []),
    ].forEach((k) => {
      if (!data[k]?.trim()) errs[k] = t("required");
    });
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email))
      errs.email = t("invalidEmail");
    if (data.phone && data.phone.replace(/\D/g, "").length < 7)
      errs.phone = t("invalidPhone");
    if (purpose === "viewing" && data.date && data.date < today())
      errs.date = t("invalidDate");
    setErrors(errs);
    if (Object.keys(errs).length) {
      (
        form.current?.elements.namedItem(
          Object.keys(errs)[0],
        ) as HTMLInputElement
      )?.focus();
      return;
    }
    setBusy(true);
    await sendEnquiry({
      ...data,
      purpose,
      propertyId: propertyId || data.propertyId || "",
    });
    setBusy(false);
    setSuccess(true);
    requestAnimationFrame(() => successRef.current?.focus());
  }
  function field(
    name: string,
    label: TranslationKey,
    type = "text",
    required = true,
  ) {
    return (
      <label className={`form-field ${errors[name] ? "has-error" : ""}`}>
        <span>
          {t(label)} {!required && <small>({t("optional")})</small>}
        </span>
        <input
          name={name}
          type={type}
          required={required}
          aria-invalid={!!errors[name]}
          aria-describedby={errors[name] ? `error-${name}` : undefined}
          autoComplete={
            name === "name"
              ? "name"
              : name === "email"
                ? "email"
                : name === "phone"
                  ? "tel"
                  : undefined
          }
          min={type === "date" ? today() : undefined}
          dir={type === "email" || type === "tel" ? "ltr" : undefined}
        />
        {errors[name] && (
          <small role="alert" id={`error-${name}`}>
            {errors[name]}
          </small>
        )}
      </label>
    );
  }
  if (success)
    return (
      <div
        className="form-success"
        ref={successRef}
        tabIndex={-1}
        role="status"
      >
        <Check size={35} />
        <h3>{t("success")}</h3>
        <p>{t("successDemo")}</p>
        <button
          className="text-link"
          onClick={() => {
            setSuccess(false);
            setErrors({});
          }}
        >
          {t("newEnquiry")}
          <Arrow />
        </button>
      </div>
    );
  return (
    <form className="enquiry-form" onSubmit={submit} noValidate ref={form}>
      <p className="demo-notice">{t("demoNotice")}</p>
      {!viewing && (
        <fieldset>
          <legend>{t("formHelp")}</legend>
          <div className="purpose-options">
            {purposes.map((p) => (
              <label key={p} className={purpose === p ? "selected" : ""}>
                <input
                  type="radio"
                  name="purpose"
                  value={p}
                  checked={purpose === p}
                  onChange={() => {
                    setPurpose(p);
                    setErrors({});
                  }}
                />
                {t(`help_${p}`)}
              </label>
            ))}
          </div>
        </fieldset>
      )}
      <div className="form-grid">
        {!propertyId && purpose === "viewing" && (
          <label className="form-field">
            <span>{t("formResidence")}</span>
            <select name="propertyId" defaultValue="">
              <option value="">{t("selectResidence")}</option>
              {getProperties()
                .filter((p) => !p.is_private && p.availability === "available")
                .map((p) => (
                  <option value={p.id} key={p.id}>
                    {p.name[locale]}
                  </option>
                ))}
            </select>
          </label>
        )}
        {field("name", "fullName")}
        {field("email", "email", "email")}
        {field("phone", "phone", "tel")}
        {(purpose === "find" || purpose === "invest") &&
          field("budget", "budget", "number", false)}
        {purpose === "sell" && field("location", "sellLocation", "text", false)}
        {purpose === "viewing" && (
          <>
            {field("date", "date", "date")}
            <label className="form-field">
              <span>{t("time")}</span>
              <select
                name="time"
                required
                aria-invalid={!!errors.time}
                aria-describedby={errors.time ? "error-time" : undefined}
                defaultValue=""
              >
                <option value="">{t("selectTime")}</option>
                {["morning", "afternoon", "evening"].map((time) => (
                  <option key={time} value={time}>
                    {t(time as TranslationKey)}
                  </option>
                ))}
              </select>
              {errors.time && (
                <small id="error-time" role="alert">
                  {errors.time}
                </small>
              )}
            </label>
          </>
        )}
      </div>
      <label className="form-field">
        <span>
          {t("message")} <small>({t("optional")})</small>
        </span>
        <textarea name="message" rows={3} />
      </label>
      <button className="button" type="submit" disabled={busy}>
        {t(busy ? "sending" : viewing ? "requestViewing" : "sendEnquiry")}
        <Arrow />
      </button>
    </form>
  );
}
