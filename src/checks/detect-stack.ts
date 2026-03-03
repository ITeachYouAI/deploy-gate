import { readFileSync, existsSync } from "fs";
import { join } from "path";
import type { Stack } from "../types.js";

export function detectStack(projectPath: string): Stack[] {
  const stacks: Stack[] = ["core"];

  const pkgPath = join(projectPath, "package.json");
  if (existsSync(pkgPath)) {
    try {
      const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
      const allDeps = { ...pkg.dependencies, ...pkg.devDependencies };
      if (allDeps["expo"] || allDeps["react-native"]) stacks.push("mobile");
      if (allDeps["next"] || allDeps["@remix-run/node"] || allDeps["nuxt"]) stacks.push("web");
    } catch {
      // Invalid package.json — skip
    }
  }

  if (existsSync(join(projectPath, "go.mod"))) stacks.push("cli");

  // Check for systemd service files or infra markers
  if (
    existsSync(join(projectPath, "systemd")) ||
    existsSync(join(projectPath, "docker-compose.yml")) ||
    existsSync(join(projectPath, "Dockerfile"))
  ) {
    stacks.push("infra");
  }

  return [...new Set(stacks)];
}
