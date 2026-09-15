/** App routes — English paths only. Canonical market is `/market`. */
export const routes = {
  home: "/",
  /** Category directory. Browse: `/market/jogos/free-fire`. Search: `/market?q=`. */
  market: "/market",
  /** Category browse from `slugPath` (`/jogos/free-fire` or `jogos/free-fire`). */
  marketCategory: (slugPath: string) => {
    const path = slugPath.replace(/^\/+/, "").replace(/\/+$/, "");
    return path ? (`/market/${path}` as const) : ("/market" as const);
  },
  cart: "/cart",
  listing: (id: string) => `/listings/${id}` as const,
  /** Public user/seller profile by username (or id fallback). */
  profile: (usernameOrId: string) => `/profile/${usernameOrId}` as const,
  /** @deprecated Prefer `routes.profile`. */
  sellerProfile: (id: string) => `/profile/${id}` as const,
  /** @deprecated Prefer `routes.profile`. */
  seller: (id: string) => `/profile/${id}` as const,
  sell: "/sell",

  /** Logged-in hub (overview + buyer/seller tools). */
  dashboard: "/dashboard",
  dashboardNotifications: "/dashboard/notifications",
  dashboardPurchases: "/dashboard/purchases",
  dashboardFavorites: "/dashboard/favorites",
  dashboardListings: "/dashboard/listings",
  dashboardListingEdit: (id: string) => `/dashboard/listings/${id}/edit` as const,
  dashboardSales: "/dashboard/sales",
  dashboardMetrics: "/dashboard/metrics",
  dashboardMetricsTab: (
    tab: "overview" | "listings" | "costs" | "service" = "overview",
  ) => `/dashboard/metrics?tab=${tab}` as const,
  dashboardMessages: "/dashboard/messages",
  dashboardWallet: "/dashboard/wallet",
  dashboardWithdrawals: "/dashboard/withdrawals",
  dashboardSettings: "/dashboard/settings",
  dashboardVerification: "/dashboard/verification",
  dashboardQuestionsMine: "/dashboard/questions",
  dashboardQuestionsReceived: "/dashboard/questions/received",
  dashboardReviews: "/dashboard/reviews",
  dashboardReviewsMine: "/dashboard/reviews/mine",

  /** Aliases kept for deep-links / menu legado. */
  orders: "/dashboard/purchases",
  order: (id: string) => `/orders/${id}` as const,
  messages: "/dashboard/messages",
  conversation: (id: string) => `/dashboard/messages/${id}` as const,
  wallet: "/dashboard/wallet",
  account: "/dashboard/settings",

  login: "/login",
  register: "/register",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
  /** Design sandbox — not product UI. Blocked in production middleware. */
  uiLab: "/ui",

  // Footer / institutional
  blog: "/blog",
  faq: "/faq",
  help: "/help",
  howItWorks: "/how-it-works",
  advantages: "/advantages",
  fees: "/fees",
  paymentMethods: "/payment-methods",
  accountVerifier: "/dashboard/verification",
  terms: "/terms",
  rewards: "/rewards",
  privacy: "/privacy",
  refund: "/refund",
  careers: "/careers",
  contact: "/contact",
} as const;
