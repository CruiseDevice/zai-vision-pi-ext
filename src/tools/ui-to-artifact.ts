/**
 * Tool: ui_to_artifact — Convert UI screenshots to code / prompt / spec / description
 */

import { Type, StringEnum } from "@earendil-works/pi-ai";
import { createImageTool, ImageSourceSchema, PromptSchema } from "../shared/tool-factory.js";
import { getUiToArtifactPrompt } from "../prompts.js";

const OutputTypeEnum = StringEnum(["code", "prompt", "spec", "description"] as const);

const UiToArtifactParams = Type.Object({
  image_source: ImageSourceSchema,
  output_type: OutputTypeEnum,
  prompt: PromptSchema,
});

export const uiToArtifactTool = createImageTool({
  name: "ui_to_artifact",
  label: "UI to Artifact",
  description: "Convert UI screenshots into code, prompts, design specs, or descriptions.",
  parameters: UiToArtifactParams,
  getSystemPrompt: (params) => getUiToArtifactPrompt(params.output_type),
  buildUserPrompt: (params) => params.prompt ?? "Analyze this UI screenshot and generate the requested artifact.",
  imageParamKeys: ["image_source"],
});
