---
name: jira-ticket-writer
description: Turn features, bug reports, plan sections or time blocks into industry-format Jira tickets (stories, tasks, bugs, spikes) with Given/When/Then acceptance criteria, story points, components and labels. Also writes a Jira-importable CSV and appends the tickets to the project backlog in plans/08. Use this whenever the user wants tickets, stories, a backlog entry or a task breakdown ("write tickets for…", "make this a ticket", "add X to the backlog", "break this feature down", "log this bug"), or describes a bug or feature they want tracked, even if they never say "Jira".
---

# Jira Ticket Writer

Turn what the user describes into tickets they can paste into Jira, import in bulk, and build from with Claude Code. Good tickets are small, testable and tied to the project's real contracts (endpoints, models, events). The person building may be a beginner under time pressure, so "done" must be unambiguous.

## Step 1: Gather context before writing

Tickets that cite the real API path, model and doc section can be built without guessing. Generic tickets can't. So read first:

1. **`plans/08-jira-kanban-guide.md`**, which holds the project's conventions:
   - ticket format (§A4), Definition of Done (§A5), priorities (§A8)
   - epics, components and labels in use
   - the backlog tables in Part B. Find the **highest existing `HF-<n>` key across all tables**, because new keys continue from there.
2. Only the docs the request touches:
   - `05-api-design.md`: endpoints, ✅/⏩ markers, the Kafka event catalog
   - `04-database-models.md`: models and business rules
   - `02-users-roles-and-use-cases.md`: roles and permissions (needed for the RBAC criteria)
   - `07-mvp-scope-and-phases.md`: which time block (`block-N`) or later phase work belongs to
   - `03-tech-stack-and-architecture.md`: which service owns what
3. If the request names something that doesn't exist yet (a new field or endpoint), say so in the ticket's technical notes ("new: `Candidate.tags`, add to 04 §4"), so the docs get updated with the code.

If there is no `plans/` folder, use the generic format below and ask the user for the project key, unless they gave one.

## Step 2: Break the work down

- **Story**: user-visible value as a vertical slice (DB → API → UI), finishable in ≤1 day. Most feature work is stories.
- **Task**: technical work with no direct user value (consumer wiring, seed data, a migration).
- **Bug**: something that worked differently than expected.
- **Spike**: time-boxed research when there's a real unknown. Give it a time box in the title, e.g. "(1 h)".
- **Points**: Fibonacci 1, 2, 3, 5, 8. **Split anything above 5.** Big tickets hide risk, and on a 5-hour day nobody can finish an 8.
- **Epic**: reuse an existing one when it fits, otherwise propose `HF-E<next>` and list it separately.
- **Scope label**: `5h` + `block-N` if it belongs in the 5-hour MVP per 07, else `later` + `phase-a|b|c`. When the user says "for later" or it's not ✅ in the docs, it's `later`.
- **Priority** (§A8): Highest = MVP blocker · High = MVP · Medium = after MVP · Low = nice to have. A bug that breaks a demo flow is at least High.
- **Components** are services (`candidate`, `interview`, `web`, …). List every service the ticket touches.

Prefer fewer, meaningful tickets over many trivial ones. A feature usually becomes 2–5 tickets, and one bug is one ticket.

## Step 3: Write each ticket

Use this format (from plans/08 §A4) for stories and tasks:

```
### HF-<n> · [Area] Verb + outcome
Type: Story · Epic: HF-E<k> <name> · Priority: High · Points: 3
Components: candidate, web · Labels: later, phase-a

As a <role>, I want <capability>, so that <benefit>.

Acceptance criteria:
1. Given …, When …, Then …   ← happy path
2. And after a refresh …      ← persistence
3. And <event> is published to <topic>   ← only if an event is involved
4. Given <bad input / API failure>, Then … ← error case
5. Given I am an INTERVIEWER, Then … 403   ← role (RBAC) negative case

Technical notes: <endpoint(s)> (05 §x) · <model/rule> (04 §y) · <event> (05 §8)
Sub-tasks: [ ] API + test  [ ] UI  [ ] data-testids
```

Why each part matters:
- **Title** `[Area] verb + outcome`: it scans well on a board, e.g. "[Pipeline] Filter board by tag".
- **The user story** keeps the *why* visible when making trade-offs.
- **Acceptance criteria** are the test plan. The **role/403 case** is easy to forget, and missing it causes real security bugs. Every service enforces RBAC, so every story that changes data needs one. The **refresh** case catches UI-only changes that never reached the database.
- **Technical notes** point to doc sections instead of restating them, so tickets stay short and stay correct when the docs change.

Use this format for bugs:

```
### HF-<n> · [Area] <what's wrong, in one line>
Type: Bug · Epic: <related epic> · Priority: High · Points: 2
Components: … · Labels: <same scope labels as the feature it breaks>

Steps to reproduce:
1. …
Expected: …
Actual: …
Environment: local docker compose, Chrome (adjust if the user says otherwise)
Suspected cause: <your best guess from the docs/code, marked as a guess>

Acceptance criteria:
1. Given …, When …, Then <correct behaviour>
2. Regression test added: <what it checks>
```

A bug ticket's suspected cause and its regression-test criterion are what make it fixable in one sitting.

## Step 4: Number the tickets
Continue from the highest existing `HF-<n>`, with no gaps and no reuse. New epics continue the `HF-E<n>` series. If two features are written in one request, number them in the order they should be built.

## Step 5: Produce the three outputs

Create `plans/tickets/` if it doesn't exist. Use a short kebab-case slug for the request (e.g. `offers`, `scorecard-double-submit`).

1. **Readable tickets**: `plans/tickets/<slug>.md`. A title, a one-paragraph summary, any new epics, then every ticket in the Step 3 format.

2. **Jira import CSV**: `plans/tickets/<slug>.csv`. Write the tickets as JSON (schema in `references/jira-csv.md`), then run:
   ```bash
   python .claude/skills/jira-ticket-writer/scripts/tickets_to_csv.py plans/tickets/<slug>.json plans/tickets/<slug>.csv
   ```
   Use the script rather than writing CSV by hand. Descriptions contain commas, quotes and newlines, and the script quotes them correctly and repeats the Labels/Component columns the way Jira expects. Keep the `.json` next to the CSV, because it's handy for re-generating. Read `references/jira-csv.md` for how epics and parents link.

3. **Backlog update**: append one row per ticket to the matching table in `plans/08` Part B (the "5-hour sprint" table for `5h`, the "Later" table for `later`), using that table's existing columns and style. Add any new epic to the Epics table. Then **recompute the totals line** under each table you changed (ticket count and point sum), because a stale total misleads planning.

## Step 6: Reply briefly
Tell the user:
- the new keys and titles (one line each) and the total points
- the paths of the three outputs
- how to import: Jira → ⚙ Settings → System → External system import → CSV → upload `<slug>.csv` → map the columns (Parent maps to the epic) → Begin import
- any assumptions or open questions (e.g. "I assumed tags are free text; say if you want a fixed list")

Keep the reply short. The details live in the files.
