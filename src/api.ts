import {
  ApiOptions,
  ChatMessage,
  ImageContent,
  VideoContent,
  VisionError,
  VisionErrorCode,
  VisionRequest,
} from './shared/types.js';
import { getConfig } from './config.js';

// ---------------------------------------------------------------------------
// Internal HTTP error (used by retry layer before converting to VisionError)
// ---------------------------------------------------------------------------

class HttpError extends Error {
  status: number;
  retryAfter?: string;

  constructor(status: number, message: string, retryAfter?: string) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.retryAfter = retryAfter;
    Object.setPrototypeOf(this, HttpError.prototype);
  }
}

// ---------------------------------------------------------------------------
// Retry utility
// ---------------------------------------------------------------------------

const RETRYABLE_STATUS_CODES = new Set([429, 500, 502, 503, 504]);
const MAX_RETRIES = 2;

function isRetryableStatus(status: number): boolean {
  return RETRYABLE_STATUS_CODES.has(status);
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getRetryDelay(attempt: number, retryAfterHeader?: string | null): number {
  if (retryAfterHeader) {
    const seconds = parseInt(retryAfterHeader, 10);
    if (!isNaN(seconds) && seconds > 0) {
      return seconds * 1000;
    }
  }
  // Exponential backoff: 1s, 2s
  return [1000, 2000][attempt] ?? 2000;
}

async function withRetry<T>(
  fn: () => Promise<T>,
  options?: { signal?: AbortSignal },
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    if (options?.signal?.aborted) {
      throw new VisionError('ABORTED', 'Request was cancelled');
    }

    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Don't retry if caller aborted
      if (options?.signal?.aborted) {
        throw new VisionError('ABORTED', 'Request was cancelled');
      }

      // Non-retryable on last attempt
      if (attempt === MAX_RETRIES) {
        break;
      }

      // Classify retryability
      let shouldRetry = false;
      let retryAfter: string | undefined;

      if (error instanceof HttpError) {
        if (isRetryableStatus(error.status)) {
          shouldRetry = true;
          retryAfter = error.retryAfter;
        }
      } else if (error instanceof TypeError || error instanceof Error) {
        // Network-level fetch failures (ECONNREFUSED, DNS, etc.)
        shouldRetry = true;
      }

      if (!shouldRetry) {
        break;
      }

      const backoffMs = getRetryDelay(attempt, retryAfter ?? null);
      await delay(backoffMs);
    }
  }

  // All retries exhausted — convert lastError to VisionError
  if (lastError instanceof HttpError) {
    const status = lastError.status;
    if (status === 429) {
      throw new VisionError('API_ERROR', 'Rate limited after retries', status);
    }
    throw new VisionError('API_ERROR', `Z.AI server error (${status})`, status);
  }

  if (lastError instanceof VisionError) {
    throw lastError;
  }

  // Network failure after retries
  throw new VisionError('NETWORK_ERROR', 'Unable to reach Z.AI API');
}

// ---------------------------------------------------------------------------
// HTTP client
// ---------------------------------------------------------------------------

async function postChatCompletions(
  body: VisionRequest,
  options?: ApiOptions,
): Promise<string> {
  const config = getConfig();
  const url = config.baseUrl + 'chat/completions';

  const timeoutMs = options?.timeoutMs ?? config.timeoutMs;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Compose with caller signal
  if (options?.signal) {
    const callerOnAbort = () => controller.abort();
    options.signal.addEventListener('abort', callerOnAbort, { once: true });

    // Clean up listener if our controller fires first (timeout)
    controller.signal.addEventListener(
      'abort',
      () => {
        options.signal?.removeEventListener('abort', callerOnAbort);
      },
      { once: true },
    );
  }

  let response: Response;

  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${config.apiKey}`,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (fetchError) {
    clearTimeout(timeoutId);

    // Distinguish caller abort vs timeout vs network failure
    if (options?.signal?.aborted) {
      throw new VisionError('ABORTED', 'Request was cancelled');
    }
    if (controller.signal.aborted) {
      throw new VisionError('TIMEOUT', `Request timed out after ${timeoutMs}ms`);
    }

    // Network-level failure — throw plain Error for retry layer
    throw fetchError;
  }

  clearTimeout(timeoutId);

  // Handle HTTP status codes
  const status = response.status;

  if (status === 401 || status === 403) {
    throw new VisionError(
      'INVALID_API_KEY',
      'Authentication failed — check Z_AI_API_KEY',
      status,
    );
  }

  if (status === 400) {
    let message = 'Bad request';
    try {
      const body = (await response.json()) as Record<string, unknown>;
      const errorObj =
        typeof body.error === 'object' && body.error !== null
          ? (body.error as Record<string, unknown>)
          : undefined;
      message =
        (typeof errorObj?.message === 'string' ? errorObj.message : undefined) ||
        (typeof body.message === 'string' ? body.message : undefined) ||
        JSON.stringify(body);
    } catch {
      // ignore parse failure
    }
    throw new VisionError('API_ERROR', `Bad request: ${message}`, status);
  }

  if (status === 429) {
    const retryAfter = response.headers.get('retry-after') ?? undefined;
    throw new HttpError(429, 'Rate limited', retryAfter);
  }

  if (status >= 500) {
    throw new HttpError(status, `Z.AI server error (${status})`);
  }

  if (!response.ok) {
    throw new HttpError(status, `Unexpected HTTP ${status}`);
  }

  // Parse response
  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new VisionError(
      'API_ERROR',
      'Failed to parse API response as JSON',
    );
  }

  const choices = (payload as Record<string, unknown>)?.choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new VisionError(
      'API_ERROR',
      `Unexpected response: choices array missing or empty. Raw: ${JSON.stringify(payload).slice(0, 500)}`,
    );
  }

  const firstChoice = choices[0] as Record<string, unknown>;
  const message = firstChoice?.message as Record<string, unknown> | undefined;
  const content = message?.content;

  if (typeof content !== 'string') {
    throw new VisionError(
      'API_ERROR',
      `Unexpected response: content missing or not a string. Raw: ${JSON.stringify(payload).slice(0, 500)}`,
    );
  }

  return content;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Send a vision analysis request with one or more images.
 */
export async function visionAnalyze(
  systemPrompt: string,
  userPrompt: string,
  imageSources: ImageContent[],
  options?: ApiOptions,
): Promise<string> {
  const config = getConfig();

  const messages: ChatMessage[] = [
    { role: 'system', content: systemPrompt },
    {
      role: 'user',
      content: [
        ...imageSources,
        { type: 'text', text: userPrompt },
      ],
    },
  ];

  const body: VisionRequest = {
    model: config.model,
    messages,
    stream: false,
    temperature: options?.temperature ?? 0.8,
    top_p: options?.top_p ?? 0.6,
    max_tokens: options?.max_tokens ?? config.maxTokens,
  };

  return withRetry(() => postChatCompletions(body, options), options);
}

/**
 * Send a video analysis request.
 * The payload structure is identical to images; only the content block differs.
 */
export async function videoAnalyze(
  systemPrompt: string,
  userPrompt: string,
  videoSource: VideoContent,
  options?: ApiOptions,
): Promise<string> {
  const config = getConfig();

  const messages: ChatMessage[] = [];
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  messages.push({
    role: 'user',
    content: [videoSource, { type: 'text', text: userPrompt }],
  });

  const body: VisionRequest = {
    model: config.model,
    messages,
    stream: false,
    temperature: options?.temperature ?? 0.8,
    top_p: options?.top_p ?? 0.6,
    max_tokens: options?.max_tokens ?? config.maxTokens,
  };

  return withRetry(() => postChatCompletions(body, options), options);
}
