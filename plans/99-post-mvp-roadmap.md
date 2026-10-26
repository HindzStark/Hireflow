# 99 · Roadmap & Progress (LIVING DOCUMENT)

> **Update this after every block / phase.** It's your memory between sessions and your "what's next" slide in the demo.
> Last updated: 2026-10-26 · Status: **Planning done, not started**

## 1. 5-hour MVP checklist
Legend: ⬜ todo · 🟨 in progress · ✅ done · ✂️ cut

| Block | Item | Planned | Actual time | Status | Notes |
|---|---|---|---|---|---|
| 1 | Monorepo + compose (postgres, kafka, kafka-ui) | 0:00–0:45 | | ⬜ | |
| 1 | service-kit + _template + gateway + 4 services, health green | | | ⬜ | |
| 1 | Test event visible in kafka-ui, consumed once | | | ⬜ | |
| 2 | Login/logout, roles, role-aware sidebar, seed users | 0:45–1:20 | | ⬜ | |
| 3 | Jobs list by department + 3-step wizard | 1:20–2:00 | | ⬜ | |
| 3 | job.created → JobRef | | | ⬜ | |
| 4 | Add candidate + attach to job + signal score | 2:00–3:20 | | ⬜ | |
| 4 | Kanban drag + column metrics | | | ⬜ | |
| 4 | Profile: timeline + notes + reject | | | ⬜ | |
| 5 | Review inbox (A/R) | 3:20–4:00 | | ⬜ | |
| 6 | Schedule interview + scorecard + events → timeline | 4:00–4:40 | | ⬜ | |
| 7 | README + demo rehearsal | 4:40–5:00 | | ⬜ | |

## 2. After the MVP

### Phase A: Features
| Feature | Service | Jira | Status |
|---|---|---|---|
| Offers + multi-step approval chain + letter preview | offer-service (new) | HF-25…28 | ⬜ |
| Emails + notification bell | notification-service (new) | HF-29, 30 | ⬜ |
| Reports (KPIs, funnel, trends) + dashboard | reporting-service (new) | HF-31…34 | ⬜ |
| Cmd+K search | gateway | HF-35 | ⬜ |
| CSV import, bulk actions | candidate | HF-36, 37 | ⬜ |
| Resume upload + Files tab | candidate | HF-38 | ⬜ |
| Visual availability grid, Google Calendar sync | interview | HF-39, 40 | ⬜ |
| Signup/invite, 2FA, Google sign-in, refresh tokens | auth | HF-41…44 | ⬜ |

### Phase B: Quality
| Item | Jira | Status |
|---|---|---|
| Playwright suite | HF-45 | ⬜ |
| Transactional outbox + DLQ topics | HF-46 | ⬜ |
| RS256 JWT | HF-47 | ⬜ |
| GitHub Actions CI | HF-48 | ⬜ |

### Phase C: Infrastructure
| Item | Jira | Status |
|---|---|---|
| Dockerfiles | HF-49 | ⬜ |
| Generic Helm chart | HF-50 | ⬜ |
| kind + ingress + Strimzi Kafka + Postgres | HF-51 | ⬜ |
| Terraform (kind + platform + apps) | HF-52 | ⬜ |

## 3. Future ideas
| Idea | Value |
|---|---|
| AI resume parsing + smarter signal score (`ai-service`) | High |
| Public careers page + apply form (`careers-service`) | High |
| Real-time board updates (SSE/WebSocket via gateway) | Medium |
| Cloud deployment: EKS + MSK / Confluent Cloud, Argo CD | Medium |
| OpenTelemetry tracing across services | Medium |
| Multi-tenant (orgId everywhere) | High for SaaS |
| Hiring-manager role / custom permissions | Medium |

## 4. Decision log
| Date | Decision | Why | Alternatives |
|---|---|---|---|
| 2026-10-25 | TypeScript full stack (Next.js, Express, Prisma, Postgres) | One language; strong Claude Code support | FastAPI, Spring Boot |
| 2026-10-25 | Microservices with database per service | Company requirement; clear ownership | Modular monolith |
| 2026-10-25 | Only 3 roles: ADMIN, HR, INTERVIEWER | Simpler RBAC | 5 roles |
| 2026-10-26 | **5-hour budget** → MVP = gateway + 4 services | Real constraint is one day / ~5 h | All 7 services (impossible in 5 h) |
| 2026-10-26 | **Kafka** (KRaft, single broker) for events | Requested; keeps history, replayable, many independent readers | RabbitMQ |
| 2026-10-26 | Publish after commit now; outbox later | Saves ~30 min on the day; accepted small risk | Outbox from the start |
| 2026-10-26 | HS256 JWT now; RS256 later | Simpler setup | RS256 from the start |
| 2026-10-26 | Development first; infra later | Working app beats YAML | Infra in parallel |
| 2026-10-26 | Kubernetes on **kind** + Helm + Strimzi; Terraform targets kind | No cloud account/EKS experience needed; free | EKS + MSK |

## 5. Known issues / tech debt
| # | Issue | Severity | Ticket |
|---|---|---|---|
| | | | |

## 6. Practice run log
| Date | Run | Blocks done | Where I overran | Fix for next time |
|---|---|---|---|---|
| | | | | |

## 7. Claude Code lessons learned
Prompts that worked, mistakes to avoid. Copy the good ones into CLAUDE.md.
-
