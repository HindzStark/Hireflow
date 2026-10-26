# 08 · Jira & Kanban: How Teams Do It in Industry

## Part A: Jira basics

### A1. Vocabulary
| Jira term | Meaning | HireFlow example |
|---|---|---|
| **Project** | Container for all work. Its **key** prefixes every ticket. | "HireFlow", key **HF** |
| **Epic** | Big feature spanning many tickets | HF-E4 "Candidates & Pipeline" |
| **Story** | User-visible value, done in ≤1 day | "As HR I can drag a card to another stage" |
| **Task** | Technical work with no direct user value | "Create service-kit outbox" |
| **Sub-task** | Checklist item inside a story/task | "API endpoint", "UI", "test" |
| **Bug** | Something broken | "Card snaps back in empty column" |
| **Spike** | Time-boxed research | "Spike: kafkajs consumer group setup (30 min)" |
| **Story points** | Relative effort, Fibonacci 1-2-3-5-8 (not hours) | Login = 3, Kanban drag = 5 |
| **Component** | Part of the system | one per service: `gateway`, `auth`, `job`, `candidate`, `interview`, `offer`, `notification`, `reporting`, `web`, `infra`, `k8s` |
| **Label** | Free tag for filtering | `5h`, `block-4`, `later`, `backend`, `frontend` |

Hierarchy: **Epic → Story / Task / Bug → Sub-task**

### A2. Why Kanban (not Scrum) for a 5-hour build
Scrum works in 1–2 week sprints with planning ceremonies. Kanban is **continuous flow**: you pull the next top card when you finish one. That fits a one-day hackathon.

> **On a 5-hour day,** keep Jira light: create the 24 "5h" tickets **before** the day (or in the first 5 minutes from the CSV), then just drag cards. Don't spend more than ~5 minutes total in Jira during the build. Fill in the "later" tickets in practice sessions.

### A3. Set up the board
1. Jira Cloud (free ≤10 users) → **Create project** → **Kanban** template → team-managed → name `HireFlow`, key `HF`.
2. **Columns + WIP limits:**

| Column | Meaning | WIP limit |
|---|---|---|
| Backlog | Not yet committed | — |
| To Do | Ready, prioritized for the current phase | 8 |
| In Progress | Being built now | **2** |
| Code Review | Self-review / `/code-review` | 3 |
| Testing | Verified against acceptance criteria | 3 |
| Done | Meets the Definition of Done | — |

3. **Swimlanes by Epic**, **quick filters** by label (`5h`, `block-1` … `block-7`, `later`), and **components = services**.

> **WIP limit** = the maximum number of cards allowed in a column. With "In Progress" at 2, you must finish something before starting more. This rule prevents "everything half-done at demo time".

### A4. Writing a ticket (industry format)
```
Title:       [Pipeline] Drag a candidate card to another stage
Type: Story   Epic: HF-E4   Priority: Highest   Points: 5
Components:  candidate, web        Labels: 5h, block-4

Description:
  As an HR user,
  I want to drag a candidate card between stage columns,
  so that the pipeline shows where each candidate is.

Acceptance criteria:
  1. Given I'm on /jobs/:id/pipeline, When I drag a card Screen → Interview,
     Then it appears in Interview immediately.
  2. And after refresh it is still there.
  3. And a StageTransition + Activity row exist, and application.stage_changed is visible in kafka-ui.
  4. Given the API fails, Then the card returns and an error toast shows.
  5. Given I'm an INTERVIEWER, Then I cannot open this page (403 / hidden).

Technical notes: POST /applications/:id/move (05 §5) · DB transaction, then publish to Kafka (03 §3.4)
Sub-tasks: [ ] service + transaction + test  [ ] gateway route  [ ] UI dnd + optimistic  [ ] data-testids
```
Title format: `[Area] verb + outcome`.

### A5. Definition of Ready / Done
**Ready:** story + acceptance criteria written · API/DB/events impact known (04/05) · estimated · no blockers.

**Done:**
- [ ] Acceptance criteria verified in the browser
- [ ] Lint + typecheck pass
- [ ] Tests for business logic / endpoint
- [ ] Events (if any) documented in the 05 event catalog
- [ ] `/api/v1/health` still green for all services
- [ ] Committed with the ticket key, merged to `main`

### A6. Git ↔ Jira
- Branch: `feature/HF-29-pipeline-drag`, `fix/HF-70-empty-column-drop`, `chore/HF-6-outbox`
- Commit: `HF-29: add optimistic stage move on pipeline board`
- With the "GitHub for Jira" app, the keys auto-link commits and PRs to tickets.

### A7. Daily flow
Pull the top To Do card → branch → build (Claude Code, file 11) → Code Review → Testing → merge → Done → repeat. At the end of a phase, tag the release.

### A8. Priorities
`Highest` = MVP blocker · `High` = MVP · `Medium` = after MVP · `Low` = nice to have

---

## Part B: HireFlow backlog

Labels: `5h` = build on the day · `later` = after the MVP · `block-N` = time block from file 07.
Points matter less on a 5-hour day. Use them to see which tickets are big.

### Epics
| Key | Epic | When |
|---|---|---|
| HF-E1 | Clean Base | 5h · block 1 (0:00–0:45) |
| HF-E2 | Auth & Roles | 5h · block 2 (0:45–1:20) |
| HF-E3 | Jobs | 5h · block 3 (1:20–2:00) |
| HF-E4 | Candidates & Pipeline | 5h · block 4 (2:00–3:20) |
| HF-E5 | Review Inbox | 5h · block 5 (3:20–4:00) |
| HF-E6 | Interviews & Scorecards | 5h · block 6 (4:00–4:40) |
| HF-E7 | Demo & Docs | 5h · block 7 (4:40–5:00) |
| HF-E8 | Offers & Approvals | later · Phase A |
| HF-E9 | Notifications & Email | later · Phase A |
| HF-E10 | Reports & Dashboard | later · Phase A |
| HF-E11 | Productivity (search, import, bulk, files, grid, calendar) | later · Phase A |
| HF-E12 | Auth Extras | later · Phase A |
| HF-E13 | Quality & Hardening | later · Phase B |
| HF-E14 | Infrastructure (kind, Helm, Terraform) | later · Phase C |

### 5-hour sprint tickets (create these first)

| Key | Type | Title | Epic | Component | Pts | Labels |
|---|---|---|---|---|---|---|
| HF-1 | Task | [Base] pnpm + Turborepo monorepo, shared tsconfig | E1 | infra | 1 | 5h block-1 |
| HF-2 | Task | [Base] Docker Compose: postgres (4 DBs), Kafka (KRaft), kafka-ui | E1 | infra | 1 | 5h block-1 |
| HF-3 | Task | [Base] packages/contracts: event envelope, error codes | E1 | infra | 1 | 5h block-1 |
| HF-4 | Task | [Base] service-kit: createService, errors, validate, requireAuth/requireRole, Kafka publish/subscribe + de-dup | E1 | infra | 3 | 5h block-1 |
| HF-5 | Task | [Base] services/_template → gateway + 4 services with /health | E1 | gateway | 2 | 5h block-1 |
| HF-6 | Task | [Base] Web shell: Next.js + shadcn + sidebar + api client | E1 | web | 1 | 5h block-1 |
| HF-7 | Task | [Base] CLAUDE.md + .env.example | E1 | infra | 1 | 5h block-1 |
| HF-8 | Story | [Auth] Log in / log out with email + password | E2 | auth, gateway, web | 3 | 5h block-2 |
| HF-9 | Story | [Auth] Role-aware sidebar + route guard (RBAC) | E2 | web | 2 | 5h block-2 |
| HF-10 | Task | [Seed] Users for the 3 roles | E2 | auth | 1 | 5h block-2 |
| HF-11 | Story | [Jobs] Jobs list grouped by department | E3 | job, web | 2 | 5h block-3 |
| HF-12 | Story | [Jobs] Create a job via 3-step wizard | E3 | job, web | 3 | 5h block-3 |
| HF-13 | Task | [Events] job.created → JobRef in candidate-service | E3 | job, candidate | 2 | 5h block-3 |
| HF-14 | Story | [Candidates] Add candidate + attach to job (with signal score) | E4 | candidate, web | 3 | 5h block-4 |
| HF-15 | Story | [Pipeline] Board with columns and cards | E4 | candidate, web | 3 | 5h block-4 |
| HF-16 | Story | [Pipeline] Drag a card to another stage | E4 | candidate, web | 3 | 5h block-4 |
| HF-17 | Story | [Pipeline] Column metrics: count, conversion %, avg days | E4 | candidate, web | 2 | 5h block-4 |
| HF-18 | Story | [Profile] Header, timeline, notes, reject | E4 | candidate, web | 3 | 5h block-4 |
| HF-19 | Task | [Seed] Departments, jobs, 30 candidates with history | E4 | job, candidate | 2 | 5h block-4 |
| HF-20 | Story | [Inbox] Review inbox with Advance / Reject (+ A / R keys) | E5 | candidate, web | 3 | 5h block-5 |
| HF-21 | Story | [Interviews] Schedule an interview (with double-booking check) | E6 | interview, web | 3 | 5h block-6 |
| HF-22 | Story | [Interviews] My interviews + submit scorecard | E6 | interview, web | 3 | 5h block-6 |
| HF-23 | Task | [Events] interview/scorecard events → candidate timeline | E6 | interview, candidate | 2 | 5h block-6 |
| HF-24 | Task | [Demo] README (diagram, run steps, what's next) + rehearsal | E7 | infra | 1 | 5h block-7 |

**5-hour total:** 24 tickets, 51 points.

### Later tickets

| Key | Type | Title | Epic | Component | Pts | Labels |
|---|---|---|---|---|---|---|
| HF-25 | Task | [Offers] Create offer-service from template + letter templates | E8 | offer | 3 | later phase-a |
| HF-26 | Story | [Offers] Offer builder with ordered approval chain | E8 | offer, web | 5 | later phase-a |
| HF-27 | Story | [Offers] Approve / reject a step | E8 | offer, web | 3 | later phase-a |
| HF-28 | Story | [Offers] Letter preview, send, accept → Hired | E8 | offer, candidate | 3 | later phase-a |
| HF-29 | Story | [Email] notification-service: interview invites, candidate emails | E9 | notification | 3 | later phase-a |
| HF-30 | Story | [Notifications] Bell with unread count | E9 | notification, web | 3 | later phase-a |
| HF-31 | Task | [Reports] reporting-service consumers + fact tables | E10 | reporting | 3 | later phase-a |
| HF-32 | Story | [Reports] KPI tiles + funnel | E10 | reporting, web | 3 | later phase-a |
| HF-33 | Story | [Reports] Time in stage + interview volume | E10 | reporting, web | 2 | later phase-a |
| HF-34 | Story | [Dashboard] KPIs + my tasks | E10 | web | 2 | later phase-a |
| HF-35 | Story | [Search] Cmd+K with gateway fan-out | E11 | gateway, web | 3 | later phase-a |
| HF-36 | Story | [Import] CSV import with error report | E11 | candidate, web | 5 | later phase-a |
| HF-37 | Story | [Pipeline] Bulk move / reject / tag | E11 | candidate, web | 3 | later phase-a |
| HF-38 | Story | [Files] Resume upload (MinIO) + Files tab | E11 | candidate, web | 3 | later phase-a |
| HF-39 | Story | [Interviews] Visual availability grid | E11 | interview, web | 5 | later phase-a |
| HF-40 | Story | [Calendar] Google Calendar sync | E11 | interview | 5 | later phase-a |
| HF-41 | Story | [Auth] Signup, invite users, user admin | E12 | auth, web | 3 | later phase-a |
| HF-42 | Story | [Auth] TOTP 2FA | E12 | auth, web | 5 | later phase-a |
| HF-43 | Story | [Auth] Google sign-in | E12 | auth, web | 3 | later phase-a |
| HF-44 | Task | [Auth] Refresh-token rotation | E12 | auth | 2 | later phase-a |
| HF-45 | Task | [E2E] Playwright suite (7 flows) | E13 | web | 5 | later phase-b |
| HF-46 | Task | [Events] Transactional outbox + DLQ topics | E13 | infra | 3 | later phase-b |
| HF-47 | Task | [Auth] RS256 keys (only auth-service signs) | E13 | auth | 2 | later phase-b |
| HF-48 | Task | [CI] GitHub Actions: lint, typecheck, test | E13 | infra | 2 | later phase-b |
| HF-49 | Task | [k8s] Dockerfile per service | E14 | k8s | 2 | later phase-c |
| HF-50 | Task | [k8s] Generic Helm chart + values per service | E14 | k8s | 3 | later phase-c |
| HF-51 | Task | [k8s] kind cluster + ingress-nginx + Strimzi Kafka + Postgres | E14 | k8s | 5 | later phase-c |
| HF-52 | Task | [Infra] Terraform: create kind + install platform + deploy apps | E14 | k8s | 5 | later phase-c |

**Later total:** 28 tickets, 94 points.

### Sample bug
```
Title:    [Pipeline] Card snaps back when dropped into an empty column
Type: Bug  Priority: High  Component: web  Labels: 5h block-4
Steps:    1. Open Backend Engineer pipeline  2. Drag Rahul to "Offer" (0 cards)
Expected: card stays in Offer
Actual:   card animates back; no request in Network tab
```

### Bulk-create tickets
Jira → Settings → System → **External system import → CSV**. Columns: `Summary, Issue Type, Parent (epic), Story Points, Component/s, Labels, Priority`. Copy these tables into a sheet, export it as CSV, and import it.
