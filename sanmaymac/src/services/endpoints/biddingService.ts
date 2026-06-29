import api from '../api';
import { ApiResponse } from '../../types';

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
};