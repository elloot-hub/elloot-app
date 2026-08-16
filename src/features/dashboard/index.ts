/**
 * Dashboard feature — hub logado (visão geral, anúncios, vendas/entrega).
 *
 * STATUS: shell ativo — páginas em `/dashboard*` usam `DashboardShell`.
 * Chat/notificações/presença: Socket.IO em `features/realtime`.
 */

export { DashboardNav } from "./components/dashboard-nav";
export { DashboardShell } from "./components/dashboard-shell";
export { DashboardOverviewClient } from "./components/dashboard-overview-client";
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
