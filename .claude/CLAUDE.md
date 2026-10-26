# HireFlow: project memory for Claude Code

HireFlow is an **internal Applicant Tracking System (ATS)**. The hiring team (ADMIN, HR, INTERVIEWER) manages candidates **after** they apply: jobs, review inbox, a Kanban pipeline, interviews, scorecards, and later offers and reports. Candidates never log in. It is built as **microservices** behind an API gateway, connected by **Kafka**, in a **5-hour** build.

## Start of every session (do this first)
1. Read `docs/PROGRESS.md`: the current block, what's done, and **what to do next**.
2. Run `git status` and `git branch --show-current`. Never start work on `main` or `develop` (see Git rules).
3. Read only the plan docs the next task needs (map below).

## Scope rule
Build only what is marked **✅ (5h)** in `plans/`. Items marked **⏩ (later)** are out of scope unless the user asks. Roles are only `ADMIN`, `HR`, `INTERVIEWER`.

## Where the truth lives
| Need | File |
|---|---|
| What to do now / handoff | `docs/PROGRESS.md` |
| Things the user must provide | `docs/SETUP-CHECKLIST.md` |
| Git rules | `CONTRIBUTING.md` |
| Architecture, service ownership, Kafka rules | `plans/03-tech-stack-and-architecture.md` |
| DB schema per service | `plans/04-database-models.md` |
| API, gateway routes, Kafka event catalog | `plans/05-api-design.md` |
| Screens | `plans/06-frontend-pages-and-ux.md` |
| Time blocks and "done when" | `plans/07-mvp-scope-and-phases.md` |
| Jira tickets (HF-n) | `plans/08-jira-kanban-guide.md` (use the `jira-ticket-writer` skill for new ones) |
If you change a contract (API, schema, event), update the plan doc in the same branch.

## Tech stack (pinned, so don't upgrade majors without asking)
| Layer | Choice |
|---|---|
| Runtime / PM | Node 22, **pnpm 11** workspaces, Turborepo 2 |
| Language | **TypeScript 5** (not 7: Next 14 needs the TS5 API) |
| Web | **Next.js 14** App Router, React 18, Tailwind 3, shadcn/ui (to init), TanStack Query 5, React Hook Form + Zod, dnd-kit, sonner, lucide-react |
| Services | **Express 4**, Zod 4, **Prisma 6** (classic `schema.prisma` + `env()` URL), pino |
| Gateway | Express 4, http-proxy-middleware, jsonwebtoken (HS256), express-rate-limit, helmet |
| Messaging | **Kafka** (KRaft, 1 broker) via **kafkajs**; kafka-ui on :8080 |
| DB | PostgreSQL 16, **one database per service** |
| Tests | Vitest, Supertest (Playwright later) |

## Folder structure
```
hireflow/
├─ .claude/            CLAUDE.md (this file), skills/jira-ticket-writer
├─ apps/web/           Next.js: app/ components/ hooks/ lib/ public/
├─ services/
│  ├─ _template/       copy to create a service: src/{routes,internal,services,consumers,lib} prisma/ test/
│  ├─ gateway/         :4000, the only public entry (/api/v1/*)
│  ├─ auth-service/    :4001 auth_db: users, roles, login
│  ├─ job-service/     :4002 job_db: departments, jobs, stages
│  ├─ candidate-service/ :4003 candidate_db: candidates, applications, pipeline, timeline, inbox
│  └─ interview-service/ :4004 interview_db: interviews, scorecards
├─ packages/
│  ├─ contracts/       Zod schemas: API bodies, error codes, Kafka event envelope
│  └─ service-kit/     createService, requireAuth/requireRole, errors, validate, internal client, Kafka helpers
├─ infra/docker/       postgres-init.sql (creates the 4 DBs)
├─ docs/               PROGRESS.md, SETUP-CHECKLIST.md
├─ plans/              design docs 00–11, 99
└─ docker-compose.yml  turbo.json  pnpm-workspace.yaml  tsconfig.base.json  .env.example
```

## Commands
```
pnpm infra:up            # docker compose up -d (postgres :5432, kafka :9092, kafka-ui :8080)
pnpm dev                 # all apps/services via turbo (web :3000, gateway :4000, services :4001-4004)
pnpm --filter @hireflow/<name> <script>   # one package, e.g. --filter @hireflow/job-service db:migrate
pnpm db:migrate | db:seed | db:reset
pnpm typecheck | test | lint | format
```

## Microservice rules (never break)
- A service touches **only its own database**. Never import another service's code or Prisma client.
- Need data now → call the other service's `/internal/*` route with `x-internal-token` (via service-kit).
- Something happened → publish to Kafka **after** the DB transaction commits. Topics: `hireflow.job`, `hireflow.application`, `hireflow.interview`. Key = entity id. Envelope from `packages/contracts`.
- Consumers: consumer group = service name, de-duplicate via the `ProcessedEvent` table.
- The browser calls **only** the gateway (`/api/v1`). A new public route also needs a gateway routing entry.

## Code conventions
- Layers: route → service function → Prisma. No business logic in routes.
- Responses `{ data }` / `{ data, meta }`. Errors `{ error: { code, message, details? } }`.
- Every route: `requireAuth` + `requireRole(...)`. Ownership checks (🔸) go inside the service.
- Validate every request body and every consumed event with Zod from `packages/contracts`.
- Seed data uses fixed IDs (`usr_priya`, `job_backend`, `stg_backend_screen`…).
- Packages are ESM (`"type": "module"`, NodeNext). Use `.js` extensions in relative imports inside services/packages.
- Keep it simple. No new libraries beyond the stack above without asking.

## Git rules (summary; full rules in CONTRIBUTING.md)
- Branches: `main` (released, tagged) ← `develop` (integration) ← `feature/HF-<n>-<slug>`, `fix/…`, `chore/…`, `docs/…`.
- **Never commit directly to `main` or `develop`.** Branch from `develop`, one ticket per branch.
- Commits: Conventional Commits, `type(scope): imperative subject`, plus a footer `Refs: HF-<n>`. Scope = service/package name.
- Finish a feature: typecheck + tests green → update `docs/PROGRESS.md` → merge into `develop` with `--no-ff` (or a GitHub PR) → delete the branch.
- Release a block: `develop` → `main` with `--no-ff` + an annotated tag `v0.<block>.0`. Ask the user before pushing.
- Never force-push `main`/`develop`. Never commit `.env` or secrets.

## Definition of done (every ticket)
Acceptance criteria verified · `pnpm typecheck` + tests pass · `/api/v1/health` green · plan docs updated if contracts changed · `docs/PROGRESS.md` updated · merged with the ticket key.

## Known gotchas
- pnpm 11 blocks dependency install scripts. Approved ones live in `pnpm-workspace.yaml` → `allowBuilds`. If an install prints "ignored build scripts", add the package there only if it's trusted.
- Each service's Prisma schema reads its own env var (`AUTH_DATABASE_URL`, …). Services load the root `.env` via `tsx --env-file=../../.env`.
- Kafka: host apps use `localhost:9092`, containers use `kafka:29092`.
- Windows dev machine: use forward slashes in scripts. Line endings are normalized to LF by `.gitattributes`.
