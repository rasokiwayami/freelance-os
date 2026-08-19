# Agent Guidelines

This repository is a local-first FreelanceOS app. Treat source code, tests,
package scripts, `CLAUDE.md`, and `PROJECT_PROFILE.yaml` as the operating truth.
README prose is secondary when it lags current implementation.

## Development Route

For non-trivial implementation, use the parent-owned route:
Plan -> Work -> independent Sol max Review. The central instructions are
`/Users/sora/dev/jinsei/CODEX_GLOBAL_AGENTS.md`, and the deterministic task,
authority, evidence, and Git boundary is `/Users/sora/dev/jinsei/bin/jinsei`.
The Codex parent owns model launch; the current TaskIntent, exact worktree
scope, and fresh verification/review evidence must bind to the current HEAD.
Do not infer launch commands from this repository.

## Development Autonomy

Development GitHub operations are L5 under Jinsei's
`GITHUB_DEVOPS_AUTONOMY_POLICY.md` after this repo's verification and fresh
independent Sol max review evidence bound to the current HEAD pass. This
includes branch work, local commits, pushes to an existing approved remote, PR
creation/update, and issue operations.

Public deployment, repository visibility changes, billing or paid services,
secret mutation, production data mutation, public claims, and publication remain
gated.

## Engineering Rules

- Prefer existing React/Vite/hooks/component patterns.
- Do not duplicate Supabase data access outside existing hooks without a scoped
  reason.
- UI/UX redesign requires the Global Design Department gate before UI files are
  edited.
- Do not deploy, mutate production data, or change Supabase policies unless the
  latest user instruction explicitly approves that operation.

## Safety

Do not read, print, commit, or copy `.env*`, Supabase service keys, Gemini/API
keys, auth tokens, user data exports, browser profiles, raw logs, or generated
private workspaces.

## Verification

Use the relevant subset:

```bash
npm run lint
npm run test
npm run build
git diff --check
```
