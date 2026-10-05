# Sprint 1 — ACME Salary Management

**Sprint goal:** a deployed app where the HR Manager can manage 10,000 employees and see how ACME pays people, built test-first with every step visible in git.

**Dates:** Mon Oct 5 → Wed Oct 7, 2026 · **Submission:** Wed Oct 7, evening

## Board

| ID | Ticket | Branch | Day | Depends on |
| --- | --- | --- | --- | --- |
| SETUP-1 | Repo scaffold, docs, CI, limits check | `chore/project-setup` | 1 | — |
| BE-1 | Employee model, schemas, validation | `feat/employee-model` | 1 | SETUP-1 |
| BE-2 | Deterministic 10k seed script | `feat/seed-data` | 1 | BE-1 |
| BE-3 | Employee CRUD API | `feat/employee-crud-api` | 1 | BE-1 |
| BE-4 | Search, filter, sort, pagination + filter options | `feat/employee-search` | 1 | BE-3 |
| BE-5 | Currency table + local/USD conversion | `feat/currency-conversion` | 2 | BE-1 |
| BE-6 | Pay insights: summary, by-dimension, distribution | `feat/pay-insights` | 2 | BE-5 |
| BE-7 | Pay outliers by role + country median | `feat/pay-outliers` | 2 | BE-6 |
| FE-1 | App shell, API client, routing | `feat/ui-shell` | 2 | BE-4 |
| FE-2 | Employee directory table + filters | `feat/ui-employee-directory` | 2 | FE-1 |
| FE-3 | Add / edit / delete employee form | `feat/ui-employee-form` | 2 | FE-2 |
| FE-4 | Insights dashboard | `feat/ui-insights-dashboard` | 3 | BE-7, FE-1 |
| OPS-1 | Deploy: Render + Vercel + Neon, seed prod | `chore/deploy` | 3 | all |
| DOC-1 | Perf numbers, AI log, demo video, final README | `docs/final-artifacts` | 3 | OPS-1 |

## Acceptance criteria

**BE-1:** Employee has code, name, email, title, department, country, salary (int), currency (derived from country), and hire date. Rejects salary ≤ 0, unsupported countries, and invalid emails.
**BE-2:** `python -m seed.seed` creates exactly 10,000 rows, identical on every run, in under 10 s. Covers 8 countries, 6 departments, and about 20 titles.
**BE-3:** Create, read, update, and delete work. Returns 404 on missing, 409 on duplicate email, and 422 on bad input.
**BE-4:** Search matches name, email, or code. Filters combine with AND. Page size is capped at 100. The response includes a total count.
**BE-5:** Conversion is deterministic with a dated rate table. Unknown currencies raise an error.
**BE-6:** Count, min, max, avg, and median by country, department, or title, in local or USD. Histogram bins are configurable.
**BE-7:** Flags salaries more than the threshold away from the (title, country) median. Skips groups smaller than 5.
**FE-2:** The table loads page 1 in under 1 s. Filters and search update the URL so views are shareable.
**FE-3:** Validation errors appear inline. A delete needs confirmation. The list refreshes after a change.
**FE-4:** Summary cards, pay by dimension (table + bar chart), histogram, and an outlier list linking to the employee.
**OPS-1:** Public URLs work, and production has 10k seeded rows.

## Git workflow (every ticket)

```bash
git checkout main && git pull
git checkout -b feat/<branch-name>
session start "<ticket intent>" --scope <files this ticket may touch>

# red
git commit -m "test(<scope>): <behavior>"
# green
git commit -m "feat(<scope>): <what works now>"
# clean
git commit -m "refactor(<scope>): <what got cleaner>"

session stop                            # receipt: scope vs actual, write checks, tokens, cost
# save the receipt → docs/sessions/<ticket>.md, commit as docs(<ticket>): session receipt

git push -u origin feat/<branch-name>
gh pr create --fill --base main
# CI goes green → self-review against the PR checklist
gh pr merge --merge --delete-branch     # merge commit, never squash (D-011)
```

## Commit types
`test` · `feat` · `refactor` · `fix` · `chore` · `docs` · `perf`

## Definition of done
- Acceptance criteria met
- Tests written first, and the failing run is in the commit history
- CI green: pytest, ruff, vitest, tsc, limits check
- PR description filled in using the template
- New decisions added to `docs/DECISIONS.md`
- Notable AI moments added to `docs/AI_LOG.md`
- Session receipt committed, and its summary pasted into the PR

## Risks
| Risk | Mitigation |
| --- | --- |
| Render cold start looks broken to reviewers | Note it in the README, and wake the API before recording the demo |
| Median logic diverges between SQLite and Postgres | Median only in Python (D-006) |
| Seed too slow on the free tier | Bulk insert, run once from local against Neon |
| Agent overbuilds | CLAUDE.md "Do not" list, one ticket per prompt, and scope enforced by The Session |
| Session data looks like self-promotion | Present it as evidence in one table, not a pitch. Drift is shown honestly, not hidden. |
