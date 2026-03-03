# Contributing to Deploy Gate

Thanks for your interest in contributing! Deploy Gate is built by the community, and every check traces back to a real production incident.

## Adding a new check

The best checks come from real bugs. If you've been burned by something CI didn't catch, we want to hear about it.

1. **Open an issue first** using the Feature Request template
2. Include the real incident that inspired the check
3. Fork the repo and create a branch: `git checkout -b check/your-check-name`
4. Add your check in `src/checks/` following the existing pattern
5. Register it in `src/checks/index.ts`
6. Add tests in `tests/`
7. Submit a PR

### Check format

Every check must have:

- **id**: Unique identifier (e.g., `PD-6` for pre-deploy check #6)
- **phase**: Which gate it belongs to (`pre-eng`, `pre-test`, `pre-deploy`)
- **check**: Human-readable description
- **auto**: Whether it can be automated (boolean)
- **from**: The real incident that inspired it
- **stack**: Which stack it applies to (`core`, `mobile`, `web`, `infra`, `cli`)
- **run**: Optional async function that performs the automated check

### Naming convention for IDs

- `PE-*` = pre-engineering
- `PT-*` = pre-test
- `PD-*` = pre-deploy

## Development setup

```bash
git clone https://github.com/ITeachYouAI/deploy-gate.git
cd deploy-gate
npm install
npm run build
npm test
```

## Code style

- TypeScript with strict mode
- ESM modules
- Prettier for formatting (`npm run format`)
- Tests with Vitest

## Pull request checklist

- [ ] Tests added for new functionality
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run format:check` passes
- [ ] CHANGELOG.md updated if user-facing change
- [ ] New checks include a `from` field with the real incident

## Reporting bugs

Use the Bug Report issue template. Include your Node.js version and OS.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
