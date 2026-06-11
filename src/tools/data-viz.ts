/**
 * Tool: analyze_data_visualization — Data visualization analysis
 */

import { Type, StringEnum } from "@earendil-works/pi-ai";
import { createImageTool, ImageSourceSchema, PromptSchema } from "../shared/tool-factory.js";
import { getDataVizAnalysisPrompt } from "../prompts.js";

const AnalysisFocusEnum = StringEnum(["trends", "anomalies", "comparisons", "metrics", "comprehensive"] as const);

const AnalyzeDataVizParams = Type.Object({
  image_source: ImageSourceSchema,
  prompt: PromptSchema,
  analysis_focus: Type.Optional(AnalysisFocusEnum),
});

export const analyzeDataVizTool = createImageTool({
  name: "analyze_data_visualization",
  label: "Analyze Data Visualization",
  description: "Extract insights from charts, dashboards, and data visualizations.",
  parameters: AnalyzeDataVizParams,
  getSystemPrompt: () => getDataVizAnalysisPrompt(),
  buildUserPrompt: (params) => {
    let prompt = params.prompt ?? "Analyze this data visualization and extract key insights.";
    if (params.analysis_focus) {
      prompt += `\n\nFocus on: ${params.analysis_focus}.`;
    }
    return prompt;
  },
  imageParamKeys: ["image_source"],
});
