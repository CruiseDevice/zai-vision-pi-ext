# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-06-10

### Added
- Initial release with 8 vision AI tools for the pi coding agent:
  - `analyze_image` — general-purpose image understanding
  - `extract_text_from_screenshot` — OCR and code extraction with formatting preserved
  - `diagnose_error_screenshot` — root-cause analysis from error screenshots
  - `understand_technical_diagram` — architecture, UML, flowchart, ER, network, and sequence diagram analysis
  - `analyze_data_visualization` — insight extraction from charts and dashboards
  - `ui_to_artifact` — convert UI mockups to code, prompts, specs, or descriptions
  - `ui_diff_check` — visual regression testing comparing expected vs actual screenshots
  - `analyze_video` — video content analysis (local base64 or remote URL)
- Dual platform support: Z.AI (`https://api.z.ai`) and Zhipu (`https://open.bigmodel.cn`)
- Environment-based configuration via `Z_AI_API_KEY` and `Z_AI_MODE`
- Auto base64 encoding for local image and video files
- Client-side validation for file size (images ≤ 5 MB, videos ≤ 50 MB) and format allow-lists
- Auto-retry with exponential backoff for rate limits (429) and transient server errors (5xx)
- AbortSignal support for cancelling long-running analysis mid-flight
- `/zai` status command showing configuration, model, and API key mask
- Session-start validation with warning notifications for missing or placeholder API keys
- Comprehensive README with installation, configuration, tool documentation, and troubleshooting
- Manual testing protocol with synthetic fixture generation and 32 test cases
- Programmatic test fixture generator (`scripts/generate-fixtures.js`) using pure Node.js (no external image dependencies)

[0.1.0]: https://github.com/earendil-works/zai-vision-pi-ext/releases/tag/v0.1.0
