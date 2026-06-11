/**
 * Tool: extract_text_from_screenshot — OCR / text extraction
 */

import { Type } from "@earendil-works/pi-ai";
import { createImageTool, ImageSourceSchema, PromptSchema } from "../shared/tool-factory.js";
import { getTextExtractionPrompt } from "../prompts.js";

const ExtractTextParams = Type.Object({
  image_source: ImageSourceSchema,
  prompt: PromptSchema,
  programming_language: Type.Optional(Type.String({
    description: "Programming language hint for code extraction (e.g. 'python', 'javascript')",
  })),
});

export const extractTextTool = createImageTool({
  name: "extract_text_from_screenshot",
  label: "Extract Text from Screenshot",
  description: "Extract and transcribe all visible text from a screenshot, preserving formatting.",
  parameters: ExtractTextParams,
  getSystemPrompt: () => getTextExtractionPrompt(),
  buildUserPrompt: (params) => {
    let prompt = params.prompt ?? "Extract all visible text from this screenshot, preserving formatting.";
    if (params.programming_language) {
      prompt += `\n\nNote: The code appears to be in ${params.programming_language}.`;
    }
    return prompt;
  },
  imageParamKeys: ["image_source"],
});
