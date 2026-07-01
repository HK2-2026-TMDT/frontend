import api from '../api';
import { ApiResponse } from '../../types';

export interface ChatThread {
  id: number;
  orderId?: number | null;
  customerId?: number | null;
  customerName?: string;
  workshopId?: number | null;
  workshopName?: string;
  participantName?: string;
  participantAvatarUrl?: string;
  subject?: string;
  lastMessage?: string;
  lastMessageAt?: string;
}

export interface ChatMessage {
  id: number;
  threadId?: number;
  senderId?: number;
  senderName?: string;
  senderRole?: string;
  senderAvatarUrl?: string;
  content: string;
  createdAt?: string;
}

export interface ChatThreadDetail {
  thread: ChatThread;
  messages: ChatMessage[];
}

const MESSAGE_BASE = '/messages';

export const messageService = {
  getThreads: () => api.get<ApiResponse<ChatThread[]>>(`${MESSAGE_BASE}/threads`),

  getThread: (threadId: number) =>
    api.get<ApiResponse<ChatThreadDetail>>(`${MESSAGE_BASE}/threads/${threadId}`),

  getThreadByOrder: (orderId: number) =>
    api.get<ApiResponse<ChatThreadDetail>>(`${MESSAGE_BASE}/threads/by-order/${orderId}`),

  sendMessage: (threadId: number, content: string) =>
    api.post<ApiResponse<ChatThreadDetail>>(`${MESSAGE_BASE}/threads/${threadId}`, { content }),
};

export const getWebSocketUrl = () => {
  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';
  const origin = apiBase.replace(/\/api\/?$/, '');
  return `${origin}/ws`;
};
