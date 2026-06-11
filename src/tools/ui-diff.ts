/**
 * Tool: ui_diff_check — Visual regression / diff between two UI screenshots
 */

import { Type } from "@earendil-works/pi-ai";
import { createImageTool, PromptSchema } from "../shared/tool-factory.js";
import { getUiDiffCheckPrompt } from "../prompts.js";

const UiDiffParams = Type.Object({
  expected_image: Type.String({
    description: "Path or URL to the expected/reference UI screenshot",
  }),
  actual_image: Type.String({
    description: "Path or URL to the actual/current UI screenshot",
  }),
  prompt: PromptSchema,
});

export const uiDiffTool = createImageTool({
  name: "ui_diff_check",
  label: "UI Diff Check",
  description: "Compare expected vs actual UI screenshots to find visual differences.",
  parameters: UiDiffParams,
  getSystemPrompt: () => getUiDiffCheckPrompt(),
  buildUserPrompt: (params) => params.prompt ?? "Compare these two UI screenshots and identify all visual differences.",
  imageParamKeys: ["expected_image", "actual_image"],
});
