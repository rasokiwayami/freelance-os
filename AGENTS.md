# Agent Guidelines

This repository is a local-first FreelanceOS app. Treat source code, tests,
package scripts, `CLAUDE.md`, and `PROJECT_PROFILE.yaml` as the operating truth.
README prose is secondary when it lags current implementation.

## Global Routing

For non-trivial implementation, route through Jinsei / Global Coding Department:

```bash
cd /Users/sora/dev/jinsei
python3 scripts/dispatch_codex_session.py --queue-request --project "FreelanceOS" --repo /Users/sora/dev/freelance-os --operation-id <operation_id> --goal "<bounded goal>" --authority-band A2
python3 scripts/dispatch_codex_session.py --from-queue --limit 3
python3 scripts/dispatch_codex_session.py --check-push-review --project "FreelanceOS" --operation-id <operation_id>
```

Use Planning Worker, Implementation Worker, and Review Controller separation for
multi-file changes, Supabase/auth work, AI/API behavior, GUI/design work,
deployment readiness, or push readiness.

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
