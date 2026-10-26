# 05 · API Design

The browser calls **only the gateway**: `http://localhost:4000/api/v1/...`. The gateway forwards each request to the right service.

✅ = build in the 5 hours · ⏩ = later phase

## 1. Conventions (implemented once in `service-kit`)
| Topic | Rule |
|---|---|
| Format | JSON. Success: `{ data }` or `{ data, meta }`. Error: `{ error: { code, message, details? } }` |
| Auth | `access_token` httpOnly cookie → gateway checks it → forwards `Authorization: Bearer <jwt>` |
| Validation | Zod schemas from `packages/contracts` → `422 VALIDATION_ERROR` |
| Pagination | `?page=1&pageSize=25` → `meta: { page, pageSize, total }` |
| Status codes | 200 · 201 · 204 · 400 · 401 (not logged in) · 403 (role not allowed) · 404 · 409 (duplicate) · 422 · 503 (other service down) |
| Internal routes | `/internal/*`, never exposed by the gateway, require header `x-internal-token` |

Roles legend: **AD** ADMIN · **HR** · **IN** INTERVIEWER · **ALL** any logged-in user · 🔸 ownership check.

## 2. Gateway routing table
| Path (after `/api/v1`) | Goes to | Login needed | When |
|---|---|---|---|
| `/auth/*`, `/users/*` | auth-service | except `/auth/login` | ✅ |
| `/departments/*`, `/jobs/*` | job-service | yes | ✅ |
| `/jobs/:id/pipeline` | **candidate-service** (registered before `/jobs/*`) | yes | ✅ |
| `/candidates/*`, `/applications/*`, `/review-inbox/*` | candidate-service | yes | ✅ |
| `/interviews/*` | interview-service | yes | ✅ |
| `/health` | gateway → checks every service | no | ✅ |
| `/offers/*`, `/offer-templates/*` | offer-service | yes | ⏩ |
| `/notifications/*` | notification-service | yes | ⏩ |
| `/reports/*` | reporting-service | yes | ⏩ |
| `/search` | gateway fan-out (candidate + job) | yes | ⏩ |

---

## 3. auth-service
| | Method | Path | Role | Body | Response |
|---|---|---|---|---|---|
| ✅ | POST | `/auth/login` | public | `{ email, password }` | `{ data: user }` + `access_token` cookie (8 h) |
| ✅ | POST | `/auth/logout` | ALL | — | `204`, cookie cleared |
| ✅ | GET | `/auth/me` | ALL | — | `{ id, name, email, role }` |
| ✅ | GET | `/users` | AD, HR | `?role=INTERVIEWER` | user list (for the interviewer picker) |
| ✅ | GET | `/internal/users?ids=a,b` | internal | — | `[{ id, name, email, role }]` |
| ⏩ | POST | `/auth/signup`, `/auth/refresh` | public | — | refresh-token rotation |
| ⏩ | POST | `/users/invite`, PATCH `/users/:id` | AD | — | user admin |
| ⏩ | POST | `/auth/2fa/setup` · `/enable` · `/verify` | ALL | — | TOTP 2FA |
| ⏩ | GET | `/auth/google`, `/auth/google/callback` | public | — | Google sign-in |

```http
POST /api/v1/auth/login   { "email": "priya@hireflow.dev", "password": "Passw0rd!" }
200  Set-Cookie: access_token=eyJ…; HttpOnly; SameSite=Lax
{ "data": { "id": "usr_priya", "name": "Priya", "email": "priya@hireflow.dev", "role": "HR" } }
```

## 4. job-service
| | Method | Path | Role | Body / Query | Response |
|---|---|---|---|---|---|
| ✅ | GET | `/departments` | ALL | — | `[{ id, name }]` (seeded) |
| ✅ | GET | `/jobs` | AD, HR | `?status=&groupBy=department` | `[{ department, jobs: [...] }]` |
| ✅ | POST | `/jobs` | AD, HR | **CreateJob** ↓ | `201` job + stages · publishes `job.created` |
| ✅ | GET | `/jobs/:id` | AD, HR | — | job + stages |
| ✅ | GET | `/internal/jobs/:id` | internal | — | job + stages (fallback if JobRef missing) |
| ⏩ | PATCH | `/jobs/:id`, POST `/jobs/:id/close`, PUT `/jobs/:id/stages` | AD, HR | — | edit, close, stage editor · `job.updated` |
| ⏩ | POST/PATCH/DELETE | `/departments` | AD | — | department admin |

**CreateJob** (sent once at the end of the wizard)
```json
{
  "title": "Backend Engineer", "departmentId": "dep_eng",
  "location": "Bangalore", "remoteAllowed": true, "employmentType": "FULL_TIME", "openings": 2,
  "description": "## About the role …",
  "requiredSkills": ["node", "postgres"], "niceToHaveSkills": ["aws"], "minYears": 3,
  "salaryMin": 2000000, "salaryMax": 3200000,
  "publish": true
}
```
Default stages are created automatically: Applied · Screen · Interview · Offer · Hired.

## 5. candidate-service

### Candidates & profile
| | Method | Path | Role | Body / Query | Response |
|---|---|---|---|---|---|
| ✅ | GET | `/candidates` | AD, HR | `?q=&page=` | paginated list |
| ✅ | POST | `/candidates` | AD, HR | `{ firstName, lastName, email, phone?, location?, currentTitle?, yearsExperience?, skills[], source, jobId? }` | `201`. With `jobId`, also creates an application in "Applied". `409` if the email exists. |
| ✅ | GET | `/candidates/:id` | AD, HR, IN🔸 | — | candidate + applications (job title + stage name from JobRef) |
| ✅ | GET | `/candidates/:id/activity` | AD, HR, IN🔸 | — | timeline, newest first |
| ✅ | GET / POST | `/candidates/:id/notes` | AD, HR | `{ body }` | notes (+ timeline entry) |
| ⏩ | PATCH | `/candidates/:id` | AD, HR | — | edit |
| ⏩ | GET/POST | `/candidates/:id/files`, `/candidates/:id/emails` | AD, HR | — | resume upload, emails |

### Applications & pipeline
| | Method | Path | Role | Body | Response |
|---|---|---|---|---|---|
| ✅ | POST | `/applications` | AD, HR | `{ candidateId, jobId }` | `201` (409 if duplicate) |
| ✅ | POST | `/applications/:id/move` | AD, HR | `{ toStageId }` | application · publishes `application.stage_changed` |
| ✅ | POST | `/applications/:id/reject` | AD, HR | `{ reason }` | application · publishes `application.rejected` |
| ✅ | GET | `/jobs/:id/pipeline` | AD, HR | — | **board** ↓ |
| ⏩ | POST | `/applications/bulk` | AD, HR | `{ ids[], action, … }` | bulk move/reject/tag |

```json
{ "data": {
  "job": { "id": "job_backend", "title": "Backend Engineer" },
  "columns": [ {
    "stage":   { "id": "stg_backend_screen", "name": "Screen", "position": 1 },
    "metrics": { "count": 12, "conversionPct": 58.3, "avgDaysInStage": 3.4 },
    "cards":   [ { "applicationId": "app_1", "candidateId": "c_1", "name": "Rahul Sharma",
                   "currentTitle": "SDE II", "signalScore": 82, "daysInStage": 2 } ]
  } ] } }
```

### Review inbox
| | Method | Path | Role | Response |
|---|---|---|---|---|
| ✅ | GET | `/review-inbox?jobId=` | AD, HR | unreviewed ACTIVE applications, highest score first |
| ✅ | POST | `/review-inbox/:applicationId/advance` | AD, HR | moves to the next stage + sets `reviewedAt` |
| ✅ | POST | `/review-inbox/:applicationId/reject` | AD, HR | `{ reason }` → rejects + sets `reviewedAt` |
| ⏩ | GET | `/review-inbox/count` | AD, HR | sidebar badge |
| ⏩ | POST | `/review-inbox/:applicationId/undo` | AD, HR | undo last action |

### Internal (for other services)
| | Path | Response |
|---|---|---|
| ✅ | `GET /internal/applications/:id` | `{ id, candidateId, candidateName, candidateEmail, jobId, jobTitle, stageName }` |

**Listens to (Kafka):** ✅ `hireflow.job` → upsert `JobRef` · ✅ `hireflow.interview` → add timeline entries ("Interview scheduled", "Arjun submitted scorecard: Strong Yes").

## 6. interview-service
| | Method | Path | Role | Body / Query | Response |
|---|---|---|---|---|---|
| ✅ | GET | `/interviews` | ALL (IN: own only) | `?mine=true&candidateId=` | interviews + participants |
| ✅ | POST | `/interviews` | AD, HR | `{ applicationId, title, startAt, endAt, location?, participantIds[] }` | `201` · `409` if an interviewer is already booked · publishes `interview.scheduled` |
| ✅ | GET | `/interviews/:id` | AD, HR, IN🔸 | — | interview + scorecards |
| ✅ | POST | `/interviews/:id/scorecards` | participant 🔸 | `{ ratings: [{ criterion, score: 1-4 }], overall: "STRONG_YES"\|"YES"\|"NO"\|"STRONG_NO", summary }` | `201` · publishes `scorecard.submitted` |
| ✅ | GET | `/internal/interviews/assigned?userId=&candidateId=` | internal | — | `{ assigned: boolean }` |
| ⏩ | PATCH / cancel | `/interviews/:id` | AD, HR | — | reschedule, cancel |
| ⏩ | GET/PUT | `/availability/*` | ALL | — | visual availability grid |
| ⏩ | — | `/calendar/google/*` | ALL | — | Google Calendar sync |

## 7. Later services (⏩ Phase A, summary)
| Service | Main endpoints |
|---|---|
| offer-service | `POST /offers` (with ordered `approverIds`) · `POST /offers/:id/submit` · `POST /offers/:id/steps/:step/approve` / `reject` · `GET /offers/:id/preview` · `POST /offers/:id/send` · `/accept` · `/decline` · CRUD `/offer-templates` |
| notification-service | `GET /notifications` · `GET /notifications/unread-count` · `POST /notifications/:id/read` · sends emails from `hireflow.email` |
| reporting-service | `GET /reports/kpis` · `/funnel` · `/time-in-stage` · `/interview-volume` · `/sources` |
| gateway | `GET /search?q=` → candidates + jobs in parallel |
| candidate | CSV import (`/imports/preview`, `/imports`), bulk actions |

---

## 8. Kafka event catalog
Every message: **key** = the id in the "Key" column, **value** = the envelope from [03 §3.3](03-tech-stack-and-architecture.md).

| | Event `type` | Topic | Key | Producer | `data` (main fields) | Consumers |
|---|---|---|---|---|---|---|
| ✅ | `job.created` | `hireflow.job` | jobId | job | `{ job: { id, title, department, location, remoteAllowed, requiredSkills, niceToHaveSkills, minYears, status }, stages: [{ id, name, kind, position }] }` | candidate |
| ✅ | `application.created` | `hireflow.application` | applicationId | candidate | `{ applicationId, candidateId, jobId, stageId }` | (reporting later) |
| ✅ | `application.stage_changed` | `hireflow.application` | applicationId | candidate | `{ applicationId, candidateId, jobId, fromStage, toStage }` | (reporting, notification later) |
| ✅ | `application.rejected` | `hireflow.application` | applicationId | candidate | `{ applicationId, jobId, reason }` | (reporting later) |
| ✅ | `interview.scheduled` | `hireflow.interview` | interviewId | interview | `{ interviewId, applicationId, candidateId, title, startAt, participants: [{ id, name }] }` | candidate |
| ✅ | `scorecard.submitted` | `hireflow.interview` | interviewId | interview | `{ interviewId, candidateId, interviewerName, overall }` | candidate |
| ⏩ | `job.updated` | `hireflow.job` | jobId | job | same as created | candidate |
| ⏩ | `user.created` / `user.updated` | `hireflow.user` | userId | auth | `{ id, name, email, role }` | notification |
| ⏩ | `offer.*` | `hireflow.offer` | offerId | offer | `{ offerId, applicationId, … }` | candidate, notification, reporting |
| ⏩ | `email.requested` | `hireflow.email` | recipient | any | `{ to, subject, html }` | notification |

**Consumer groups:** `candidate-service` (✅), later `notification-service`, `reporting-service`.
