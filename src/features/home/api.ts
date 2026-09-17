import { api } from "@/lib/api/client";
import type { ListingSummary } from "@/types/api";

export type HomeSectionSource =
  | "PLACEMENT"
  | "CATEGORY"
  | "METRIC"
  | "MANUAL";

export type HomeSectionLayout = "GRID" | "CAROUSEL";

export type HomeSectionPayload = {
  id: string;
  title: string;
  subtitle: string | null;
  source: HomeSectionSource;
  layout: HomeSectionLayout;
  columns: number;
  viewMoreHref: string | null;
  viewMoreLabel: string | null;
  category: { id: string; name: string; slugPath: string } | null;
  metric: string | null;
  listings: ListingSummary[];
};

export type HomeSectionsResponse = {
  sections: HomeSectionPayload[];
};

const empty: HomeSectionsResponse = { sections: [] };

export async function fetchHomeSections() {
  try {
    return await api.get<HomeSectionsResponse>("/api/home/sections", {
      auth: false,
      // Align with API Cache-Control (~45s); Next ISR soft-cache.
      revalidate: 45,
    });
  } catch (err) {
    console.error("[home]", err);
    return empty;
  }
}
