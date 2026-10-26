# 09 · Testing Strategy

## 1. In the 5 hours: test only what protects the demo
Five hours leaves little room for tests. Spend ~15–20 minutes **total** on a few high-value tests, and let Claude write them while you check the UI.

| Priority | Test | Why | Block |
|---|---|---|---|
| 1 | **Unit:** `signalScore()` (perfect match, no match, experience scaling) | Pure logic, 2 minutes to write | 4 |
| 2 | **API:** `POST /applications/:id/move` → stage changed, 1 StageTransition + 1 Activity, 403 for INTERVIEWER | Protects the hero feature | 4 |
| 3 | **API:** `POST /interviews` → 409 when the interviewer is double-booked | Business rule | 6 |
| 4 | **Consumer:** handling the same `job.created` event twice → only 1 JobRef | Shows you understand Kafka redelivery | 3 |
| 5 | *(if time)* **Playwright smoke:** login → drag card → card stays after reload | One E2E proves the whole stack | 7 |

**How API tests avoid other services:**
- `tokenFor('HR')` signs a test JWT with the same `JWT_SECRET`, so auth-service isn't needed.
- Internal REST calls are mocked (e.g. `vi.mock` of the internal client).
- The Kafka publisher is mocked in API tests. Assert it was called with the right topic, key, and type.

**Manual check every block** (faster than tests on the day):
- `GET /api/v1/health` all green
- kafka-ui shows the expected event on the expected topic
- Click through the block's "Done when" from file 07

## 2. Later (Phase B): the full pyramid
```
        ▲  E2E (Playwright): real browser → gateway → services → Kafka
       ▲▲▲ Event tests: real Kafka (compose) → consumer updates its DB, once
      ▲▲▲▲ API tests per service (Supertest + the service's test DB)
    ▲▲▲▲▲▲ Unit tests: signal score, metrics, approval chain, availability slots
```

### Unit
| Service | Module | Cases |
|---|---|---|
| candidate | `signalScore`, `pipelineMetrics` | conversion with 0 entries, avg days |
| interview | `overlaps()` | edge-touching slots are not overlaps |
| offer | `approvalChain` | next step activates, reject resets, wrong approver forbidden |
| service-kit | `subscribe` de-dup | same event id handled once |

### API (per service)
Each service gets its own test DB (`candidate_db_test`), reset before the suite. Every endpoint gets: happy path · 401 · 403 · 422.

### Event (contract) tests
- Event `data` is validated with the Zod schema from `packages/contracts` both when publishing and when consuming.
- With Kafka from docker compose: publish `interview.scheduled` → candidate-service adds a timeline row. Publish it again → still one row.

### E2E (Playwright)
```
e2e/
  playwright.config.ts   # baseURL http://localhost:3000
  global-setup.ts        # reset + seed, save login state per role (.auth/admin|hr|interviewer.json)
  tests/*.spec.ts
```
| # | Spec | Flow |
|---|---|---|
| 1 | `auth.spec.ts` | each role logs in → correct sidebar; wrong password → error |
| 2 | `job-wizard.spec.ts` | HR creates a job → appears under its department |
| 3 | `pipeline.spec.ts` | drag Screen → Interview → reload → still there → timeline entry |
| 4 | `review-inbox.spec.ts` | `A` advances the top candidate |
| 5 | `interview-scorecard.spec.ts` | HR schedules → interviewer (2nd browser context) submits a scorecard → HR sees it |
| 6 | `offer-approval.spec.ts` | (after offers exist) submit → approve → approve → send → Hired |
| 7 | `import-search.spec.ts` | (after import exists) CSV import → Ctrl+K finds the candidate |

Events are async, so wait for the UI (`await expect(locator).toBeVisible()`) and never use fixed sleeps.

## 3. Commands
```
pnpm test                                # all unit + API tests (turbo)
pnpm --filter candidate-service test     # one service
pnpm test:e2e                            # playwright
```
