# Agent Guidelines

This repository is a local-first FreelanceOS app. Treat source code, tests,
package scripts, `CLAUDE.md`, and `PROJECT_PROFILE.yaml` as the operating truth.
README prose is secondary when it lags current implementation.

## Development Route

For non-trivial implementation, the current central Jinsei contract and linked
policies own the route, model and effort selection, review, task evidence, and
Git side effects:

- `/Users/sora/dev/jinsei/CODEX_GLOBAL_AGENTS.md`
- `/Users/sora/dev/jinsei/docs/policies/DEVELOPMENT_MODEL_ROUTE_POLICY.md`
- `/Users/sora/dev/jinsei/docs/policies/DEVELOPMENT_PROTOCOL.md`
- `/Users/sora/dev/jinsei/docs/policies/MANAGED_REPOSITORY_INHERITANCE.md`

This repository is a specialized Jinsei-managed implementation unit. The
`project.authority` block in `PROJECT_PROFILE.yaml` only narrows central
authority; it does not grant authority or replace central task, halt, identity,
or review checks.

## Repository Scope

This repository owns the React/Vite app, its existing hooks and Supabase
workflows, and the product-local Gemini chat path. For cross-repository changes,
inspect only directly affected contracts and actual consumers; do not add a
provider integration in this inheritance migration.

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
