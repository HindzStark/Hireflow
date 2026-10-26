# Contributing: Git Workflow

This repo uses a **GitFlow-lite** model with Conventional Commits and Jira keys. Claude Code follows the same rules (see `.claude/CLAUDE.md`).

## 1. Branches

```
main      ●───────────────●──────────────────●        released, tagged (v0.1.0, v1.0.0)
           \             / \                /
develop     ●──●────●───●───●────●─────●───●          integration: always runs
                \  /         \  /       \ /
feature          ●●           ●●         ●            one ticket each, short-lived
```

| Branch | Purpose | Created from | Merges into | Lifetime |
|---|---|---|---|---|
| `main` | Released, demo-ready code | — | — | permanent |
| `develop` | Integration of finished tickets | `main` | `main` (release) | permanent |
| `feature/HF-<n>-<slug>` | New functionality | `develop` | `develop` | hours |
| `fix/HF-<n>-<slug>` | Bug fix | `develop` | `develop` | hours |
| `chore/HF-<n>-<slug>` | Tooling, deps, config | `develop` | `develop` | hours |
| `docs/<slug>` | Docs only | `develop` | `develop` | hours |
| `hotfix/<version>` | Urgent fix to released code | `main` | `main` **and** `develop` | hours |

Names: lowercase kebab-case, ticket key first, e.g. `feature/HF-16-pipeline-drag`.

**Rules**
1. Never commit directly to `main` or `develop`.
2. One ticket per branch. Keep branches small and short-lived.
3. Never force-push `main` or `develop`. On your own feature branch, `--force-with-lease` is OK.
4. Delete the branch after merging.
5. Never commit `.env`, secrets, `node_modules`, or build output.

## 2. Commits (Conventional Commits)

```
<type>(<scope>): <imperative summary, ≤ 72 chars>

<body: what and why, wrapped at 72>

Refs: HF-<n>
```

| Type | Use for |
|---|---|
| `feat` | new user-visible functionality |
| `fix` | bug fix |
| `chore` | tooling, deps, config |
| `refactor` | code change with no behavior change |
| `test` | adding/fixing tests |
| `docs` | documentation |
| `perf`, `style`, `ci`, `build` | as named |

**Scope** = the package or area: `web`, `gateway`, `auth`, `job`, `candidate`, `interview`, `contracts`, `service-kit`, `infra`, `repo`, `deps`.

Examples:
```
feat(candidate): add stage move endpoint with transition log
fix(web): disable scorecard submit while request is in flight
chore(deps): pin prisma to v6
```
Commit small, working steps. Each commit should build.

**The `Refs:` footer is not optional.** `scripts/sync-progress.mjs` (run by the Claude Code Stop hook) reads it to tick `docs/PROGRESS.md`. Write one key per ticket or a comma list: `Refs: HF-3, HF-4`. Commits with no ticket (rare tooling work) may omit it.

## 3. Daily flow for one ticket

```bash
# 1. start from fresh develop
git checkout develop
git pull origin develop
git checkout -b feature/HF-16-pipeline-drag

# 2. work, commit in small steps
git add -A
git commit -m "feat(candidate): add move endpoint" -m "Refs: HF-16"

# 3. before merging: update with latest develop
git fetch origin
git rebase origin/develop          # or: git merge origin/develop
pnpm typecheck && pnpm test

# 4a. with GitHub PRs (preferred; needs gh CLI)
git push -u origin feature/HF-16-pipeline-drag
gh pr create --base develop --fill            # fill in the PR template
# review → "Create a merge commit" on GitHub → delete branch

# 4b. without PRs (local merge, when working solo/offline)
git checkout develop
git merge --no-ff feature/HF-16-pipeline-drag -m "Merge branch 'feature/HF-16-pipeline-drag' into develop"
git push origin develop
git branch -d feature/HF-16-pipeline-drag
```
`--no-ff` always creates a merge commit, so each ticket shows up as one clear unit in the history.

## 4. Releases (end of each block / the demo)

```bash
git checkout main && git pull
git merge --no-ff develop -m "release: v0.2.0 (block 1 clean base)"
git tag -a v0.2.0 -m "Block 1: clean base"
git push origin main --follow-tags
```
Versioning (SemVer, pre-1.0): scaffold `v0.0.1`, then each finished block bumps the minor version (`v0.2.0` = block 1 … `v0.8.0` = block 7). The demo build is `v1.0.0`.

## 5. Pull requests
- Title: `HF-16 feat(candidate): drag cards between stages`
- Fill `.github/pull_request_template.md`.
- Merge only when checks pass and the acceptance criteria are verified.
- Merge method: **Create a merge commit** (matches `--no-ff`).

## 6. Fixing mistakes
| Situation | Command |
|---|---|
| Undo last local commit, keep changes | `git reset --soft HEAD~1` |
| Discard uncommitted changes in a file | `git restore <file>` |
| Committed to develop by accident (not pushed) | `git branch feature/HF-x-… && git reset --hard origin/develop`, then continue on the new branch |
| Undo a pushed commit | `git revert <sha>` (never rewrite shared history) |
