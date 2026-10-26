# 02 · Users, Roles & Use Cases

## 1. Roles (only 3)

| Role | Goal | Can do |
|---|---|---|
| **ADMIN** | Oversee everything | Everything HR can do, plus manage users and departments |
| **HR** | Run hiring | Jobs, candidates, pipeline, inbox, scheduling (later: offers, reports) |
| **INTERVIEWER** | Give feedback | Only their own interviews + submit scorecards |

Stored as `User.role` in auth-service. One role per user. In the 5-hour build, users are **seeded**: there is no signup/invite screen yet.

## 2. What is RBAC? (plain words)

> **RBAC = Role-Based Access Control**: what you can do depends on your role.

Think of an office building:
- Everyone has an ID card (**login**). That's *authentication*: "who are you?"
- The card opens only some doors depending on your job (**role**). That's *authorization*: "are you allowed?"

In HireFlow:
1. You log in and get a token that says `{ id: "usr_arjun", role: "INTERVIEWER" }`.
2. Every request carries that token.
3. Before doing anything, the service checks the role. If an interviewer tries to move a candidate, the service answers **403 Forbidden**.
4. The UI also **hides** buttons you can't use, but that is only for convenience. **The server check is the real lock**, because anyone can call the API directly.

In code it is one line per route:
```ts
router.post('/jobs', requireRole('ADMIN', 'HR'), createJob);              // INTERVIEWER → 403
router.post('/interviews/:id/scorecards', requireAuth, submitScorecard);   // + "are you on this panel?" check inside
```
- **Role check** (`requireRole`): "Is your role allowed on this route at all?"
- **Ownership check** (inside the service): "Is *this specific* thing yours?" e.g. only interviewers on that interview can submit its scorecard.

## 3. Use cases per role
✅ = in the 5-hour MVP · ⏩ = later phase (see 07)

### Everyone
| ID | Use case | When |
|---|---|---|
| UC-ALL1 | Log in with email + password, stay logged in, log out | ✅ |
| UC-ALL2 | Sectioned sidebar showing only allowed items | ✅ |
| UC-ALL3 | Sign up, invite, 2FA, Google sign-in | ⏩ A |
| UC-ALL4 | Ctrl/Cmd+K search, notification bell | ⏩ A |

### HR (Admin can do all of these too)
| ID | Use case | When |
|---|---|---|
| UC-HR1 | Create a job with the **3-step wizard** (default stages included) | ✅ |
| UC-HR2 | See jobs **grouped by department** | ✅ |
| UC-HR3 | **Add a candidate** (form) and **attach to a job** → creates an application in "Applied" | ✅ |
| UC-HR4 | **Pipeline board**: drag cards between stages; each column shows count, conversion %, avg days | ✅ |
| UC-HR5 | Reject an application with a reason | ✅ |
| UC-HR6 | **Candidate profile**: header, timeline, notes, interviews, scorecards | ✅ |
| UC-HR7 | **Review inbox**: new applications sorted by signal score; Advance / Reject (keys A / R) | ✅ |
| UC-HR8 | **Schedule an interview** (date, time, interviewers) | ✅ |
| UC-HR9 | Resume upload, emails to candidates | ⏩ A |
| UC-HR10 | Offers with multi-step approval chain + letter preview | ⏩ A |
| UC-HR11 | Reports (KPIs, funnel, trends) | ⏩ A |
| UC-HR12 | CSV import, bulk actions | ⏩ A |

### Interviewer
| ID | Use case | When |
|---|---|---|
| UC-IN1 | See **My interviews** | ✅ |
| UC-IN2 | Open the candidate's basic profile for an assigned interview | ✅ |
| UC-IN3 | Submit a **scorecard** (rating 1–4 per criterion, summary, recommendation) | ✅ |
| UC-IN4 | Others' scorecards hidden until I submit mine | ⏩ A |

### Admin only
| ID | Use case | When |
|---|---|---|
| UC-AD1 | Manage users (invite, change role, deactivate) | ⏩ A (seeded in MVP) |
| UC-AD2 | Manage departments | ⏩ A (seeded in MVP) |

## 4. Permission matrix

| Action | ADMIN | HR | INTERVIEWER |
|---|---|---|---|
| View / create jobs | ✅ | ✅ | ❌ |
| Add / edit candidates | ✅ | ✅ | ❌ |
| Pipeline, inbox, move, reject | ✅ | ✅ | ❌ |
| View candidate profile | ✅ | ✅ | 🔸 only candidates they interview |
| Schedule interviews | ✅ | ✅ | ❌ |
| See interviews | ✅ all | ✅ all | 🔸 only their own |
| Submit scorecard | 🔸 if on the panel | 🔸 if on the panel | 🔸 if on the panel |
| Manage users / departments (later) | ✅ | ❌ | ❌ |
| Offers, reports (later) | ✅ | ✅ | ❌ |

🔸 = ownership check inside the service.

## 5. Example acceptance criteria

**UC-HR4: move a card**
- *Given* I am HR on the Backend Engineer pipeline
- *When* I drag Rahul from "Screen" to "Interview"
- *Then* after a refresh he is still in "Interview",
- *And* his timeline shows "Priya moved to Interview".

**UC-HR7: review inbox**
- *Given* 5 unreviewed applications
- *When* I press `A` on Rahul
- *Then* Rahul moves to the next stage (Screen), disappears from the inbox, and the next candidate is selected.

**UC-IN3: scorecard**
- *Given* Arjun is on Rahul's interview
- *When* he submits a scorecard
- *Then* Priya sees it on Rahul's profile, and the timeline shows "Arjun submitted scorecard: Strong Yes".
- *Given* Sara is **not** on that interview, *Then* she gets 403.
