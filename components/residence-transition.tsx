"use client";
import { createContext, useContext, useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useReducedMotion,
} from "framer-motion";
import { X } from "lucide-react";
import { getPropertyById } from "@/lib/data";
import type { Property } from "@/lib/types";
import { useExperience } from "./experience-provider";
import dynamic from "next/dynamic";
const ResidenceDetail = dynamic(
  () => import("./detail").then((m) => m.ResidenceDetail),
  { ssr: false },
);
import { MOTION } from "@/motion/tokens";
type TransitionContextValue = {
  openResidence: (
    event: React.MouseEvent<HTMLAnchorElement>,
    p: Property,
  ) => void;
  overlay: boolean;
};
const TransitionContext = createContext<TransitionContextValue>({
  openResidence: () => {},
  overlay: false,
});
export const useResidenceTransition = () => useContext(TransitionContext);
export function ResidenceTransitions({
  children,
}: {
  children: React.ReactNode;
}) {
  const { locale } = useExperience();
  const pathname = usePathname();
  const [armed, setArmed] = useState(false);
  const origin = useRef<HTMLAnchorElement | null>(null);
  const sourcePath = useRef("");
  const sourceId = useRef("");
  const root = useRef<HTMLDivElement>(null);
  const match = pathname.match(/^\/(en|ar)\/collection\/([^/]+)$/);
  const property = armed && match ? getPropertyById(match[2]) : undefined;
  useEffect(() => {
    if (armed && !match && pathname !== sourcePath.current.split("?")[0])
      setArmed(false);
  }, [pathname, armed]);
  async function openResidence(
    e: React.MouseEvent<HTMLAnchorElement>,
    p: Property,
  ) {
    if (
      e.button ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      p.is_private ||
      property
    )
      return;
    e.preventDefault();
    origin.current = e.currentTarget;
    sourceId.current = p.id;
    sourcePath.current = window.location.pathname + window.location.search;
    await import("./detail");
    setArmed(true);
    window.history.pushState(
      { veloraOverlay: true },
      "",
      `/${locale}/collection/${p.slug}`,
    );
  }
  return (
    <TransitionContext.Provider value={{ openResidence, overlay: !!property }}>
      <LayoutGroup id="residence-transitions">
        <div ref={root}>{children}</div>
        <AnimatePresence
          onExitComplete={() => {
            if (root.current) root.current.inert = false;
            document
              .querySelectorAll<HTMLDialogElement>("dialog.residence-dialog")
              .forEach((d) => d.close());
            const target = document.querySelector<HTMLAnchorElement>(
              `[data-residence="${sourceId.current}"]`,
            );
            requestAnimationFrame(() => {
              target?.focus({ preventScroll: true });
            });
          }}
        >
          {property && (
            <ResidenceDialog
              key={property.id}
              property={property}
              backgroundRef={root}
              close={() => window.history.back()}
            />
          )}
        </AnimatePresence>
      </LayoutGroup>
    </TransitionContext.Provider>
  );
}
function ResidenceDialog({
  property,
  close,
  backgroundRef,
}: {
  property: Property;
  close: () => void;
  backgroundRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { t, locale } = useExperience();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    closeRef.current?.focus();
    document.body.style.overflow = "hidden";
    const root = backgroundRef.current;
    if (root) root.inert = true;
    return () => {
      dialog?.close();
      document.body.style.overflow = "";
      if (root) root.inert = false;
    };
  }, [backgroundRef]);
  return (
    <motion.dialog
      ref={ref}
      className="residence-dialog"
      aria-label={property.name[locale]}
      onCancel={(e) => {
        e.preventDefault();
        close();
      }}
      initial={{ opacity: reduced ? 0 : 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: MOTION.page, ease: MOTION.ease }}
    >
      <button
        className="dialog-close"
        ref={closeRef}
        onClick={close}
        aria-label={t("close")}
      >
        <X size={20} />
        <span>{t("backCollection")}</span>
      </button>
      <div className="dialog-languages">
        <a lang="en" href={`/en/collection/${property.slug}`}>
          EN
        </a>
        <span>|</span>
        <a lang="ar" href={`/ar/collection/${property.slug}`}>
          AR
        </a>
      </div>
      <ResidenceDetail property={property} overlay />
    </motion.dialog>
  );
}
