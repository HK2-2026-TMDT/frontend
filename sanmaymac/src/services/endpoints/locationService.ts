import api from '../api';
import { ApiResponse } from '../../types';

export interface Province {
  provinceId: number;
  provinceName: string;
}

export interface District {
  districtId: number;
  districtName: string;
}

export interface Ward {
  wardCode: string;
  wardName: string;
}

export const locationService = {
  getProvinces: () =>
    api.get<ApiResponse<Province[]>>('/locations/provinces'),

  getDistricts: (provinceId: number) =>
    api.get<ApiResponse<District[]>>(`/locations/districts?provinceId=${provinceId}`),

  getWards: (districtId: number) =>
    api.get<ApiResponse<Ward[]>>(`/locations/wards?districtId=${districtId}`),
};
