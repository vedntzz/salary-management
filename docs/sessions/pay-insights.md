  stopped  Read CLAUDE.md and docs/DECISIONS.md. Branch feat/pay-insights. Never run git. Touch only backend/app, backend/tests, docs/DECISIONS.md. Tests only: 1. app/currency.py: convert_local_to_usd(amount, currency) -> int, using the same fixed rates and half-up rounding. 8,800,000 INR gives 100,000 USD; USD is unchanged; an unknown currency raises ValueError. 2. app/services/statistics.py (pure functions, no DB): calculate_median_salary returns the middle value for an odd count and the rounded mean of…
  changed  19 files, mostly in backend/tests/integration/ and backend/app/
  no scope — nothing was declared to drift from
  cost     3,067,322 tokens  9 turns  (38 api calls)
