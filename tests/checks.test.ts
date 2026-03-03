import { describe, it, expect } from "vitest";
import { join } from "path";
import { secretScan } from "../src/checks/secret-scan.js";
import { emptyCatch } from "../src/checks/empty-catch.js";
import { deadForms } from "../src/checks/dead-forms.js";
import { testCoverageMap } from "../src/checks/test-coverage-map.js";
import { lockFile } from "../src/checks/lock-file.js";
import { gitClean } from "../src/checks/git-clean.js";
import { goVet } from "../src/checks/go-vet.js";

const FIXTURES = join(import.meta.dirname, "fixtures");
const CLEAN = join(FIXTURES, "clean-project");
const DIRTY = join(FIXTURES, "dirty-project");

describe("secretScan", () => {
  it("passes on clean project", async () => {
    const result = await secretScan.run!(CLEAN);
    expect(result.status).toBe("pass");
  });

  it("has correct metadata", () => {
    expect(secretScan.id).toBe("PD-3");
    expect(secretScan.phase).toBe("pre-deploy");
    expect(secretScan.auto).toBe(true);
  });
});

describe("emptyCatch", () => {
  it("passes on clean project", async () => {
    const result = await emptyCatch.run!(CLEAN);
    expect(result.status).toBe("pass");
  });

  it("fails on dirty project with empty catch blocks", async () => {
    const result = await emptyCatch.run!(DIRTY);
    expect(result.status).toBe("fail");
    expect(result.message).toMatch(/empty catch/);
  });
});

describe("deadForms", () => {
  it("passes on clean project", async () => {
    const result = await deadForms.run!(CLEAN);
    expect(result.status).toBe("pass");
  });

  it('fails on dirty project with action=""', async () => {
    const result = await deadForms.run!(DIRTY);
    expect(result.status).toBe("fail");
    expect(result.message).toMatch(/dead form/);
  });
});

describe("testCoverageMap", () => {
  it("flags files without tests", async () => {
    const result = await testCoverageMap.run!(DIRTY);
    expect(result.status).toBe("fail");
    expect(result.message).toMatch(/without tests/);
  });

  it("skips when no src directory", async () => {
    const result = await testCoverageMap.run!(join(FIXTURES, "go-project"));
    expect(result.status).toBe("skip");
  });
});

describe("lockFile", () => {
  it("passes when lock file exists", async () => {
    const result = await lockFile.run!(CLEAN);
    expect(result.status).toBe("pass");
    expect(result.message).toMatch(/package-lock/);
  });

  it("fails when no lock file", async () => {
    const result = await lockFile.run!(DIRTY);
    expect(result.status).toBe("fail");
  });
});

describe("gitClean", () => {
  it("skips for non-git directories", async () => {
    const result = await gitClean.run!(CLEAN);
    expect(result.status).toBe("skip");
  });

  it("has correct metadata", () => {
    expect(gitClean.id).toBe("PD-0");
    expect(gitClean.phase).toBe("pre-deploy");
  });
});

describe("goVet", () => {
  it("skips when no go.mod", async () => {
    const result = await goVet.run!(CLEAN);
    expect(result.status).toBe("skip");
  });

  it("has correct metadata", () => {
    expect(goVet.id).toBe("C-PT-3");
    expect(goVet.phase).toBe("pre-test");
    expect(goVet.stack).toBe("cli");
  });
});
