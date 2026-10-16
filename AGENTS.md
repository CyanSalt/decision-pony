# Project Rules

## Scope

- Keep only core, project-wide rules in this file.
- Record rationale, architecture decisions, implementation details, and test
  strategy in `docs/<four-digit>-<topic>.md`, then link the document here.

## References

- [Project foundation](docs/0001-project-foundation.md) defines the toolchain
  and package baseline.
- [OpenAI Decisions polyfill architecture](docs/0002-openai-decisions-polyfill.md)
  defines the product contract, adapters, dependencies, validation, and tests.

## Core Rules

- Use Node.js 24 and pnpm 11.
- Install dependencies with `pnpm add`; do not edit dependency versions
  manually.
- Treat OpenAI Decisions as the canonical public protocol.
- Keep the library transport-agnostic: do not own HTTP servers, credentials,
  network requests, retries, or model routing.
- Import canonical Decisions types directly from the official OpenAI SDK; do
  not duplicate them locally.
- Keep source code under `src`, tests under `tests`, and reusable logic in
  focused modules.
- Use English kebab-case file names.
- Keep `README.md` limited to concise user-facing product, installation, and
  usage information.
- Keep lockfile changes limited to dependencies required by the task.
- Run `pnpm lint:ci`, `pnpm exec tsc --build`, `pnpm test --run`, and
  `pnpm prepack` before completing changes.
