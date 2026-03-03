# Changelog

## [0.1.0] - 2026-03-03

### Added

- Initial release
- MCP server with 4 tools: `run_checklist`, `check_deploy_ready`, `detect_stack`, `list_checks`
- 7 automated checks:
  - PD-0: Git working tree clean
  - PD-3: Secret scanning (patterns in external data file)
  - PD-9: Dead form actions / placeholder links
  - PD-13: Lock file exists
  - PT-1: Source-to-test file mapping
  - PT-5: Empty catch block detection
  - C-PT-3: Go vet (cli stack)
- Stack detection: mobile (expo/react-native), web (next/remix/nuxt), cli (go.mod), infra (docker/systemd)
- CLI with `install-hooks` command for Claude Code integration
- Pre-deploy hook script for enforcement
- 40 tests across 3 test suites (stack detection, individual checks, MCP server integration)
- CI workflow for Node 20/22
- Auto-publish workflow on `v*` tags
- Dependabot for npm + GitHub Actions
