# Decisions

Every decision lists the context, the choice, why, and what was **rejected** and why, so nobody has to relitigate it from memory.

---

## D-001 · Stack: FastAPI + React (Vite) + TypeScript
**Context:** The role is Python/React. It needs a fast API, typed contracts, and a quick UI build.
**Decision:** FastAPI, SQLAlchemy 2.0, and Pydantic v2 on the backend. React, Vite, TypeScript, TanStack Query/Table, shadcn/ui, and Recharts on the frontend.
**Why:** Pydantic gives validation and an OpenAPI contract for free. TanStack handles server-state caching and table logic without me hand-rolling them.
**Rejected:**
- *Django:* the admin is tempting, but it's heavier than a 2-resource API needs.
- *Next.js:* SSR adds nothing for a single-user internal tool.

## D-002 · Simple layered architecture, not hexagonal
**Context:** CRUD plus aggregates over one table.
**Decision:** `api → services → repositories → models`. Routers stay thin, logic lives in services, and SQL lives in repositories.
**Why:** It's testable without ceremony. Services are tested with an in-memory SQLite session.
**Rejected:**
- *Ports and adapters:* I used it in my RAG take-home because the embedder, store, and LLM had to be swappable. Nothing here needs swapping. It would be complexity for show.

## D-003 · Store local currency, report in local or USD with fixed rates
**Context:** Employees are paid in different currencies. HR compares within a country locally and across countries in one currency.
**Decision:** Each employee stores `salary_amount` (integer) plus `salary_currency` (derived from the country). `currency.py` holds a dated, fixed USD rate table. Insight endpoints take `currency=local|usd`.
**Why:** Deterministic reports and tests, and the truth (local pay) is never overwritten.
**Rejected:**
- *Store only USD:* loses the real figure, and every rate change would corrupt data.
- *Live FX API:* non-deterministic, adds an external dependency, and isn't what HR needs for planning.

## D-004 · Integers for money
**Decision:** Annual salary as an integer in whole local currency units.
**Why:** Floats drift (0.1 + 0.2). Annual salaries don't need cents.
**Rejected:** *Decimal columns*, because they're unnecessary precision for annual figures and slower to aggregate.
**Scoped exception: sorting by USD equivalent.** `sort=salary` ranks employees by `salary_amount / rate` computed in SQL, which is a float. It's used only inside `ORDER BY`, never stored, returned, or aggregated, and the expression lives in `app/currency.py` (D-003). Float precision can't flip the order of two salaries unless they're equal to within about 1e-12.
*Rejected:* integer arithmetic with pre-scaled rates, because rounding the scaled rates can swap two salaries that are close in USD, and sorting in Python would mean loading every matching row instead of one page.

## D-005 · SQLite locally and in tests, Postgres in production
**Context:** Render's free tier has an ephemeral filesystem, so SQLite there would lose every edit on restart.
**Decision:** SQLite for local dev and tests. Free Postgres (Neon) in production. SQLAlchemy keeps the code identical, and the only difference is `DATABASE_URL`.
**Rejected:**
- *SQLite in production:* data loss on every deploy or restart.
- *Postgres in tests:* slower and needs Docker. Integration tests cover the SQL I write by hand.

## D-006 · Salary aggregates computed in Python, not SQL
**Context:** SQLite has no `percentile_cont`, and Postgres does. D-016 requires converting each salary to USD before aggregating.
**Decision:** Each insight request loads the matching `(group, currency, salary)` rows in one query. The insights service computes count, min, and max from those integers, and `statistics.py` the avg and median, after conversion when reporting in USD.
**Why:** Convert-then-aggregate can't be done in SQL without float division (D-004). Identical behavior on both databases, and 10k integers sort and sum in about 1 ms.
**Rejected:**
- *Database-specific median SQL:* it would split the code paths and let tests pass on SQLite while production breaks.
- *SQL `GROUP BY` for count/min/max alongside the salary list:* a second code path that computes the same numbers the list already gives.

## D-007 · Server-side search, filter, sort, pagination
**Decision:** `GET /api/employees?search&country&department&job_title&sort&page&page_size`, with page_size capped at 100. Indexes on `country`, `department`, `job_title`, and `email`.
**Why:** Shipping 10k rows to the browser is slow on the first load and doesn't scale to the next 50k.
**Rejected:** *Client-side filtering*, which is fine at 10k rows but the wrong habit.

## D-008 · Outlier definition
**Decision:** Flag an employee when their salary is more than 25% away from the median of their (job_title, country) group, and only for groups of 5 or more.
**Why:** It compares like with like (role and country), and the minimum group size stops a single-person group from flagging itself. The threshold is configurable.
**Rejected:**
- *Z-score:* salaries are skewed, and HR can't reason about "2.1 standard deviations."
- *Org-wide percentile:* a US engineer would always look high next to an India analyst.

**Details:**
- *Strict `>`:* an employee exactly at the threshold is not flagged ("more than 25%"). The deviation and the threshold are both `Decimal`, so 25% can't round to 25.0000001 and flip.
- *`deviation_percent`* is a signed float to one decimal (`30.0`, `-50.0`). It's a ratio, not money, so D-004 doesn't apply. `direction` (`above|below`) repeats the sign for readability.
- *Order:* by absolute deviation descending (the exact value, not the rounded one), ties broken by employee id so the list is stable.
- *Medians are in local currency.* Groups are single-country, so no conversion is needed.

## D-009 · Deterministic seed
**Decision:** `seed.py` uses `random.Random(42)`, name lists from files, and salary bands per title × country multiplier. Bulk insert, idempotent (wipes and reseeds).
**Why:** The same 10k rows every time, so demo numbers and integration tests are reproducible.

## D-010 · No auth, no salary history
**Decision:** Both confirmed out of scope by Incubyte. See REQUIREMENTS.md.
**Consequence:** The schema keeps `employees` as a single table. History would be an added `salary_changes` table, not a rewrite.

## D-011 · Branch per feature, merge commits, no squash
**Decision:** Every ticket gets a `feat/...` branch and a PR into `main`, merged with a merge commit.
**Why:** Squashing would erase the test → feat → refactor commits the reviewers asked to see.

## D-012 · Hosting: Render (API) + Vercel (UI) + Neon (Postgres)
**Why:** All free and all deploy from git.
**Known trade-off:** Render's free tier sleeps after inactivity, so the first request takes about 30–50 s. This is documented in the README so reviewers aren't surprised.

## D-013 · Record every agent session with The Session
**Context:** Incubyte wants to see *how* AI was used, not just that it was. Git history shows what landed. It doesn't show what the agent was asked to do, what it tried to touch beyond that, or what it cost.
**Decision:** Each ticket runs inside a recorded session. I declare intent and file scope before the agent starts, and the declared scope is the agreement. Out-of-scope writes are asked about or recorded. The receipt is committed per ticket, and summarized in the PR and the AI log.
**Why:** It turns "I used AI intentionally" from a claim into evidence: declared versus actual, per ticket.
**Rejected:**
- *Commit the raw transcript only:* complete, but nobody reads 10,000 lines. The receipt is the summary, and the transcript stays as backup.
- *Hide tickets that drifted:* drift is the honest signal. Explaining it is worth more than a clean-looking table.

## D-015 · Known trade-offs from the employees API
- **Seed is uniform random.** Every country has about 1,250 people, so headcount charts look synthetic. Next: weighted distribution.
- **`create_all`, no migrations.** Alembic was rejected: single table, timeboxed. A model change means deleting the local DB.
- **Employee codes come from the highest existing code.** Concurrent creates could race. Single HR user, and the unique constraint is the backstop.
- **Emails are compared in lowercase but stored as typed.** Next: normalize on write.
- **Search doesn't escape `%` or `_`.** Low impact, known.

## D-016 · Summary is USD-only; USD stats convert each salary, then aggregate
**Context:** The summary totals payroll across every country, and by-dimension groups can mix currencies.
**Decision:** `GET /api/insights/summary` takes no currency parameter. Its total and median payroll are always in USD, and every insights response labels money with an ISO code (`"USD"`, `"INR"`). Wherever a stat is reported in USD, each salary is converted to whole USD first (D-003, half-up) and the count, min, max, avg, and median are taken over those integers.
**Why:** A total across currencies only means something in one currency. Converting per salary keeps group stats consistent with the per-employee USD values the HR manager sees elsewhere.
**Rejected:**
- *`currency=local` with `null` totals:* a UI trap, since the cards would render blanks or zeros for a valid request.
- *Converting the aggregated totals:* rounding differs from the per-row values, so a total wouldn't equal the sum of the figures shown beside it.

## D-017 · The frontend gets country currencies from `/api/meta/filters`
**Context:** The employee form shows the salary currency (read-only) for the chosen country, and offers every supported country, including ones with no employees yet. The country→currency map only existed in `app/currency.py`.
**Decision:** `GET /api/meta/filters` also returns `currency_by_country`, built from `CURRENCY_BY_COUNTRY`. The form's Country dropdown uses its keys. The filter dropdowns keep using `countries`, which lists only countries that have employees.
**Why:** One source of truth (D-003). Adding a country means changing `app/currency.py` and the `Country` Literal, and an integration test fails if those two drift apart.
**Rejected:**
- *Copy the map into the frontend:* two lists to keep in sync, and they would drift silently.
- *Fill the form's Country dropdown from `countries`:* on an empty database, or for a new country, the first employee could never be added.
- *A separate `/api/meta/currencies` endpoint:* a second request for eight entries the form loads alongside the filters anyway.

## D-018 · Insights UI choices
- **The median chart is always USD.** Bars in mixed currencies on one axis are meaningless. Only the table switches to local currency.
- **Local currency is only offered when grouping by country.** Switching away resets to USD.
- **The histogram reuses the employees filter-options hook.** One shared cache, at the cost of coupling the two features.
- **Frontend line limits aren't automated.** `check_limits.py` scans only the backend. Frontend limits were checked by eye.
