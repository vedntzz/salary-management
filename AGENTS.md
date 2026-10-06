# AGENTS.md — Rules for the agent

Read this fully before every task. If anything here conflicts with a prompt, **stop and ask**.

## What we're building
Salary management for ACME's HR Manager: 10,000 employees across countries. Employee CRUD, server-side search, and pay insights (stats by country, department, and title, a distribution, and outliers). Full context: `docs/REQUIREMENTS.md`. Every design choice and its rejected alternatives: `docs/DECISIONS.md`. Do not re-decide anything recorded there.

## Stack
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2.0, Pydantic v2, pytest, ruff
- **DB:** SQLite (local and tests), Postgres (production). Same code, only `DATABASE_URL` changes.
- **Frontend:** React 18, Vite, TypeScript (strict), TanStack Query + Table, shadcn/ui, Recharts, Vitest, Testing Library

## Folder structure
```
backend/
  app/
    main.py  config.py  db.py  currency.py
    models/employee.py
    schemas/employee.py  schemas/insights.py
    repositories/employee_repository.py
    services/employee_service.py  insights_service.py  statistics.py
    api/employees.py  insights.py  meta.py
  seed/seed.py  first_names.txt  last_names.txt  salary_bands.py
  tests/unit/  tests/integration/  conftest.py
  scripts/check_limits.py
frontend/src/
  app/                  AppLayout, NotFoundPage
  api/client.ts  employees.ts  insights.ts
  features/employees/   EmployeeTable, EmployeeFilters, EmployeeForm, hooks
  features/insights/    SummaryCards, PayByDimension, SalaryHistogram, OutlierList
  components/ui/        shadcn only
  lib/format.ts
```

## Architecture rules
- Layers: `api → services → repositories → models`. A layer only calls the one below it.
- Routers are thin: parse input, call one service method, return a schema. No logic.
- All SQL lives in repositories. Services never touch the session directly.
- Money is an `int`, always. Never a float in the salary path (D-004).
- Currency conversion only happens in `app/currency.py` (D-003).
- Median only in `services/statistics.py`, never in SQL (D-006).
- Frontend: server state through TanStack Query only. No fetching inside components.

## Code style (enforced)
- **Functions: 20 lines max. Files: 200 lines max.** `scripts/check_limits.py` runs inside pytest and fails the build.
- **Names explain the function** without opening it: `calculate_median_salary`, not `calc` or `process`.
- **One-line comments only**, and only for *why*, never *what*.
- Full type hints. `ruff check` and `tsc --noEmit` must be clean.
- Pick the pattern that removes complexity, not the one that looks clever. If unsure, choose the simpler one and ask.
- No new dependencies without asking first.

## TDD — non-negotiable
1. Write the test. Run it. **Show the failing output.**
2. Write the minimum code to pass. Run it. Show it green.
3. Refactor if needed. Keep it green.

Each step is its own commit:
```
test(<scope>): <behavior being specified>
feat(<scope>): <what now works>
refactor(<scope>): <what got cleaner>
```

## Testing conventions
- Name: `test_<unit>_<behavior>_<condition>`, e.g. `test_median_returns_middle_value_for_odd_count`
- One behavior per test, laid out as Arrange / Act / Assert.
- Unit tests: no network, no disk. Services use an in-memory SQLite session from `conftest.py`.
- Integration tests: hit the API through FastAPI's `TestClient` with a seeded DB of about 50 rows (not 10k).
- Deterministic: fixed seeds, fixed FX rates, no `datetime.now()` without injection.
- Frontend: test behavior the user sees (Testing Library queries by role/label), not implementation details.

## API contract
```
GET    /api/employees?search&country&department&job_title&sort&page&page_size
POST   /api/employees
GET    /api/employees/{id}
PATCH  /api/employees/{id}
DELETE /api/employees/{id}
GET    /api/meta/filters                       distinct countries, departments, titles
GET    /api/insights/summary                   always USD
GET    /api/insights/by-dimension?dimension=country|department|job_title&currency=usd
GET    /api/insights/distribution?country&bins=20
GET    /api/insights/outliers?threshold=0.25&min_group_size=5
```
Errors return `{"detail": "..."}` with the right status: 404 not found, 409 duplicate email, 422 validation.

## Commands
```
cd backend && uv sync && pytest -q && ruff check .
cd backend && python -m seed.seed               # 10,000 employees, deterministic
cd backend && uvicorn app.main:app --reload
cd frontend && npm i && npm run test && npm run dev
```

## Workflow
- Every ticket runs inside a recorded session (The Session, `@vedantzz/session`). I start it with the declared intent and file scope before you begin, and stop it after the last commit.
- **The declared scope is the agreement.** If you need a file outside it, stop and ask. Don't edit it and explain afterwards. An out-of-scope write is recorded and shows up in the PR.
- Work only on the branch named in the prompt. Never commit to `main`.
- Only touch files the ticket needs. If a change ripples further, say so before doing it.
- Do not open or merge PRs. I do that.
- When finished, report: tests added, files changed, and anything you were unsure about.

## Definition of done (every ticket)
- [ ] Failing test shown before the code
- [ ] `pytest -q` / `npm run test` green
- [ ] Limits check passes
- [ ] `ruff` and `tsc` clean
- [ ] Commits follow test → feat → refactor
- [ ] Any new decision added to `docs/DECISIONS.md`
- [ ] Session stopped and its receipt saved to `docs/sessions/<ticket>.md`

## Do not
- Invent features not in `docs/REQUIREMENTS.md`
- Add auth, salary history, live FX, or Excel import (deliberately out of scope)
- Fetch all 10k employees to the frontend
- Write tests that mirror the implementation instead of checking behavior
