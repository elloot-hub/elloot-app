/** App routes — English paths only. Canonical market is `/market`. */
export const routes = {
  home: "/",
  /** Browse catalog. Query: `?category=slug` (legacy `?game=` still accepted by API). */
  market: "/market",
  listing: (id: string) => `/listings/${id}` as const,
  sell: "/sell",
  orders: "/orders",
  order: (id: string) => `/orders/${id}` as const,
  wallet: "/wallet",
  account: "/account",
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
  accountVerifier: "/account-verifier",
  terms: "/terms",
  rewards: "/rewards",
  privacy: "/privacy",
  refund: "/refund",
  careers: "/careers",
  contact: "/contact",
} as const;
