/**
 * Tool: analyze_image — General-purpose image analysis
 */

import { Type } from "@earendil-works/pi-ai";
import { createImageTool, ImageSourceSchema, PromptSchema } from "../shared/tool-factory.js";
import { getGeneralImageAnalysisPrompt } from "../prompts.js";

const AnalyzeImageParams = Type.Object({
  image_source: ImageSourceSchema,
  prompt: PromptSchema,
});

export const analyzeImageTool = createImageTool({
  name: "analyze_image",
  label: "Analyze Image",
  description: "Analyze any image and answer questions about its contents.",
  promptSnippet: "analyze_image <image_path_or_url> — general-purpose image understanding",
  parameters: AnalyzeImageParams,
  getSystemPrompt: () => getGeneralImageAnalysisPrompt(),
  buildUserPrompt: (params) => params.prompt ?? "Analyze this image in detail.",
  imageParamKeys: ["image_source"],
});
