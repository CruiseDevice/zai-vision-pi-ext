import { constants, promises as fs } from 'node:fs';
import { extname } from 'node:path';
import { ImageContent, VideoContent, VisionError } from './shared/types.js';

// ---------------------------------------------------------------------------
// Supported format allow-lists
// ---------------------------------------------------------------------------

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);
const VIDEO_EXTENSIONS = new Set(['.mp4', '.mov', '.mkv']);

const IMAGE_MAX_BYTES = 5 * 1024 * 1024; // 5 MB
const VIDEO_MAX_BYTES = 8 * 1024 * 1024; // 8 MB

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

function isUrl(source: string): boolean {
  return /^https?:\/\//.test(source);
}

function getMimeTypeFromExt(ext: string): string {
  switch (ext) {
    case '.jpg':
    case '.jpeg':
      return 'jpeg';
    case '.png':
      return 'png';
    case '.webp':
      return 'webp';
    case '.gif':
      return 'gif';
    case '.mp4':
      return 'mp4';
    case '.mov':
      return 'quicktime';
    case '.mkv':
      return 'x-matroska';
    default:
      return 'octet-stream';
  }
}

async function validateFile(
  path: string,
  allowedExts: Set<string>,
  maxBytes: number,
): Promise<void> {
  // Verify file exists
  try {
    await fs.access(path, constants.F_OK);
  } catch {
    throw new VisionError(
      'FILE_NOT_FOUND',
      `File not found: ${path}`,
    );
  }

  // Verify extension
  const rawExt = extname(path);
  const ext = rawExt.toLowerCase();
  if (!allowedExts.has(ext)) {
    throw new VisionError(
      'UNSUPPORTED_FORMAT',
      `Unsupported file format "${rawExt}". Allowed: ${[...allowedExts].join(', ')}`,
    );
  }

  // Verify size (before loading into memory)
  const stats = await fs.stat(path);
  if (stats.size > maxBytes) {
    throw new VisionError(
      'FILE_TOO_LARGE',
      `File too large: ${stats.size} bytes (max ${maxBytes} bytes)`,
    );
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Resolve an image source string into an API-ready ImageContent block.
 * Remote URLs are passed through unchanged. Local files are validated,
 * read, and encoded as base64 data URLs.
 */
export async function resolveImageSource(source: string): Promise<ImageContent> {
  if (isUrl(source)) {
    return { type: 'image_url', image_url: { url: source } };
  }

  await validateFile(source, IMAGE_EXTENSIONS, IMAGE_MAX_BYTES);

  const ext = extname(source).toLowerCase();
  const mime = getMimeTypeFromExt(ext);
  const buffer = await fs.readFile(source);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:image/${mime};base64,${base64}`;

  return { type: 'image_url', image_url: { url: dataUrl } };
}

/**
 * Resolve a video source string into an API-ready VideoContent block.
 * Remote URLs are passed through unchanged. Local files are validated,
 * read, and encoded as base64 data URLs.
 *
 * Base64 video is confirmed supported by Z.AI/Zhipu.
 */
export async function resolveVideoSource(source: string): Promise<VideoContent> {
  if (isUrl(source)) {
    return { type: 'video_url', video_url: { url: source } };
  }

  await validateFile(source, VIDEO_EXTENSIONS, VIDEO_MAX_BYTES);

  const ext = extname(source).toLowerCase();
  const mime = getMimeTypeFromExt(ext);
  const buffer = await fs.readFile(source);
  const base64 = buffer.toString('base64');
  const dataUrl = `data:video/${mime};base64,${base64}`;

  return { type: 'video_url', video_url: { url: dataUrl } };
}
