import api from '../api';
import { ApiResponse } from '../../types';
import type { PageResponse } from './adminService';

export type ProductApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface AdminProductReview {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  thumbnailUrl?: string;
  categoryId?: number;
  categoryName?: string;
  workshopId?: number;
  workshopName?: string;
  approvalStatus: ProductApprovalStatus;
  isVisible?: boolean;
  adminNote?: string;
  createdAt?: string;
}

export const adminProductService = {
  listProducts: (params?: { status?: ProductApprovalStatus; page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<AdminProductReview>>>('/admin/products', { params }),

  getProduct: (productId: number) =>
    api.get<ApiResponse<AdminProductReview>>(`/admin/products/${productId}`),

  reviewProduct: (productId: number, approved: boolean, adminNote?: string) =>
    api.put<ApiResponse<AdminProductReview>>(`/admin/products/${productId}/approval`, { approved, adminNote }),
};
