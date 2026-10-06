# AI log

Where AI sped things up, where I overruled it, and where I got things wrong. It's organized by branch, and only notable moments are listed, not every prompt.

**Tools:** Claude (chat) for planning, requirements, decisions, and review. Claude Code (agent) for the code, working under `CLAUDE.md`. **The agent never ran git.** It stopped at every red and green step, and I reviewed each one and made every commit myself.

---

## Planning · Oct 5
- **Used AI for:** the clarifying questions to Incubyte, requirements, decisions, the sprint plan, and the agent rules.
- **Caught:** the first plan used SQLite everywhere. Render's free disk is wiped on restart, so every HR edit would vanish. I switched production to Postgres (D-005).
- **Decided myself:** the outlier rule (title + country median, not a z-score), local + USD reporting, and merge commits over squash.

## Setup
- **Overruled:** the agent committed its own work. I reset the 9 commits, re-committed them in TDD order myself, and added a "never run git" rule to `CLAUDE.md`.
- **My mistake:** I declared the session scope with globs, which The Session doesn't expand, so 40 of 42 files showed as "outside scope." These were false positives, and I recorded them as-is rather than editing the receipt.

## Employees API (BE-1 to BE-4)
- **Agent caught:** its own 404 tests were passing for the wrong reason, because FastAPI's default 404 matched. It tightened them to assert the exact error body.
- **Agent added:** a test that changing an employee's country updates their currency. I kept it, since it protects D-003.
- **I caught:** sorting by salary ranked ₹8.8M above $150k (raw local amounts). The fix was a USD-equivalent sort (D-014), with a scoped float exception for ordering only.
- **I caught:** duplicate-email checks were case-sensitive (`Asha@` vs `asha@`). Fixed test-first.
- **I caught:** schemas and repositories imported upward from `services/`. I moved `currency.py` to a core module (refactor commit).

## Pay insights (BE-5 to BE-7)
- **My instruction was wrong:** I asked for SQL `GROUP BY` aggregates. Since every salary is fetched anyway for the median, that duplicated the code path. The agent flagged it and I reversed it (refactor commit, D-006 rewritten).
- **Overruled:** the agent proposed null totals for the summary in local currency. Nulls are a UI trap, so the summary became USD-only (D-016).
- **Agent flagged:** a country filter matching nobody would have returned a 500 from the histogram. Specified and fixed.
- **I added:** a test pinning the boundary. Exactly +25% is *not* an outlier (strict >), compared in `Decimal` so it can't drift.

## UI: employees (FE-1 to FE-3)
- **Agent's idea:** a global fetch guard that fails any test making an unmocked request.
- **I caught:** API failures showed "No employees match", which is a demo killer during Render's cold start. Added an error state, a Retry button, and a wake-up notice after 3 s.
- **Process slip:** the retry policy was written before its tests. The tests were added after, and the agent proved them by **deliberately breaking the code twice** (retrying 4xx, retrying twice) and watching them fail.
- **Agent caught:** table rows were keyed by position, so after a re-sort focus jumped to the wrong employee. Keyed by employee id instead.
- **Agent flagged:** the form needed the country→currency map. Rather than keeping a second copy in the frontend, the API now serves it (D-017). The agent also added a test using a country with no employees (Canada) to prove the form doesn't read from the filter list.
- **I caught in the browser:** mixed currency symbols ("CA$", "A$", "SGD") and a salary sort that looked broken without context. Switched to ISO codes plus a USD-equivalent line.
- **Agent made sure:** the "no USD line for USD-paid employees" test also asserts the positive line, so it can't pass vacuously.

## UI: insights (FE-4)
- **Agent slip:** it ran `git status` once despite the rule. It was read-only and the agent reported it itself.
- **Agent's proposal, approved:** the median chart always uses USD, because bars in mixed currencies on one axis are meaningless.
- **Found in the browser:** without `VITE_API_URL`, requests hit Vite and parsed HTML as JSON. I added `.env.development`.

## Seed outliers
- **I caught:** the outlier list showed only +25–27% cases, because uniform in-band data barely crosses the threshold. I planted about 1% deliberate outliers, alternating direction (D-009).
- **Agent corrected me:** I wrote that in-band data "can't exceed 25%." It found 14 natural rows that do. D-009 now says the accurate thing.
- **My mistake:** I ran `git reset --hard` before committing the red step and lost an edit to `test_seed.py`. The agent re-applied it from its own context.

## Deploy
- **Planned ahead:** no Postgres driver, no SPA rewrite (refreshing `/insights` would 404), and CORS. All three were fixed test-first before touching Render.
- **I added:** a test that a trailing slash in `CORS_ORIGINS` still matches. A pasted Vercel URL would otherwise fail silently.
- **From the Render logs:** `uv run` re-installed dev dependencies on every start. `--no-dev` cut startup install time from about 28 s to about 12 s.
- **My mistake:** I first seeded Neon before pulling the outlier commits, so production had the old data. I reseeded after pulling.
- **My mistake:** I exposed the database connection string in my AI chat while seeding. The password was rotated and `DATABASE_URL` updated on Render.

---

## Session data
From The Session (`@vedantzz/session`). Receipts are in [`sessions/`](sessions/). Token counts are pooled totals as the receipt prints them, mostly cache reads, not separate billable input.

| Branch | Files changed | Outside declared scope | Tokens | Turns | Note |
| --- | --- | --- | --- | --- | --- |
| SETUP-1 | 42 | 40 | 2.06M | 1 | Glob scope not expanded, so "outside" counts are false positives |
| employees-api | 30 | 5 | 8.78M | 17 | Real drift, all approved mid-session (pyproject, CLAUDE.md, AGENTS.md, DECISIONS) |
| pay-insights | 19 | no scope recorded | 3.07M | 9 | |
| ui-employees | 51 | no scope recorded | 20.71M | 21 | Largest branch: shell, directory, form, focus fixes, plus test-first backend changes |
| ui-insights | 28 | no scope recorded | 2.02M | 2 | |
| seed-outliers | 6 | no scope recorded | 1.10M | 4 | |
| deploy | 9 | no scope recorded | 0.82M | 5 | |

**What the numbers showed:** only one branch, employees-api, has trustworthy drift data. There, every file outside the declared scope was a config or docs change I approved mid-session, never a surprise code change. For the last five branches, The Session recorded the pasted prompt as the intent, and the scoped `session start` either wasn't run or didn't register, so there was nothing to measure drift against. That's my process gap, not something I can reconstruct after the fact. What the receipts still show reliably is size and cost per branch. The UI employees branch took about 20M tokens across 21 turns, roughly two-thirds of the whole build.# AI log

Where AI sped things up, where I overruled it, and where I got things wrong. It's organized by branch, and only notable moments are listed, not every prompt.

**Tools:** Claude (chat) for planning, requirements, decisions, and review. Claude Code (agent) for the code, working under `CLAUDE.md`. **The agent never ran git.** It stopped at every red and green step, and I reviewed each one and made every commit myself.

---

## Planning · Oct 5
- **Used AI for:** the clarifying questions to Incubyte, requirements, decisions, the sprint plan, and the agent rules.
- **Caught:** the first plan used SQLite everywhere. Render's free disk is wiped on restart, so every HR edit would vanish. I switched production to Postgres (D-005).
- **Decided myself:** the outlier rule (title + country median, not a z-score), local + USD reporting, and merge commits over squash.

## Setup
- **Overruled:** the agent committed its own work. I reset the 9 commits, re-committed them in TDD order myself, and added a "never run git" rule to `CLAUDE.md`.
- **My mistake:** I declared the session scope with globs, which The Session doesn't expand, so 40 of 42 files showed as "outside scope." These were false positives, and I recorded them as-is rather than editing the receipt.

## Employees API (BE-1 to BE-4)
- **Agent caught:** its own 404 tests were passing for the wrong reason, because FastAPI's default 404 matched. It tightened them to assert the exact error body.
- **Agent added:** a test that changing an employee's country updates their currency. I kept it, since it protects D-003.
- **I caught:** sorting by salary ranked ₹8.8M above $150k (raw local amounts). The fix was a USD-equivalent sort (D-014), with a scoped float exception for ordering only.
- **I caught:** duplicate-email checks were case-sensitive (`Asha@` vs `asha@`). Fixed test-first.
- **I caught:** schemas and repositories imported upward from `services/`. I moved `currency.py` to a core module (refactor commit).

## Pay insights (BE-5 to BE-7)
- **My instruction was wrong:** I asked for SQL `GROUP BY` aggregates. Since every salary is fetched anyway for the median, that duplicated the code path. The agent flagged it and I reversed it (refactor commit, D-006 rewritten).
- **Overruled:** the agent proposed null totals for the summary in local currency. Nulls are a UI trap, so the summary became USD-only (D-016).
- **Agent flagged:** a country filter matching nobody would have returned a 500 from the histogram. Specified and fixed.
- **I added:** a test pinning the boundary. Exactly +25% is *not* an outlier (strict >), compared in `Decimal` so it can't drift.

## UI: employees (FE-1 to FE-3)
- **Agent's idea:** a global fetch guard that fails any test making an unmocked request.
- **I caught:** API failures showed "No employees match", which is a demo killer during Render's cold start. Added an error state, a Retry button, and a wake-up notice after 3 s.
- **Process slip:** the retry policy was written before its tests. The tests were added after, and the agent proved them by **deliberately breaking the code twice** (retrying 4xx, retrying twice) and watching them fail.
- **Agent caught:** table rows were keyed by position, so after a re-sort focus jumped to the wrong employee. Keyed by employee id instead.
- **Agent flagged:** the form needed the country→currency map. Rather than keeping a second copy in the frontend, the API now serves it (D-017). The agent also added a test using a country with no employees (Canada) to prove the form doesn't read from the filter list.
- **I caught in the browser:** mixed currency symbols ("CA$", "A$", "SGD") and a salary sort that looked broken without context. Switched to ISO codes plus a USD-equivalent line.
- **Agent made sure:** the "no USD line for USD-paid employees" test also asserts the positive line, so it can't pass vacuously.

## UI: insights (FE-4)
- **Agent slip:** it ran `git status` once despite the rule. It was read-only and the agent reported it itself.
- **Agent's proposal, approved:** the median chart always uses USD, because bars in mixed currencies on one axis are meaningless.
- **Found in the browser:** without `VITE_API_URL`, requests hit Vite and parsed HTML as JSON. I added `.env.development`.

## Seed outliers
- **I caught:** the outlier list showed only +25–27% cases, because uniform in-band data barely crosses the threshold. I planted about 1% deliberate outliers, alternating direction (D-009).
- **Agent corrected me:** I wrote that in-band data "can't exceed 25%." It found 14 natural rows that do. D-009 now says the accurate thing.
- **My mistake:** I ran `git reset --hard` before committing the red step and lost an edit to `test_seed.py`. The agent re-applied it from its own context.

## Deploy
- **Planned ahead:** no Postgres driver, no SPA rewrite (refreshing `/insights` would 404), and CORS. All three were fixed test-first before touching Render.
- **I added:** a test that a trailing slash in `CORS_ORIGINS` still matches. A pasted Vercel URL would otherwise fail silently.
- **From the Render logs:** `uv run` re-installed dev dependencies on every start. `--no-dev` cut startup install time from about 28 s to about 12 s.
- **My mistake:** I first seeded Neon before pulling the outlier commits, so production had the old data. I reseeded after pulling.
- **My mistake:** I exposed the database connection string in my AI chat while seeding. The password was rotated and `DATABASE_URL` updated on Render.

---

## Session data
From The Session (`@vedantzz/session`). Receipts are in [`sessions/`](sessions/). Token counts are pooled totals as the receipt prints them, mostly cache reads, not separate billable input.

| Branch | Files changed | Outside declared scope | Tokens | Turns | Note |
| --- | --- | --- | --- | --- | --- |
| SETUP-1 | 42 | 40 | 2.06M | 1 | Glob scope not expanded, so "outside" counts are false positives |
| employees-api | 30 | 5 | 8.78M | 17 | Real drift, all approved mid-session (pyproject, CLAUDE.md, AGENTS.md, DECISIONS) |
| pay-insights | 19 | no scope recorded | 3.07M | 9 | |
| ui-employees | 51 | no scope recorded | 20.71M | 21 | Largest branch: shell, directory, form, focus fixes, plus test-first backend changes |
| ui-insights | 28 | no scope recorded | 2.02M | 2 | |
| seed-outliers | 6 | no scope recorded | 1.10M | 4 | |
| deploy | 9 | no scope recorded | 0.82M | 5 | |

**What the numbers showed:** only one branch, employees-api, has trustworthy drift data. There, every file outside the declared scope was a config or docs change I approved mid-session, never a surprise code change. For the last five branches, The Session recorded the pasted prompt as the intent, and the scoped `session start` either wasn't run or didn't register, so there was nothing to measure drift against. That's my process gap, not something I can reconstruct after the fact. What the receipts still show reliably is size and cost per branch. The UI employees branch took about 20M tokens across 21 turns, roughly two-thirds of the whole build.