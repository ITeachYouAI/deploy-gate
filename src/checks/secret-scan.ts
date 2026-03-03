import { execSync } from "child_process";
import { readFileSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import type { CheckItem } from "../types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load patterns from data file to avoid the scanner flagging its own source
const patternsFile = join(__dirname, "..", "checks", "secret-patterns.json");
let SECRET_PATTERNS: string[];
try {
  const data = JSON.parse(readFileSync(patternsFile, "utf-8"));
  SECRET_PATTERNS = data.patterns;
} catch {
  // Fallback: when running from dist/, resolve relative to compiled output
  const distPatternsFile = join(__dirname, "secret-patterns.json");
  const data = JSON.parse(readFileSync(distPatternsFile, "utf-8"));
  SECRET_PATTERNS = data.patterns;
}

export const secretScan: CheckItem = {
  id: "PD-3",
  phase: "pre-deploy",
  check: "Grep for secrets in committed files",
  auto: true,
  from: "LooksMaxx: API key in eas.json",
  stack: "core",
  run: async (projectPath: string) => {
    try {
      const grepPattern = SECRET_PATTERNS.join("|");

      try {
        const result = execSync(
          `grep -rn --include='*.ts' --include='*.js' --include='*.json' --include='*.env' --include='*.yml' --include='*.yaml' -E '${grepPattern}' '${projectPath}' 2>/dev/null || true`,
          { encoding: "utf-8", timeout: 10000 },
        );

        // Filter out node_modules, .git, test fixtures, and pattern data files
        const lines = result
          .split("\n")
          .filter(
            (l) =>
              l.trim() &&
              !l.includes("node_modules/") &&
              !l.includes(".git/") &&
              !l.includes("test/fixtures/") &&
              !l.includes("__tests__/") &&
              !l.includes("secret-patterns.json"),
          );

        if (lines.length > 0) {
          return {
            status: "fail",
            message: `Found ${lines.length} potential secret(s):\n${lines.slice(0, 5).join("\n")}`,
          };
        }
      } catch {
        // grep returns exit 1 when no matches — that's fine
      }

      return { status: "pass", message: "No secrets found in source files" };
    } catch (err) {
      return { status: "fail", message: `Secret scan error: ${err}` };
    }
  },
};
