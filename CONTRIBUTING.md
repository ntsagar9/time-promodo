# Contributing to TimerPromodo

Thank you for your interest! This project is maintained by **[Sagar NT](https://github.com/ntsagar9)**.

## Ground Rules

- All contributions must come via **Pull Request** — no direct pushes to `main`
- Every PR must pass `pnpm typecheck` (0 errors) and `pnpm lint` (0 warnings)
- Every PR must pass `pnpm build:app` on GitHub Actions (Ubuntu, Windows, macOS)
- Keep PRs focused — one feature or fix per PR
- New dependencies require an Issue discussion first

## Development Setup

See [README.md → Development Setup](./README.md#-development-setup).

## Commit Convention

- `feat(scope): description`
- `fix(scope): description`
- `docs(scope): description`
- `refactor(scope): description`

## Code Style

- TypeScript strict — no `any`
- Tailwind for all styles — no inline styles except dynamic SVG values
- Functional components + hooks only

## Questions?

Open an Issue with the `question` label.
