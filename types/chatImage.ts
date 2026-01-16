/**
 * Chat Image Upload Types
 * Types cho tính năng upload ảnh và nhận gợi ý sản phẩm
 */

export interface ImageSearchResult {
  messageType: 'IMAGE_SEARCH_RESULT';
  imageUrl: string;
  analysis: ImageAnalysis;
  suggestedProducts: SuggestedProduct[];
  chatMessage: string;
}

export interface ImageAnalysis {
  detectedProduct: string;
  confidence: number;
  attributes: {
    category: string;
    brand: string;
    color: string;
    material: string;
    gender: string;
  };
  keywords: string[];
}

export interface SuggestedProduct {
  productId: number;
  name: string;
  price: number;
  imageUrl: string;
  similarityScore: number;
  brand?: string;
  category?: string;
}

/**
 * Message Types Union
 */
export type ChatMessageType = 
  | 'TEXT'
  | 'IMAGE_LOCAL' 
  | 'IMAGE_SEARCH_RESULT'
  | 'ASSISTANT';

export interface BaseMessage {
  id: string;
  type: ChatMessageType;
  timestamp: number;
  sender: 'USER' | 'ASSISTANT';
}

export interface TextMessage extends BaseMessage {
  type: 'TEXT';
  content: string;
}

export interface ImageLocalMessage extends BaseMessage {
  type: 'IMAGE_LOCAL';
  imageUri: string;
  uploading: boolean;
  error?: string;
}

export interface ImageSearchResultMessage extends BaseMessage {
  type: 'IMAGE_SEARCH_RESULT';
  result: ImageSearchResult;
}

export interface AssistantMessage extends BaseMessage {
  type: 'ASSISTANT';
  content: string;
  suggestions?: any[];
}

export type ChatMessage = 
  | TextMessage 
  | ImageLocalMessage 
  | ImageSearchResultMessage 
  | AssistantMessage;

/**
 * Upload Image Request
 */
export interface UploadImageRequest {
  sessionId: number;
  senderType: 'USER' | 'ADMIN';
  imageUri: string;
}
