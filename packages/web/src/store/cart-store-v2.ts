/**
 * Cart Store with Shopify Sync
 *
 * Extended cart store that syncs with Shopify Cart API
 * Falls back to local storage when Shopify is not configured
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { cartApi } from "@/lib/shopify/cart-api";
import { isShopifyConfigured } from "@/lib/shopify";

// Cart item type
export interface CartItem {
  merchandiseId: string;
  title: string;
  handle: string;
  price: number;
  quantity: number;
  image?: string;
  variant?: {
    id: string;
    title: string;
    available: boolean;
  };
}

interface ShopifyCartState {
  cartId: string | null;
  isSyncing: boolean;
  syncError: string | null;
}

interface ExtendedCartState extends ShopifyCartState {
  items: CartItem[];
  isOpen: boolean;
  // Basic cart operations
  addItem: (item: CartItem) => void;
  removeItem: (merchandiseId: string) => void;
  updateQuantity: (merchandiseId: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  // Cart operations with Shopify sync
  addItemWithSync: (item: Omit<CartItem, "title" | "handle"> & { title?: string; handle?: string }) => Promise<void>;
  updateQuantityWithSync: (merchandiseId: string, quantity: number) => Promise<void>;
  removeItemWithSync: (merchandiseId: string) => Promise<void>;
  clearCartWithSync: () => Promise<void>;
  syncWithShopify: () => Promise<void>;
  getCheckoutUrl: () => Promise<string | null>;
}

const EMPTY_CART: CartItem[] = [];

export const useCartStore = create<ExtendedCartState>()(
  persist(
    (set, get) => ({
      // Initial state
      items: EMPTY_CART,
      cartId: null,
      isSyncing: false,
      syncError: null,

      // Original methods (local only)
      addItem: (item) => {
        const items = get().items;
        const existingIndex = items.findIndex((i) => i.merchandiseId === item.merchandiseId);

        set({
          items: existingIndex >= 0
            ? items.map((i, index) =>
                index === existingIndex
                  ? { ...i, quantity: i.quantity + item.quantity }
                  : i
              )
            : [...items, item],
          isOpen: true,
        });
      },

      removeItem: (merchandiseId) => {
        set({ items: get().items.filter((i) => i.merchandiseId !== merchandiseId) });
      },

      updateQuantity: (merchandiseId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(merchandiseId);
          return;
        }

        set({
          items: get().items.map((i) =>
            i.merchandiseId === merchandiseId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      toggleCart: () => set({ isOpen: !get().isOpen }),
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),

      getTotalItems: () => get().items.reduce((sum, item) => sum + item.quantity, 0),

      // New: Shopify sync methods
      addItemWithSync: async (item) => {
        set({ isSyncing: true, syncError: null });

        // First add to local cart (optimistic update)
        get().addItem(item as CartItem);

        // If Shopify is configured, sync with Shopify
        if (isShopifyConfigured()) {
          try {
            const { cartId } = get();

            if (cartId) {
              // Add to existing cart
              await cartApi.addLines(cartId, [
                { merchandiseId: item.merchandiseId, quantity: item.quantity },
              ]);
            } else {
              // Create new cart
              const newCart = await cartApi.create({
                lines: [{ merchandiseId: item.merchandiseId, quantity: item.quantity }],
              });
              if (newCart) {
                set({ cartId: newCart.id });
              }
            }
          } catch (error) {
            console.error("Failed to sync with Shopify:", error);
            set({
              syncError: error instanceof Error ? error.message : "Sync failed",
            });
            // Note: We keep the local item even if sync fails
          }
        }

        set({ isSyncing: false });
      },

      updateQuantityWithSync: async (merchandiseId, quantity) => {
        set({ isSyncing: true, syncError: null });

        // First update locally (optimistic update)
        get().updateQuantity(merchandiseId, quantity);

        // If Shopify is configured, sync with Shopify
        if (isShopifyConfigured() && get().cartId) {
          try {
            // Find the line ID for this merchandise
            const cart = await cartApi.updateLines(get().cartId!, [
              { id: merchandiseId, quantity },
            ]);
            // Cart is updated, could sync prices if needed
          } catch (error) {
            console.error("Failed to sync with Shopify:", error);
            set({
              syncError: error instanceof Error ? error.message : "Sync failed",
            });
          }
        }

        set({ isSyncing: false });
      },

      removeItemWithSync: async (merchandiseId) => {
        set({ isSyncing: true, syncError: null });

        // First remove locally (optimistic update)
        get().removeItem(merchandiseId);

        // If Shopify is configured, sync with Shopify
        if (isShopifyConfigured() && get().cartId) {
          try {
            await cartApi.removeLines(get().cartId!, [merchandiseId]);
          } catch (error) {
            console.error("Failed to sync with Shopify:", error);
            set({
              syncError: error instanceof Error ? error.message : "Sync failed",
            });
          }
        }

        set({ isSyncing: false });
      },

      clearCartWithSync: async () => {
        set({ isSyncing: true, syncError: null });

        // Clear locally
        get().clearCart();

        // Clear Shopify cart by creating a new one
        if (isShopifyConfigured()) {
          try {
            const newCart = await cartApi.create({ lines: [] });
            set({ cartId: newCart?.id || null });
          } catch (error) {
            console.error("Failed to clear Shopify cart:", error);
            set({
              syncError: error instanceof Error ? error.message : "Sync failed",
            });
          }
        }

        set({ isSyncing: false });
      },

      syncWithShopify: async () => {
        if (!isShopifyConfigured()) {
          return;
        }

        set({ isSyncing: true, syncError: null });

        try {
          const { cartId, items } = get();

          if (!cartId && items.length > 0) {
            // Create new cart from local items
            const newCart = await cartApi.create({
              lines: items.map((item) => ({
                merchandiseId: item.merchandiseId,
                quantity: item.quantity,
              })),
            });
            set({ cartId: newCart?.id || null });
          }
        } catch (error) {
          console.error("Failed to sync with Shopify:", error);
          set({
            syncError: error instanceof Error ? error.message : "Sync failed",
          });
        }

        set({ isSyncing: false });
      },

      getCheckoutUrl: async () => {
        const { cartId } = get();
        if (!cartId || !isShopifyConfigured()) {
          return null;
        }

        try {
          const cart = await cartApi.getCart(cartId);
          return cart?.checkoutUrl || null;
        } catch (error) {
          console.error("Failed to get checkout URL:", error);
          return null;
        }
      },

      isOpen: false,
    }),
    {
      name: "cart-storage",
      partialize: (state) => ({
        items: state.items,
        cartId: state.cartId,
      }),
    }
  )
);
