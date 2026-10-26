# Jira CSV import: format used by `tickets_to_csv.py`

## Input JSON (what you write)
A list of ticket objects:

```json
[
  {
    "id": "HF-E8",
    "summary": "Offers & Approvals",
    "type": "Epic",
    "parent": "",
    "priority": "Medium",
    "points": null,
    "components": [],
    "labels": ["later", "phase-a"],
    "description": "Offer builder, approval chain, letter preview, send/accept."
  },
  {
    "id": "HF-53",
    "summary": "[Offers] Build an offer with an ordered approval chain",
    "type": "Story",
    "parent": "HF-E8",
    "priority": "Medium",
    "points": 5,
    "components": ["offer", "web"],
    "labels": ["later", "phase-a"],
    "description": "As an HR user, I want …\n\nAcceptance criteria:\n1. Given …"
  }
]
```

| Field | Notes |
|---|---|
| `id` | Our doc key (`HF-53`, `HF-E8`). It becomes Jira's **Issue ID** column, which links rows inside one import. Jira assigns its own real keys on import. |
| `summary` | The ticket title, `[Area] verb + outcome` |
| `type` | `Epic`, `Story`, `Task`, `Bug`, `Spike` (the importer maps Spike to Task if the project has no Spike type) |
| `parent` | The `id` of an epic **in the same file**, or a **real Jira key** (e.g. `HF-12`) for an epic that already exists in Jira. Leave it empty if unknown. |
| `priority` | `Highest`, `High`, `Medium`, `Low` |
| `points` | Integer or null (epics have none) |
| `components`, `labels` | Lists. The script writes one column per value. |
| `description` | Full ticket body: story, acceptance criteria, technical notes, sub-tasks. Newlines are fine. |

## Output CSV (what the script writes)
Columns, in order:
`Issue ID, Summary, Issue Type, Parent, Priority, Story Points, Component/s × N, Labels × M, Description`

- **Repeated columns:** Jira's importer takes multiple values for a field as several columns with the **same header**, not as a comma-separated cell. The script pads every row to the widest ticket.
- **Quoting:** every field is quoted and inner quotes are doubled. Newlines inside the description are kept, which Jira supports in quoted fields.
- **Order:** epics are written first, so `Parent` can reference them by Issue ID.

## Linking to epics
| Situation | What to put in `parent` |
|---|---|
| The epic is new and included in this file | that epic's `id` (e.g. `HF-E8`). Jira links it via Issue ID. |
| The epic already exists in Jira | its **real Jira key** (ask the user, e.g. `HF-7`). The doc key `HF-E4` is not a Jira key. |
| Unknown | leave it empty and mention in the reply that epics can be set after import (bulk edit → Parent) |

## Import steps (tell the user)
Jira → ⚙ Settings → **System** → **External system import** → **CSV** → upload → choose the project → map columns: Issue ID → Issue ID, Summary → Summary, Issue Type → Issue Type, Parent → Parent, Priority → Priority, Story Points → Story point estimate, Component/s → Components, Labels → Labels, Description → Description → **Begin import**.
In team-managed projects, the components must already exist in the project, or that column can be skipped.
