import type { Metadata } from "next";
import {
  Manrope,
  Cormorant_Garamond,
  IBM_Plex_Sans_Arabic,
} from "next/font/google";
import { notFound } from "next/navigation";
import "@/styles/globals.css";
import { ExperienceProvider } from "@/components/experience-provider";
import { Header, Footer } from "@/components/chrome";
import type { Locale } from "@/lib/types";
const manrope = Manrope({
  subsets: ["latin"],
  preload: false,
  display: "swap",
  variable: "--font-manrope",
});
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  preload: false,
  weight: ["400"],
  style: ["normal", "italic"],
  display: "swap",
  variable: "--font-editorial",
});
const arabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  preload: false,
  weight: ["400"],
  display: "swap",
  variable: "--font-arabic",
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
      className={`${manrope.variable} ${cormorant.variable} ${arabic.variable}`}
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
