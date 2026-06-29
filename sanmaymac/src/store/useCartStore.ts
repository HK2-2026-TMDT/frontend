import { create } from 'zustand';
import { cartService, Cart, CartItem } from '../services/endpoints/cartService';

interface CartStore {
  cart: Cart | null;
  loading: boolean;
  // Tổng số item (dùng cho badge header)
  totalItems: number;

  fetchCart: () => Promise<void>;
  addItem: (variantId: number, quantity: number) => Promise<void>;
  updateItem: (itemId: number, quantity: number) => Promise<void>;
  removeItem: (itemId: number) => Promise<void>;
  clearCart: () => Promise<void>;
  reset: () => void;
}

const calcTotalItems = (cart: Cart | null) =>
  cart?.items?.reduce((sum, i) => sum + i.quantity, 0) ?? 0;

export const useCartStore = create<CartStore>((set, get) => ({
  cart: null,
  loading: false,
  totalItems: 0,

  fetchCart: async () => {
    set({ loading: true });
    try {
      const res = await cartService.getCart();
      const cart = res.data.data;
      set({ cart, totalItems: calcTotalItems(cart) });
    } catch {
      // 401 = chưa đăng nhập, bỏ qua
    } finally {
      set({ loading: false });
    }
  },

  addItem: async (variantId, quantity) => {
    set({ loading: true });
    try {
      const res = await cartService.addItem(variantId, quantity);
      const cart = res.data.data;
      set({ cart, totalItems: calcTotalItems(cart) });
    } finally {
      set({ loading: false });
    }
  },

  updateItem: async (itemId, quantity) => {
    // Optimistic update
    const prev = get().cart;
    if (prev) {
      const optimistic: Cart = {
        ...prev,
        items: prev.items.map((i) =>
          i.id === itemId ? { ...i, quantity } : i
        ),
        totalAmount: 0, // sẽ được cập nhật từ server
      };
      set({ cart: optimistic, totalItems: calcTotalItems(optimistic) });
    }
    try {
      const res = await cartService.updateItem(itemId, quantity);
      const cart = res.data.data;
      set({ cart, totalItems: calcTotalItems(cart) });
    } catch {
      // Rollback
      set({ cart: prev, totalItems: calcTotalItems(prev) });
    }
  },

  removeItem: async (itemId) => {
    const prev = get().cart;
    // Optimistic remove
    if (prev) {
      const optimistic: Cart = {
        ...prev,
        items: prev.items.filter((i) => i.id !== itemId),
        totalAmount: 0,
      };
      set({ cart: optimistic, totalItems: calcTotalItems(optimistic) });
    }
    try {
      const res = await cartService.removeItem(itemId);
      const cart = res.data.data;
      set({ cart, totalItems: calcTotalItems(cart) });
    } catch {
      set({ cart: prev, totalItems: calcTotalItems(prev) });
    }
  },

  clearCart: async () => {
    await cartService.clearCart();
    set({ cart: null, totalItems: 0 });
  },

  reset: () => set({ cart: null, totalItems: 0, loading: false }),
}));
