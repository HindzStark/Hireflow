# 06 · Frontend Pages & UX

The frontend is **one Next.js app** (`apps/web`). It does not know about microservices. It only calls `/api/v1/*` on the gateway.

## 1. App shell

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ◆ HireFlow   [ 🔍 Search…            Ctrl K ]                 🔔3   (P) Priya ▾│
├───────────────┬──────────────────────────────────────────────────────────────┤
│ HIRING        │                                                              │
│  ▣ Dashboard  │                                                              │
│  ▤ Jobs       │                     PAGE CONTENT                             │
│  ☰ Candidates │                                                              │
│  ✉ Inbox  12  │                                                              │
│  ◷ Interviews │                                                              │
│  ✎ Offers  2  │                                                              │
│ INSIGHTS      │                                                              │
│  ▥ Reports    │                                                              │
│ SETTINGS      │                                                              │
│  ⚙ Profile    │                                                              │
│  👥 Users  ◆  │  ◆ = Admin only                                              │
│  🏢 Depts  ◆  │                                                              │
│  📄 Templates◆│                                                              │
└───────────────┴──────────────────────────────────────────────────────────────┘
```

In the 5-hour build, the sidebar shows only items that exist. Later items (Offers, Reports, Settings pages, search box, bell) appear as they are built.

**What each role sees in the sidebar**
| Item | ADMIN | HR | INTERVIEWER | When |
|---|---|---|---|---|
| Jobs, Candidates, Inbox | ✅ | ✅ | ❌ | ✅ 5h |
| Interviews | ✅ all | ✅ all | ✅ mine only | ✅ 5h |
| Dashboard, Offers, Reports | ✅ | ✅ | ❌ (dashboard: ✅ my tasks) | ⏩ |
| Users, Departments, Templates | ✅ | ❌ | ❌ | ⏩ |

## 2. Route map
✅ = 5-hour build · ⏩ = later

| | Route | Page | Roles |
|---|---|---|---|
| ✅ | `/login` | Login form (seeded users) | public |
| ✅ | `/jobs` | Jobs grouped by department | AD HR |
| ✅ | `/jobs/new` | **3-step wizard** | AD HR |
| ✅ | `/jobs/[id]/pipeline` | **Kanban** | AD HR |
| ✅ | `/candidates` | Table + **Add candidate** dialog | AD HR |
| ✅ | `/candidates/[id]` | **Profile**: header, timeline, notes, interviews, scorecards | AD HR, IN (limited) |
| ✅ | `/inbox` | **Review inbox** | AD HR |
| ✅ | `/interviews` | My interviews (IN) / all interviews (AD HR) | all |
| ✅ | `/interviews/[id]` | Interview detail + **scorecard form** | AD HR, participant |
| ⏩ | `/signup`, `/login/2fa`, `/settings/*` | Signup, 2FA, profile, admin pages | — |
| ⏩ | `/dashboard` | KPIs + my tasks | all |
| ⏩ | `/candidates/import` | CSV import | AD HR |
| ⏩ | `/offers/*` | Offers | AD HR |
| ⏩ | `/reports` | Reports | AD HR |

After login: AD/HR land on `/jobs`, Interviewers on `/interviews`.

## 3. Key screens

### 3.1 Jobs (grouped by department) ✅
```
Jobs                                          [Status: Open ▾] [+ New job]
▼ Engineering (3)
  Backend Engineer     Bangalore · Remote   OPEN    24 active  Priya  [Pipeline →]
  Frontend Engineer    Pune                 OPEN    11 active  Neha   [Pipeline →]
  SRE                  Remote               DRAFT    0         Priya  [Edit]
▼ Sales (1)
  Account Executive    Mumbai               OPEN     9 active  Neha   [Pipeline →]
```

### 3.2 New job wizard (3 steps ✅)
```
 ① Basics ─────────── ② Description & skills ─────────── ③ Review & publish
 ① title, department, location, remote, type, openings, salary range, min years
 ② description (textarea), required skills chips, nice-to-have chips
 ③ summary + the default stages (Applied → Screen → Interview → Offer → Hired) → [Publish]
```
One form state across all steps (React Hook Form). Each step validates its part of the Zod schema, and there is one `POST /jobs` at the end.
⏩ Later: a stage-editor step (reorder, rename, add, remove).
✂️ If running late: a single-page form with the same fields.

### 3.3 Pipeline (Kanban) ✅
```
Backend Engineer · Pipeline         [🔍 filter] [Score ≥ 50 ▾] [☐ Select]  [+ Add candidate]
┌─────────────┬─────────────┬─────────────┬───────────┬──────────┐
│ Applied  18 │ Screen   12 │ Interview 7 │ Offer   1 │ Hired  1 │
│ →67% · 2.1d │ →58% · 3.4d │ →43% · 5.0d │ →100%     │          │
├─────────────┼─────────────┼─────────────┼───────────┼──────────┤
│┌───────────┐│┌───────────┐│             │           │          │
││Rahul S. 82││││Anita K. 74│││             │           │          │
││SDE II     ││││Flipkart   │││             │           │          │
││⏱ 2d 🏷ref ││││📅 Tue 3pm │││             │           │          │
│└───────────┘│└───────────┘│             │           │          │
└─────────────┴─────────────┴─────────────┴───────────┴──────────┘
 header: count · →% conversion to next stage · avg days in stage
```
- dnd-kit drag with an optimistic update, rolled back with a toast if the API fails.
- Score badge colors: green ≥75 / amber 50–74 / grey <50.
- Click a card to open the candidate profile. ⏩ Later: side-drawer preview, filters, "Select" mode for bulk actions.
- 5h: "Reject" lives on the profile page. ✂️ If late, show only the count in the column header.

### 3.4 Candidate profile ✅
```
┌───────────────────────────────────────────────────────────────────────────────┐
│ (RS) Rahul Sharma        rahul@mail.com · Bangalore · LinkedIn ↗              │
│      SDE II @ Flipkart · 5 yrs   🏷 referral                                  │
│ [Backend Engineer — Interview ▾]  [Move ▾] [Reject] [Schedule interview]      │
├───────────────────────────────────────────────────────────────────────────────┤
│ Timeline | Notes | Interviews & Scorecards        (⏩ Emails | Files)         │
├───────────────────────────────────────────────────────────────────────────────┤
│ ● Today 11:02  Priya moved to Interview                                       │
│ ● Today 10:40  Arjun submitted scorecard — Strong Yes                         │
│ ● Yesterday    Interview scheduled for Tue 3pm                                │
│ ● Oct 20       Added by Priya · Applied to Backend Engineer                   │
└───────────────────────────────────────────────────────────────────────────────┘
 right rail: signal score (⏩ breakdown bars), quick note
```
The "Interviews & Scorecards" tab loads from **interview-service** (`GET /interviews?candidateId=`). The rest loads from **candidate-service**. An interviewer sees only the header and the interviews they are on.

### 3.5 Review inbox ✅
```
Review inbox (12)        Job [All ▾]      Shortcuts: A advance · R reject   (⏩ S skip · J/K · U undo)
┌──────────────────────────┬──────────────────────────────────────────────────┐
│▶ Rahul Sharma   82 Strong│ Rahul Sharma — Backend Engineer                   │
│  Anita K.       74 Medium│ Skills: node ✓ postgres ✓ aws ✗   5 yrs (min 3)   │
│  John D.        41 Weak  │ Current: SDE II @ Flipkart · Bangalore             │
│                          │ (⏩ resume preview, score breakdown bars)          │
│                          │ [Advance (A)]  [Reject ▾ (R)]                     │
└──────────────────────────┴──────────────────────────────────────────────────┘
```

### 3.6 Schedule interview
**✅ 5h: a simple dialog** (opened from the profile):
```
┌─ Schedule interview: Rahul Sharma · Backend Engineer ─┐
│ Title        [Technical round 1        ]              │
│ Date [2026-11-04]  Start [15:00]  Duration [60 min ▾] │
│ Interviewers [Arjun ×] [+ add]                        │
│ Location     [Google Meet link         ]              │
│                              [Cancel] [Schedule]      │
└────────────────────────────────────────────────────────┘
```
If Arjun already has an interview at that time → error "Arjun is busy 15:00–16:00" (409).

**⏩ Later: visual availability grid**
```
Schedule: Rahul — Technical round    Duration [60m ▾]   Interviewers [Arjun ×][Sara ×][+]
         Mon 3    Tue 4    Wed 5    Thu 6    Fri 7
 10:00   ░░░░░    █████    ░░░░░    ▒▒▒▒▒    ░░░░░     █ all free (click to book)
 10:30   ░░░░░    █████    ▒▒▒▒▒    ▒▒▒▒▒    █████     ▒ some free (hover: who's busy)
 11:00   █████    ▒▒▒▒▒    ▒▒▒▒▒    ░░░░░    █████     ░ nobody free
 [Tue 4, 10:00–11:00]  Location [Meet link]   [Book interview]
```

### 3.6b My interviews + scorecard ✅
```
My interviews (Arjun)
 Tue 4 Nov 15:00  Rahul Sharma · Backend Engineer · Technical round 1   [Open →]

Interview: Rahul Sharma · Technical round 1
 Scorecard
  Problem solving   ○1 ○2 ○3 ●4
  Coding            ○1 ○2 ●3 ○4
  Communication     ○1 ○2 ●3 ○4
  Overall  [Strong No] [No] [Yes] [■ Strong Yes]
  Summary  [Strong fundamentals, clean code…           ]
                                              [Submit scorecard]
```

### 3.7 Offer builder & approvals ⏩
```
 ① Details ── ② Approval chain ── ③ Preview & submit
 ① salary, currency, bonus, start date, expiry, template
 ② ordered approvers (HR/Admin users): 1. Neha (HR)  2. Karan (Admin)  [+ add]
 ③ A4-style letter preview → [Save draft] [Submit for approval]

 Offer page:  Status PENDING APPROVAL
   ✔ 1. Neha  — approved "Looks good"
   ⏳ 2. Karan — pending   [Approve] [Reject]   ← only Karan sees the buttons
   [Preview letter] [Print / PDF] [Send] (when APPROVED) [Mark accepted/declined]
```

### 3.8 Reports ⏩
```
[Date range ▾] [Department ▾] [Job ▾]
 Open jobs 23 │ Active candidates 412 │ Interviews this wk 31 │ Offers pending 4 │ Time to hire 18d │ Acceptance 82%
 Funnel bars: Applied 400 → Screen 220 → Interview 95 → Offer 18 → Hired 15
 Interview volume per week (line)   |   Avg days in stage (bar)   |   Source of hire (table)
```

### 3.9 Cmd+K ⏩
```
┌──────────────────────────────┐
│ 🔍 rah                       │
│ CANDIDATES  Rahul Sharma     │
│ JOBS        —                │
│ ACTIONS     + New job · Reports│
└──────────────────────────────┘
```
200 ms debounce → `GET /search?q=`. Actions are filtered client-side.

## 4. Frontend conventions
- `lib/api.ts`: one fetch wrapper (`credentials: 'include'`, auto-refresh on a 401, typed errors).
- One TanStack Query hook per resource in `hooks/` (`useJobs`, `usePipeline`, `useMoveApplication`).
- Forms use React Hook Form + Zod schemas imported from `packages/contracts`.
- `<Can roles={['ADMIN','HR']}>` hides UI the user can't use.
- Toasts for success and errors, skeleton loaders, empty states with a call to action.
- `data-testid` on interactive elements for Playwright.
