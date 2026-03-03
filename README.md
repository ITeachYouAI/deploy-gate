# Deploy Gate

[![CI](https://github.com/ITeachYouAI/deploy-gate/actions/workflows/ci.yml/badge.svg)](https://github.com/ITeachYouAI/deploy-gate/actions/workflows/ci.yml)

**Pre-deploy checklist MCP server -- catches what CI misses.**

Deploy Gate is a Model Context Protocol (MCP) server that runs automated pre-deploy checks against your project before you ship. Every check traces back to a real bug that made it to production.

CI catches syntax errors and test failures. Deploy Gate catches the stuff CI doesn't: leaked secrets, empty catch blocks that swallow errors, missing env configs, and more.

## How it works

1. Deploy Gate auto-detects your project's stack (mobile, web, CLI, infra)
2. It runs phase-gated checks: **pre-engineering**, **pre-test**, and **pre-deploy**
3. If any check fails, the gate stays closed -- you fix before you ship
4. Every check has a `from` field linking it to the real incident that inspired it

## Install

### As an MCP server (recommended)

Add to your Claude Code MCP config (`~/.claude.json` or project `.mcp.json`):

```json
{
  "mcpServers": {
    "deploy-gate": {
      "command": "npx",
      "args": ["@iteachyouai/deploy-gate"]
    }
  }
}
```

### From source

```bash
git clone https://github.com/ITeachYouAI/deploy-gate.git
cd deploy-gate
npm install
npm run build
```

## Tools

Deploy Gate exposes 4 MCP tools:

### `run_checklist`

Run checks for a specific phase (or all phases) against a project.

| Parameter     | Type                                               | Required | Description                  |
| ------------- | -------------------------------------------------- | -------- | ---------------------------- |
| `phase`       | `"pre-eng" \| "pre-test" \| "pre-deploy" \| "all"` | Yes      | Which phase to run           |
| `projectPath` | `string`                                           | Yes      | Absolute path to the project |

Returns pass/fail results for each check, a summary, and whether the gate is open.

### `check_deploy_ready`

Quick boolean check: is this project ready to deploy?

| Parameter     | Type     | Required | Description                  |
| ------------- | -------- | -------- | ---------------------------- |
| `projectPath` | `string` | Yes      | Absolute path to the project |

Returns `{ ready: true/false, reason, summary }`.

### `detect_stack`

Detect the technology stack of a project.

| Parameter     | Type     | Required | Description                  |
| ------------- | -------- | -------- | ---------------------------- |
| `projectPath` | `string` | Yes      | Absolute path to the project |

Returns the detected stacks (e.g., `["core", "web"]`).

### `list_checks`

List all available checks, optionally filtered.

| Parameter | Type     | Required | Description     |
| --------- | -------- | -------- | --------------- |
| `phase`   | `string` | No       | Filter by phase |
| `stack`   | `string` | No       | Filter by stack |

## Stack Detection

Deploy Gate auto-detects your stack by looking at project files:

| Stack      | Detection                                                |
| ---------- | -------------------------------------------------------- |
| **core**   | Always included                                          |
| **mobile** | `expo` or `react-native` in package.json                 |
| **web**    | `next`, `@remix-run/node`, or `nuxt` in package.json     |
| **cli**    | `go.mod` exists                                          |
| **infra**  | `systemd/`, `docker-compose.yml`, or `Dockerfile` exists |

Checks are filtered to only run checks relevant to your detected stacks.

## Checks

Every check has an ID, phase, and traces back to a real incident:

| ID   | Phase      | Check                                    | From                              |
| ---- | ---------- | ---------------------------------------- | --------------------------------- |
| PD-3 | pre-deploy | Secret scanning (API keys, private keys) | LooksMaxx: API key in eas.json    |
| PT-5 | pre-test   | Empty catch block detection              | CreateSocial: silent auth failure |

More checks are added over time. Each one comes from a real bug.

## CLI

```bash
# Install the pre-deploy hook for Claude Code
deploy-gate install-hooks
```

## Development

```bash
npm install        # Install dependencies
npm run build      # Compile TypeScript
npm test           # Run tests
npm run dev        # Watch mode
npm run format     # Format code
```

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

See [SECURITY.md](SECURITY.md) for our security policy.

## License

MIT -- see [LICENSE](LICENSE).

---

Built by [ITeachYouAI](https://iteachyouai.com)
