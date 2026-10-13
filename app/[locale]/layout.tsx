import type { Metadata } from "next";
import localFont from "next/font/local";
import { notFound } from "next/navigation";
import "@/styles/globals.css";
import { ExperienceProvider } from "@/components/experience-provider";
import { Header, Footer } from "@/components/chrome";
import type { Locale } from "@/lib/types";
const manrope = localFont({
  src: "../../assets/fonts/manrope-latin-variable.woff2",
  weight: "200 800",
  display: "swap",
  variable: "--font-manrope",
  fallback: ["Helvetica Neue", "Arial", "sans-serif"],
});
const instrumentSerif = localFont({
  src: [
    {
      path: "../../assets/fonts/instrument-serif-latin-400-normal.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../assets/fonts/instrument-serif-latin-400-italic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-editorial",
  fallback: ["Iowan Old Style", "Georgia", "serif"],
});
const arabic = localFont({
  src: [
    {
      path: "../../assets/fonts/ibm-plex-sans-arabic-400.woff2",
      weight: "400",
    },
    {
      path: "../../assets/fonts/ibm-plex-sans-arabic-500.woff2",
      weight: "500",
    },
    {
      path: "../../assets/fonts/ibm-plex-sans-arabic-600.woff2",
      weight: "600",
    },
  ],
  display: "swap",
  preload: false,
  variable: "--font-arabic",
  fallback: ["Noto Sans Arabic", "Tahoma", "sans-serif"],
});
const baseMetadata: Metadata = {
  title: {
    default: "VELORA ESTATES — Where Architecture Meets Living.",
    template: "%s | VELORA ESTATES",
  },
  description:
    "A fictional, considered collection of exceptional residences in Dubai and Abu Dhabi.",
  icons: { icon: "/icon.svg" },
};
export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return locale === "ar"
    ? {
        ...baseMetadata,
        title: {
          default: "فيلورا العقارية — حيث تلتقي العمارة بالحياة.",
          template: "%s | فيلورا العقارية",
        },
        description:
          "مجموعة افتراضية مدروسة من مساكن استثنائية في دبي وأبو ظبي.",
      }
    : baseMetadata;
}
export function generateStaticParams() {
  return [{ locale: "en" }, { locale: "ar" }];
}
export default async function RootLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (locale !== "en" && locale !== "ar") notFound();
  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${manrope.variable} ${instrumentSerif.variable} ${arabic.variable}`}
    >
      <body>
        <ExperienceProvider locale={locale as Locale}>
          <Header />
          <main id="main-content">{children}</main>
          <Footer />
        </ExperienceProvider>
      </body>
    </html>
  );
}
