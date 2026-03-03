import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { createServer } from "../src/server.js";
import { join } from "path";

const FIXTURES = join(import.meta.dirname, "fixtures");
const CLEAN = join(FIXTURES, "clean-project");
const DIRTY = join(FIXTURES, "dirty-project");
const GO = join(FIXTURES, "go-project");

let client: Client;
let cleanup: () => Promise<void>;

beforeAll(async () => {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  const server = createServer();
  await server.connect(serverTransport);
  client = new Client({ name: "test-client", version: "1.0.0" }, { capabilities: {} });
  await client.connect(clientTransport);
  cleanup = async () => {
    await client.close();
    await server.close();
  };
});

afterAll(async () => {
  await cleanup();
});

function parseResult(result: { content: Array<{ type: string; text?: string }> }) {
  const text = result.content[0]?.text ?? "";
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

describe("list_tools", () => {
  it("returns all 4 tools", async () => {
    const { tools } = await client.listTools();
    expect(tools).toHaveLength(4);
    const names = tools.map((t) => t.name);
    expect(names).toContain("run_checklist");
    expect(names).toContain("check_deploy_ready");
    expect(names).toContain("detect_stack");
    expect(names).toContain("list_checks");
  });
});

describe("detect_stack", () => {
  it("detects core for clean-project", async () => {
    const result = await client.callTool({
      name: "detect_stack",
      arguments: { projectPath: CLEAN },
    });
    const data = parseResult(result);
    expect(data.stacks).toContain("core");
    expect(data.stacks).not.toContain("mobile");
  });

  it("detects cli for go-project", async () => {
    const result = await client.callTool({ name: "detect_stack", arguments: { projectPath: GO } });
    const data = parseResult(result);
    expect(data.stacks).toContain("cli");
  });

  it("returns error without projectPath", async () => {
    const result = await client.callTool({ name: "detect_stack", arguments: {} });
    expect(result.isError).toBe(true);
  });
});

describe("list_checks", () => {
  it("returns all checks with no filter", async () => {
    const result = await client.callTool({ name: "list_checks", arguments: {} });
    const data = parseResult(result);
    expect(data.count).toBeGreaterThanOrEqual(7);
    expect(data.items.some((i: { id: string }) => i.id === "PD-3")).toBe(true);
  });

  it("filters by phase", async () => {
    const result = await client.callTool({
      name: "list_checks",
      arguments: { phase: "pre-deploy" },
    });
    const data = parseResult(result);
    expect(data.items.every((i: { phase: string }) => i.phase === "pre-deploy")).toBe(true);
    expect(data.items.some((i: { id: string }) => i.id === "PD-3")).toBe(true);
  });

  it("filters by stack", async () => {
    const result = await client.callTool({ name: "list_checks", arguments: { stack: "cli" } });
    const data = parseResult(result);
    expect(data.items.every((i: { stack: string }) => i.stack === "cli")).toBe(true);
    expect(data.items.some((i: { id: string }) => i.id === "C-PT-3")).toBe(true);
  });

  it("filters by phase and stack together", async () => {
    const result = await client.callTool({
      name: "list_checks",
      arguments: { phase: "pre-test", stack: "cli" },
    });
    const data = parseResult(result);
    expect(
      data.items.every(
        (i: { phase: string; stack: string }) => i.phase === "pre-test" && i.stack === "cli",
      ),
    ).toBe(true);
  });
});

describe("run_checklist", () => {
  it("runs pre-deploy on clean project", async () => {
    const result = await client.callTool({
      name: "run_checklist",
      arguments: { phase: "pre-deploy", projectPath: CLEAN },
    });
    const data = parseResult(result);
    expect(data.stacks).toContain("core");
    expect(data.summary).toBeDefined();
    expect(typeof data.summary.pass).toBe("number");
    expect(typeof data.summary.fail).toBe("number");
    expect(typeof data.gateOpen).toBe("boolean");
  });

  it("detects empty catch in dirty project (pre-test)", async () => {
    const result = await client.callTool({
      name: "run_checklist",
      arguments: { phase: "pre-test", projectPath: DIRTY },
    });
    const data = parseResult(result);
    expect(data.summary.fail).toBeGreaterThan(0);
    expect(data.gateOpen).toBe(false);
    const ptResults = data.results.filter((r: { item: { id: string } }) => r.item.id === "PT-5");
    expect(ptResults.length).toBe(1);
    expect(ptResults[0].result.status).toBe("fail");
  });

  it("detects dead forms in dirty project (pre-deploy)", async () => {
    const result = await client.callTool({
      name: "run_checklist",
      arguments: { phase: "pre-deploy", projectPath: DIRTY },
    });
    const data = parseResult(result);
    const pdResults = data.results.filter((r: { item: { id: string } }) => r.item.id === "PD-9");
    expect(pdResults.length).toBe(1);
    expect(pdResults[0].result.status).toBe("fail");
  });

  it("detects missing lock file in dirty project", async () => {
    const result = await client.callTool({
      name: "run_checklist",
      arguments: { phase: "pre-deploy", projectPath: DIRTY },
    });
    const data = parseResult(result);
    const lockResults = data.results.filter((r: { item: { id: string } }) => r.item.id === "PD-13");
    expect(lockResults.length).toBe(1);
    expect(lockResults[0].result.status).toBe("fail");
  });

  it("lock file passes for clean project", async () => {
    const result = await client.callTool({
      name: "run_checklist",
      arguments: { phase: "pre-deploy", projectPath: CLEAN },
    });
    const data = parseResult(result);
    const lockResults = data.results.filter((r: { item: { id: string } }) => r.item.id === "PD-13");
    expect(lockResults.length).toBe(1);
    expect(lockResults[0].result.status).toBe("pass");
  });

  it("runs all phases", async () => {
    const result = await client.callTool({
      name: "run_checklist",
      arguments: { phase: "all", projectPath: CLEAN },
    });
    const data = parseResult(result);
    // "all" should run checks from all phases
    const phases = new Set(data.results.map((r: { item: { phase: string } }) => r.item.phase));
    expect(phases.size).toBeGreaterThanOrEqual(2);
  });

  it("returns error without projectPath", async () => {
    const result = await client.callTool({
      name: "run_checklist",
      arguments: { phase: "pre-deploy" },
    });
    expect(result.isError).toBe(true);
  });
});

describe("check_deploy_ready", () => {
  it("reports ready for clean project (pre-deploy checks)", async () => {
    const result = await client.callTool({
      name: "check_deploy_ready",
      arguments: { projectPath: CLEAN },
    });
    const data = parseResult(result);
    expect(typeof data.ready).toBe("boolean");
    expect(data.summary).toBeDefined();
    expect(data.reason).toBeDefined();
  });

  it("reports not ready for dirty project", async () => {
    const result = await client.callTool({
      name: "check_deploy_ready",
      arguments: { projectPath: DIRTY },
    });
    const data = parseResult(result);
    expect(data.ready).toBe(false);
    expect(data.reason).toMatch(/failed/);
  });

  it("returns error without projectPath", async () => {
    const result = await client.callTool({
      name: "check_deploy_ready",
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });
});

describe("unknown tool", () => {
  it("returns error for unknown tool name", async () => {
    const result = await client.callTool({
      name: "nonexistent_tool",
      arguments: {},
    });
    expect(result.isError).toBe(true);
  });
});
