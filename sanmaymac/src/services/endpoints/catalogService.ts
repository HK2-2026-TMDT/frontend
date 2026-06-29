import api from '../api';
import { ApiResponse } from '../../types';
import { cacheKeys, cacheService, cacheTtl } from '../cache';
import { useAuthStore } from '../../store/useAuthStore';

export interface Category {
  id: number;
  name: string;
  description?: string;
}

export interface ProductImage {
  id: number;
  imageUrl: string;
  isThumbnail: boolean;
}

export interface ProductVariant {
  id: number;
  skuCode: string;
  color?: string;
  size?: string;
  price: number;
  stockQuantity: number;
}

export interface Product {
  id: number;
  name: string;
  description?: string;
  basePrice: number;
  categoryId: number;
  categoryName?: string;
  workshopId: number;
  workshopName?: string;
  variants?: ProductVariant[];
  images?: ProductImage[];
  averageRating?: number;
  reviewCount?: number;
  isFavorite?: boolean;
  isVisible?: boolean;
  approvalStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  adminNote?: string;
  createdAt: string;
}

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}

export interface ProductPayloadVariant {
  skuCode?: string;
  color?: string;
  size?: string;
  price?: number;
  stockQuantity: number;
}

export interface ProductPayloadImage {
  imageUrl: string;
  isThumbnail?: boolean;
}

export interface ProductPayload {
  name: string;
  categoryId: number;
  basePrice?: number;
  description?: string;
  variants?: ProductPayloadVariant[];
  images?: ProductPayloadImage[];
}

export const catalogService = {
  getCategories: () =>
    (() => {
      const cachedCategories = cacheService.get<Category[]>(cacheKeys.categories);
      if (cachedCategories) {
        return Promise.resolve({ data: { success: true, data: cachedCategories } } as any);
      }

      return api.get<ApiResponse<Category[]>>('/catalog/categories').then((res) => {
        const categories = res.data.data ?? [];
        cacheService.set(cacheKeys.categories, categories, cacheTtl.categories);
        return res;
      });
    })(),

  getProducts: (params?: {
    keyword?: string;
    categoryId?: number;
    workshopId?: number;
    minPrice?: number;
    maxPrice?: number;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    api.get<ApiResponse<PageResponse<Product>>>('/catalog/products', { params }),

  getProductById: (productId: number) =>
    api.get<ApiResponse<Product>>(`/catalog/products/${productId}`),

  getMyProducts: (params?: { page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<Product>>>('/catalog/products/me', { params }),

  createProduct: (payload: ProductPayload) =>
    api.post<ApiResponse<Product>>('/catalog/products', payload),

  updateProduct: (productId: number, payload: ProductPayload) =>
    api.put<ApiResponse<Product>>(`/catalog/products/${productId}`, payload),

  deleteProduct: (productId: number) =>
    api.delete<ApiResponse<null>>(`/catalog/products/${productId}`),

  updateProductVisibility: (productId: number, isVisible: boolean) =>
    api.put<ApiResponse<Product>>(`/catalog/products/${productId}/visibility`, { isVisible }),

  getFavoriteProducts: () =>
    (() => {
      const userId = useAuthStore.getState().user?.id;
      const cacheKey = userId ? cacheKeys.favoriteProducts(userId) : null;
      const cachedFavorites = cacheKey ? cacheService.get<Product[]>(cacheKey) : null;

      if (cachedFavorites) {
        return Promise.resolve({ data: { success: true, data: cachedFavorites } } as any);
      }

      return api.get<ApiResponse<Product[]>>('/catalog/me/favorites/products').then((res) => {
        const favorites = res.data.data ?? [];
        if (cacheKey) {
          cacheService.set(cacheKey, favorites, cacheTtl.favoriteProducts);
        }
        return res;
      });
    })(),

  addFavoriteProduct: (productId: number) =>
    api.post<ApiResponse<null>>(`/catalog/products/${productId}/favorites`).then((res) => {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        cacheService.remove(cacheKeys.favoriteProducts(userId));
      }
      return res;
    }),

  removeFavoriteProduct: (productId: number) =>
    api.delete<ApiResponse<null>>(`/catalog/products/${productId}/favorites`).then((res) => {
      const userId = useAuthStore.getState().user?.id;
      if (userId) {
        cacheService.remove(cacheKeys.favoriteProducts(userId));
      }
      return res;
    }),
};
