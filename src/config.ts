import { Config, PlatformMode, VisionError } from './shared/types.js';

let cachedConfig: Config | null = null;

const PLACEHOLDER_PATTERNS = [
  'your_api_key',
  'your-api-key',
  'your api key',
  'sk-xxx',
  'sk-xxxx',
  'sk-test',
  'placeholder',
  'test',
  'demo',
  'example',
];

function isPlaceholderKey(key: string): boolean {
  const lower = key.toLowerCase();
  return PLACEHOLDER_PATTERNS.some((p) => lower.includes(p));
}

function buildConfig(): Config {
  const apiKey = process.env.Z_AI_API_KEY;

  if (!apiKey || apiKey.trim().length === 0) {
    throw new VisionError(
      'MISSING_API_KEY',
      'Z_AI_API_KEY is not set. Please set it in your environment variables.',
    );
  }

  if (isPlaceholderKey(apiKey.trim())) {
    throw new VisionError(
      'INVALID_API_KEY',
      'Z_AI_API_KEY appears to be a placeholder. Please provide a real API key.',
    );
  }

  const modeRaw = process.env.Z_AI_MODE ?? 'ZAI';
  if (modeRaw !== 'ZAI' && modeRaw !== 'ZHIPU') {
    throw new VisionError(
      'INVALID_CONFIG',
      `Z_AI_MODE must be "ZAI" or "ZHIPU", got: "${modeRaw}"`,
    );
  }
  const mode = modeRaw as PlatformMode;

  const baseUrl =
    mode === 'ZAI'
      ? 'https://api.z.ai/api/paas/v4/'
      : 'https://open.bigmodel.cn/api/paas/v4/';

  const config: Config = {
    apiKey: apiKey.trim(),
    mode,
    baseUrl,
    model: 'glm-4.6v',
    timeoutMs: 300_000, // 5 minutes
    maxTokens: 32_768,
  };

  return Object.freeze(config);
}

/**
 * Resolve environment variables once, validate them, and expose a frozen config object.
 * Lazy-initialized on first access.
 */
export function getConfig(): Readonly<Config> {
  if (!cachedConfig) {
    cachedConfig = buildConfig();
  }
  return cachedConfig;
}

/**
 * Join a path to the configured base URL safely.
 * Example: getApiUrl("chat/completions") → "https://api.z.ai/api/paas/v4/chat/completions"
 */
export function getApiUrl(path: string): string {
  const { baseUrl } = getConfig();
  return new URL(path, baseUrl).toString();
}

/**
 * Reset the cached config. Primarily useful for tests or when env vars change.
 */
export function resetConfig(): void {
  cachedConfig = null;
}
