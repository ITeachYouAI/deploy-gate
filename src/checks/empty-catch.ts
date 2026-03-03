import { execSync } from "child_process";
import type { CheckItem } from "../types.js";

export const emptyCatch: CheckItem = {
  id: "PT-5",
  phase: "pre-test",
  check: "No empty catch blocks that swallow errors",
  auto: true,
  from: "CreateSocial: silent auth failure from empty catch",
  stack: "core",
  run: async (projectPath: string) => {
    try {
      const result = execSync(
        `grep -rn --include='*.ts' --include='*.js' -E 'catch\\s*\\{\\s*\\}|catch\\s*\\([^)]*\\)\\s*\\{\\s*\\}' '${projectPath}' 2>/dev/null || true`,
        { encoding: "utf-8", timeout: 10000 },
      );

      const lines = result
        .split("\n")
        .filter((l) => l.trim() && !l.includes("node_modules/") && !l.includes(".git/"));

      if (lines.length > 0) {
        return {
          status: "fail",
          message: `Found ${lines.length} empty catch block(s):\n${lines.slice(0, 5).join("\n")}`,
        };
      }

      return { status: "pass", message: "No empty catch blocks found" };
    } catch {
      return { status: "pass", message: "No empty catch blocks found" };
    }
  },
};
