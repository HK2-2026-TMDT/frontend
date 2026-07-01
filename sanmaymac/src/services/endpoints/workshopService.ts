import api from '../api';
import { ApiResponse } from '../../types';
import { PageResponse } from './catalogService';

export interface PublicWorkshop {
  id: number;
  fullName: string;
  avatarUrl?: string;
  logoUrl?: string;
  shopName: string;
  workshopAddress: string;
  productionCapacity: number;
  description?: string;
  isVerified: boolean;
  ratingAvg: number;
}

export interface WorkshopOrder {
  id: number;
  orderType?: string;
  orderCode?: string;
  customerName?: string;
  productName?: string;
  quantity?: number;
  totalAmount?: number;
  status?: string;
  priority?: string;
  createdAt?: string;
  trackingCode?: string;
  checkoutBatchId?: string;
}

export interface WorkshopOrderDetail extends WorkshopOrder {
  customerPhone?: string;
  customerEmail?: string;
  workshopName?: string;
  workshopAddress?: string;
  shippingFee?: number;
  discountAmount?: number;
  customerNote?: string;
  receiverName?: string;
  receiverPhone?: string;
  shippingAddress?: string;
  ghnOrderCode?: string;
  notes?: string;
  designUrl?: string;
  frontDesignUrl?: string;
  backDesignUrl?: string;
  items?: Array<{ id?: number; productName?: string; quantity?: number; unitPrice?: number; totalPrice?: number }>;
}

export interface WorkshopOrderTimeline {
  orderId: number;
  currentStatus?: string;
  items: Array<{
    code: string;
    label: string;
    completed: boolean;
    updatedAt?: string;
    note?: string;
  }>;
}

export interface BiddingPostSummary {
  id: number;
  title: string;
  description?: string;
  status?: string;
  quoteCount?: number;
  createdAt?: string;
}

export interface BiddingAttachment {
  id: number;
  fileUrl: string;
  fileType?: string;
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
  attachments?: BiddingAttachment[];
  createdAt?: string;
}

export interface WorkshopQuote {
  id: number;
  postId?: number;
  postTitle?: string;
  customerName?: string;
  offeredPrice: number;
  estimateDays: number;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkshopWallet {
  userId: number;
  availableBalance: number;
  pendingBalance: number;
  aiTokenBalance: number;
}

export interface WorkshopTransaction {
  id: number;
  orderId?: number | null;
  amount: number;
  type: string;
  direction: 'IN' | 'OUT';
  status: string;
  description?: string;
  createdAt: string;
}

export interface WorkshopPayout {
  id: number;
  workshopId: number;
  amount: number;
  status: string;
  adminNote?: string | null;
  createdAt: string;
  approvedAt?: string | null;
}

export interface WorkshopRevenueReport {
  groupBy: 'day' | 'month';
  items: Array<{ date: string; revenue: number }>;
}

export interface WorkshopProfile {
  id?: number;
  shopName: string;
  taxCode?: string;
  description?: string;
  licenseUrl?: string;
  productionCapacity?: number;
  workshopAddress?: string;
  bankName?: string;
  bankAccountNo?: string;
  bankAccountName?: string;
  avatarUrl?: string;
  logoUrl?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  address?: string;
}

export interface WorkshopKyc {
  licenseUrl?: string;
  taxCode?: string;
  note?: string;
  status?: string;
}

export interface PortfolioItem {
  id: number;
  title: string;
  imageUrl: string;
  description?: string;
  createdAt?: string;
}

export interface WorkshopReputation {
  averageRating: number;
  totalReviews: number;
  responseRate?: number;
  onTimeRate?: number;
}

export interface WorkshopDashboardSummary {
  walletBalance?: number;
  pendingBalance?: number;
  aiTokenBalance?: number;
  revenueTotal?: number;
  totalOrders?: number;
  pendingOrders?: number;
  pendingPayouts?: number;
  ratingAvg?: number;
  reviewCount?: number;
  unreadNotifications?: number;
}

export interface WorkshopNotification {
  id: number;
  title: string;
  message?: string;
  type?: string;
  isRead?: boolean;
  createdAt?: string;
}

export interface WorkshopMessageThread {
  id: number;
  subject?: string;
  lastMessage?: string;
  lastMessageAt?: string;
  participantName?: string;
  participantAvatarUrl?: string;
  unreadCount?: number;
}

export interface WorkshopMessage {
  id: number;
  content: string;
  senderName?: string;
  senderAvatarUrl?: string;
  createdAt?: string;
}

export interface WorkshopBankAccount {
  id?: number;
  bankName: string;
  accountNo: string;
  accountName: string;
  isVerified?: boolean;
}

const WORKSHOP_BASE = '/workshop';
const ORDER_BASE = '/orders';
const BIDDING_BASE = '/bidding';

const resolveAssetUrl = (url?: string) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  const apiBase = (api.defaults.baseURL || 'http://localhost:8080/api').replace(/\/+$/, '');
  const backendOrigin = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  return `${backendOrigin}${normalizedPath}`;
};
const FINANCE_BASE = '/finance';

type RawRevenueItem = { date?: string; period?: string; revenue?: number; totalRevenue?: number };

const normalizeRevenueReport = (data?: WorkshopRevenueReport | null): WorkshopRevenueReport | null => {
  if (!data) return null;
  const items = (data.items ?? []).map((item: RawRevenueItem) => ({
    date: item.date ?? item.period ?? '',
    revenue: Number(item.revenue ?? item.totalRevenue ?? 0),
  }));
  return { groupBy: data.groupBy ?? 'month', items };
};

export const workshopService = {
  getPublicWorkshops: (params?: {
    keyword?: string;
    verifiedOnly?: boolean;
    page?: number;
    size?: number;
    sort?: string;
  }) =>
    api.get<ApiResponse<PageResponse<PublicWorkshop>>>('/users/workshops/public', { params }),

  getPublicWorkshopById: (workshopId: number) =>
    api.get<ApiResponse<PublicWorkshop>>(`/users/workshops/public/${workshopId}`),

  getPublicWorkshopPortfolio: (workshopId: number) =>
    api.get<ApiResponse<PortfolioItem[]>>(`/users/workshops/public/${workshopId}/portfolio`),

  getWorkshopOrders: (params?: { status?: string; orderType?: string; page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<WorkshopOrder>>>(`${ORDER_BASE}/workshop`, { params }),

  getWorkshopOrderById: (orderId: number) =>
    api.get<ApiResponse<WorkshopOrderDetail>>(`${ORDER_BASE}/workshop/${orderId}`),

  getWorkshopOrderTimeline: (orderId: number) =>
    api.get<ApiResponse<WorkshopOrderTimeline>>(`${ORDER_BASE}/workshop/${orderId}/timeline`),

  acceptWorkshopOrder: (orderId: number) => api.post<ApiResponse<null>>(`${ORDER_BASE}/workshop/${orderId}/accept`),

  rejectWorkshopOrder: (orderId: number) => api.post<ApiResponse<null>>(`${ORDER_BASE}/workshop/${orderId}/reject`),

  cancelWorkshopOrder: (orderId: number) =>
    api.post<ApiResponse<WorkshopOrderDetail>>(`${ORDER_BASE}/workshop/${orderId}/cancel`),

  updateWorkshopOrderStatus: (orderId: number, status: 'DEPOSITED' | 'PRODUCING' | 'SHIPPED') =>
    api.post<ApiResponse<null>>(`${ORDER_BASE}/workshop/${orderId}/status`, { status }),

  updateWorkshopTracking: (orderId: number, trackingCode: string) =>
    api.post<ApiResponse<null>>(`${ORDER_BASE}/workshop/${orderId}/tracking`, { trackingCode }),

  getOpenBiddingPosts: (params?: {
    keyword?: string;
    sort?: string;
    maxQuotes?: number;
    page?: number;
    size?: number;
  }) =>
    api.get<ApiResponse<PageResponse<BiddingPostSummary>>>(`${BIDDING_BASE}/posts/open`, { params }),

  getBiddingPostById: (postId: number) =>
    api.get<ApiResponse<BiddingPostDetail>>(`${BIDDING_BASE}/posts/${postId}`),

  getMyQuoteOnPost: (postId: number) =>
    api.get<ApiResponse<WorkshopQuote | null>>(`${BIDDING_BASE}/posts/${postId}/quotes/me`),

  resolveAssetUrl,

  submitWorkshopQuote: (postId: number, payload: { offeredPrice: number; estimateDays: number }) =>
    api.post<ApiResponse<WorkshopQuote>>(`${BIDDING_BASE}/posts/${postId}/quotes`, payload),

  getWorkshopQuotes: (params?: { status?: string; page?: number; size?: number; sort?: string }) =>
    api.get<ApiResponse<PageResponse<WorkshopQuote>>>(`${BIDDING_BASE}/quotes/me`, { params }),

  updateWorkshopQuote: (quoteId: number, payload: { offeredPrice: number; estimateDays: number }) =>
    api.put<ApiResponse<WorkshopQuote>>(`${BIDDING_BASE}/quotes/${quoteId}`, payload),

  withdrawWorkshopQuote: (quoteId: number) => api.post<ApiResponse<null>>(`${BIDDING_BASE}/quotes/${quoteId}/withdraw`),

  getWorkshopWallet: () => api.get<ApiResponse<WorkshopWallet>>(`${FINANCE_BASE}/wallet`),

  getWorkshopTransactions: (params?: { type?: string; status?: string }) =>
    api.get<ApiResponse<WorkshopTransaction[]>>(`${FINANCE_BASE}/transactions`, { params }),

  getWorkshopPayouts: () => api.get<ApiResponse<WorkshopPayout[]>>(`${FINANCE_BASE}/payouts`),

  requestWorkshopPayout: (amount: number) => api.post<ApiResponse<WorkshopPayout>>(`${FINANCE_BASE}/payouts`, { amount }),

  cancelWorkshopPayout: (payoutId: number) =>
    api.post<ApiResponse<WorkshopPayout>>(`${FINANCE_BASE}/payouts/${payoutId}/cancel`),

  getWorkshopRevenue: async (params?: { from?: string; to?: string; groupBy?: 'day' | 'month' }) => {
    const response = await api.get<ApiResponse<WorkshopRevenueReport>>(`${FINANCE_BASE}/revenue`, { params });
    return {
      ...response,
      data: {
        ...response.data,
        data: normalizeRevenueReport(response.data.data),
      },
    };
  },

  getWorkshopBankAccount: () => api.get<ApiResponse<WorkshopBankAccount>>(`${FINANCE_BASE}/bank-account`),

  updateWorkshopBankAccount: (payload: WorkshopBankAccount) =>
    api.put<ApiResponse<WorkshopBankAccount>>(`${FINANCE_BASE}/bank-account`, payload),

  getWorkshopDashboardSummary: () => api.get<ApiResponse<WorkshopDashboardSummary>>(`${WORKSHOP_BASE}/dashboard/summary`),

  getWorkshopStats: (params?: { from?: string; to?: string; groupBy?: 'day' | 'month' }) =>
    api.get<ApiResponse<WorkshopRevenueReport>>(`${WORKSHOP_BASE}/stats`, { params }),

  getWorkshopNotifications: () => api.get<ApiResponse<WorkshopNotification[]>>(`${WORKSHOP_BASE}/notifications`),

  getWorkshopUnreadNotificationCount: () => api.get<ApiResponse<number>>(`${WORKSHOP_BASE}/notifications/unread-count`),

  markWorkshopNotificationAsRead: (notificationId: number) =>
    api.put<ApiResponse<null>>(`${WORKSHOP_BASE}/notifications/${notificationId}/read`),

  getWorkshopMessageThreads: () => api.get<ApiResponse<WorkshopMessageThread[]>>(`${WORKSHOP_BASE}/messages/threads`),

  getWorkshopThreadMessages: (threadId: number) => api.get<ApiResponse<WorkshopMessage[]>>(`${WORKSHOP_BASE}/messages/${threadId}`),

  sendWorkshopMessage: (threadId: number, payload: { content: string }) =>
    api.post<ApiResponse<WorkshopMessage>>(`${WORKSHOP_BASE}/messages/${threadId}`, payload),

  getWorkshopProfile: () => api.get<ApiResponse<WorkshopProfile>>(`${WORKSHOP_BASE}/profile`),

  updateWorkshopProfile: (payload: WorkshopProfile) =>
    api.put<ApiResponse<WorkshopProfile>>(`${WORKSHOP_BASE}/profile`, payload),

  uploadWorkshopAvatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<WorkshopProfile>>(`${WORKSHOP_BASE}/profile/avatar`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  uploadWorkshopLogo: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<WorkshopProfile>>(`${WORKSHOP_BASE}/profile/logo`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getWorkshopKyc: () => api.get<ApiResponse<WorkshopKyc>>(`${WORKSHOP_BASE}/kyc`),

  updateWorkshopKyc: (payload: { licenseUrl: string; taxCode: string; note?: string }) =>
    api.put<ApiResponse<WorkshopKyc>>(`${WORKSHOP_BASE}/kyc`, payload),

  uploadWorkshopKycFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post<ApiResponse<WorkshopKyc>>(`${WORKSHOP_BASE}/kyc/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  getWorkshopPortfolio: () => api.get<ApiResponse<PortfolioItem[]>>(`${WORKSHOP_BASE}/portfolio`),

  addWorkshopPortfolio: (payload: { title: string; imageUrl: string; description?: string }) =>
    api.post<ApiResponse<PortfolioItem>>(`${WORKSHOP_BASE}/portfolio`, payload),

  uploadWorkshopPortfolio: (payload: { title: string; description?: string; image: File }) => {
    const formData = new FormData();
    formData.append('title', payload.title);
    if (payload.description) formData.append('description', payload.description);
    formData.append('image', payload.image);
    return api.post<ApiResponse<PortfolioItem>>(`${WORKSHOP_BASE}/portfolio/upload`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  deleteWorkshopPortfolio: (id: number) => api.delete<ApiResponse<null>>(`${WORKSHOP_BASE}/portfolio/${id}`),

  getWorkshopReputation: () => api.get<ApiResponse<WorkshopReputation>>(`${WORKSHOP_BASE}/reputation`),
};

export const mapWorkshopOrderSummary = (order: WorkshopOrder): WorkshopOrder => ({
  ...order,
  orderCode: `DH-${order.id}`,
});

export const enrichWorkshopOrders = async (orders: WorkshopOrder[]): Promise<WorkshopOrder[]> => {
  if (!orders.length) return [];

  const details = await Promise.allSettled(
    orders.map((order) => workshopService.getWorkshopOrderById(order.id)),
  );

  return orders.map((order, index) => {
    const detail = details[index].status === 'fulfilled' ? details[index].value.data.data : null;
    const items = detail?.items ?? [];
    const quantity = items.reduce((sum, item) => sum + (item.quantity ?? 0), 0);

    return {
      ...mapWorkshopOrderSummary(order),
      productName:
        items.length > 1
          ? `${items[0]?.productName ?? 'Sản phẩm'} (+${items.length - 1})`
          : items[0]?.productName ?? (order.orderType === 'READY_MADE' ? 'Hàng có sẵn' : 'Đơn may đo'),
      quantity,
      customerName: order.customerName ?? detail?.customerName,
      trackingCode: order.trackingCode ?? detail?.trackingCode,
      totalAmount: order.totalAmount ?? detail?.totalAmount,
    };
  });
};
