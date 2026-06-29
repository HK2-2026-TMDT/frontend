import api from '../api';
import axios from 'axios';
import { ApiResponse, User, AuthResponseRecord } from '../../types';
import { useAuthStore } from '../../store/useAuthStore';
import { cacheKeys, cacheService, cacheTtl } from '../cache';
import {
  facebookProvider,
  firebaseAuth,
  googleProvider,
  isFirebaseConfigured,
} from '../firebase';
import { signInWithPopup } from 'firebase/auth';

const BASE = '/auth';

const persistAuthTokens = (auth?: AuthResponseRecord) => {
  if (auth?.accessToken) {
    localStorage.setItem('token', auth.accessToken);
  }
  if (auth?.refreshToken) {
    localStorage.setItem('refreshToken', auth.refreshToken);
  }
};

const hydrateUserSession = async (
  auth: AuthResponseRecord,
  fallback: { email: string; name?: string }
) => {
  const role = (auth.role?.toLowerCase() ?? 'customer') as User['role'];
  try {
    const me = await api.get<ApiResponse<User>>(`${BASE}/me`);
    const user = me.data.data;
    const normalizedUser: User = {
      ...user,
      role: (user.role?.toLowerCase() ?? role) as User['role'],
    };
    useAuthStore.getState().login(normalizedUser, auth.accessToken);
    cacheService.set(cacheKeys.customerProfile, normalizedUser, cacheTtl.customerProfile);
  } catch {
    const fallbackUser: User = {
      id: String(auth.userId),
      email: fallback.email,
      name: fallback.name || fallback.email.split('@')[0],
      role,
      createdAt: new Date().toISOString(),
    };
    useAuthStore.getState().login(fallbackUser, auth.accessToken);
    cacheService.set(cacheKeys.customerProfile, fallbackUser, cacheTtl.customerProfile);
  }
};

export const authService = {
  login: async (email: string, password: string) => {
    const res = await api.post<ApiResponse<AuthResponseRecord>>(`${BASE}/login`, { email, password });
    const auth = res.data.data;
    persistAuthTokens(auth);
    await hydrateUserSession(auth, { email, name: email.split('@')[0] });

    return res;
  },

  firebaseLogin: (idToken: string) => api.post<ApiResponse<AuthResponseRecord>>(`${BASE}/firebase`, { idToken }),

  socialLogin: async (provider: 'google' | 'facebook') => {
    if (!isFirebaseConfigured || !firebaseAuth) {
      throw new Error('Chưa cấu hình Firebase trên frontend.');
    }
    const selectedProvider = provider === 'google' ? googleProvider : facebookProvider;
    const credential = await signInWithPopup(firebaseAuth, selectedProvider);
    const idToken = await credential.user.getIdToken();
    const res = await api.post<ApiResponse<AuthResponseRecord>>(`${BASE}/firebase`, { idToken });
    const auth = res.data.data;
    persistAuthTokens(auth);
    await hydrateUserSession(auth, {
      email: credential.user.email || '',
      name: credential.user.displayName || undefined,
    });
    return res;
  },

  register: (email: string, password: string, fullName: string) =>
    api.post<ApiResponse<any>>(`${BASE}/register`, {
      email,
      password,
      fullName,
    }),

  registerWorkshop: (data: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber: string;
    shopName: string;
    workshopAddress: string;
    productionCapacity: number;
    description?: string;
    taxCode?: string;
    bankName?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
  }) => api.post<ApiResponse<any>>(`${BASE}/register/workshop`, data),

  verifyEmail: (token: string) => api.post<ApiResponse<null>>(`${BASE}/verify-email`, { token }),

  forgotPassword: (email: string) => api.post<ApiResponse<{ resetToken: string }>>(`${BASE}/forgot-password`, { email }),

  resetPassword: (token: string, newPassword: string) => api.post<ApiResponse<null>>(`${BASE}/reset-password`, { token, newPassword }),

  refreshToken: (refreshToken: string) => axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:8080/api'}/auth/refresh-token`, { refreshToken }),

  // Resend verification email - backend endpoint may be POST /auth/verify-email/resend
  resendVerification: (email: string) => api.post<ApiResponse<null>>(`${BASE}/verify-email/resend`, { email }),

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    cacheService.remove(cacheKeys.customerProfile);
    cacheService.clearByPrefix('catalog:favorites:');
    useAuthStore.getState().logout();
    return Promise.resolve();
  },

  getCurrentUser: () => api.get<ApiResponse<User>>(`${BASE}/me`),
};
