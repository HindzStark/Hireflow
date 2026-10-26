# 07 · The 5-Hour Plan (MVP) + Later Phases

## 1. The constraint
The problem statement is sized like a **2–3 day** project, but you get **~5 working hours** in one day. Nobody expects every feature. The judges look for:
1. A **clean, working core** that demos end to end
2. **Sound architecture** (microservices done properly, not just folders)
3. Clear thinking about **what you cut and why** (the "later" list in file 99 is part of your demo)

## 2. Golden rules for the day
- **Timebox every block.** If a block overruns by 15 minutes, drop its nice-to-haves and move on.
- **Always keep it runnable.** Commit after every working step; `git tag` after each block.
- **Seed data early.** A board full of realistic candidates demos far better than an empty screen.
- **Don't polish too early.** Make it work everywhere first, then make it pretty in the buffer.

## 3. The 5-hour MVP

**Demo story it must support:**
> Priya (HR) logs in → creates a job with the wizard → adds a candidate → advances them in the Review Inbox → drags them on the Kanban board → schedules an interview with Arjun → Arjun logs in and submits a scorecard → Priya sees everything on the candidate's timeline.

### Timeline

```
0:00 ─── 0:45 ──── 1:20 ───── 2:00 ────────── 3:20 ──── 4:00 ──── 4:40 ── 5:00
│ Clean base │ Auth │  Jobs   │ Candidates+Pipeline │  Inbox  │Interviews│Buffer│
```

| Time | Block | Build | Done when ✔ | Cut first if late ✂️ |
|---|---|---|---|---|
| **0:00–0:45** | **1. Clean base** | pnpm monorepo · docker compose (postgres w/ 4 DBs, kafka, kafka-ui) · `service-kit` · `services/_template` → gateway + 4 services · web shell (Next.js + shadcn + sidebar) | `GET /api/v1/health` shows all 4 services OK · a test event is visible in kafka-ui and logged by one consumer | lint config polish |
| **0:45–1:20** | **2. Auth** | auth-service: login, logout, me, JWT cookie · gateway checks JWT · `requireRole` · seed 4 users · login page · role-aware sidebar | Each role logs in and sees its own menu; an interviewer gets 403 on HR routes | logout button styling |
| **1:20–2:00** | **3. Jobs** | job-service: departments (seeded), jobs list grouped by department, **3-step wizard**, default stages · event `job.created` → candidate-service saves `JobRef` | The new job shows in the list **and** a JobRef row exists in candidate_db | editing stages |
| **2:00–3:20** | **4. Candidates + Pipeline** | candidate-service: add candidate (+ attach to job), signal score, **Kanban** drag-drop, column metrics, profile (header + timeline + notes) · seed 30 candidates with history | Drag a card, refresh, and it stays; the timeline shows "moved to Interview"; column numbers change | metrics → count only; notes |
| **3:20–4:00** | **5. Review inbox** | list of unreviewed applications sorted by score · Advance / Reject buttons · `A` / `R` keys | Pressing A moves the candidate to Screen and removes them from the inbox | keyboard shortcuts (keep buttons) |
| **4:00–4:40** | **6. Interviews** | interview-service: schedule form (date, time, interviewers; double-booking check) · interviewer's "My interviews" · scorecard form · events → candidate timeline | Arjun submits a scorecard and Priya sees it on Rahul's profile | double-booking check |
| **4:40–5:00** | **7. Buffer + demo** | fix bugs · README (diagram + how to run + "what's next") · rehearse the story once | Story runs start to finish without errors | — |

### What is deliberately NOT in the 5 hours
Offers, reports, Cmd+K, notifications, emails, resume upload, CSV import, bulk actions, signup/invite/2FA/Google, visual availability grid, calendar sync, full Playwright suite, Kubernetes, Terraform.
→ All are listed in phases A–C below and in [99-post-mvp-roadmap.md](99-post-mvp-roadmap.md). **Show that list in the demo.** It proves you planned the whole product.

### Prepare BEFORE the day (practice runs)
You can't bring code (check the rules), but you **can** bring skill:
- Practice block 1 (clean base) until it takes **≤45 minutes** with Claude Code.
- Have your `CLAUDE.md` template and prompts (file 11) ready to paste.
- Know your Kafka, Prisma, and dnd-kit basics so you aren't learning them on the day.

## 4. Later phases (after the 5 hours, or in practice sessions)

### Phase A: Remaining features
| Feature | Service |
|---|---|
| Offers: builder, multi-step approval chain, letter preview, send/accept → Hired | **offer-service** (new) |
| Emails (interview invites, offer letter) + notification bell | **notification-service** (new) |
| Reports: KPIs, funnel, time in stage, interview volume | **reporting-service** (new) |
| Cmd+K search (gateway fan-out) | gateway |
| CSV import + bulk actions | candidate |
| Resume upload (MinIO), Emails & Files tabs | candidate |
| Visual availability grid | interview |
| Signup, invite users, 2FA (TOTP), Google sign-in | auth |

### Phase B: Quality & hardening
- Playwright suite (7 flows, file 09)
- Transactional **outbox** (no lost events if a service crashes mid-way)
- RS256 JWT keys (only auth-service can sign)
- CI on GitHub Actions

### Phase C: Infrastructure
- Dockerfile per service
- Generic **Helm** chart reused by every service
- **kind** cluster + ingress-nginx + **Strimzi** (Kafka on k8s) + Postgres
- **Terraform** that creates the kind cluster and deploys everything with `terraform apply`
- Details in [10-infra-and-devops.md](10-infra-and-devops.md) §3

## 5. Checkpoints during the 5 hours
| Time | Check |
|---|---|
| 0:45 | Health all green? If not, fix it now. Everything depends on the base. |
| 2:00 | Logged in, job created? If behind by >20 min: wizard → single form |
| 3:20 | Kanban works? This is the hero feature; protect it. |
| 4:40 | Stop adding features. Only fix bugs and prepare the demo. |
