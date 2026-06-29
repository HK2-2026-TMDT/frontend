import api from '../api';
import { ApiResponse } from '../../types';
import { PageResponse } from './catalogService';

export interface UploadDesignResponse {
  frontDesignUrl: string;
  backDesignUrl: string;
}

export interface SavedDesignResponse {
  id: number;
  name: string;
  frontDesignUrl: string;
  backDesignUrl: string;
  createdAt: string;
}

export interface CreateBiddingPostPayload {
  title: string;
  description: string;
  aiImageUrl?: string;
  frontDesignUrl: string;
  backDesignUrl: string;
  attachments?: Array<{
    fileUrl: string;
    fileType: string;
  }>;
}

export interface CreateBiddingPostResponse {
  id: number;
  title: string;
  description?: string;
  frontDesignUrl?: string;
  backDesignUrl?: string;
}

export interface BiddingPostSummary {
  id: number;
  title: string;
  status?: string;
  quoteCount?: number;
  createdAt?: string;
}

export interface BiddingPostDetail {
  id: number;
  title: string;
  description?: string;
  aiImageUrl?: string;
  frontDesignUrl?: string;
  backDesignUrl?: string;
  status?: string;
  customerId?: number;
  customerName?: string;
  quoteCount?: number;
  createdAt?: string;
}

export interface BiddingQuote {
  id: number;
  postId?: number;
  workshopId?: number;
  workshopName?: string;
  workshopAvatar?: string;
  offeredPrice: number;
  estimateDays: number;
  status?: string;
  createdAt?: string;
}

export interface AcceptQuoteResponse {
  id: number;
  orderCode?: string;
  status?: string;
  totalAmount?: number;
}

const toFormData = (frontDesign: File, backDesign: File) => {
  const formData = new FormData();
  formData.append('frontDesign', frontDesign);
  formData.append('backDesign', backDesign);
  return formData;
};

const resolveDesignAssetUrl = (url: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;

  const apiBase = (api.defaults.baseURL || 'http://localhost:8080/api').replace(/\/+$/, '');
  const backendOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendOrigin}${normalizedPath}`;
};

export const biddingService = {
  uploadDesigns: (frontDesign: File, backDesign: File) =>
    api.post<ApiResponse<UploadDesignResponse>>('/bidding/designs/upload', toFormData(frontDesign, backDesign), {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  saveDesign: (frontDesign: File, backDesign: File, name?: string) => {
    const formData = toFormData(frontDesign, backDesign);
    if (name && name.trim()) {
      formData.append('name', name.trim());
    }
    return api.post<ApiResponse<SavedDesignResponse>>('/bidding/designs', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  listMyDesigns: () => api.get<ApiResponse<SavedDesignResponse[]>>('/bidding/designs/me'),

  resolveDesignAssetUrl,

  createPost: (payload: CreateBiddingPostPayload) =>
    api.post<ApiResponse<CreateBiddingPostResponse>>('/bidding/posts', payload),

  listMyPosts: (params?: { page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<BiddingPostSummary>>>('/bidding/posts/me', { params }),

  getPostById: (postId: number) =>
    api.get<ApiResponse<BiddingPostDetail>>(`/bidding/posts/${postId}`),

  listPostQuotes: (postId: number, params?: { page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<BiddingQuote>>>(`/bidding/posts/${postId}/quotes`, { params }),

  acceptQuote: (postId: number, quoteId: number, addressId: number) =>
    api.post<ApiResponse<AcceptQuoteResponse>>(`/bidding/posts/${postId}/quotes/${quoteId}/accept`, {
      addressId,
    }),
};