export type DashboardActionKind =
  | "PAY_ORDER"
  | "DELIVER_ORDER"
  | "CONFIRM_ORDER"
  | "VIEW_DISPUTE"
  | "ANSWER_QUESTION"
  | "FIX_LISTING";

export type DashboardActionUrgency = "high" | "medium" | "low";

export type DashboardActionItem = {
  id: string;
  kind: DashboardActionKind;
  role: "buyer" | "seller";
  title: string;
  meta: string;
  href: string;
  ctaLabel: string;
  urgency: DashboardActionUrgency;
  expiresAt: string | null;
  sortAt: string;
};

export type DashboardNavCounts = {
  notifications: number;
  purchases: number;
  sales: number;
  messages: number;
  questionsReceived: number;
  listingsAttention: number;
};

export type DashboardSummaryStats = {
  balanceCents: number;
  pendingReleaseCents: number;
  releasesTodayCents: number;
  releasesUpcomingCents: number;
  inDisputeCents: number;
  pendingPayoutCents: number;
  listingsTotal: number;
  activeListings: number;
  salesPending: number;
  salesCompleted: number;
  purchasesOpen: number;
  purchasesCompleted: number;
  conversations: number;
  kycStatus: string;
  listingsPendingReview: number;
  listingsRejected: number;
};

export type DashboardSummary = {
  stats: DashboardSummaryStats;
  counts: DashboardNavCounts;
  actions: DashboardActionItem[];
};

export type DashboardNavCountKey = keyof DashboardNavCounts;
