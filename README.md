# Gestión Operativa — Club Deportivo

Operations dashboard for sports clubs: matches, player records, coaches, equipment and fields, with a separate space for each club.

This repository is **frontend only**. It will consume a separate **Laravel REST API**, which lives in its own repository and owns the business logic, persistence and authentication.

Built with **Next.js 16** (App Router + Turbopack), **React 19**, **TypeScript**, **Tailwind CSS 4** and **shadcn/ui**.

> **Status:** prototype, not yet connected to the API. Login is hardcoded (`lib/auth.ts`) and all data is mock data (`lib/data.ts`). Both will be replaced by calls to the Laravel API.

---

## 1. Running the app locally

### Prerequisites

| Tool    | Version                      | Check with   |
| ------- | ---------------------------- | ------------ |
| Node.js | 20.9 or later (tested on 24) | `node -v`    |
| pnpm    | 12.x                         | `pnpm -v`    |
| Git     | any recent version           | `git --version` |

If you don't have pnpm, the simplest way to get it is Corepack, which ships with Node:

```bash
corepack enable
```

Corepack then uses the pnpm version pinned in `package.json` (`packageManager` field).

> Use **pnpm** only. Don't run `npm install` or `yarn`: they ignore `pnpm-lock.yaml` and create a different lockfile.

### Steps

```bash
# 1. Clone the repository
git clone <REPO_URL>
cd gestion-operativa-club-deportivo

# 2. Install dependencies (exact versions from the lockfile)
pnpm install --frozen-lockfile

# 3. Start the development server
pnpm dev
```

Open <http://localhost:3000> and log in with:

- **User:** `admin`
- **Password:** `admin`

### Available scripts

| Command                  | What it does                                    |
| ------------------------ | ----------------------------------------------- |
| `pnpm dev`               | Development server with hot reload on port 3000 |
| `pnpm build`             | Production build                                |
| `pnpm start`             | Serves the production build (run `build` first) |
| `pnpm exec tsc --noEmit` | Type check (see the note below)                 |

> **Important:** `next.config.mjs` sets `typescript.ignoreBuildErrors: true`, so `pnpm build` **does not fail on type errors**. Run `pnpm exec tsc --noEmit` before opening a pull request.

### Environment variables

None are needed while the app runs on mock data. Once the Laravel API is connected:

| Variable  | Example                     | Notes                                                        |
| --------- | --------------------------- | ------------------------------------------------------------ |
| `API_URL` | `http://localhost:8000/api` | Laravel API base URL. **Server-only**: never use `NEXT_PUBLIC_`. |

The browser never calls Laravel directly. All calls go through the Next.js server, which keeps the Sanctum token in an `httpOnly` cookie. See [ADR 0001](docs/adr/0001-frontend-api-integration.md) for the reasoning.

Put local values in `.env.local`. That file is git-ignored, so it is never committed. Document every new variable in this README, and commit a `.env.example` with placeholder values.

Keep in mind that any variable prefixed with `NEXT_PUBLIC_` is sent to the browser. **Never** put secrets (API keys, tokens) in a `NEXT_PUBLIC_` variable.

### Working against the Laravel API

When the integration exists, you will need the Laravel API running locally (or a shared dev URL). See the API repository for setup instructions. Frontend and backend changes that depend on each other need **one PR in each repository**. Link the two PRs and merge the API one first.

### Troubleshooting

- **Port 3000 already in use:** run `pnpm dev -- -p 3001`.
- **Errors after pulling changes:** someone probably changed dependencies. Run `pnpm install` again.
- **Strange build cache issues:** delete the `.next/` folder and restart `pnpm dev`.

---

## 2. Project structure

```
app/                 Routes (Next.js App Router)
  page.tsx           Login
  clubes/            Club selector
  c/[club]/          Dashboard for one club (dynamic route)
components/
  ui/                Base shadcn/ui components
  auth/ brand/ club/ modules/   Feature components
hooks/               Custom React hooks
lib/                 Auth, mock data, tenants, helpers
public/              Static assets
```

`AGENTS.md` and `CLAUDE.md` are created automatically by `next dev`. They are instructions for AI coding assistants. Commit them like any other file.

---

## 3. Git workflow: branches and pull requests

We use a simple **trunk-based workflow**:

- `main` always contains working code that can be deployed.
- Nobody pushes directly to `main`. Every change goes through a **branch** and a **pull request (PR)**.
- Branches are short-lived. Aim to merge each one within a few days.

### 3.1 Branch naming

Format: `<type>/<short-description-in-kebab-case>`

| Type        | Use it for                              | Example                       |
| ----------- | --------------------------------------- | ----------------------------- |
| `feature/`  | New functionality                       | `feature/match-calendar`      |
| `fix/`      | Bug fixes                               | `fix/login-redirect-loop`     |
| `refactor/` | Code changes that don't change behavior | `refactor/split-data-module`  |
| `docs/`     | Documentation only                      | `docs/update-readme`          |
| `chore/`    | Dependencies, config, tooling           | `chore/upgrade-next`          |

If you use an issue tracker, you can add the issue number: `feature/42-match-calendar`.

### 3.2 Step by step

```bash
# 1. Start from an up-to-date main
git switch main
git pull origin main

# 2. Create your branch
git switch -c feature/match-calendar

# 3. Work and commit in small, focused steps
git add <files>
git commit -m "feat: add monthly match calendar view"

# 4. Before pushing, catch up with main and check that everything still works
git fetch origin
git rebase origin/main          # or: git merge origin/main
pnpm exec tsc --noEmit
pnpm build

# 5. Push your branch
git push -u origin feature/match-calendar
```

Then open the pull request on GitHub, either with the **"Compare & pull request"** button or from the command line:

```bash
gh pr create --base main --fill
```

### 3.3 Commit messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <what changed, in imperative mood>

feat: add equipment inventory table
fix: keep selected club after page refresh
refactor: extract kit color helpers
docs: explain branch workflow
chore: bump tailwindcss to 4.3.3
```

Each commit should do one thing. Don't mix unrelated changes in one commit.

### 3.4 Pull request checklist

Before you ask for a review, check that:

- [ ] The branch is up to date with `main`.
- [ ] `pnpm exec tsc --noEmit` passes with no errors.
- [ ] `pnpm build` succeeds.
- [ ] You tested the change manually in the browser (`pnpm dev`).
- [ ] The PR is small and does one thing. Split large changes into several PRs.
- [ ] The description explains **what** changed, **why**, and **how to test it**. Add screenshots for UI changes.
- [ ] There are no secrets, `.env` files or unrelated changes.

Suggested PR description:

```markdown
## What
Short summary of the change.

## Why
The problem it solves or the feature it adds.

## How to test
1. Run `pnpm dev`
2. Log in as admin/admin
3. Go to ... and check that ...

## Screenshots
(for UI changes)
```

### 3.5 Review and merge

1. At least **one other developer** approves the PR.
2. The author addresses the comments by pushing more commits to the same branch. The PR updates automatically.
3. Merge with **"Squash and merge"**, so each PR becomes one clean commit on `main`.
4. Delete the branch after merging. Locally:

   ```bash
   git switch main
   git pull origin main
   git branch -d feature/match-calendar
   ```

### 3.6 Resolving conflicts

If your branch conflicts with `main`:

```bash
git fetch origin
git rebase origin/main
# Git stops at each conflict: edit the files, then
git add <resolved-files>
git rebase --continue
# Because rebase rewrites your branch history, push with:
git push --force-with-lease
```

Only use `--force-with-lease` on **your own** branch, never on `main` or a branch someone else is working on. Unlike `--force`, it refuses to overwrite commits you haven't seen.

If `pnpm-lock.yaml` conflicts, don't fix it by hand. Take the version from `main` and reinstall:

```bash
git checkout --ours pnpm-lock.yaml   # during a rebase, --ours = main's version
pnpm install                         # re-applies your branch's package.json changes
git add pnpm-lock.yaml
```

> During a **rebase**, `--ours` means `main` and `--theirs` means your branch. This is the opposite of a merge. Usually you want main's version (`--ours`), then run `pnpm install` so your dependency changes are added back.

### 3.7 Recommended repository settings (for maintainers)

On GitHub, go to **Settings → Branches → Add branch protection rule** for `main`:

- Require a pull request before merging, with at least 1 approval.
- Block force pushes and branch deletion.
- Optional: allow squash merging only, and turn on "Automatically delete head branches".
