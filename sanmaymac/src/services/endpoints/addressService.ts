import api from '../api';
import { ApiResponse } from '../../types';

export interface UserAddress {
  id: number;
  receiverName: string;
  phone: string;
  detailedAddress: string;
  provinceId?: number;
  districtId?: number;
  wardCode?: string;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
  fullAddress?: string;
  isDefault: boolean;
}

export interface AddressPayload {
  receiverName: string;
  phone: string;
  detailedAddress: string;
  provinceId: number;
  districtId: number;
  wardCode: string;
  provinceName?: string;
  districtName?: string;
  wardName?: string;
  isDefault: boolean;
}

export const addressService = {
  list: () => api.get<ApiResponse<UserAddress[]>>('/users/me/addresses'),

  create: (payload: AddressPayload) =>
    api.post<ApiResponse<UserAddress>>('/users/me/addresses', payload),

  update: (id: number, payload: AddressPayload) =>
    api.put<ApiResponse<UserAddress>>(`/users/me/addresses/${id}`, payload),

  remove: (id: number) =>
    api.delete<ApiResponse<null>>(`/users/me/addresses/${id}`),
};
