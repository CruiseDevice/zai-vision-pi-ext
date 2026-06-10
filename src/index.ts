/**
 * Z.AI Vision Pi Extension — Entry Point
 *
 * Stub that loads the extension infrastructure, validates configuration
 * on session start, and registers the /zai status command.
 * Vision tools will be registered in Phase 3.
 */

import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { getConfig } from "./config.js";
import { VisionError } from "./shared/types.js";

export default function (pi: ExtensionAPI) {
  // -------------------------------------------------------------------------
  // Session start: validate config and notify user of any issues
  // -------------------------------------------------------------------------
  pi.on("session_start", async (_event, ctx) => {
    try {
      getConfig();
      // Config is valid — silently ready
    } catch (err) {
      if (err instanceof VisionError) {
        ctx.ui.notify(`Z.AI Vision: ${err.message}`, "warning");
      } else {
        ctx.ui.notify(
          `Z.AI Vision: unexpected error during initialization — ${
            err instanceof Error ? err.message : String(err)
          }`,
          "error",
        );
      }
    }
  });

  // -------------------------------------------------------------------------
  // /zai command — show current configuration status
  // -------------------------------------------------------------------------
  pi.registerCommand("zai", {
    description: "Show Z.AI Vision extension status and configuration",
    handler: async (_args, ctx) => {
      try {
        const config = getConfig();
        const lines = [
          `Z.AI Vision Extension — v0.1.0`,
          ``,
          `Platform:    ${config.mode}`,
          `Base URL:    ${config.baseUrl}`,
          `Model:       ${config.model}`,
          `API Key:     ${config.apiKey.slice(0, 8)}...${config.apiKey.slice(-4)}`,
          `Timeout:     ${config.timeoutMs / 1000}s`,
          `Max tokens:  ${config.maxTokens.toLocaleString()}`,
          ``,
          `Status:      ✅ Ready`,
        ];
        ctx.ui.notify(lines.join("\n"), "info");
      } catch (err) {
        if (err instanceof VisionError) {
          const lines = [
            `Z.AI Vision Extension — v0.1.0`,
            ``,
            `Status:      ⚠️  ${err.code}`,
            `Message:     ${err.message}`,
            ``,
            `Set Z_AI_API_KEY in your environment to enable vision tools.`,
          ];
          ctx.ui.notify(lines.join("\n"), "warning");
        } else {
          ctx.ui.notify(
            `Z.AI Vision: unexpected error — ${
              err instanceof Error ? err.message : String(err)
            }`,
            "error",
          );
        }
      }
    },
  });
}
