/** App routes — English paths only. Canonical market is `/market`. */
export const routes = {
  home: "/",
  /** Browse catalog. Query: `?category=slug` (legacy `?game=` still accepted by API). */
  market: "/market",
  cart: "/cart",
  listing: (id: string) => `/listings/${id}` as const,
  sellerProfile: (id: string) => `/vendedores/${id}` as const,
  seller: (id: string) => `/vendedores/${id}` as const,
  sell: "/sell",

  /** Logged-in hub (overview + buyer/seller tools). */
  dashboard: "/dashboard",
  dashboardNotifications: "/dashboard/notifications",
  dashboardPurchases: "/dashboard/purchases",
  dashboardFavorites: "/dashboard/favorites",
  dashboardListings: "/dashboard/listings",
  dashboardSales: "/dashboard/sales",
  dashboardMetrics: "/dashboard/metrics",
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
  authCallback: "/auth/callback",
  /** Design sandbox — not product UI. */
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
