# HireFlow: Progress Tracker & Session Handoff

> **For every new Claude Code session:** read this file first, then `.claude/CLAUDE.md`.
> **Ticking is automatic:** a Stop hook (`scripts/sync-progress.mjs`) runs after every Claude run. It ticks checklist items whose `HF-n` appears in a `Refs:` commit footer on `develop`/`main`, adds merged tickets that aren't listed, and rewrites the ✅/⏳ block below. Don't edit that block by hand.
> **At the end of every feature/session you still write:** the "Current status" table, a session-log entry, and the "Next step" section.

## Current status
| | |
|---|---|
| **Phase** | Scaffold done → next is **Block 1: Clean base** |
| **Current branch** | `develop` (start a new branch for the next ticket) |
| **Last release tag** | `v0.0.1` (scaffold) |
| **Blockers** | Start Docker Desktop (see `docs/SETUP-CHECKLIST.md`) |
| **Last updated** | 2026-10-26 |

<!-- AUTO-SYNC:START (maintained by scripts/sync-progress.mjs via the Stop hook; do not edit by hand) -->
**Tickets: 3/24 done (13%)**, counted from `Refs: HF-n` footers of commits on `develop` / `main`
- ✅ **Done:** HF-1, HF-2, HF-7
- ⏳ **Remaining:** HF-3, HF-4, HF-5, HF-6, HF-8, HF-9, HF-10, HF-11, HF-12, HF-13, HF-14, HF-15, HF-16, HF-17, HF-18, HF-19, HF-20, HF-21, HF-22, HF-23, HF-24
- ▶ **Next ticket:** HF-3 `packages/contracts`: event envelope, error codes
<!-- AUTO-SYNC:END -->

## ▶ Next step (do exactly this)
1. Finish the open items in `docs/SETUP-CHECKLIST.md` (Docker Desktop running, `.env` present).
2. Start the infra: `pnpm infra:up` → open http://localhost:8080 (kafka-ui) to confirm Kafka is up.
3. New branch: `git checkout develop && git pull && git checkout -b feature/HF-3-contracts-and-service-kit`
4. In Claude Code (plan mode), prompt:
   > Read .claude/CLAUDE.md and docs/PROGRESS.md. Implement Block 1 tickets HF-3 and HF-4 from plans/08: packages/contracts (event envelope + error codes) and packages/service-kit (createService, errors, validate, requireAuth/requireRole with HS256 JWT_SECRET, internal client, Kafka publish/subscribe with ProcessedEvent de-dup) as described in plans/03 §3 and §6. Add unit tests. Don't touch services yet.
5. Then HF-5 on its own branch: `_template` service + gateway + 4 services with `/health`, so that `GET localhost:4000/api/v1/health` shows all OK. HF-6 next: web shell (shadcn init, sidebar, api client).

## 5-hour build checklist
Ticked automatically when a ticket is merged into `develop` (manual ticks are kept; nothing is ever unticked). Ticket details are in `plans/08`, block timings in `plans/07`.

### Scaffold (done before the clock starts)
- [x] Git repo, `main` + `develop` branches, remote on GitHub
- [x] Monorepo config: pnpm workspaces, Turborepo, tsconfig base, Prettier, EditorConfig (HF-1)
- [x] docker-compose: Postgres (4 DBs), Kafka KRaft, kafka-ui; `.env.example` (HF-2)
- [x] Package skeletons + all dependencies installed (no source code yet)
- [x] `.claude/CLAUDE.md`, `CONTRIBUTING.md`, PR template, this tracker (HF-7)

### Block 1: Clean base (0:00–0:45)
- [ ] HF-3 `packages/contracts`: event envelope, error codes
- [ ] HF-4 `packages/service-kit`: createService, errors, validate, auth, Kafka helpers
- [ ] HF-5 `_template` → gateway + auth/job/candidate/interview with `/health`; gateway aggregated health
- [ ] HF-6 Web shell: shadcn init, Tailwind config, sidebar layout, `lib/api.ts`
- [ ] ✔ Done when: health all green + test event visible in kafka-ui and consumed once

### Block 2: Auth (0:45–1:20)
- [ ] HF-8 Login/logout (auth-service + gateway cookie check + login page)
- [ ] HF-9 Role-aware sidebar + route guard
- [ ] HF-10 Seed users (Karan ADMIN, Priya/Neha HR, Arjun/Sara INTERVIEWER)

### Block 3: Jobs (1:20–2:00)
- [ ] HF-11 Jobs list by department
- [ ] HF-12 3-step job wizard
- [ ] HF-13 `job.created` → `JobRef` in candidate-service

### Block 4: Candidates + Pipeline (2:00–3:20)
- [ ] HF-14 Add candidate + attach to job + signal score
- [ ] HF-15 Board columns & cards
- [ ] HF-16 Drag card between stages
- [ ] HF-17 Column metrics
- [ ] HF-18 Profile: header, timeline, notes, reject
- [ ] HF-19 Seed departments, jobs, 30 candidates

### Block 5: Review inbox (3:20–4:00)
- [ ] HF-20 Inbox with Advance/Reject + A/R keys

### Block 6: Interviews (4:00–4:40)
- [ ] HF-21 Schedule interview (double-booking check)
- [ ] HF-22 My interviews + scorecard
- [ ] HF-23 Interview/scorecard events → candidate timeline

### Block 7: Buffer + demo (4:40–5:00)
- [ ] HF-24 README + demo rehearsal
- [ ] Release `develop` → `main`, tag `v1.0.0`

Later phases (offers, reports, k8s…) are tracked in `plans/99-post-mvp-roadmap.md`.

## Session log (newest first)
| Date | Branch | What was done | Tag/commit | Notes for next session |
|---|---|---|---|---|
| 2026-10-26 | `chore/progress-sync-hook` → `develop` | Added the Stop hook + `scripts/sync-progress.mjs`: auto-ticks this checklist from `Refs: HF-n` commit footers, adds unlisted merged tickets, maintains the ✅/⏳ block | (see git log) | The hook only loads after you open `/hooks` once or restart Claude Code. Every commit needs a `Refs: HF-n` footer or it won't tick. |
| 2026-10-26 | `chore/HF-1-project-scaffold` → `develop` → `main` | Repo init, monorepo config, docker compose, package skeletons, deps installed, CLAUDE.md, git workflow docs | `v0.0.1` | Docker Desktop was not running, so images are not pulled yet. Pinned TS 5, Prisma 6 (pnpm resolved TS 7 and a Prisma 8 RC by default). |

## Handoff template (copy into the log at the end of a session)
```
| <date> | <branch> | <what was finished, ticket keys> | <tag or short sha> | <what's half-done, gotchas, exact next action> |
```
