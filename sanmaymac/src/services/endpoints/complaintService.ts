import api from '../api';
import { ApiResponse } from '../../types';
import type { PageResponse } from './adminService';

export type ComplaintStatus = 'PENDING' | 'PROCESSING' | 'RESOLVED' | 'REJECTED' | 'ESCALATED';

export type DisputeStatus =
  | 'OPEN'
  | 'AWAITING_INFO'
  | 'JUDGED'
  | 'REFUNDED'
  | 'RELEASED_TO_WORKSHOP'
  | 'CLOSED';

export interface Complaint {
  id: number;
  orderId: number;
  customerId: number;
  customerName?: string;
  workshopId: number;
  workshopName?: string;
  reason: string;
  status: ComplaintStatus;
  imageUrls: string[];
  adminNote?: string;
  disputeId?: number | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface Dispute {
  id: number;
  complaintId: number;
  orderId: number;
  customerId: number;
  customerName?: string;
  workshopId: number;
  workshopName?: string;
  reason: string;
  imageUrls: string[];
  complaintStatus: ComplaintStatus;
  status: DisputeStatus;
  adminRequestInfo?: string;
  customerSupplement?: string;
  ruling?: string;
  refundProcessed?: boolean;
  escrowReleased?: boolean;
  violationRecorded?: boolean;
  violationNote?: string;
  resolvedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateComplaintPayload {
  orderId: number;
  reason: string;
  imageUrls: string[];
}

export const complaintService = {
  create: (payload: CreateComplaintPayload) =>
    api.post<ApiResponse<Complaint>>('/complaints', payload),

  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<{ imageUrl: string }>>('/complaints/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getMyComplaints: (params?: { page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<Complaint>>>('/complaints/me', { params }),

  getMyComplaint: (complaintId: number) =>
    api.get<ApiResponse<Complaint>>(`/complaints/me/${complaintId}`),

  getByOrder: (orderId: number) =>
    api.get<ApiResponse<Complaint | null>>(`/complaints/by-order/${orderId}`),
};

export const adminComplaintService = {
  list: (params?: { status?: ComplaintStatus; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<Complaint>>>('/admin/complaints', { params }),

  get: (complaintId: number) =>
    api.get<ApiResponse<Complaint>>(`/admin/complaints/${complaintId}`),

  updateStatus: (complaintId: number, payload: { status: ComplaintStatus; adminNote?: string }) =>
    api.put<ApiResponse<Complaint>>(`/admin/complaints/${complaintId}/status`, payload),

  escalate: (complaintId: number) =>
    api.post<ApiResponse<Dispute>>(`/admin/complaints/${complaintId}/escalate`),
};

export const adminDisputeService = {
  list: (params?: { status?: DisputeStatus; page?: number; size?: number }) =>
    api.get<ApiResponse<PageResponse<Dispute>>>('/admin/disputes', { params }),

  get: (disputeId: number) =>
    api.get<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}`),

  requestInfo: (disputeId: number, message: string) =>
    api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/request-info`, { message }),

  submitRuling: (disputeId: number, ruling: string) =>
    api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/ruling`, { ruling }),

  refundCustomer: (disputeId: number) =>
    api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/refund-customer`),

  releaseWorkshop: (disputeId: number) =>
    api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/release-workshop`),

  saveViolation: (disputeId: number, description: string) =>
    api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/violation`, { description }),

  close: (disputeId: number) =>
    api.post<ApiResponse<Dispute>>(`/admin/disputes/${disputeId}/close`),
};

export const complaintStatusLabel: Record<ComplaintStatus, string> = {
  PENDING: 'Chờ xử lý',
  PROCESSING: 'Đang xử lý',
  RESOLVED: 'Đã giải quyết',
  REJECTED: 'Từ chối',
  ESCALATED: 'Chuyển tranh chấp',
};

export const disputeStatusLabel: Record<DisputeStatus, string> = {
  OPEN: 'Mở',
  AWAITING_INFO: 'Chờ bổ sung',
  JUDGED: 'Đã phán quyết',
  REFUNDED: 'Đã hoàn tiền KH',
  RELEASED_TO_WORKSHOP: 'Đã chuyển xưởng',
  CLOSED: 'Đã đóng',
};
