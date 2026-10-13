"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, House, TrendingUp, Sun, Users, Shield } from "lucide-react";
import { INTENTS } from "@/constants/intents";
import { useExperience } from "./experience-provider";
import { Arrow, Eyebrow } from "./ui";
import type { Intent } from "@/lib/types";
const icons = {
  home: House,
  investment: TrendingUp,
  retreat: Sun,
  family: Users,
  private: Shield,
};
export function IntentPicker({
  compact = false,
  onChange,
}: {
  compact?: boolean;
  onChange?: (v: Intent) => void;
}) {
  const { intent, setIntent, t } = useExperience();
  return (
    <div
      className={`intent-options ${compact ? "compact" : ""}`}
      role="group"
      aria-label={t("findTitle")}
    >
      {INTENTS.map((i) => {
        const Icon = icons[i];
        return (
          <button
            key={i}
            aria-pressed={intent === i}
            className={intent === i ? "selected" : ""}
            onClick={() => {
              setIntent(i);
              onChange?.(i);
            }}
          >
            <Icon size={18} strokeWidth={1.3} />
            <span>{t(`intent_${i}`)}</span>
            <Arrow size={15} />
          </button>
        );
      })}
    </div>
  );
}
export function SearchBox({
  onSearch,
  initialValue = "",
}: {
  onSearch?: (q: string) => void;
  initialValue?: string;
}) {
  const [value, setValue] = useState(initialValue);
  const { locale, intent, t } = useExperience();
  const router = useRouter();
  return (
    <form
      className="search-box"
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        if (onSearch) onSearch(value);
        else
          router.push(
            `/${locale}/collection?q=${encodeURIComponent(value)}&intent=${intent}`,
          );
      }}
    >
      <Search size={19} aria-hidden="true" strokeWidth={1.4} />
      <input
        aria-label={t("search")}
        placeholder={t("searchPlaceholder")}
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" aria-label={t("search")}>
        <span>{t("search")}</span>
        <Arrow size={18} />
      </button>
    </form>
  );
}
export function FindYourPlace() {
  const { t } = useExperience();
  return (
    <section className="find-place section-pad" id="find-your-place">
      <div className="find-heading">
        <div>
          <Eyebrow>{t("findEyebrow")}</Eyebrow>
          <h2>{t("findTitle")}</h2>
        </div>
        <p>{t("findCopy")}</p>
      </div>
      <IntentPicker />
      <SearchBox />
    </section>
  );
}
