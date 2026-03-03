export type Phase = "pre-eng" | "pre-test" | "pre-deploy";
export type Stack = "core" | "mobile" | "web" | "infra" | "cli";

export interface CheckResult {
  status: "pass" | "fail" | "skip" | "manual" | "info";
  message: string;
}

export interface CheckItem {
  id: string;
  phase: Phase;
  check: string;
  auto: boolean;
  from: string;
  stack: Stack;
  run?: (projectPath: string) => Promise<CheckResult>;
}

export interface ChecklistResult {
  phase: Phase;
  stacks: Stack[];
  results: Array<{ item: CheckItem; result: CheckResult }>;
  summary: { pass: number; fail: number; skip: number; manual: number; info: number };
  gateOpen: boolean;
}
