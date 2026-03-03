import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { detectStack } from "./checks/detect-stack.js";
import { checks } from "./checks/index.js";
import type { Phase, ChecklistResult } from "./types.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const pkg = JSON.parse(readFileSync(join(__dirname, "..", "package.json"), "utf-8"));

const PHASES: Phase[] = ["pre-eng", "pre-test", "pre-deploy"];

async function runChecklist(phase: Phase | "all", projectPath: string): Promise<ChecklistResult> {
  const stacks = detectStack(projectPath);
  const phases = phase === "all" ? PHASES : [phase as Phase];

  const applicableChecks = checks.filter(
    (c) => phases.includes(c.phase) && stacks.includes(c.stack),
  );

  const results = await Promise.all(
    applicableChecks.map(async (item) => {
      if (!item.run) {
        return { item, result: { status: "manual" as const, message: "Manual check required" } };
      }
      try {
        const result = await item.run(projectPath);
        return { item, result };
      } catch (err) {
        return { item, result: { status: "fail" as const, message: `Check error: ${err}` } };
      }
    }),
  );

  const summary = {
    pass: results.filter((r) => r.result.status === "pass").length,
    fail: results.filter((r) => r.result.status === "fail").length,
    skip: results.filter((r) => r.result.status === "skip").length,
    manual: results.filter((r) => r.result.status === "manual").length,
    info: results.filter((r) => r.result.status === "info").length,
  };

  return {
    phase: phase === "all" ? "pre-deploy" : phase,
    stacks,
    results,
    summary,
    gateOpen: summary.fail === 0,
  };
}

export { runChecklist };

export function createServer() {
  const server = new Server(
    { name: "deploy-gate", version: pkg.version },
    { capabilities: { tools: {} } },
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      {
        name: "run_checklist",
        description: "Run pre-deploy checklist checks against a project",
        inputSchema: {
          type: "object" as const,
          properties: {
            phase: {
              type: "string",
              enum: ["pre-eng", "pre-test", "pre-deploy", "all"],
              description: "Which phase to run",
            },
            projectPath: {
              type: "string",
              description: "Absolute path to the project directory",
            },
          },
          required: ["phase", "projectPath"],
        },
      },
      {
        name: "check_deploy_ready",
        description:
          "Quick check if a project is ready to deploy (has passing pre-deploy checklist)",
        inputSchema: {
          type: "object" as const,
          properties: {
            projectPath: {
              type: "string",
              description: "Absolute path to the project directory",
            },
          },
          required: ["projectPath"],
        },
      },
      {
        name: "detect_stack",
        description: "Detect the technology stack of a project",
        inputSchema: {
          type: "object" as const,
          properties: {
            projectPath: {
              type: "string",
              description: "Absolute path to the project directory",
            },
          },
          required: ["projectPath"],
        },
      },
      {
        name: "list_checks",
        description: "List available checklist items, optionally filtered by phase and stack",
        inputSchema: {
          type: "object" as const,
          properties: {
            phase: {
              type: "string",
              enum: ["pre-eng", "pre-test", "pre-deploy"],
              description: "Filter by phase",
            },
            stack: {
              type: "string",
              enum: ["core", "mobile", "web", "infra", "cli"],
              description: "Filter by stack",
            },
          },
        },
      },
    ],
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    switch (name) {
      case "run_checklist": {
        const phase = (args?.phase as string) || "all";
        const projectPath = args?.projectPath as string;
        if (!projectPath) {
          return {
            content: [{ type: "text", text: "Error: projectPath is required" }],
            isError: true,
          };
        }
        const result = await runChecklist(phase as Phase | "all", projectPath);
        return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
      }

      case "check_deploy_ready": {
        const projectPath = args?.projectPath as string;
        if (!projectPath) {
          return {
            content: [{ type: "text", text: "Error: projectPath is required" }],
            isError: true,
          };
        }
        const result = await runChecklist("pre-deploy", projectPath);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(
                {
                  ready: result.gateOpen,
                  reason: result.gateOpen
                    ? "All checks passed"
                    : `${result.summary.fail} check(s) failed`,
                  summary: result.summary,
                },
                null,
                2,
              ),
            },
          ],
        };
      }

      case "detect_stack": {
        const projectPath = args?.projectPath as string;
        if (!projectPath) {
          return {
            content: [{ type: "text", text: "Error: projectPath is required" }],
            isError: true,
          };
        }
        const stacks = detectStack(projectPath);
        return { content: [{ type: "text", text: JSON.stringify({ stacks }, null, 2) }] };
      }

      case "list_checks": {
        let filtered = checks;
        if (args?.phase) filtered = filtered.filter((c) => c.phase === args.phase);
        if (args?.stack) filtered = filtered.filter((c) => c.stack === args.stack);
        const items = filtered.map(({ id, phase, check, auto, from, stack }) => ({
          id,
          phase,
          check,
          auto,
          from,
          stack,
        }));
        return {
          content: [
            { type: "text", text: JSON.stringify({ items, count: items.length }, null, 2) },
          ],
        };
      }

      default:
        return { content: [{ type: "text", text: `Unknown tool: ${name}` }], isError: true };
    }
  });

  return server;
}
