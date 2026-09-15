import type { Category } from "@/types/api";
import { routes } from "@/lib/routes";

/** Normalize to `/jogos/free-fire` form. */
export function normalizeSlugPath(input: string): string {
  const trimmed = input.trim().replace(/\/+/g, "/").replace(/\/+$/, "");
  if (!trimmed || trimmed === "/") return "/";
  return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
}

/** Build href from a category (prefers slugPath). */
export function marketCategoryHref(
  category: Pick<Category, "slug"> & { slugPath?: string | null },
) {
  if (category.slugPath) return routes.marketCategory(category.slugPath);
  return routes.marketCategory(category.slug);
}

export type CategoryTreeMatch = {
  category: Category;
  ancestors: Category[];
  /** Direct children of the matched category (subcategories). */
  children: Category[];
  /** Siblings under the same parent (for leaf pages). */
  siblings: Category[];
};

/** Walk a category tree and resolve a node by slugPath or trailing slug. */
export function findCategoryInTree(
  roots: Category[],
  pathOrSlug: string,
): CategoryTreeMatch | null {
  const target = normalizeSlugPath(pathOrSlug);
  const targetSlug = target.split("/").filter(Boolean).at(-1) ?? pathOrSlug;

  let exact: CategoryTreeMatch | null = null;
  let bySlug: CategoryTreeMatch | null = null;

  function walk(
    nodes: Category[],
    ancestors: Category[],
    siblings: Category[],
  ) {
    for (const node of nodes) {
      const nodePath = normalizeSlugPath(node.slugPath || node.slug);
      const kids = node.children ?? [];
      const hit: CategoryTreeMatch = {
        category: node,
        ancestors,
        children: kids,
        siblings,
      };

      if (nodePath === target) {
        exact = hit;
        return true;
      }
      if (!bySlug && (node.slug === pathOrSlug || node.slug === targetSlug)) {
        bySlug = hit;
      }
      if (walk(kids, [...ancestors, node], kids)) return true;
    }
    return false;
  }

  walk(roots, [], roots);
  return exact ?? bySlug;
}

/** Group mid-level categories by their root/parent for directory sections. */
export function groupCategoriesByParent(categories: Category[]) {
  const groups = new Map<string, { title: string; items: Category[] }>();

  for (const category of categories) {
    const title = category.parent?.name?.trim() || "Categorias";
    const key = category.parent?.id ?? title;
    const existing = groups.get(key);
    if (existing) {
      existing.items.push(category);
    } else {
      groups.set(key, { title, items: [category] });
    }
  }

  return [...groups.values()].sort((a, b) => {
    if (a.title.toLowerCase().includes("jogo")) return -1;
    if (b.title.toLowerCase().includes("jogo")) return 1;
    return a.title.localeCompare(b.title, "pt-BR");
  });
}
