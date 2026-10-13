import { notFound } from "next/navigation";
import { getPropertyById, getProperties } from "@/lib/data";
import { ResidenceDetail } from "@/components/detail";
export function generateStaticParams() {
  return getProperties().map((p) => ({ slug: p.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const p = getPropertyById(slug);
  if (!p) notFound();
  return <ResidenceDetail property={p} />;
}
