import type { NextConfig } from "next";
const config: NextConfig = {
  experimental: { cpus: 1, webpackMemoryOptimizations: true },
  devIndicators: false,
  poweredByHeader: false,
  images: { formats: ["image/avif", "image/webp"] },
};
export default config;
