"use client";
import Link from "next/link";
import { ArrowUpRight, ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { reveal } from "@/motion/variants";
export function Arrow({
  diagonal = false,
  size = 17,
}: {
  diagonal?: boolean;
  size?: number;
}) {
  const Icon = diagonal ? ArrowUpRight : ArrowRight;
  return (
    <Icon
      aria-hidden="true"
      size={size}
      strokeWidth={1.3}
      className="directional"
    />
  );
}
export function TextLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Link href={href} className={`text-link ${className}`}>
      {children}
      <Arrow />
    </Link>
  );
}
export function ButtonLink({
  href,
  children,
  light = false,
  outline = false,
}: {
  href: string;
  children: React.ReactNode;
  light?: boolean;
  outline?: boolean;
}) {
  return (
    <Link
      className={`button ${light ? "button-light" : ""} ${outline ? "button-outline" : ""}`}
      href={href}
    >
      {children}
      <Arrow />
    </Link>
  );
}
export function Reveal({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={false}
      whileInView="visible"
      viewport={{ once: true, amount: 0.12 }}
      variants={reveal}
    >
      {children}
    </motion.div>
  );
}
export function Monogram({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 64 64"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="m8 12 24 43 24-43M20 12l12 22 12-22"
        stroke="currentColor"
        strokeWidth="1.4"
      />
    </svg>
  );
}
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="eyebrow">
      <span />
      {children}
    </p>
  );
}
