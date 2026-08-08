import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/features/site/components/content-page";
import {
  sitePages,
  type SitePageSlug,
} from "@/features/site/content/pages";

type Props = {
  params: Promise<{ slug: string }>;
};

function isSitePageSlug(slug: string): slug is SitePageSlug {
  return Object.prototype.hasOwnProperty.call(sitePages, slug);
}

export function generateStaticParams() {
  return Object.keys(sitePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  if (!isSitePageSlug(slug)) return {};
  const page = sitePages[slug];
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function SiteContentPage({ params }: Props) {
  const { slug } = await params;
  if (!isSitePageSlug(slug)) notFound();
  return <ContentPage content={sitePages[slug]} />;
}
