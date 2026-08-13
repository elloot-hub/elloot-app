export type CartItemSeller = {
  name: string;
  verified?: boolean;
};

export type CartItem = {
  /** Stable key: listingId or listingId:offerId */
  id: string;
  listingId: string;
  offerId?: string;
  title: string;
  /** Unit price in cents (source of truth for display). */
  priceCents: number;
  image: string;
  category?: string;
  sellerId: string;
  seller?: CartItemSeller;
  quantity: number;
  stock?: number;
};

export type CartAddInput = Omit<CartItem, "quantity" | "id"> & {
  quantity?: number;
};

export type CartContextType = {
  items: CartItem[];
  isOpen: boolean;
  /** True after localStorage hydration (avoids badge flash). */
  ready: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  addItem: (item: CartAddInput) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  /** Subtotal in cents. */
  subtotalCents: number;
};

export function cartLineId(listingId: string, offerId?: string | null) {
  return offerId ? `${listingId}:${offerId}` : listingId;
}

export function isCartItem(value: unknown): value is CartItem {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.id === "string" &&
    typeof v.listingId === "string" &&
    typeof v.title === "string" &&
    typeof v.priceCents === "number" &&
    typeof v.image === "string" &&
    typeof v.sellerId === "string" &&
    typeof v.quantity === "number"
  );
}
