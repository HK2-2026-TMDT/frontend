import api from '../api';
import { ApiResponse } from '../../types';

export interface AdminCoupon {
  id: number;
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  usedCount: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface AdminCouponPayload {
  code: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  maxDiscountAmount?: number;
  minOrderAmount?: number;
  usageLimit?: number;
  startsAt?: string;
  expiresAt?: string;
  isActive: boolean;
}

export const adminCouponService = {
  listCoupons: () => api.get<ApiResponse<AdminCoupon[]>>('/admin/coupons'),
  getCoupon: (couponId: number) => api.get<ApiResponse<AdminCoupon>>(`/admin/coupons/${couponId}`),
  createCoupon: (payload: AdminCouponPayload) => api.post<ApiResponse<AdminCoupon>>('/admin/coupons', payload),
  updateCoupon: (couponId: number, payload: AdminCouponPayload) =>
    api.put<ApiResponse<AdminCoupon>>(`/admin/coupons/${couponId}`, payload),
  deleteCoupon: (couponId: number) => api.delete<ApiResponse<null>>(`/admin/coupons/${couponId}`),
};
