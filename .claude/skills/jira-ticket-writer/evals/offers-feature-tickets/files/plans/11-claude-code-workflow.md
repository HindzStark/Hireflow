# 11 · Working with Claude Code (Beginner Playbook for a 5-Hour Build)

## 1. Mental model
Claude Code is a **pair programmer that reads your repo and runs commands**. It works best when you:
1. Give it **context**: `CLAUDE.md` + these plan docs.
2. Ask for **one focused thing at a time** (one ticket or one block step).
3. Make it **verify**: run the service, curl the endpoint, check kafka-ui.
4. **Review** before committing.

On a 5-hour day, the biggest time-wasters are vague prompts, giant changes you can't review, and debugging loops. The habits below avoid all three.

## 2. Commands & features you'll use
| What | How | When |
|---|---|---|
| Plan before coding | **Plan mode** (Shift+Tab) | start of each block (2–3 min, not more) |
| Auto-accept edits | Shift+Tab → accept edits | once the plan looks right |
| Point at docs | `@plans/05-api-design.md` in your prompt | every feature prompt |
| Fresh context | `/clear` | between blocks |
| Review | `/code-review` | only if time allows (block 7) |
| Undo a wrong turn | `Esc Esc` (rewind) or `git checkout .` | when Claude goes off track |
| Background run | ask Claude to start `pnpm dev` in the background | keep the app running while you work |

## 3. `CLAUDE.md` template (paste into the repo root in block 1)

```markdown
# HireFlow: internal ATS, microservices, 5-hour build

## Scope
Build ONLY what is marked ✅ in /plans (5-hour MVP). Things marked ⏩ are later. Don't build them unless asked.
Roles: ADMIN, HR, INTERVIEWER.

## Source of truth
- Architecture & rules: plans/03-tech-stack-and-architecture.md
- DB per service: plans/04-database-models.md
- API + gateway routes + Kafka events: plans/05-api-design.md
- Screens: plans/06-frontend-pages-and-ux.md
- Time blocks: plans/07-mvp-scope-and-phases.md

## Layout
apps/web (Next.js 14 + Tailwind + shadcn/ui + TanStack Query + dnd-kit)
services/{gateway,auth-service,job-service,candidate-service,interview-service} (Express + Zod + Prisma), made from services/_template
packages/contracts (Zod schemas, event envelope) · packages/service-kit (shared server plumbing)

## Commands
docker compose up -d   (postgres :5432, kafka :9092, kafka-ui :8080)
pnpm dev | pnpm db:migrate | pnpm db:seed | pnpm db:reset | pnpm test | pnpm typecheck

## Microservice rules (never break)
- A service only touches its OWN database. Never import another service's code or Prisma client.
- Need data now → call the other service's /internal/* route via service-kit (x-internal-token).
- Something happened → publish(topic, key, envelope) AFTER the DB transaction commits.
  Topics: hireflow.job, hireflow.application, hireflow.interview. Key = entity id.
- Consumers use service-kit subscribe() (consumer group = service name, de-dup via ProcessedEvent).
- The browser only calls the gateway at /api/v1. New public route → add it to the gateway routing table.

## Code conventions
- route → service function → Prisma. Responses { data } / { data, meta }; errors { error: { code, message } }.
- Every route: requireAuth + requireRole(...) from service-kit; ownership checks inside the service.
- Seed data uses fixed IDs (usr_priya, job_backend, stg_backend_screen…).
- Keep it simple: no extra libraries or abstractions beyond plans/03 §5.
```

## 4. The loop for each block
```
1. /clear   → paste the block prompt (below), in plan mode
2. Skim the plan (≤2 min) → approve
3. Claude builds → ask it to verify the block's "Done when" (07)
4. Check it yourself in the browser / kafka-ui (≤2 min)
5. git commit -m "HF-xx: …"  → drag Jira cards to Done
6. Over time by 15 min? → apply the block's ✂️ cut and move on
```

## 5. Prompts per block (copy, paste, adjust)

**Block 1: Clean base (0:00–0:45)**
> Read @CLAUDE.md and @plans/03-tech-stack-and-architecture.md. Create the clean base:
> 1. pnpm + Turborepo monorepo with the layout in 03 §6, and a shared tsconfig.
> 2. docker-compose.yml and postgres-init.sql exactly as in @plans/10-infra-and-devops.md §1.
> 3. packages/contracts: the event envelope type + Zod schema, error codes.
> 4. packages/service-kit with the helpers in 03 §6 (createService, errors, validate, requireAuth/requireRole with HS256 JWT_SECRET, internal client, Kafka publish/subscribe using kafkajs with ProcessedEvent de-dup).
> 5. services/_template, then gateway + auth/job/candidate/interview services from it (ports in 00-README), each with GET /health and its own Prisma schema (just ProcessedEvent for now).
> 6. Gateway routing table from @plans/05-api-design.md §2 and an aggregated /api/v1/health.
> 7. apps/web: Next.js + Tailwind + shadcn, the sidebar shell from 06 §1, lib/api.ts.
> Verify: docker compose up -d, pnpm dev, curl the gateway health (all ok). Then publish a test event from job-service to hireflow.job and show candidate-service logging it once.

**Block 2: Auth (0:45–1:20)**
> Implement HF-8, HF-9, HF-10 using @plans/05-api-design.md §3 (✅ rows only) and @plans/02-users-roles-and-use-cases.md §2–4. auth-service: User model from 04 §2 (no 2FA/refresh fields), bcrypt, login sets an httpOnly access_token cookie (HS256, 8 h), logout, me, GET /users, GET /internal/users. Gateway verifies the cookie. Seed the 5 users from 04 §10. Web: login page, auth guard, role-aware sidebar (06 §1), redirect AD/HR → /jobs and IN → /interviews. Verify by logging in as priya and arjun, and show that arjun gets 403 on GET /api/v1/jobs.

**Block 3: Jobs (1:20–2:00)**
> Implement HF-11, HF-12, HF-13. job-service per 04 §3 and 05 §4 (✅ rows): seeded departments, GET /jobs grouped by department, POST /jobs creating the default stages, then publish job.created to hireflow.job (key = jobId) with the payload from 05 §8. candidate-service: JobRef model + consumer upserting it. Web: jobs page (06 §3.1) and the 3-step wizard (06 §3.2) with RHF + Zod from packages/contracts. Verify: create a job in the UI, see the event in kafka-ui, and query the JobRef row.

**Block 4: Candidates + pipeline (2:00–3:20)**: split into two prompts
> (a) HF-14, HF-19: candidate-service models from 04 §4 (skip `// later` fields). POST /candidates with optional jobId → application in the first stage + signal score (03 §7, with a unit test). Seed 30 candidates with back-dated StageTransitions so the metrics look real. Web: candidates table + Add candidate dialog.
>
> (b) HF-15–18: GET /jobs/:id/pipeline with metrics (05 §5 example response), POST /applications/:id/move and /reject (one DB transaction: Application + StageTransition + Activity, then publish to hireflow.application). Web: Kanban with dnd-kit + optimistic update (06 §3.3), profile page with timeline + notes + reject (06 §3.4). Add the API test from 09 §1 #2. Verify by dragging a card, refreshing, and checking the timeline + kafka-ui.

**Block 5: Review inbox (3:20–4:00)**
> Implement HF-20 per 05 §5 "Review inbox" (✅ rows) and 06 §3.5. Advance = move to the next stage by position + set reviewedAt; Reject = reason + reviewedAt. Keys A/R must not fire inside inputs. Verify with the seeded unreviewed applications.

**Block 6: Interviews (4:00–4:40)**
> Implement HF-21–23 per 05 §6 (✅ rows), 04 §5, 06 §3.6 and §3.6b. POST /interviews calls candidate-service /internal/applications/:id and auth-service /internal/users for snapshots, rejects double-booking with 409, and publishes interview.scheduled. Scorecards are only for participants and publish scorecard.submitted. candidate-service consumes both → timeline entries. Web: Schedule dialog on the profile, My interviews page, scorecard form, interviews section on the profile. Verify the full flow as priya, then arjun.

**Block 7: Buffer + demo (4:40–5:00)**
> Write README.md: what HireFlow is, the architecture diagram from 03 §1, how to run (10 §1), the demo story (01 §5), and "What's next" from 07 §4. Then run pnpm typecheck and fix anything that fails. Don't add features.

## 6. When something breaks (cross-service debugging prompt)
> The scorecard doesn't appear on the candidate timeline. Trace it step by step: did interview-service publish to hireflow.interview (check kafka-ui)? Is candidate-service subscribed with group candidate-service? Did the consumer log an error or skip it as a duplicate? Report what you find before changing code.

## 7. Time-saving tips for the day
- **Prompts point at docs**, so you never retype the API or schema.
- **One block = one or two prompts.** If Claude touches 30 files for one ticket, stop and split the work.
- **Same error 2–3 times?** `/clear`, paste the exact error, and say "find the root cause first".
- **Seed data early** (block 4a), so every later screen has data.
- **Don't polish before 4:40.** Make everything work end to end first.
- **Commit after each green check.** Git is your undo button.

## 8. Practice plan before the day
1. Run block 1 alone until it takes **≤45 min**. It's the riskiest block.
2. Do a full 5-hour dry run with a timer. Note where you overran in file 99.
3. Shorten the prompts that worked into your own cheat sheet.
4. Practice the 3-minute demo: the story in 01 §5 + kafka-ui + the "What's next" slide.
