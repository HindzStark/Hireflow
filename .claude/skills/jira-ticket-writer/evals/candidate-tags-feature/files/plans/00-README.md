# HireFlow: Planning Docs (Read Me First)

HireFlow is an **internal Applicant Tracking System (ATS)**. The company's hiring team (Admin, HR, Interviewers) uses it to manage candidates **after** they apply: triage, pipeline, interviews, scorecards, and later offers and reports. It is **not** a job portal, and candidates never log in.

It is built as **microservices** (small services, each with its own database) connected through an **API gateway** and **Kafka** events.

> ⏱ **The real constraint:** the problem is sized like a 2–3 day project, but it must be built in **one day, ~5 working hours**. These docs are cut to fit: a **5-hour MVP** first, everything else in later phases.

## Reading order

| Pass | # | File | What you get |
|---|---|---|---|
| 1 · Big picture | 00 | [00-README.md](00-README.md) | Index + key decisions |
| | 01 | [01-product-overview.md](01-product-overview.md) | Plain-English explanation and flows |
| | 02 | [02-users-roles-and-use-cases.md](02-users-roles-and-use-cases.md) | 3 roles, what each can do, RBAC explained |
| | 07 | [07-mvp-scope-and-phases.md](07-mvp-scope-and-phases.md) | **The 5-hour plan** + later phases |
| 2 · How it's built | 03 | [03-tech-stack-and-architecture.md](03-tech-stack-and-architecture.md) | Microservices, Kafka primer, stack, repo layout |
| | 04 | [04-database-models.md](04-database-models.md) | Database per service |
| | 05 | [05-api-design.md](05-api-design.md) | Gateway routes, endpoints, Kafka events |
| | 06 | [06-frontend-pages-and-ux.md](06-frontend-pages-and-ux.md) | Screens + wireframes |
| 3 · How to work | 08 | [08-jira-kanban-guide.md](08-jira-kanban-guide.md) | Jira basics + the backlog |
| | 11 | [11-claude-code-workflow.md](11-claude-code-workflow.md) | Driving Claude Code, prompts per time block |
| | 10 | [10-infra-and-devops.md](10-infra-and-devops.md) | Docker Compose now; Kubernetes (kind) + Terraform later |
| | 09 | [09-testing-strategy.md](09-testing-strategy.md) | Minimal tests now, full suite later |
| Ongoing | 99 | [99-post-mvp-roadmap.md](99-post-mvp-roadmap.md) | **Living file**: progress, decisions, next steps |

## Key decisions

| Decision | Choice |
|---|---|
| Time budget | **5 hours** for the MVP; extra features and infra afterwards |
| Architecture | Microservices: **gateway + 4 services in the MVP** (+3 later), database per service |
| Roles | **ADMIN, HR, INTERVIEWER** |
| Language / stack | TypeScript · Next.js + Tailwind + shadcn/ui · Express + Zod + Prisma · PostgreSQL |
| Messaging | **Kafka** (single broker, KRaft mode) + kafka-ui |
| Local dev | **Docker Compose** (postgres, kafka, kafka-ui) + `pnpm dev` |
| Deployment (later) | **Kubernetes on kind** + Helm, Kafka via Strimzi, **Terraform** for one-command setup |
| Order | **Development first**, infra later |

## Services

| Service | Owns | Port | When |
|---|---|---|---|
| `web` | UI (Next.js) | 3000 | ✅ 5h |
| `gateway` | Routing, login check, rate limit | 4000 | ✅ 5h |
| `auth-service` | Users, roles, login | 4001 | ✅ 5h |
| `job-service` | Departments, jobs, pipeline stages | 4002 | ✅ 5h |
| `candidate-service` | Candidates, applications, pipeline board, timeline, notes, review inbox | 4003 | ✅ 5h |
| `interview-service` | Interviews, scorecards | 4004 | ✅ 5h |
| `offer-service` | Offers + approval chain + letter | 4005 | ⏩ Phase A |
| `notification-service` | Notifications + emails | 4006 | ⏩ Phase A |
| `reporting-service` | KPIs, funnel, trends | 4007 | ⏩ Phase A |

## Traceability: problem statement → when it's built

| Requirement | Service | When |
|---|---|---|
| Full FE + BE + DB | all | ✅ 5h |
| Sign-in (email/password, roles) | auth | ✅ 5h |
| Sign-up, 2FA, Google | auth | ⏩ A |
| Job list by department + creation wizard | job | ✅ 5h |
| Pipeline Kanban + conversion/time metrics | candidate | ✅ 5h |
| Candidate profile (timeline, notes, interviews, scorecards) | candidate + interview | ✅ 5h (emails/files: A) |
| Review inbox with signal score + advance/reject | candidate | ✅ 5h |
| Interview scheduling + scorecards | interview | ✅ 5h (visual grid, calendar sync: A) |
| Sectioned sidebar | web | ✅ 5h |
| Offers + multi-step approval + letter preview | offer | ⏩ A |
| Reports (KPIs, funnel, trends) | reporting | ⏩ A |
| Cmd+K search, notifications | gateway, notification | ⏩ A |
| CSV import + bulk actions | candidate | ⏩ A |
| Playwright E2E suite | — | 1 smoke test if time allows; full suite in ⏩ B |
| Terraform / infra-as-code | — | ⏩ C (kind + Helm + Terraform) |
