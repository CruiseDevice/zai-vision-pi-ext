# Z.AI Vision Pi Extension

> 8 vision AI tools for the [pi coding agent](https://github.com/earendil-works/pi-coding-agent), powered by Z.AI / Zhipu AI (GLM-4.6v, GLM-4.5v).

## Features

- **Analyze images**, screenshots, diagrams, charts, and videos
- **Extract text / OCR** from screenshots with formatting preserved
- **Diagnose error screenshots** with root-cause analysis and suggested fixes
- **Convert UI mockups** to code, prompts, specs, or descriptions
- **Visual regression testing** — compare expected vs actual UI screenshots
- **Local files** are auto base64-encoded; **remote URLs** pass through directly
- **Auto-retry** with exponential backoff on rate limits and transient errors
- **AbortSignal support** — long-running analysis can be cancelled mid-flight

## Installation

### Global install
```bash
# Copy the extension into pi's global extensions folder
cp -r $(pwd) ~/.pi/agent/extensions/zai-vision/
```

### Project-local install
```bash
# Copy into the current project's pi extensions directory
cp -r $(pwd) .pi/extensions/zai-vision/
```

### Symlink for development
```bash
# Live reload as you edit
ln -s $(pwd) ~/.pi/agent/extensions/zai-vision
```

After installing, restart pi or run `/reload` to load the extension.

## Configuration

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `Z_AI_API_KEY` | ✅ | — | API key from [Z.AI](https://z.ai) or [Zhipu](https://open.bigmodel.cn) |
| `Z_AI_MODE` | ❌ | `ZAI` | Platform: `ZAI` (https://api.z.ai) or `ZHIPU` (https://open.bigmodel.cn) |

Set them in your shell profile or before launching pi:

```bash
export Z_AI_API_KEY="sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export Z_AI_MODE="ZAI"   # or "ZHIPU"
```

The extension validates the key on session start and shows a warning notification if it is missing or looks like a placeholder.

### Platform defaults

| Mode | Base URL | Default Model |
|------|----------|---------------|
| `ZAI` | `https://api.z.ai/api/paas/v4/` | `glm-4.6v` |
| `ZHIPU` | `https://open.bigmodel.cn/api/paas/v4/` | `glm-4.6v` |

## Available Tools

### `analyze_image`
General-purpose image understanding — identify objects, scenes, text, and answer open-ended questions.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_source` | `string` | ✅ | Path to a local image file or a remote URL (http/https) |
| `prompt` | `string` | ❌ | Optional additional instructions for the analysis |

**Example use case:** "What objects are in this photo?" / `~/Downloads/photo.png`

---

### `extract_text_from_screenshot`
Extract and transcribe all visible text from a screenshot while preserving layout and formatting.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_source` | `string` | ✅ | Path or URL to the screenshot |
| `prompt` | `string` | ❌ | Optional instructions (e.g. "only the code block") |
| `programming_language` | `string` | ❌ | Language hint for better code extraction (e.g. `python`, `typescript`) |

**Example use case:** "Extract the Python code from this terminal screenshot."

---

### `diagnose_error_screenshot`
Analyze error screenshots (stack traces, dialog boxes, browser consoles) to identify root cause and suggest fixes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_source` | `string` | ✅ | Path or URL to the error screenshot |
| `prompt` | `string` | ❌ | Specific question about the error |
| `context` | `string` | ❌ | Additional context about what was happening when the error occurred |

**Example use case:** "Why is this TypeError happening?" with context: "I just upgraded React to 19."

---

### `understand_technical_diagram`
Explain architecture diagrams, UML, flowcharts, ER diagrams, network topologies, and sequence diagrams.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_source` | `string` | ✅ | Path or URL to the diagram |
| `prompt` | `string` | ❌ | Optional focus instructions |
| `diagram_type` | `enum` | ❌ | One of: `architecture`, `uml`, `flowchart`, `er`, `network`, `sequence`, `other` |

**Example use case:** "Explain this microservices architecture diagram."

---

### `analyze_data_visualization`
Extract insights from charts, dashboards, plots, and data visualizations.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_source` | `string` | ✅ | Path or URL to the chart / dashboard |
| `prompt` | `string` | ❌ | Optional instructions |
| `analysis_focus` | `enum` | ❌ | One of: `trends`, `anomalies`, `comparisons`, `metrics`, `comprehensive` |

**Example use case:** "What trends does this Grafana dashboard show?" with `analysis_focus: trends`

---

### `ui_to_artifact`
Convert a UI screenshot or mockup into a concrete artifact.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `image_source` | `string` | ✅ | Path or URL to the UI screenshot |
| `output_type` | `enum` | ✅ | `code`, `prompt`, `spec`, or `description` |
| `prompt` | `string` | ❌ | Optional extra instructions |

**Example use cases:**
- `output_type: code` → "Turn this Figma mockup into React + Tailwind."
- `output_type: spec` → "Write a design spec for this settings page."
- `output_type: prompt` → "Generate an image-generation prompt that recreates this UI."

---

### `ui_diff_check`
Compare two UI screenshots (expected vs actual) and report visual differences.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `expected_image` | `string` | ✅ | Path or URL to the reference / expected screenshot |
| `actual_image` | `string` | ✅ | Path or URL to the actual / current screenshot |
| `prompt` | `string` | ❌ | Optional focus (e.g. "only compare the header") |

**Example use case:** "Compare `expected.png` vs `actual.png` and list all visual regressions."

---

### `analyze_video`
Analyze video content and answer questions about events, characters, actions, and scenes.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `video_source` | `string` | ✅ | Path to a local video file or a remote URL |
| `prompt` | `string` | ❌ | Optional instructions for the analysis |

**Supported formats:** `.mp4`, `.mov`, `.mkv`  
**Size limits:** images ≤ 5 MB; videos ≤ 50 MB (local base64), 200 MB (remote URL)

**Example use case:** "Describe what happens in this 10-second screen recording."

## Usage Examples

These are typical conversational invocations — pi decides which tool to call based on your message.

```
User: analyze this screenshot: ~/Downloads/error.png
→ pi calls diagnose_error_screenshot

User: turn this mockup into React: https://example.com/mockup.png
→ pi calls ui_to_artifact with output_type=code

User: compare expected.png vs actual.png
→ pi calls ui_diff_check

User: extract the code from this screenshot
→ pi calls extract_text_from_screenshot

User: what's in this video? ~/Downloads/demo.mp4
→ pi calls analyze_video

User: explain this architecture diagram
→ pi calls understand_technical_diagram
```

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `⚠️ MISSING_API_KEY` notification | `Z_AI_API_KEY` not set | Export the env var and restart pi |
| `⚠️ INVALID_API_KEY` | Key is wrong, expired, or a placeholder | Regenerate at [Z.AI](https://z.ai/manage-apikey/apikey-list) or [Zhipu](https://open.bigmodel.cn) console |
| `Error: File too large` | Image > 5 MB or video > 50 MB (local) | Compress, resize, or use a remote URL |
| `Error: Unsupported format` | Wrong file extension | Convert to `.png`, `.jpg`, `.jpeg`, `.mp4`, `.mov`, or `.mkv` |
| `Error: Rate limited after retries` | Too many requests | Wait a moment and retry |
| `Error: TIMEOUT` | Request exceeded 5 minutes | Retry with a smaller image/video or shorter prompt |
| Tool returns generic `API_ERROR` | Bad request or server error | Check that URLs are publicly accessible and the file isn't corrupted |

### Checking status
Run `/zai` in pi to see the current configuration, model, and API key mask:

```
/zai
→ Z.AI Vision Extension — v0.1.0
  Platform:    ZAI
  Base URL:    https://api.z.ai/api/paas/v4/
  Model:       glm-4.6v
  API Key:     sk-abcd1...9xyz
  Timeout:     300s
  Max tokens:  32,768
  Status:      ✅ Ready
```

## Development

```bash
# Install dev dependencies
npm install

# Type check
npx tsc --noEmit

# Reload extension in pi after edits
/reload
```

### Project structure

```
src/
├── index.ts              # Entry point — registers tools + /zai command
├── config.ts             # Env validation (Z_AI_API_KEY, Z_AI_MODE)
├── api.ts                # HTTP client with retry, abort, timeout
├── file-service.ts       # Local file validation + base64 encoding
├── prompts.ts            # System prompts per tool category
├── shared/
│   ├── types.ts          # Shared interfaces and VisionError
│   └── tool-factory.ts   # createImageTool / createVideoTool factory
└── tools/
    ├── general-image.ts
    ├── text-extraction.ts
    ├── error-diagnosis.ts
    ├── diagram-analysis.ts
    ├── data-viz.ts
    ├── ui-to-artifact.ts
    ├── ui-diff.ts
    └── video-analysis.ts
```

## License

Apache-2.0
