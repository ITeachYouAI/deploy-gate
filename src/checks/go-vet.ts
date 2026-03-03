import { execSync } from "child_process";
import { existsSync } from "fs";
import { join } from "path";
import type { CheckItem } from "../types.js";

export const goVet: CheckItem = {
  id: "C-PT-3",
  phase: "pre-test",
  check: "go vet passes with no issues",
  auto: true,
  from: "devreap: go vet caught shadowed variables missed by tests",
  stack: "cli",
  run: async (projectPath: string) => {
    if (!existsSync(join(projectPath, "go.mod"))) {
      return { status: "skip", message: "No go.mod found" };
    }

    try {
      execSync("go vet ./...", {
        cwd: projectPath,
        encoding: "utf-8",
        timeout: 30000,
        stdio: ["pipe", "pipe", "pipe"],
      });
      return { status: "pass", message: "go vet clean" };
    } catch (err: unknown) {
      const stderr = (err as { stderr?: string }).stderr || String(err);
      return { status: "fail", message: `go vet issues:\n${stderr.slice(0, 500)}` };
    }
  },
};
