import { Contact } from "@/components/content-pages";
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ purpose?: string; property?: string }>;
}) {
  const p = await searchParams;
  return <Contact purpose={p.purpose} propertyId={p.property} />;
}
