// Global TypeScript Types & Interfaces

// User & Auth
export interface User {
  id: string;
  email: string;
  name: string;
  role: 'customer' | 'workshop' | 'admin';
  avatar?: string;
  createdAt: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// API Response
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

// Auth response record returned by auth endpoints
export interface AuthResponseRecord {
  accessToken: string;
  tokenType: string; // usually "Bearer"
  expiresIn: number; // seconds
  userId: number;
  role: string; // CUSTOMER | WORKSHOP | ADMIN
  refreshToken?: string;
}

// Common
export interface Pagination {
  page: number;
  limit: number;
  total: number;
}
