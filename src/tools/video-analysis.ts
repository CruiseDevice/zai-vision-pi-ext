/**
 * Tool: analyze_video — Video content analysis
 */

import { Type } from "@earendil-works/pi-ai";
import { createVideoTool, VideoSourceSchema, PromptSchema } from "../shared/tool-factory.js";

const AnalyzeVideoParams = Type.Object({
  video_source: VideoSourceSchema,
  prompt: PromptSchema,
});

export const analyzeVideoTool = createVideoTool({
  name: "analyze_video",
  label: "Analyze Video",
  description: "Analyze video content and answer questions about what happens in it.",
  parameters: AnalyzeVideoParams,
  buildUserPrompt: (params) => params.prompt ?? "Analyze this video and describe its content.",
  videoParamKey: "video_source",
});
