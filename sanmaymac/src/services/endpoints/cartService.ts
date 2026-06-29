import api from '../api';
import { ApiResponse } from '../../types';

export interface CartItemVariant {
  id: number;
  skuCode?: string;
  color?: string;
  size?: string;
  price: number;
  stockQuantity: number;
}

export interface CartItemProduct {
  id: number;
  name: string;
  images?: { imageUrl: string; isThumbnail: boolean }[];
  workshopId?: number;
  workshopName?: string;
}

export interface CartItem {
  id: number;
  variantId: number;
  productId: number;
  productName: string;
  color?: string;
  size?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variant?: CartItemVariant;
  product?: CartItemProduct;
}

export interface Cart {
  items: CartItem[];
  subTotal: number;
  totalAmount?: number;
}

export interface OrderDetail {
  id: number;
  orderType?: string;
  status?: string;
  totalAmount: number;
  shippingFee?: number;
  customerNote?: string;
  trackingCode?: string;
  ghnOrderCode?: string;
}

export interface CheckoutResult {
  checkoutBatchId: string;
  grandTotal: number;
  orders: OrderDetail[];
  orderCount: number;
}

export const cartService = {
  getCart: () =>
    api.get<ApiResponse<Cart>>('/orders/cart'),

  addItem: (variantId: number, quantity: number) =>
    api.post<ApiResponse<Cart>>('/orders/cart', { variantId, quantity }),

  updateItem: (itemId: number, quantity: number) =>
    api.put<ApiResponse<Cart>>(`/orders/cart/items/${itemId}`, { quantity }),

  removeItem: (itemId: number) =>
    api.delete<ApiResponse<Cart>>(`/orders/cart/items/${itemId}`),

  clearCart: () =>
    api.delete<ApiResponse<null>>('/orders/cart'),

  checkout: (addressId: number, couponCode?: string, customerNote?: string) =>
    api.post<ApiResponse<CheckoutResult>>('/orders/checkout/ready-made', {
      addressId,
      couponCode: couponCode || undefined,
      customerNote: customerNote || undefined,
    }),
};
