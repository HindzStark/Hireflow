# HireFlow

Internal **Applicant Tracking System** for a company's hiring team (Admin, HR, Interviewers). Jobs, review inbox, Kanban pipeline, interviews and scorecards, built as **microservices** with an API gateway and Kafka.

> Status: **scaffold**. Tooling, folders and dependencies are ready, with no features yet. Progress: [docs/PROGRESS.md](docs/PROGRESS.md).

## Architecture
```
Browser → web (Next.js :3000) → gateway (:4000 /api/v1)
            ├─ auth-service       :4001  auth_db
            ├─ job-service        :4002  job_db
            ├─ candidate-service  :4003  candidate_db
            └─ interview-service  :4004  interview_db
          services ⇄ Kafka (hireflow.job · hireflow.application · hireflow.interview)
```
Details: [plans/03-tech-stack-and-architecture.md](plans/03-tech-stack-and-architecture.md)

## Quick start
```bash
# prerequisites: Node 22, pnpm 11, Docker Desktop running
pnpm install
cp .env.example .env        # then change JWT_SECRET / INTERNAL_TOKEN
pnpm infra:up               # postgres, kafka, kafka-ui (http://localhost:8080)
pnpm dev                    # once services have source code (Block 1)
```

## Docs
| | |
|---|---|
| Plans (product, API, DB, phases, Jira) | [plans/](plans/) |
| Progress & next step | [docs/PROGRESS.md](docs/PROGRESS.md) |
| Setup checklist | [docs/SETUP-CHECKLIST.md](docs/SETUP-CHECKLIST.md) |
| Git workflow | [CONTRIBUTING.md](CONTRIBUTING.md) |
| Claude Code memory | [.claude/CLAUDE.md](.claude/CLAUDE.md) |
