/**
 * Tool: understand_technical_diagram — Diagram analysis
 */

import { Type, StringEnum } from "@earendil-works/pi-ai";
import { createImageTool, ImageSourceSchema, PromptSchema } from "../shared/tool-factory.js";
import { getDiagramUnderstandingPrompt } from "../prompts.js";

const DiagramTypeEnum = StringEnum(["architecture", "uml", "flowchart", "er", "network", "sequence", "other"] as const);

const UnderstandDiagramParams = Type.Object({
  image_source: ImageSourceSchema,
  prompt: PromptSchema,
  diagram_type: Type.Optional(DiagramTypeEnum),
});

export const understandDiagramTool = createImageTool({
  name: "understand_technical_diagram",
  label: "Understand Technical Diagram",
  description: "Analyze architecture, UML, flowchart, ER, or network diagrams.",
  parameters: UnderstandDiagramParams,
  getSystemPrompt: () => getDiagramUnderstandingPrompt(),
  buildUserPrompt: (params) => {
    let prompt = params.prompt ?? "Explain this technical diagram in detail.";
    if (params.diagram_type) {
      prompt += `\n\nNote: This appears to be a ${params.diagram_type} diagram.`;
    }
    return prompt;
  },
  imageParamKeys: ["image_source"],
});
