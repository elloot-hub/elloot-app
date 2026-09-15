export type Role = "BUYER" | "SELLER" | "ADMIN";

export type KycStatus = "NONE" | "PENDING" | "APPROVED" | "REJECTED";

export type ListingStatus =
  | "DRAFT"
  | "PENDING_REVIEW"
  | "ACTIVE"
  | "PAUSED"
  | "SOLD"
  | "REJECTED"
  | "REMOVED";

export type ListingModel = "NORMAL" | "DYNAMIC" | "SERVICE";

export type DeliveryMode = "MANUAL" | "AUTO";

export type ListingProductType =
  | "CONTA"
  | "ITEM"
  | "SERVICO"
  | "GOLD"
  | "OUTROS";

export type ListingOffer = {
  id: string;
  title: string;
  priceCents: number;
  stockQuantity: number;
  deliveryMode?: DeliveryMode;
  sortOrder: number;
  /** Only returned to the listing owner (available auto-delivery lines). */
  autoStockLines?: string[];
  /** Only returned to the listing owner (available items with ids). */
  autoStockItems?: Array<{ id: string; content: string }>;
};

export type User = {
  id: string;
  email: string;
  name: string | null;
  username?: string | null;
  bio?: string | null;
  avatarUrl: string | null;
  role: Role;
  kycStatus: KycStatus;
  pixKey?: string | null;
  phone?: string | null;
  emailVerifiedAt?: string | null;
  phoneVerifiedAt?: string | null;
  createdAt: string;
  nameChangedAt?: string | null;
  nameChangeAvailableAt?: string | null;
  nameChangeCooldownDays?: number;
  totpEnabled?: boolean;
  totpEnabledAt?: string | null;
  accounts?: Array<{ provider: string; createdAt: string }>;
};

export type AuthResponse = {
  user: User | null;
  accessToken: string | null;
  message?: string;
};

export type AuthProviders = {
  providers: {
    email: boolean;
    google: boolean;
    discord: boolean;
  };
};

export type Category = {
  id: string;
  parentId: string | null;
  externalId: number | null;
  name: string;
  slug: string;
  slugPath: string;
  status: "active" | "inactive";
  orderInstruction: string;
  showInMenu: boolean;
  acceleratedRelease: boolean;
  interventionDeadlines: Record<string, number> | null;
  isFeatured: boolean;
  isAdult: boolean;
  imageUrl: string | null;
  iconUrl: string | null;
  icon: string | null;
  hasWebp: boolean;
  templateDescription: string | null;
  balanceReleaseDays: number;
  keywords: string | null;
  descriptionSeo: string | null;
  titleSeo: string | null;
  subtitleSeo: string | null;
  slugSeo: string | null;
  defaultOrderBy: string;
  childrenExternalIds: string | null;
  requiredUserValidation: boolean;
  isNoindex: boolean | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
  children?: Category[];
  parent?: {
    id: string;
    slug: string;
    name: string;
    slugPath?: string;
    imageUrl?: string | null;
    iconUrl?: string | null;
  } | null;
};

export type MediaAsset = {
  id: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
  width: number | null;
  height: number | null;
  purpose: "GENERAL" | "LISTING" | "AVATAR" | "CATEGORY";
  visibility: "PUBLIC" | "PRIVATE";
  originalName: string | null;
  createdAt: string;
};

export type ListingCategoryRef = {
  id: string;
  slug: string;
  name: string;
  imageUrl?: string | null;
  iconUrl?: string | null;
  slugPath?: string;
  parent?: {
    id: string;
    slug: string;
    name: string;
    imageUrl?: string | null;
    iconUrl?: string | null;
    slugPath?: string;
  } | null;
};

export type SellerPublic = {
  id: string;
  username?: string | null;
  name: string | null;
  bio?: string | null;
  avatarUrl?: string | null;
  createdAt?: string;
  lastSeenAt?: string | null;
  isOnline?: boolean;
  reputationScore?: number;
  kycStatus?: KycStatus;
  verifications?: {
    email: boolean;
    phone: boolean;
    documents: boolean;
  };
  stats?: {
    ratingCount: number;
    ratingAvg: number | null;
    positiveCount: number;
    neutralCount: number;
    negativeCount: number;
    positivePercent: number | null;
  };
};

export type ListingSummary = {
  id: string;
  code?: string;
  title: string;
  priceCents: number;
  status: ListingStatus;
  listingModel?: ListingModel;
  deliveryMode?: DeliveryMode;
  productType?: ListingProductType | null;
  createdAt: string;
  category: ListingCategoryRef;
  media: Array<{ url: string }>;
  /** Total de imagens do anúncio (pode ser > media.length no card). */
  mediaCount?: number;
  seller: SellerPublic;
};

export type ListingDetail = {
  id: string;
  code?: string;
  title: string;
  description: string;
  priceCents: number;
  stockQuantity: number;
  unitsSold?: number;
  salesCount?: number;
  productType: ListingProductType | null;
  listingModel: ListingModel;
  deliveryMode?: DeliveryMode;
  status: ListingStatus;
  createdAt: string;
  updatedAt: string;
  category: ListingCategoryRef;
  media: Array<{ id: string; url: string; sortOrder: number }>;
  offers?: ListingOffer[];
  /** Only returned to the listing owner (available auto-delivery lines). */
  autoStockLines?: string[];
  /** Only returned to the listing owner (available items with ids). */
  autoStockItems?: Array<{ id: string; content: string }>;
  seller: SellerPublic;
};

export type CatalogListingsResponse = {
  listings: ListingSummary[];
  nextCursor: string | null;
};
