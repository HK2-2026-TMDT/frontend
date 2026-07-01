import api from '../api';
import { ApiResponse } from '../../types';
import { PageResponse } from './catalogService';

export interface ReviewSummary {
  averageRating: number;
  totalReviews: number;
}

export interface Review {
  id: number;
  orderId: number;
  productId?: number | null;
  workshopId?: number | null;
  userId?: number;
  rating: number;
  comment?: string;
  status?: string;
  imageUrls?: string[];
  replyContent?: string;
  replyAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UnreviewedOrder {
  orderId: number;
  workshopId?: number;
  totalAmount?: number;
}

export interface CreateReviewPayload {
  orderId: number;
  productId?: number;
  rating: number;
  comment?: string;
  imageUrls?: string[];
}

export interface UpdateReviewPayload {
  rating: number;
  comment?: string;
  imageUrls?: string[];
}

export const reviewService = {
  create: (payload: CreateReviewPayload) =>
    api.post<ApiResponse<Review>>('/reviews', payload),

  update: (id: number, payload: UpdateReviewPayload) =>
    api.put<ApiResponse<Review>>(`/reviews/${id}`, payload),

  delete: (id: number) => api.delete<ApiResponse<Review>>(`/reviews/${id}`),

  getMyReviews: (params?: { page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<Review>>>('/reviews/me', { params }),

  getUnreviewedOrders: () =>
    api.get<ApiResponse<UnreviewedOrder[]>>('/reviews/me/unreviewed-orders'),

  getWorkshopSummary: (workshopId: number) =>
    api.get<ApiResponse<ReviewSummary>>(`/reviews/public/workshops/${workshopId}/summary`),

  getProductSummary: (productId: number) =>
    api.get<ApiResponse<ReviewSummary>>(`/reviews/public/products/${productId}/summary`),

  getWorkshopReviews: (
    workshopId: number,
    params?: { page?: number; size?: number; sort?: string },
  ) =>
    api.get<ApiResponse<PageResponse<Review>>>(`/reviews/public/workshops/${workshopId}`, {
      params,
    }),

  getProductReviews: (
    productId: number,
    params?: { page?: number; size?: number; sort?: string },
  ) =>
    api.get<ApiResponse<PageResponse<Review>>>(`/reviews/public/products/${productId}`, {
      params,
    }),

  /** WORKSHOP portal — own reviews */
  getOwnedWorkshopReviews: (params?: {
    rating?: number;
    hasImages?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }) => api.get<ApiResponse<PageResponse<Review>>>('/reviews/workshop', { params }),

  replyToReview: (reviewId: number, content: string) =>
    api.post<ApiResponse<Review>>(`/reviews/${reviewId}/reply`, { content }),

  reportReview: (reviewId: number, reason: string) =>
    api.post<ApiResponse<{ id: number; reviewId: number; reason: string; status: string }>>(
      `/reviews/${reviewId}/report`,
      { reason },
    ),
};
