import api from '../api';
import { ApiResponse } from '../../types';

export interface ShippingQuote {
  fee: number;
  serviceName?: string;
  available: boolean;
  message?: string;
}

export const shippingService = {
  quote: (addressId: number) =>
    api.post<ApiResponse<ShippingQuote>>('/shipping/quote', { addressId }),
};
