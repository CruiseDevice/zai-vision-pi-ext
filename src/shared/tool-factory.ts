/**
 * Shared tool factory — eliminates boilerplate across 7 image tools and 1 video tool.
 */

import { defineTool, type ExtensionContext, type ToolDefinition, type AgentToolUpdateCallback } from "@earendil-works/pi-coding-agent";
import { Type, StringEnum } from "@earendil-works/pi-ai";
import type { Static, TSchema } from "@earendil-works/pi-ai";
import { visionAnalyze, videoAnalyze } from "../api.js";
import { resolveImageSource, resolveVideoSource } from "../file-service.js";
import { VisionError, type ImageToolDetails, type VideoToolDetails, type ErrorToolDetails } from "./types.js";

// ---------------------------------------------------------------------------
// Re-export TypeBox helpers so tools don't need multiple imports
// ---------------------------------------------------------------------------
export { Type, StringEnum };

// ---------------------------------------------------------------------------
// Common parameter schemas
// ---------------------------------------------------------------------------

export const ImageSourceSchema = Type.String({
  description: "Path to a local image file or a remote URL (http/https)",
});

export const VideoSourceSchema = Type.String({
  description: "Path to a local video file or a remote URL (http/https)",
});

export const PromptSchema = Type.Optional(Type.String({
  description: "Optional additional instructions for the analysis",
}));

// ---------------------------------------------------------------------------
// Image tool factory
// ---------------------------------------------------------------------------

export interface ImageToolConfig<TParams extends TSchema> {
  name: string;
  label: string;
  description: string;
  promptSnippet?: string;
  promptGuidelines?: string[];
  parameters: TParams;
  getSystemPrompt: (params: Static<TParams>) => string;
  buildUserPrompt: (params: Static<TParams>) => string;
  imageParamKeys: string[];
}

const MAX_IMAGES = 10;

export function createImageTool<TParams extends TSchema>(
  config: ImageToolConfig<TParams>,
): ToolDefinition<TParams, ImageToolDetails | ErrorToolDetails> {
  return defineTool<TParams, ImageToolDetails | ErrorToolDetails>({
    name: config.name,
    label: config.label,
    description: config.description,
    promptSnippet: config.promptSnippet,
    promptGuidelines: config.promptGuidelines,
    parameters: config.parameters,

    async execute(
      _toolCallId: string,
      params: Static<TParams>,
      signal: AbortSignal | undefined,
      onUpdate: AgentToolUpdateCallback<ImageToolDetails | ErrorToolDetails> | undefined,
      _ctx: ExtensionContext,
    ) {
      // Validate image param keys exist
      for (const key of config.imageParamKeys) {
        if (!(key in (params as Record<string, unknown>))) {
          const err = new VisionError(
            'INVALID_CONFIG',
            `Missing required image parameter: "${key}"`,
          );
          return makeErrorResult(config.name, err);
        }
      }

      if (config.imageParamKeys.length > MAX_IMAGES) {
        const err = new VisionError(
          'INVALID_CONFIG',
          `Too many images: ${config.imageParamKeys.length} (max ${MAX_IMAGES})`,
        );
        return makeErrorResult(config.name, err);
      }

      const userPrompt = config.buildUserPrompt(params);
      const systemPrompt = config.getSystemPrompt(params);

      // Emit progress update
      onUpdate?.({
        content: [{ type: "text", text: `${config.label}: resolving images...` }],
        details: {
          toolName: config.name,
          userPrompt,
          systemPrompt,
          imageCount: config.imageParamKeys.length,
          imageSources: [],
        },
      });

      try {
        // Resolve all images in parallel
        const rawSources = config.imageParamKeys.map(
          (k) => (params as Record<string, string>)[k],
        );
        const imageContents = await Promise.all(
          rawSources.map((src) => resolveImageSource(src)),
        );

        onUpdate?.({
          content: [{ type: "text", text: `${config.label}: analyzing...` }],
          details: {
            toolName: config.name,
            userPrompt,
            systemPrompt,
            imageCount: imageContents.length,
            imageSources: rawSources,
          },
        });

        const resultText = await visionAnalyze(
          systemPrompt,
          userPrompt,
          imageContents,
          { signal },
        );

        return {
          content: [{ type: "text", text: resultText }],
          details: {
            toolName: config.name,
            userPrompt,
            systemPrompt,
            imageCount: imageContents.length,
            imageSources: rawSources,
          },
        };
      } catch (err) {
        if (err instanceof VisionError) {
          return makeErrorResult(config.name, err);
        }
        const generic = new VisionError(
          'API_ERROR',
          err instanceof Error ? err.message : String(err),
        );
        return makeErrorResult(config.name, generic);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Video tool factory
// ---------------------------------------------------------------------------

export interface VideoToolConfig<TParams extends TSchema> {
  name: string;
  label: string;
  description: string;
  promptSnippet?: string;
  promptGuidelines?: string[];
  parameters: TParams;
  buildUserPrompt: (params: Static<TParams>) => string;
  videoParamKey: string;
}

export function createVideoTool<TParams extends TSchema>(
  config: VideoToolConfig<TParams>,
): ToolDefinition<TParams, VideoToolDetails | ErrorToolDetails> {
  return defineTool<TParams, VideoToolDetails | ErrorToolDetails>({
    name: config.name,
    label: config.label,
    description: config.description,
    promptSnippet: config.promptSnippet,
    promptGuidelines: config.promptGuidelines,
    parameters: config.parameters,

    async execute(
      _toolCallId: string,
      params: Static<TParams>,
      signal: AbortSignal | undefined,
      onUpdate: AgentToolUpdateCallback<VideoToolDetails | ErrorToolDetails> | undefined,
      _ctx: ExtensionContext,
    ) {
      if (!(config.videoParamKey in (params as Record<string, unknown>))) {
        const err = new VisionError(
          'INVALID_CONFIG',
          `Missing required video parameter: "${config.videoParamKey}"`,
        );
        return makeErrorResult(config.name, err);
      }

      const userPrompt = config.buildUserPrompt(params);
      const rawSource = (params as Record<string, string>)[config.videoParamKey];

      onUpdate?.({
        content: [{ type: "text", text: `${config.label}: resolving video...` }],
        details: {
          toolName: config.name,
          userPrompt,
          videoSource: rawSource,
        },
      });

      try {
        const videoContent = await resolveVideoSource(rawSource);

        onUpdate?.({
          content: [{ type: "text", text: `${config.label}: analyzing...` }],
          details: {
            toolName: config.name,
            userPrompt,
            videoSource: rawSource,
          },
        });

        const resultText = await videoAnalyze(
          "", // no system prompt for video (matches MCP behavior)
          userPrompt,
          videoContent,
          { signal },
        );

        return {
          content: [{ type: "text", text: resultText }],
          details: {
            toolName: config.name,
            userPrompt,
            videoSource: rawSource,
          },
        };
      } catch (err) {
        if (err instanceof VisionError) {
          return makeErrorResult(config.name, err);
        }
        const generic = new VisionError(
          'API_ERROR',
          err instanceof Error ? err.message : String(err),
        );
        return makeErrorResult(config.name, generic);
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Shared error result builder
// ---------------------------------------------------------------------------

function makeErrorResult(toolName: string, err: VisionError): { content: Array<{ type: "text"; text: string }>; details: ErrorToolDetails } {
  return {
    content: [{ type: "text", text: `Error: ${err.message}` }],
    details: {
      toolName,
      errorCode: err.code,
      errorMessage: err.message,
      userPrompt: "",
    },
  };
}
