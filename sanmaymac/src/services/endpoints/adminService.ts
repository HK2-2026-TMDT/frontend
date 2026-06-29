import api from '../api';
import { ApiResponse } from '../../types';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface AdminUser {
  id: number;
  email: string;
  fullName?: string;
  phoneNumber?: string;
  avatarUrl?: string;
  role?: 'CUSTOMER' | 'WORKSHOP' | 'ADMIN';
  status?: 'ACTIVE' | 'UNVERIFIED' | 'LOCKED' | 'DEACTIVATED' | 'BANNED';
  createdAt?: string;
}

export interface WorkshopPublic {
  id: number;
  fullName?: string;
  avatarUrl?: string;
  shopName?: string;
  logoUrl?: string;
  workshopAddress?: string;
  productionCapacity?: number;
  description?: string;
  isVerified: boolean;
  ratingAvg: number;
}

export interface PayoutItem {
  id: number;
  workshopId: number;
  amount: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  adminNote?: string;
  createdAt?: string;
  approvedAt?: string;
}

export interface CashflowSummary {
  escrowBalance: number;
  workshopAvailable: number;
  platformRevenue: number;
}

export const adminService = {
  searchUsers: (params?: {
    keyword?: string;
    role?: string;
    status?: string;
    page?: number;
    size?: number;
    sort?: string;
  }) => api.get<ApiResponse<PageResponse<AdminUser>>>('/users/admin/search', { params }),

  updateUserStatus: (userId: number, status: string) =>
    api.put<ApiResponse<null>>(`/users/admin/${userId}/status`, { status }),

  updateUserRole: (userId: number, role: string) =>
    api.put<ApiResponse<null>>(`/users/admin/${userId}/role`, { role }),

  listWorkshopsPublic: (params?: { keyword?: string; verifiedOnly?: boolean; page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<WorkshopPublic>>>('/users/workshops/public', { params }),

  getWorkshopPublicById: (workshopId: number) =>
    api.get<ApiResponse<WorkshopPublic>>(`/users/workshops/public/${workshopId}`),

  vettingWorkshop: (workshopId: number, approved: boolean, adminNote?: string) =>
    api.put<ApiResponse<null>>(`/users/admin/${workshopId}/vetting`, { approved, adminNote }),

  listAdminPayouts: (status?: string) =>
    api.get<ApiResponse<PayoutItem[]>>('/finance/admin/payouts', { params: status ? { status } : undefined }),

  approvePayout: (payoutId: number, adminNote?: string) =>
    api.post<ApiResponse<PayoutItem>>(`/finance/admin/payouts/${payoutId}/approve`, { adminNote }),

  rejectPayout: (payoutId: number, adminNote?: string) =>
    api.post<ApiResponse<PayoutItem>>(`/finance/admin/payouts/${payoutId}/reject`, { adminNote }),

  getCashflow: (params?: { from?: string; to?: string }) =>
    api.get<ApiResponse<CashflowSummary>>('/finance/admin/cashflow', { params }),
};
