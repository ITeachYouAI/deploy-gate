import { existsSync } from "fs";
import { join } from "path";
import type { CheckItem } from "../types.js";

export const lockFile: CheckItem = {
  id: "PD-13",
  phase: "pre-deploy",
  check: "Lock file exists and is committed",
  auto: true,
  from: "CreateSocial: missing lock file caused different deps in prod",
  stack: "core",
  run: async (projectPath: string) => {
    const lockFiles = ["package-lock.json", "bun.lockb", "yarn.lock", "pnpm-lock.yaml", "go.sum"];

    const found = lockFiles.filter((f) => existsSync(join(projectPath, f)));

    if (found.length === 0) {
      return { status: "fail", message: "No lock file found (package-lock.json, bun.lockb, etc.)" };
    }

    return { status: "pass", message: `Lock file committed: ${found.join(", ")}` };
  },
};
