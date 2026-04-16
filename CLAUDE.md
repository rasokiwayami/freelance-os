# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Local development (use vercel dev — not npm run dev — to enable /api routes)
vercel dev

# Unit tests (Vitest + jsdom)
npm run test
npm run test:watch

# Run a single unit test file
npx vitest run src/features/projects/__tests__/ProjectForm.test.jsx

# E2E tests (Playwright — requires a running dev server)
npx playwright install chromium   # first time only
npm run test:e2e

# Lint
npm run lint

# Production build
npm run build
```

E2E tests read credentials from `E2E_TEST_EMAIL` and `E2E_TEST_PASSWORD` env vars (fallback to `test@example.com` / `testpassword123`).

## Environment Variables

Copy `.env.local` from `.env.example`. Required variables:

| Variable | Used by |
|---|---|
| `VITE_SUPABASE_URL` | Browser Supabase client |
| `VITE_SUPABASE_ANON_KEY` | Browser Supabase client |
| `SUPABASE_URL` | Vercel serverless function (`api/chat.js`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Vercel serverless function |
| `GEMINI_API_KEY` | Vercel serverless function — AI chat |

> Note: `.env.example` lists `ANTHROPIC_API_KEY`, but `api/chat.js` currently uses Google Gemini (`GEMINI_API_KEY` / `gemini-2.5-flash`). The `@anthropic-ai/sdk` package is installed but not yet wired up.

## Architecture

```
Browser (React + Vite)
    │
    ├── Supabase (PostgreSQL + RLS)
    │     Tables: projects, clients, transactions, chat_history
    │     Auth:   email/password; RLS isolates data per user_id
    │
    └── /api/chat  (Vercel serverless function — Node.js)
          Receives { message, projects, transactions, clients } from the browser,
          builds a Japanese-language prompt with all user data as context,
          and calls Google Gemini to generate a reply.
```

### Data layer — custom hooks

Each resource (`projects`, `clients`, `transactions`) has a hook in `src/hooks/` that owns all Supabase calls and local state. The pattern is consistent across all four hooks:

- `data` / `loading` / `error` returned as state
- CRUD methods (`createX`, `updateX`, `deleteX`) each call `fetchX()` on success to keep state fresh
- Supabase queries include related tables via `.select('*, relatedTable(field)')`

`useChat` (`src/hooks/useChat.js`) composes all three data hooks to pass full context to `/api/chat`, and persists message history to the `chat_history` table.

### Routing and auth

`App.jsx` wraps routes in `<PrivateRoute>` / `<PublicRoute>` guards that both delegate to `useAuth`. All protected routes share the `<Layout>` component (sidebar + header via React Router's `<Outlet>`).

### Component structure

- `src/components/ui/` — shadcn/ui primitives (do not edit manually; regenerate with `shadcn` CLI)
- `src/components/` — shared app-level components (`Layout`, `ConfirmDialog`)
- `src/features/<feature>/` — feature-specific components with co-located `__tests__/`
- `src/pages/` — route-level page components (thin wrappers that compose hooks + features)

### Forms

All forms use React Hook Form with Zod schemas via `@hookform/resolvers/zod`. Validation errors render as `<p role="alert">` — this is what unit tests target.

### Path alias

`@` resolves to `/src` (configured in `vite.config.js`).

### UI language

The app UI and code comments are in Japanese.
