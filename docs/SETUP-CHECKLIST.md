# Setup Checklist: what Claude Code needs from you

Tick each item. Claude reads this at session start, and unticked items are blockers.

## Machine & tools
| ✔ | Item | Why | How |
|---|---|---|---|
| [x] | Node 22 | runtime | installed (v22.23) |
| [x] | pnpm 11 | package manager | installed (v11.18) |
| [x] | Git | version control | installed (2.55) |
| [x] | Dependencies installed | everything in package.json files | done in the scaffold (`pnpm install` to refresh) |
| [ ] | **Docker Desktop running** | Postgres + Kafka run in containers | Open Docker Desktop and wait for "Engine running", then run `docker compose pull` once (downloads ~1 GB) and `pnpm infra:up` |
| [ ] | **GitHub CLI (`gh`)** | lets Claude open pull requests for you | `winget install GitHub.cli`, then `gh auth login` (GitHub.com → HTTPS → browser) |
| [ ] | VS Code extensions (optional) | editor help | Prisma, ESLint, Tailwind CSS IntelliSense, Prettier |

## Project config
| ✔ | Item | Why | How |
|---|---|---|---|
| [x] | `.env` file | services read secrets/URLs from it | created from `.env.example` with dev defaults |
| [ ] | Change `JWT_SECRET` and `INTERNAL_TOKEN` in `.env` | default secrets are public | any long random strings (e.g. `node -e "console.log(crypto.randomUUID()+crypto.randomUUID())"`) |

## GitHub repo (https://github.com/HindzStark/Hireflow)
| ✔ | Item | Why | How |
|---|---|---|---|
| [x] | Push access works | Claude pushes branches/tags | verified: main, develop and v0.0.1 pushed on 2026-10-26 |
| [ ] | **Default branch = `develop`** | new PRs target develop automatically | Repo → Settings → General → Default branch → `develop` |
| [ ] | **Protect `main`** | no direct pushes to released code | Settings → Branches → Add rule `main`: ✅ Require a pull request before merging · ✅ Do not allow bypassing (optional for solo) · ❌ Allow force pushes |
| [ ] | **Protect `develop`** | same for integration branch | Add rule `develop`: ✅ Require a pull request (0 approvals is fine solo) · ❌ Allow force pushes |
| [ ] | Auto-delete merged branches | keeps branch list clean | Settings → General → ✅ Automatically delete head branches |

> With branch protection on, Claude can't merge locally and push to `develop`/`main`. Instead it pushes the feature branch and opens a PR (needs `gh`), and you click **Merge** on GitHub. That's the real industry flow.

## Jira
| ✔ | Item | How |
|---|---|---|
| [ ] | Jira project **HireFlow**, key **HF**, Kanban template | `plans/08` §A3 |
| [ ] | Board columns + WIP limits | `plans/08` §A3 |
| [ ] | Import the 24 "5h" tickets | `plans/08` Part B → CSV import |

## Hackathon day questions (confirm with the company)
- [ ] Is a prepared scaffold/repo allowed, or must you start from an empty folder? If empty: practice re-creating this scaffold quickly with Claude Code.
- [ ] Which Jira/GitHub accounts will you use on the day?
