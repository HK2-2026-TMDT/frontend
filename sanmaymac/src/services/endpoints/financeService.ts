import api from '../api';
import { ApiResponse } from '../../types';

export interface PaymentTransaction {
  id: number;
  orderId: number;
  amount: number;
  type: string;
  direction: string;
  status: string;
  description?: string;
  createdAt?: string;
}

export interface MomoCreatePaymentResponse {
  payUrl: string;
  requestId: string;
  momoOrderId: string;
  amount: number;
  message?: string;
}

export interface CheckoutBatchOrderItem {
  orderId: number;
  workshopName?: string;
  totalAmount: number;
  remainingAmount: number;
  paymentStatus?: string;
}

export interface CheckoutBatchSummary {
  checkoutBatchId: string;
  grandTotal: number;
  remainingTotal: number;
  orderCount: number;
  orders: CheckoutBatchOrderItem[];
}

export const financeService = {
  payOrderDeposit: (orderId: number, amount?: number) =>
    api.post<ApiResponse<PaymentTransaction>>(`/finance/orders/${orderId}/pay-deposit`, null, {
      params: amount ? { amount } : undefined,
    }),

  payOrderBalance: (orderId: number) =>
    api.post<ApiResponse<PaymentTransaction>>(`/finance/orders/${orderId}/pay-balance`),

  createMomoPayment: (
    orderId: number,
    payload?: { phase?: 'deposit' | 'full'; amount?: number; orderInfo?: string }
  ) => api.post<ApiResponse<MomoCreatePaymentResponse>>(`/finance/orders/${orderId}/momo/create`, payload ?? {}),

  getCheckoutBatchSummary: (checkoutBatchId: string) =>
    api.get<ApiResponse<CheckoutBatchSummary>>(`/finance/checkout-batches/${checkoutBatchId}`),

  createBatchMomoPayment: (
    checkoutBatchId: string,
    payload?: { phase?: 'deposit' | 'full'; amount?: number; orderInfo?: string }
  ) => api.post<ApiResponse<MomoCreatePaymentResponse>>(
    `/finance/checkout-batches/${checkoutBatchId}/momo/create`,
    payload ?? {},
  ),
};
