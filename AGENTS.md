# Project Rules

## Toolchain

- Use Node.js 24 and pnpm 11.
- Use ESLint 10, TypeScript 6, and the latest tsdown release.
- Install dependencies with `pnpm add`; do not edit dependency versions manually.
- Use the latest available package version unless a version is explicitly constrained.

## Structure

- Keep the package structure aligned with `/Users/sunxiaoran/Documents/GitHub/git9`.
- Keep source code under `src` and tests under `tests`.
- Put reusable logic in focused modules instead of growing `src/index.ts`.
- Use English kebab-case file names.

## Quality

- Run `pnpm lint:ci`, `pnpm exec tsc --build`, `pnpm test --run`, and `pnpm prepack` before completing changes.
- Keep lockfile changes limited to dependencies required by the task.
- Record architectural and toolchain decisions under `docs` using a four-digit prefix.
