import { getArticle, getJournal } from "@/lib/data";
import { notFound } from "next/navigation";
import { JournalArticle } from "@/components/content-pages";
export function generateStaticParams() {
  return getJournal().map((a) => ({ slug: a.slug }));
}
export default async function Page({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const article = getArticle(slug);
  if (!article) notFound();
  return <JournalArticle article={article} />;
}
