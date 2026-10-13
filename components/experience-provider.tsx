"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { usePathname } from "next/navigation";
import { MotionConfig } from "framer-motion";
import { CONFIG } from "@/constants/config";
import { MOTION } from "@/motion/tokens";
import { ResidenceTransitions } from "./residence-transition";
import { translate, type TranslationKey } from "@/i18n";
import type { Locale, Intent } from "@/lib/types";
type Store = {
  saved: string[];
  compared: string[];
  viewed: string[];
  intent: Intent;
  dismissed: boolean;
};
const initial: Store = {
  saved: [],
  compared: [],
  viewed: [],
  intent: "home",
  dismissed: false,
};
type Experience = Store & {
  locale: Locale;
  ready: boolean;
  t: (key: TranslationKey, vars?: Record<string, string | number>) => string;
  setIntent: (i: Intent) => void;
  toggleSave: (id: string) => void;
  toggleCompare: (id: string) => void;
  setCompared: (ids: string[]) => void;
  markViewed: (id: string) => void;
  dismiss: () => void;
  notice: string;
  announce: (s: string) => void;
};
const Context = createContext<Experience | null>(null);
export function ExperienceProvider({
  locale,
  children,
}: {
  locale: Locale;
  children: React.ReactNode;
}) {
  const [store, setStore] = useState<Store>(initial);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState("");
  const pathname = usePathname();
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(CONFIG.storageKey) || "null");
      if (raw) {
        const list = (k: string) =>
          Array.isArray(raw[k])
            ? raw[k].filter((v: unknown) => typeof v === "string")
            : [];
        setStore({
          saved: list("saved"),
          compared: list("compared").slice(0, CONFIG.compareMax),
          viewed: list("viewed").slice(0, CONFIG.historyMax),
          intent: [
            "home",
            "investment",
            "family",
            "retreat",
            "private",
          ].includes(raw.intent)
            ? raw.intent
            : "home",
          dismissed: !!raw.dismissed,
        });
      }
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (ready)
      try {
        localStorage.setItem(CONFIG.storageKey, JSON.stringify(store));
      } catch {}
  }, [store, ready]);
  useEffect(() => setNotice(""), [pathname]);
  const t = useCallback(
    (key: TranslationKey, vars?: Record<string, string | number>) =>
      translate(locale, key, vars),
    [locale],
  );
  const markViewed = useCallback(
    (id: string) =>
      setStore((s) => ({
        ...s,
        viewed: [id, ...s.viewed.filter((x) => x !== id)].slice(
          0,
          CONFIG.historyMax,
        ),
      })),
    [],
  );
  const toggleSave = (id: string) =>
    setStore((s) => ({
      ...s,
      saved: s.saved.includes(id)
        ? s.saved.filter((x) => x !== id)
        : [...s.saved, id],
    }));
  const toggleCompare = (id: string) => {
    if (
      !store.compared.includes(id) &&
      store.compared.length >= CONFIG.compareMax
    ) {
      setNotice(t("compareLimit"));
      return;
    }
    setStore((s) => ({
      ...s,
      compared: s.compared.includes(id)
        ? s.compared.filter((x) => x !== id)
        : [...s.compared, id],
    }));
  };
  return (
    <Context.Provider
      value={{
        ...store,
        locale,
        ready,
        t,
        setIntent: (intent) => setStore((s) => ({ ...s, intent })),
        toggleSave,
        toggleCompare,
        setCompared: (ids) =>
          setStore((s) => ({
            ...s,
            compared: ids.slice(0, CONFIG.compareMax),
          })),
        markViewed,
        dismiss: () => setStore((s) => ({ ...s, dismissed: true })),
        notice,
        announce: setNotice,
      }}
    >
      <MotionConfig
        reducedMotion="user"
        transition={{ duration: MOTION.page, ease: MOTION.ease }}
      >
        <ResidenceTransitions>{children}</ResidenceTransitions>
        {notice && (
          <div className="notice" role="status">
            <span>{notice}</span>
            <button onClick={() => setNotice("")} aria-label={t("close")}>
              ×
            </button>
          </div>
        )}
      </MotionConfig>
    </Context.Provider>
  );
}
export function useExperience() {
  const c = useContext(Context);
  if (!c) throw new Error("ExperienceProvider required");
  return c;
}
