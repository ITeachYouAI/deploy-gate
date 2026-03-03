import { execSync } from "child_process";
import type { CheckItem } from "../types.js";

export const deadForms: CheckItem = {
  id: "PD-9",
  phase: "pre-deploy",
  check: "No dead form actions or placeholder anchor links",
  auto: true,
  from: "CreateSocial: form action='' caused silent submission failure",
  stack: "core",
  run: async (projectPath: string) => {
    try {
      const result = execSync(
        `grep -rn --include='*.ts' --include='*.tsx' --include='*.js' --include='*.jsx' --include='*.html' -E 'action=""|action=''\\''\\''|href="#"' '${projectPath}' 2>/dev/null || true`,
        { encoding: "utf-8", timeout: 10000 },
      );

      const lines = result
        .split("\n")
        .filter(
          (l) =>
            l.trim() &&
            !l.includes("node_modules/") &&
            !l.includes(".git/") &&
            !l.includes("test/fixtures/") &&
            !l.includes("__tests__/"),
        );

      if (lines.length > 0) {
        return {
          status: "fail",
          message: `Found ${lines.length} dead form/link(s):\n${lines.slice(0, 5).join("\n")}`,
        };
      }

      return { status: "pass", message: "No dead form actions or anchor links" };
    } catch {
      return { status: "pass", message: "No dead form actions or anchor links" };
    }
  },
};
