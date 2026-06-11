/**
 * Tool: diagnose_error_screenshot — Error diagnosis
 */

import { Type } from "@earendil-works/pi-ai";
import { createImageTool, ImageSourceSchema, PromptSchema } from "../shared/tool-factory.js";
import { getErrorDiagnosisPrompt } from "../prompts.js";

const DiagnoseErrorParams = Type.Object({
  image_source: ImageSourceSchema,
  prompt: PromptSchema,
  context: Type.Optional(Type.String({
    description: "Additional context about what was happening when the error occurred",
  })),
});

export const diagnoseErrorTool = createImageTool({
  name: "diagnose_error_screenshot",
  label: "Diagnose Error Screenshot",
  description: "Analyze error screenshots to identify root cause and suggest fixes.",
  parameters: DiagnoseErrorParams,
  getSystemPrompt: () => getErrorDiagnosisPrompt(),
  buildUserPrompt: (params) => {
    let prompt = params.prompt ?? "Diagnose the error shown in this screenshot.";
    if (params.context) {
      prompt += `\n\nContext: ${params.context}`;
    }
    return prompt;
  },
  imageParamKeys: ["image_source"],
});
