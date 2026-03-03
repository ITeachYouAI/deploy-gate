#!/usr/bin/env node
import { copyFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const args = process.argv.slice(2);
const command = args[0];

if (command === "install-hooks") {
  const hookDir = join(process.env.HOME || "~", ".claude", "hooks");
  const hookSrc = join(__dirname, "..", "hooks", "pre-deploy-gate.sh");
  const hookDest = join(hookDir, "pre-deploy-gate.sh");

  if (!existsSync(hookDir)) mkdirSync(hookDir, { recursive: true });

  copyFileSync(hookSrc, hookDest);
  console.log(`Hook installed to ${hookDest}`);
  console.log("Deploy commands will now be gated by the checklist.");
} else {
  console.log("Usage: deploy-gate <command>");
  console.log("");
  console.log("Commands:");
  console.log("  install-hooks  Install the pre-deploy hook for Claude Code");
  console.log("");
  console.log("For MCP server mode, add to your Claude Code config:");
  console.log(
    '  { "mcpServers": { "deploy-gate": { "command": "npx", "args": ["@iteachyouai/deploy-gate"] } } }',
  );
}
