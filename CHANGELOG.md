# Changelog

## [0.1.0] - 2026-03-03

### Added

- Initial release
- MCP server with 4 tools: `run_checklist`, `check_deploy_ready`, `detect_stack`, `list_checks`
- Automated checks: secret scanning (PD-3), empty catch blocks (PT-5)
- Stack detection: mobile (expo/react-native), web (next/remix/nuxt), cli (go.mod), infra (docker/systemd)
- CLI with `install-hooks` command for Claude Code integration
- Pre-deploy hook script for enforcement
