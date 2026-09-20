import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ContentPage } from "@/features/site/components/content-page";
import { fetchPublicSitePage } from "@/features/site/api";
import { sitePages } from "@/features/site/content/pages";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return Object.keys(sitePages).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await fetchPublicSitePage(slug);
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
  };
}

export default async function SiteContentPage({ params }: Props) {
  const { slug } = await params;
  const page = await fetchPublicSitePage(slug);
  if (!page) notFound();
  return (
    <ContentPage
      content={{
        title: page.title,
        description: page.description,
        sections: page.sections,
      }}
    />
  );
}
