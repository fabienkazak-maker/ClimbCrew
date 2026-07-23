# AGENTS.md

## Project

ClimbCrew is a climbing-club session, participant, route, and achievement manager owned by Priveetee.

The repository is a Bun workspace with a React/Vite frontend and an Express/PostgreSQL backend. The frontend communicates with the backend exclusively over HTTP. Production is deployed with Docker Compose on Linux.

## Non-Negotiables

- Never edit files outside this repository unless Priveetee explicitly asks for the exact target.
- Never commit or push without explicit instruction from Priveetee.
- Never take an externally visible GitHub, deployment, production, issue, pull-request, or release action without proposing the exact action and receiving explicit approval.
- Never close, reopen, comment on, or otherwise change a GitHub issue unless Priveetee explicitly asks for that exact action on that exact issue.
- Never give unsolicited advice.
- No emojis in code, commits, documentation, or public text.
- No comments in application code. Names and module boundaries must make the code self-documenting.
- Strict TypeScript: no `any`; narrow `unknown`; avoid type assertions and justify the rare unavoidable assertion in the review report.
- Never hide backend or data-contract defects with frontend fallbacks. Fix the owning layer and preserve the HTTP boundary.
- Maximum 180 lines per source or configuration file. Split responsibilities before the limit.
- Zero Biome warnings and zero Biome errors before a commit.
- Bun exclusively. Never invoke npm, yarn, or pnpm.
- Never expose credentials, personal data, local absolute paths, temporary scripts, logs, tool names, agent names, usernames, or machine names in public artifacts.
- Never store session tokens in local storage. Authentication uses the server's HttpOnly cookie and CSRF protection.
- Never weaken CORS, security headers, rate limits, setup-token checks, password rules, cookie security, or PostgreSQL TLS validation to make local behavior pass.

## Stack

### Frontend

| Role | Tool |
|---|---|
| Language | TypeScript, strict |
| Runtime and package manager | Bun |
| Build | Vite |
| Framework | React |
| Styling | Plain CSS modules split by responsibility |
| Lint and format | Biome |

### Backend

| Role | Tool |
|---|---|
| Language | TypeScript, strict |
| Runtime | Bun |
| Server | Express |
| Database | PostgreSQL through `pg` |
| Authentication | HttpOnly session cookie plus CSRF cookie/header |
| Password hashing | bcrypt |

## Naming Conventions

| Entity | Convention | Example |
|---|---|---|
| React components | PascalCase | `SessionCard` |
| Files | kebab-case | `session-card.tsx` |
| Functions | camelCase | `fetchSessions` |
| Constants | SCREAMING_SNAKE_CASE | `MAX_PARTICIPANTS` |
| Types and interfaces | PascalCase | `ClimbingSession` |
| Hooks | camelCase prefixed with `use` | `useSessionActions` |

## File Rules

- Maximum 180 lines per source or configuration file.
- One React component per file.
- Extract parsing, validation, database access, and presentation into focused modules.
- Never minify or compress code to satisfy the line limit.
- Generated lockfiles, imported data fixtures, SQL schemas, and CSV files are exempt from the line limit.
- Keep real member data out of tracked fixtures. Examples must use clearly fictional values.

## Architecture Rules

- `frontend/` owns browser state, presentation, forms, and HTTP clients.
- `backend/` owns authentication, authorization, validation, persistence, security policy, and business invariants.
- PostgreSQL is the source of truth whenever `VITE_API_URL` is configured.
- Do not silently persist server-backed business data to browser storage.
- Preserve the current API paths and accepted `/api` and `/v1` prefixes unless a deliberate migration is requested.
- Preserve the `matin`, `midi`, and `soir` session slots.
- Free-session passport eligibility is a backend invariant and must only reject newly added ineligible participants when updating an existing session.
- Database schema changes must be idempotent and compatible with existing production data.
- Setup and import endpoints remain protected by `SETUP_TOKEN` or authenticated administrator access.

## Security Rules

- Send browser API requests with `credentials: "include"`.
- Send the readable CSRF cookie in `X-CSRF-Token` for unsafe methods.
- Keep the session cookie HttpOnly and the CSRF cookie readable by the browser.
- Use constant-time comparison for sensitive tokens.
- Validate request bodies at the HTTP boundary before database calls.
- Apply authorization on the backend even when the frontend hides an action.
- Never log passwords, reset secrets, session tokens, cookie contents, or imported personal data.
- Production secrets belong in environment variables and must never be committed.

## Dependencies

- Verify every new runtime dependency license before adding it.
- Runtime dependencies must use MIT or ISC licenses.
- Build-only dependencies may also use Apache-2.0 when required by the toolchain.
- Never add GPL, AGPL, LGPL, proprietary, or source-available dependencies.

## Validation

- Run `bun run lint`.
- Run `bun run typecheck`.
- Run `bun run build` with output redirected to a temporary `.log` file. Report only the final status and inspect the log only on failure.
- Run focused backend and browser checks appropriate to the changed behavior.
- Keep the committed Playwright suite under `tests/browser` and temporary traces under `.tmp`.
- For session, responsive, authentication, storage, and administration changes, verify Chromium and Firefox at desktop and mobile viewports.
- Run `bun run test:e2e` for cross-cutting frontend, backend, database, authentication, or deployment changes.

## Docker and Production

- Production containers use Bun images and commands.
- The frontend image serves only built static assets.
- The backend health check must exercise the public health endpoint.
- Keep deployment configuration free of development credentials and local filesystem paths.
- Do not deploy or alter production without explicit approval.

## Commit Convention

Format: `type: description`

Allowed types: `feat`, `fix`, `refactor`, `chore`, `docs`, `test`, `perf`, `style`.

- One line, maximum 72 characters.
- Imperative mood.
- No emojis.
- Split commits by concern.
- Target at most 120 insertions and never exceed 290 insertions per commit.
- Keep generated files in a separate commit.

## What Not To Do

- No JavaScript application source.
- No npm, yarn, or pnpm.
- No frontend bearer-token storage.
- No hardcoded credentials or real personal data.
- No permissive TLS workaround such as `rejectUnauthorized: false`.
- No production mutation, GitHub mutation, commit, or push without explicit approval.
