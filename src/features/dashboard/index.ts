/**
 * Dashboard feature — hub logado (visão geral, anúncios, vendas/entrega).
 *
 * STATUS: shell ativo — páginas em `/dashboard*` usam `DashboardShell`.
 * Chat/notificações/presença: Socket.IO em `features/realtime`.
 */

export { DashboardNav } from "./components/dashboard-nav";
export { DashboardShell } from "./components/dashboard-shell";
export { DashboardOverviewClient } from "./components/dashboard-overview-client";
export { DashboardActionQueue } from "./components/action-queue";
export { NavBadge } from "./components/nav-badge";
export { fetchDashboardSummary } from "./api";
export {
  DashboardSummaryProvider,
  useDashboardSummary,
  useDashboardSummaryOptional,
} from "./context/dashboard-summary-context";
export type {
  DashboardSummary,
  DashboardActionItem,
  DashboardNavCounts,
} from "./types";
export {
  DashboardRoleTabs,
} from "./components/role-tabs";
export {
  DashboardRoleBlock,
  DashboardOverviewOnboarding,
  DashboardKycBanner,
} from "./components/role-block";
export { ListingHealthCard } from "./components/listing-health-card";
export {
  resolveDashboardProfile,
  filterActionsByRole,
  type DashboardRoleFilter,
  type DashboardHomeProfile,
} from "./dashboard-profile";
export { FavoritesClient } from "./components/favorites-client";
export { MetricsClient } from "./components/metrics-client";
export { SettingsClient } from "./components/settings-client";
export { VerificationClient } from "./components/verification-client";
export {
  OverviewSkeleton,
  OrderListSkeleton,
  ListingsSkeleton,
  FavoritesSkeleton,
  MetricsSkeleton,
  MetricsTabContentSkeleton,
  SellFormSkeleton,
  DashboardListSkeleton,
  WalletSkeleton,
  ConversationsListSkeleton,
  ConversationThreadSkeleton,
  NotificationsListSkeleton,
  SettingsSkeleton,
  VerificationSkeleton,
  OrderDetailSkeleton,
} from "./components/dashboard-skeletons";
