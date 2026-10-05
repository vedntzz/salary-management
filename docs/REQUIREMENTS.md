# Requirements — ACME Salary Management

## Goal
Replace the HR team's Excel workflow with a web app where one HR Manager can manage salary data for 10,000 employees across countries, and answer one question quickly: **how does ACME pay its people?**

## Persona
**HR Manager.** Comfortable with Excel and not technical. Needs to find an employee in seconds, fix a salary without fear of breaking a formula, and spot pay problems before leadership asks.

## Problem today
- 10,000 rows across multiple countries and currencies, spread over spreadsheets
- Every answer ("what do engineers in India earn?") is a manual pivot table
- No validation, so typos in salary or country go unnoticed
- Cross-country comparisons mean converting currencies by hand

## Success criteria
1. Find any employee by name, email, or code in under 2 seconds.
2. Add, edit, or remove an employee with validation that blocks bad data.
3. See pay statistics by country, department, and job title without building a pivot.
4. Compare pay across countries in one currency, while still seeing local amounts.
5. Get a list of employees paid unusually high or low for their role and country.

## In scope
| Feature | What the HR Manager gets |
| --- | --- |
| Employee directory | Server-side search, filter (country, department, title), sort, and pagination |
| Employee CRUD | Create, edit, and delete with validation (positive salary, supported country, unique email) |
| Dual currency | Salary stored in local currency. Reports can show local or USD via a fixed rate table |
| Pay insights | Headcount, min, max, average, and median by country, department, or job title |
| Salary distribution | Histogram of salaries, filterable by country |
| Pay outliers | Employees more than 25% above or below the median for their role and country |
| Seed data | Deterministic script that creates 10,000 realistic employees |
| Deployment | Public URL for the app and API, plus a demo video |

## Deliberately out of scope
| Left out | Why |
| --- | --- |
| Authentication and roles | Confirmed single HR Manager. Auth adds work without changing what's being evaluated. |
| Salary history / effective dates | Confirmed optional. It would double the data model for a feature not asked for. Schema leaves room to add it. |
| Live exchange rates | Rates that change daily make reports and tests non-deterministic. A dated, fixed table is honest and reproducible. |
| Payroll, tax, deductions | Different problem (payroll processing), with country-specific legal rules. |
| Excel import/export | Valuable for migration, but the seed script covers the demo. First item for v2. |
| Bonuses, equity, benefits | Base salary answers the core question. Total comp is a v2 extension. |
| Audit log | Useful for compliance, but needs auth to mean anything. |

## Confirmed with Incubyte (Sandli, Oct 5)
Currency approach is our choice (fixed rates are fine). Current salary only. No auth. We define the metrics. A public URL is required, and the free tier is fine.

## Non-functional
- Directory and insight endpoints respond in under 300 ms at 10,000 rows.
- Tests are fast, deterministic, and need no network.
- Money is stored as integers. No floats anywhere in the salary path.
