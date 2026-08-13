"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  cartLineId,
  isCartItem,
  type CartAddInput,
  type CartContextType,
  type CartItem,
} from "./types";

const CART_STORAGE_KEY = "elloot_cart_items_v2";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed.filter(isCartItem));
        }
      }
    } catch (e) {
      console.error("Erro ao carregar carrinho:", e);
    } finally {
      setReady(true);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error("Erro ao salvar carrinho:", e);
    }
  }, [items, ready]);

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((prev) => !prev), []);

  const addItem = useCallback((newItem: CartAddInput) => {
    const id = cartLineId(newItem.listingId, newItem.offerId);
    const qtyToAdd = newItem.quantity ?? 1;

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.id === id);
      if (existingIndex > -1) {
        const updated = [...prevItems];
        const existing = updated[existingIndex];
        const maxStock = existing.stock ?? 99;
        updated[existingIndex] = {
          ...existing,
          title: newItem.title,
          priceCents: newItem.priceCents,
          image: newItem.image,
          category: newItem.category,
          seller: newItem.seller,
          stock: newItem.stock ?? existing.stock,
          quantity: Math.min(existing.quantity + qtyToAdd, maxStock),
        };
        return updated;
      }
      return [
        ...prevItems,
        {
          ...newItem,
          id,
          quantity: Math.min(qtyToAdd, newItem.stock ?? 99),
        },
      ];
    });
    setIsOpen(true);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity <= 0) {
      setItems((prev) => prev.filter((item) => item.id !== id));
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const maxStock = item.stock ?? 99;
        return { ...item, quantity: Math.min(quantity, maxStock) };
      }),
    );
  }, []);

  const clearCart = useCallback(() => {
    setItems([]);
  }, []);

  const itemCount = useMemo(
    () => items.reduce((acc, item) => acc + item.quantity, 0),
    [items],
  );

  const subtotalCents = useMemo(
    () => items.reduce((acc, item) => acc + item.priceCents * item.quantity, 0),
    [items],
  );

  const value = useMemo<CartContextType>(
    () => ({
      items,
      isOpen,
      ready,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotalCents,
    }),
    [
      items,
      isOpen,
      ready,
      openCart,
      closeCart,
      toggleCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      itemCount,
      subtotalCents,
    ],
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart deve ser usado dentro de um CartProvider");
  }
  return context;
}
