import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { CheckItem } from "../types.js";

export const gitClean: CheckItem = {
  id: "PD-0",
  phase: "pre-deploy",
  check: "Git working tree is clean",
  auto: true,
  from: "Universal: uncommitted changes lost after deploy",
  stack: "core",
  run: async (projectPath: string) => {
    if (!existsSync(join(projectPath, ".git"))) {
      return { status: "skip", message: "Not a git repository" };
    }

    try {
      const status = execSync("git status --porcelain", {
        cwd: projectPath,
        encoding: "utf-8",
        timeout: 10000,
      }).trim();

      if (status) {
        const lines = status.split("\n");
        return {
          status: "fail",
          message: `${lines.length} uncommitted change(s):\n${lines.slice(0, 5).join("\n")}`,
        };
      }

      return { status: "pass", message: "Working tree clean" };
    } catch {
      return { status: "skip", message: "Could not check git status" };
    }
  },
};
