import { describe, it, expect } from "vitest";
import { detectStack } from "../src/checks/detect-stack.js";
import { join } from "path";
import { mkdtempSync, writeFileSync, mkdirSync, rmSync } from "fs";
import { tmpdir } from "os";

describe("detectStack", () => {
  it("returns core for empty directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      const stacks = detectStack(dir);
      expect(stacks).toEqual(["core"]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("detects mobile stack from expo dependency", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({ dependencies: { expo: "^51.0.0" } }),
      );
      const stacks = detectStack(dir);
      expect(stacks).toContain("core");
      expect(stacks).toContain("mobile");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("detects web stack from next dependency", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({ dependencies: { next: "^14.0.0" } }),
      );
      const stacks = detectStack(dir);
      expect(stacks).toContain("core");
      expect(stacks).toContain("web");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("detects cli stack from go.mod", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      writeFileSync(join(dir, "go.mod"), "module example.com/mycli\n\ngo 1.22\n");
      const stacks = detectStack(dir);
      expect(stacks).toContain("core");
      expect(stacks).toContain("cli");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("detects infra stack from Dockerfile", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      writeFileSync(join(dir, "Dockerfile"), "FROM node:20\n");
      const stacks = detectStack(dir);
      expect(stacks).toContain("core");
      expect(stacks).toContain("infra");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("detects infra stack from docker-compose.yml", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      writeFileSync(join(dir, "docker-compose.yml"), "version: '3'\n");
      const stacks = detectStack(dir);
      expect(stacks).toContain("infra");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("detects infra stack from systemd directory", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      mkdirSync(join(dir, "systemd"));
      const stacks = detectStack(dir);
      expect(stacks).toContain("infra");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("detects multiple stacks", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      writeFileSync(
        join(dir, "package.json"),
        JSON.stringify({
          dependencies: { expo: "^51.0.0", next: "^14.0.0" },
        }),
      );
      writeFileSync(join(dir, "Dockerfile"), "FROM node:20\n");
      const stacks = detectStack(dir);
      expect(stacks).toContain("core");
      expect(stacks).toContain("mobile");
      expect(stacks).toContain("web");
      expect(stacks).toContain("infra");
    } finally {
      rmSync(dir, { recursive: true });
    }
  });

  it("handles malformed package.json gracefully", () => {
    const dir = mkdtempSync(join(tmpdir(), "dg-test-"));
    try {
      writeFileSync(join(dir, "package.json"), "not valid json{{{");
      const stacks = detectStack(dir);
      expect(stacks).toEqual(["core"]);
    } finally {
      rmSync(dir, { recursive: true });
    }
  });
});
