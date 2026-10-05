# ACME Salary Management

A web app that replaces the HR team's salary spreadsheets. One HR Manager can manage 10,000 employees across countries and answer **how does ACME pay its people?** without building a single pivot table.

> **Live app:** added after deploy · **API docs:** `/docs` on the API URL · **Demo video:** added after recording
> The API runs on Render's free tier, so the first request after idle can take 30–50 s to wake up.

## What it does
- **Employee directory:** search by name, email, or code. Filter by country, department, or title. Sort and paginate server-side.
- **Manage employees:** add, edit, and delete with validation (positive salary, supported country, unique email).
- **Pay insights:** headcount, min, max, average, and median by country, department, or job title, in local currency or USD.
- **Salary distribution:** a histogram of pay, filterable by country.
- **Pay outliers:** employees more than 25% above or below the median for their role and country.

## Why it's built this way
The full reasoning, including what I rejected and why, is in [`docs/DECISIONS.md`](docs/DECISIONS.md). The short version:

| Choice | Reason |
| --- | --- |
| Salaries stored in local currency, reported in local or USD | Local pay is the truth. Fixed, dated FX rates keep reports deterministic. |
| Money as integers | No float drift in salary math |
| SQLite locally, Postgres in prod | Render's free disk is wiped on restart, so SQLite there would lose edits |
| Median computed in Python | SQLite has no percentile function, so this keeps behavior identical on both DBs |
| Outliers by role and country median | Compares like with like. A z-score means nothing to HR. |
| Simple layered backend | Nothing here needs swapping, so hexagonal would be complexity for show |

What's deliberately left out (auth, salary history, live FX, payroll, Excel import) and why: [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md).

## Architecture
```
React (Vite) ── TanStack Query ──► FastAPI
                                    api/          thin routers
                                    services/     business logic, currency, statistics
                                    repositories/ all SQL
                                    models/       SQLAlchemy
                                        │
                              SQLite (dev/test) · Postgres (prod)
```

## Quick start
**Prerequisites:** Python 3.12, [uv](https://docs.astral.sh/uv/), Node 20

```bash
# backend
cd backend
uv sync
python -m seed.seed          # creates 10,000 employees (deterministic, seed 42)
uvicorn app.main:app --reload
# API at http://localhost:8000, docs at http://localhost:8000/docs

# frontend (new terminal)
cd frontend
npm install
npm run dev
# UI at http://localhost:5173
```

## Running tests
```bash
cd backend && pytest -q          # unit + integration + code-limits check
cd frontend && npm run test      # component and hook tests
```
Tests need no network and no external database, and they give the same result every run.

## How this was built
- **One sprint, one branch per ticket, one PR per branch.** The plan and board are in [`docs/SPRINT.md`](docs/SPRINT.md).
- **Strict TDD.** Every feature shows a `test(...)` commit before its `feat(...)` commit. PRs are merged with merge commits, never squashed, so that history survives.
- **Every agent session recorded.** Each ticket ran under [The Session](https://www.npmjs.com/package/@vedantzz/session), my own published CLI. I declared the files the agent could touch before it started, and the receipt shows what it actually touched, what it asked permission for, and what it cost. Receipts are in [`docs/sessions/`](docs/sessions/), with a summary in the AI log.
- **AI-assisted, human-steered.** Claude Code worked under the rules in [`CLAUDE.md`](CLAUDE.md). The prompts I used are in [`docs/PROMPTS.md`](docs/PROMPTS.md), and what I accepted, changed, or rejected is in [`docs/AI_LOG.md`](docs/AI_LOG.md).

## Performance
Measured at 10,000 rows. Numbers are recorded in [`docs/AI_LOG.md`](docs/AI_LOG.md) once deployed.
- Indexes on `country`, `department`, `job_title`, `email`
- Page size capped at 100, and the browser never receives the full table
- Seed uses a bulk insert, so 10k rows load in a few seconds

## Project docs
| File | What's in it |
| --- | --- |
| [`docs/REQUIREMENTS.md`](docs/REQUIREMENTS.md) | One-page requirements: goal, scope, what's out and why |
| [`docs/DECISIONS.md`](docs/DECISIONS.md) | Every design decision with rejected alternatives |
| [`docs/SPRINT.md`](docs/SPRINT.md) | Sprint plan, tickets, branches, PR order |
| [`docs/PROMPTS.md`](docs/PROMPTS.md) | The prompt cycle given to the agent |
| [`docs/AI_LOG.md`](docs/AI_LOG.md) | Where AI helped, where I overruled it, plus session data per ticket |
| [`docs/sessions/`](docs/sessions/) | One receipt per ticket: declared scope vs actual changes, write checks, tokens, cost |
| [`CLAUDE.md`](CLAUDE.md) | The rules the coding agent follows |

## What I'd build next
1. Excel import with a row-level validation report, since that's how HR's real data gets in.
2. Salary history (a `salary_changes` table) to answer "how has pay moved?"
3. Auth and an audit log once there's more than one user.
