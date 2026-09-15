import type {
  DashboardActionItem,
  DashboardNavCounts,
  DashboardSummaryStats,
} from "@/features/dashboard/types";

export type DashboardRoleFilter = "all" | "buyer" | "seller";

export type DashboardHomeProfile =
  | "new"
  | "buyer-only"
  | "seller-only"
  | "hybrid";

export function resolveDashboardProfile(
  stats: DashboardSummaryStats,
  actions: DashboardActionItem[],
): DashboardHomeProfile {
  const hasSeller = hasSellerSurface(stats);

  const hasBuyer =
    stats.purchasesOpen > 0 ||
    stats.purchasesCompleted > 0 ||
    actions.some((action) => action.role === "buyer");

  const isNew =
    !hasSeller &&
    !hasBuyer &&
    actions.length === 0 &&
    stats.conversations === 0;

  if (isNew) return "new";
  if (hasSeller && !hasBuyer) return "seller-only";
  if (hasBuyer && !hasSeller) return "buyer-only";
  return "hybrid";
}

/** User has listings or sales activity — show seller tools. */
export function hasSellerSurface(stats: DashboardSummaryStats): boolean {
  return (
    stats.listingsTotal > 0 ||
    stats.salesCompleted > 0 ||
    stats.salesPending > 0 ||
    stats.listingsPendingReview > 0 ||
    stats.listingsRejected > 0
  );
}

/** Wallet / withdrawals — sellers, or anyone with balance (e.g. refund). */
export function hasFinanceSurface(stats: DashboardSummaryStats): boolean {
  return (
    hasSellerSurface(stats) ||
    stats.balanceCents > 0 ||
    stats.pendingPayoutCents > 0 ||
    stats.pendingReleaseCents > 0
  );
}

export function filterActionsByRole(
  actions: DashboardActionItem[],
  filter: DashboardRoleFilter,
): DashboardActionItem[] {
  if (filter === "all") return actions;
  return actions.filter((action) => action.role === filter);
}

export function shouldShowKycBanner(stats: DashboardSummaryStats): boolean {
  if (stats.kycStatus === "APPROVED") return false;
  return (
    stats.listingsTotal > 0 ||
    stats.salesCompleted > 0 ||
    stats.pendingReleaseCents > 0 ||
    stats.balanceCents > 0
  );
}

export function roleFilterOptions(profile: DashboardHomeProfile): DashboardRoleFilter[] {
  if (profile === "buyer-only") return ["buyer"];
  if (profile === "seller-only") return ["seller"];
  return ["all", "buyer", "seller"];
}

export function defaultRoleFilter(profile: DashboardHomeProfile): DashboardRoleFilter {
  if (profile === "buyer-only") return "buyer";
  if (profile === "seller-only") return "seller";
  return "all";
}

export function buyerHighlightItems(
  actions: DashboardActionItem[],
  stats: DashboardSummaryStats,
): string[] {
  const items = actions
    .filter((a) => a.role === "buyer")
    .slice(0, 2)
    .map((a) => a.title.replace(/^(Pagar PIX|Confirmar recebimento|Disputa aberta) — /, ""));

  if (items.length > 0) return items;

  if (stats.purchasesOpen > 0) {
    return [`${stats.purchasesOpen} compra(s) em andamento`];
  }
  if (stats.purchasesCompleted > 0) {
    return [`${stats.purchasesCompleted} compra(s) concluída(s)`];
  }
  return ["Explore o marketplace e faça sua primeira compra"];
}

export function sellerHighlightItems(
  actions: DashboardActionItem[],
  stats: DashboardSummaryStats,
  counts: DashboardNavCounts,
): string[] {
  const items = actions
    .filter((a) => a.role === "seller")
    .slice(0, 2)
    .map((a) =>
      a.title.replace(
        /^(Entregar pedido|Responder pergunta|Corrigir anúncio|Disputa aberta) — /,
        "",
      ),
    );

  if (items.length > 0) return items;

  if (stats.salesPending > 0) {
    return [`${stats.salesPending} entrega(s) pendente(s)`];
  }
  if (stats.activeListings > 0) {
    return [`${stats.activeListings} anúncio(s) ativo(s)`];
  }
  if (counts.questionsReceived > 0) {
    return [`${counts.questionsReceived} pergunta(s) sem resposta`];
  }
  return ["Publique seu primeiro anúncio para começar a vender"];
}
