/**
 * Shared TypeScript interfaces and type definitions for zai-vision-pi-ext.
 * Single source of truth for types used across config, file-service, api, and tools.
 */

// ---------------------------------------------------------------------------
// Platform & Config
// ---------------------------------------------------------------------------

export type PlatformMode = 'ZAI' | 'ZHIPU';

export interface Config {
  apiKey: string;
  mode: PlatformMode;
  baseUrl: string;
  model: string;
  timeoutMs: number;
  maxTokens: number;
}

// ---------------------------------------------------------------------------
// Multimodal Content Blocks (OpenAI-compatible)
// ---------------------------------------------------------------------------

export interface ImageContent {
  type: 'image_url';
  image_url: { url: string };
}

export interface VideoContent {
  type: 'video_url';
  video_url: { url: string };
}

export interface TextContent {
  type: 'text';
  text: string;
}

export type MultimodalContentItem = TextContent | ImageContent | VideoContent;

// ---------------------------------------------------------------------------
// Chat Messages (narrowed by role)
// ---------------------------------------------------------------------------

export interface SystemMessage {
  role: 'system';
  content: string;
}

export interface UserMessage {
  role: 'user';
  content: string | MultimodalContentItem[];
}

export interface AssistantMessage {
  role: 'assistant';
  content: string;
}

export type ChatMessage = SystemMessage | UserMessage | AssistantMessage;

// ---------------------------------------------------------------------------
// API Request / Response
// ---------------------------------------------------------------------------

export interface VisionRequest {
  model: string;
  messages: ChatMessage[];
  stream: boolean;
  temperature: number;
  top_p: number;
  max_tokens: number;
}

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

export type VisionErrorCode =
  | 'MISSING_API_KEY'
  | 'INVALID_API_KEY'
  | 'INVALID_CONFIG'
  | 'FILE_NOT_FOUND'
  | 'FILE_TOO_LARGE'
  | 'UNSUPPORTED_FORMAT'
  | 'NETWORK_ERROR'
  | 'API_ERROR'
  | 'TIMEOUT'
  | 'ABORTED';

export class VisionError extends Error {
  code: VisionErrorCode;
  statusCode?: number;

  constructor(code: VisionErrorCode, message: string, statusCode?: number) {
    super(message);
    this.name = 'VisionError';
    this.code = code;
    this.statusCode = statusCode;

    // Restore prototype chain for instanceof checks across transpilation boundaries
    Object.setPrototypeOf(this, VisionError.prototype);
  }

  toString(): string {
    if (this.statusCode !== undefined) {
      return `[${this.code}] (${this.statusCode}) ${this.message}`;
    }
    return `[${this.code}] ${this.message}`;
  }
}

// ---------------------------------------------------------------------------
// Per-request Overrides
// ---------------------------------------------------------------------------

export interface ApiOptions {
  temperature?: number;
  top_p?: number;
  max_tokens?: number;
  timeoutMs?: number;
  signal?: AbortSignal;
}

// ---------------------------------------------------------------------------
// Tool Result (pi-compatible return shape)
// ---------------------------------------------------------------------------

export interface ToolResult {
  content: Array<{ type: 'text'; text: string }>;
  isError?: boolean;
}



