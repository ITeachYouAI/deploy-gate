import { readdirSync, existsSync } from "fs";
import { join, basename, extname } from "path";
import type { CheckItem } from "../types.js";

function findSourceFiles(dir: string, files: string[] = []): string[] {
  try {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.name === "node_modules" || entry.name === ".git" || entry.name === "dist") continue;
      const fullPath = join(dir, entry.name);
      if (entry.isDirectory()) {
        findSourceFiles(fullPath, files);
      } else if (
        (entry.name.endsWith(".ts") || entry.name.endsWith(".go")) &&
        !entry.name.endsWith(".test.ts") &&
        !entry.name.endsWith(".spec.ts") &&
        !entry.name.endsWith("_test.go") &&
        !entry.name.endsWith(".d.ts")
      ) {
        files.push(fullPath);
      }
    }
  } catch {
    // Directory not readable
  }
  return files;
}

export const testCoverageMap: CheckItem = {
  id: "PT-1",
  phase: "pre-test",
  check: "Every source file has a corresponding test file",
  auto: true,
  from: "devreap: 40% coverage presented as 'all tests pass'",
  stack: "core",
  run: async (projectPath: string) => {
    const srcDir = join(projectPath, "src");
    if (!existsSync(srcDir)) {
      return { status: "skip", message: "No src/ directory found" };
    }

    const sourceFiles = findSourceFiles(srcDir);
    const untested: string[] = [];

    for (const file of sourceFiles) {
      const ext = extname(file);
      const base = basename(file, ext);
      const dir = join(file, "..");

      // Check for test file in same dir, __tests__ subdir, or tests/ at project root
      const testPatterns = [
        join(dir, `${base}.test${ext}`),
        join(dir, `${base}.spec${ext}`),
        join(dir, "__tests__", `${base}.test${ext}`),
        join(projectPath, "tests", `${base}.test${ext}`),
        // Go convention
        join(dir, `${base}_test.go`),
      ];

      if (!testPatterns.some(existsSync)) {
        const relative = file.replace(projectPath + "/", "");
        // Skip index/barrel files and type-only files
        if (base !== "index" && base !== "types") {
          untested.push(relative);
        }
      }
    }

    if (untested.length > 0) {
      return {
        status: "fail",
        message: `${untested.length} source file(s) without tests:\n${untested.join("\n")}`,
      };
    }

    return { status: "pass", message: "All source files have corresponding test files" };
  },
};
