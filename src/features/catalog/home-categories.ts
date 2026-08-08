import type { Category } from "@/types/api";

export const HOME_POPULAR_CATEGORY_SLUGS = [
  "valorant",
  "league-of-legends",
  "fortnite",
  "brawl-stars",
  "clash-royale",
  "clash-of-clans",
  "genshin-impact",
  "counter-strike",
  "steam",
  "discord",
  "rocket-league",
  "rainbow-six-siege",
] as const;

export const HOME_GRID_DESKTOP_LIMIT = 12;
export const HOME_GRID_MOBILE_LIMIT = 6;

export function pickHomeGridCategories(all: Category[], limit = HOME_GRID_DESKTOP_LIMIT,): Category[] {
  const bySlug = new Map(all.map((c) => [c.slug, c]));
  const picked: Category[] = [];
  const used = new Set<string>();

  for (const slug of HOME_POPULAR_CATEGORY_SLUGS) {
    const category = bySlug.get(slug);
    if (!category || used.has(category.id)) continue;
    picked.push(category);
    used.add(category.id);
    if (picked.length >= limit) return picked;
  }

  const fillers = [
    ...all.filter((c) => c.isFeatured),
    ...all,
  ];
  for (const category of fillers) {
    if (used.has(category.id)) continue;
    picked.push(category);
    used.add(category.id);
    if (picked.length >= limit) break;
  }

  return picked;
};