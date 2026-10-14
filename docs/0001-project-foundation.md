# Project Foundation

## Status

Accepted on 2026-10-14.

## Decision

The project follows the single-package library structure used by
`/Users/sunxiaoran/Documents/GitHub/git9`.

- Node.js 24 is the runtime and pnpm 11 is the package manager.
- TypeScript 6 is compiled by the latest tsdown release.
- The package publishes ESM and matching declaration files.
- ESLint 10 provides static checks through the shared CyanSalt configuration.
- Vitest is reserved for tests as functionality is added.
- release-it and GitHub Actions provide the release and CI foundations.

The initial public entry point is intentionally empty. Product behavior will be
introduced in later decisions.
