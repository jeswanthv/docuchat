export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  isStreaming?: boolean;
}

export interface PDFDocument {
  id: string;
  name: string;
  size: number;
  pageCount: number;
  textConfigured: boolean;
  content: string; // Extracted text
  preview?: string; // Base64 data URL of the first page
}

export enum AppState {
  UPLOAD = 'UPLOAD',
  PROCESSING = 'PROCESSING',
  CHAT = 'CHAT',
  ERROR = 'ERROR'
}

export interface ChatSessionConfig {
  pdfContent: string;
}