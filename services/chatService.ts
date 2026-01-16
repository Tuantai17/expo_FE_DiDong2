/**
 * Chat Service
 * =============
 * Service xử lý chat với Admin hoặc AI
 */

import { API_BASE_URL } from '@/config/api.config';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Token key phải khớp với api.ts
const TOKEN_KEY = 'auth_token';

// Types
export interface ChatSession {
  id: number;
  userId: number;
  userName: string;
  userEmail: string;
  assignedAdminId: number | null;
  assignedAdminName: string | null;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  lastMessageAt: string | null;
  createdAt: string;
  closedAt: string | null;
  unreadCount: number;
}

// Action types that AI can perform
export interface ActionData {
  type: 'NONE' | 'ADD_TO_CART' | 'VIEW_PRODUCT' | 'VIEW_CATEGORY';
  productId: number | null;
  productName: string;
  size: string;
  quantity: number;
}

export interface ChatMessage {
  id: number;
  sessionId: number;
  senderType: 'USER' | 'ADMIN' | 'AI';
  senderId: number | null;
  senderName: string;
  content: string;
  createdAt: string;
  metadata: string | null;
  isRead: boolean;
  // Parsed from metadata - product suggestions with images
  products?: ProductSuggestion[];
  // Parsed from metadata - action performed by AI
  action?: ActionData;
}

export interface ProductSuggestion {
  id: number;
  name: string;
  price: number;
  priceRoot?: number | null;
  photo?: string | null;
  brand?: string | null;
  avgRating?: number;
  reviewCount?: number;
}

class ChatService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  private async getToken(): Promise<string | null> {
    return AsyncStorage.getItem(TOKEN_KEY);
  }

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }

  /**
   * Tạo hoặc lấy session chat hiện tại của user
   */
  async createOrGetSession(): Promise<ChatSession> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/api/chat/sessions`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create/get session: ${error}`);
    }

    return response.json();
  }

  /**
   * Lấy thông tin session
   */
  async getSession(sessionId: number): Promise<ChatSession> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error('Failed to get session');
    }

    return response.json();
  }

  /**
   * Lấy danh sách messages của session
   */
  async getMessages(sessionId: number, page = 0, size = 50): Promise<ChatMessage[]> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(
      `${this.baseUrl}/api/chat/sessions/${sessionId}/messages?page=${page}&size=${size}`,
      { headers }
    );

    if (!response.ok) {
      throw new Error('Failed to get messages');
    }

    const messages: ChatMessage[] = await response.json();
    
    // Parse metadata to extract product suggestions and actions for AI messages
    return messages.map(msg => {
      if (msg.senderType === 'AI' && msg.metadata) {
        try {
          const meta = JSON.parse(msg.metadata);
          const parsed: Partial<ChatMessage> = { ...msg };
          
          // Extract products
          if (meta.products && Array.isArray(meta.products)) {
            parsed.products = meta.products;
          }
          
          // Extract action (ADD_TO_CART, etc.)
          if (meta.action && meta.action.type) {
            parsed.action = meta.action;
          }
          
          return parsed as ChatMessage;
        } catch (e) {
          console.log('[Chat] Failed to parse metadata:', e);
        }
      }
      return msg;
    });
  }

  /**
   * Gửi message từ user
   */
  async sendMessage(sessionId: number, content: string): Promise<ChatMessage> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}/messages`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to send message: ${error}`);
    }

    return response.json();
  }

  /**
   * Đánh dấu đã đọc
   */
  async markAsRead(sessionId: number): Promise<void> {
    const headers = await this.getAuthHeaders();
    await fetch(`${this.baseUrl}/api/chat/sessions/${sessionId}/read`, {
      method: 'POST',
      headers,
    });
  }

  /**
   * Kiểm tra xem user đã đăng nhập chưa
   */
  async isLoggedIn(): Promise<boolean> {
    const token = await this.getToken();
    return !!token;
  }
}

export const chatService = new ChatService();
export default chatService;
