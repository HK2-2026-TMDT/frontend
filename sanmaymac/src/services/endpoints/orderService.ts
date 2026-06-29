import api from '../api';
import { ApiResponse } from '../../types';
import { PageResponse } from './catalogService';

export interface OrderSummary {
  id: number;
  orderType?: string;
  status: string;
  totalAmount: number;
  checkoutBatchId?: string;
  trackingCode?: string;
  createdAt: string;
}

export interface OrderDetailItem {
  id: number;
  variantId?: number;
  productName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderDetail {
  id: number;
  orderType?: string;
  status: string;
  totalAmount: number;
  shippingFee?: number;
  customerNote?: string;
  checkoutBatchId?: string;
  trackingCode?: string;
  ghnOrderCode?: string;
  frontDesignUrl?: string;
  backDesignUrl?: string;
  workshopId?: number;
  workshopName?: string;
  addressId?: number;
  items: OrderDetailItem[];
  createdAt: string;
}

export interface OrderTimelineItem {
  code: string;
  label: string;
  completed: boolean;
  updatedAt?: string;
  note?: string;
}

export interface OrderTimeline {
  orderId: number;
  currentStatus: string;
  items: OrderTimelineItem[];
}

export const orderService = {
  getMyOrders: (params?: { status?: string; page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<OrderSummary>>>('/orders/me', { params }),

  getMyOrderDetail: (orderId: number) =>
    api.get<ApiResponse<OrderDetail>>(`/orders/me/${orderId}`),

  getMyOrderTimeline: (orderId: number) =>
    api.get<ApiResponse<OrderTimeline>>(`/orders/me/${orderId}/timeline`),

  updateMyOrderAddress: (orderId: number, addressId: number) =>
    api.put<ApiResponse<OrderDetail>>(`/orders/me/${orderId}/address`, { addressId }),

  cancelOrder: (orderId: number) =>
    api.post<ApiResponse<OrderDetail>>(`/orders/me/${orderId}/cancel`),

  confirmDelivery: (orderId: number) =>
    api.post<ApiResponse<OrderDetail>>(`/orders/me/${orderId}/confirm-delivery`),
};
