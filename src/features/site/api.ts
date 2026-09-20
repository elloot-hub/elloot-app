import { config } from "@/lib/config";
import {
  sitePages,
  type SitePageContent,
  type SitePageSlug,
} from "@/features/site/content/pages";

export type PublicFooterLink = {
  id: string;
  label: string;
  href: string;
};

export type PublicFooter = {
  tagline: string | null;
  columns: Array<{
    id: string;
    title: string;
    items: PublicFooterLink[];
  }>;
  socials: Array<{ network: string; url: string; enabled?: boolean }>;
  legalLinks: PublicFooterLink[];
  helpCta: {
    discordUrl: string;
    discordEnabled: boolean;
    contactEnabled: boolean;
    contactHref?: string;
  };
  homeLinks: PublicFooterLink[];
};

export type PublicSitePage = {
  slug: string;
  title: string;
  description: string;
  sections: SitePageContent["sections"];
};

async function platformGet<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${config.apiUrl}${path}`, {
      next: { revalidate: 30 },
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export async function fetchPublicFooter(): Promise<PublicFooter | null> {
  const data = await platformGet<{ footer: PublicFooter }>(
    "/api/platform/footer",
  );
  return data?.footer ?? null;
}

export async function fetchPublicSitePage(
  slug: string,
): Promise<PublicSitePage | null> {
  const data = await platformGet<{ page: PublicSitePage }>(
    `/api/platform/site-pages/${encodeURIComponent(slug)}`,
  );
  if (data?.page) return data.page;

  if (Object.prototype.hasOwnProperty.call(sitePages, slug)) {
    const page = sitePages[slug as SitePageSlug];
    return {
      slug,
      title: page.title,
      description: page.description,
      sections: page.sections,
    };
  }
  return null;
}

export async function fetchPublicHomeLinks(): Promise<PublicFooterLink[]> {
  const footer = await fetchPublicFooter();
  return footer?.homeLinks ?? [];
}
