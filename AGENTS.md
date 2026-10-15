# Project Rules

## Toolchain

- Use Node.js 24 and pnpm 11.
- Use ESLint 10, TypeScript 6, and the latest tsdown release.
- Install dependencies with `pnpm add`; do not edit dependency versions manually.
- Use the latest available package version unless a version is explicitly constrained.

## Product

- Treat OpenAI Decisions as the canonical public protocol.
- Convert Decisions requests to conversational LLM requests and convert completed responses back to Decisions responses.
- Initially target OpenAI Responses, OpenAI Chat Completions, and Anthropic Messages.
- Keep the library transport-agnostic: do not own HTTP servers, credentials, network requests, retries, or model routing.
- Import canonical Decisions types directly from the official OpenAI SDK; do not duplicate them locally.
- Keep `openai >=7.30.0` as an optional peer dependency and use the latest release as the development dependency.
- Pass `DecisionCreateParams.model` through unchanged; do not add adapter-specific options.
- Pass the original Decisions request explicitly to response conversion; do not introduce hidden mutable state.
- Use structured outputs as the initial result carrier; defer tool-call compatibility until it is separately justified.
- Treat conversational-model probabilities and confidence values as uncalibrated estimates and validate every generated result.

## Structure

- Keep the package structure aligned with `/Users/sunxiaoran/Documents/GitHub/git9`.
- Keep source code under `src` and tests under `tests`.
- Put reusable logic in focused modules instead of growing `src/index.ts`.
- Use English kebab-case file names.

## Quality

- Run `pnpm lint:ci`, `pnpm exec tsc --build`, `pnpm test --run`, and `pnpm prepack` before completing changes.
- Tests call real provider APIs using `.env` credentials and do not run in CI.
- Keep lockfile changes limited to dependencies required by the task.
- Record architectural and toolchain decisions under `docs` using a four-digit prefix.

## Documentation

- Keep `README.md` limited to concise user-facing product, installation, and usage information.
- Record internal project constraints in `AGENTS.md`.
- Record implementation proposals and architectural decisions under `docs`.
