# AI log

Where AI sped things up, and where I overruled it. One entry per notable moment, not per prompt.

**Tools:** Claude (chat) for planning, requirements, and decisions. Claude Code (agent) for implementation under `CLAUDE.md`.

---

### Planning · Oct 5
- **Used AI for:** drafting the clarifying questions to Incubyte, then the requirements, decisions, sprint plan, and agent rules.
- **Caught:** the first plan used SQLite everywhere. Render's free filesystem is wiped on restart, so every HR edit would vanish. I switched production to Postgres (D-005).
- **Decided myself:** the outlier rule (role + country median, not z-score), local + USD reporting, and merge commits over squash.

<!-- Template for each entry:
### <Ticket> · <date>
- **Asked for:**
- **AI produced:**
- **I changed / rejected:**
- **Why:**
-->

## Session data (from The Session)
Every ticket was recorded with The Session (`@vedantzz/session`), a CLI I built and published on npm. It records what I declared the agent would do *before* it started, then compares that against what actually changed. Full receipts are in [`sessions/`](sessions/).

| Ticket | Declared files | Changed in scope | Changed out of scope | Write checks asked / denied | Tokens (in / out / cache) | Cost |
| --- | --- | --- | --- | --- | --- | --- |
| SETUP-1 | | | | | | |
| BE-1 | | | | | | |
| BE-2 | | | | | | |
| BE-3 | | | | | | |
| BE-4 | | | | | | |
| BE-5 | | | | | | |
| BE-6 | | | | | | |
| BE-7 | | | | | | |
| FE-1 | | | | | | |
| FE-2 | | | | | | |
| FE-3 | | | | | | |
| FE-4 | | | | | | |
| OPS-1 | | | | | | |

**What the numbers showed:** written after the sprint. Name the ticket with the most drift and why.

## Performance (filled after deploy)
| Endpoint | Rows | p50 | Notes |
| --- | --- | --- | --- |
| `GET /api/employees` page 1 | 10,000 | | |
| `GET /api/employees?search=` | 10,000 | | |
| `GET /api/insights/by-dimension` | 10,000 | | |
| `GET /api/insights/outliers` | 10,000 | | |
| Seed script | 10,000 | | |

### Local performance · Oct 5 (10,000 rows, SQLite, M-series Mac)
| Endpoint | Time |
| --- | --- |
| `GET /api/insights/outliers` (16 flagged) | 84 ms |
| `GET /api/insights/by-dimension?dimension=job_title` | 20 ms |
| `GET /api/employees?search=smith` | 9 ms |
| Seed 10,000 rows | 0.24 s |
