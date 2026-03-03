# Security Policy

## Supported versions

| Version | Supported |
| ------- | --------- |
| 0.1.x   | Yes       |

## Reporting a vulnerability

If you discover a security vulnerability in Deploy Gate, please report it responsibly:

1. **Do not** open a public issue
2. Email **tim@iteachyouai.com** with:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
3. You will receive a response within 48 hours
4. A fix will be released as soon as possible, and you will be credited (unless you prefer to remain anonymous)

## Scope

Deploy Gate runs locally and scans project files. Security concerns include:

- **Secret scanning patterns**: If a pattern has false negatives, real secrets could be missed
- **Command injection**: Check implementations use `execSync` with project paths -- these must be properly sanitized
- **Path traversal**: Project paths should be validated to prevent scanning unintended directories

## Design principles

- Deploy Gate is read-only -- it never modifies your project files
- All checks run locally -- no data is sent to external services
- Secret patterns are intentionally broad to minimize false negatives
