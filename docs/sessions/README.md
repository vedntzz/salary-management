# Session receipts

One file per ticket, saved from `session stop` with [The Session](https://www.npmjs.com/package/@vedantzz/session).

Each receipt shows:
- **Declared intent and scope:** what I told the agent to do and which files it could touch, recorded *before* it started
- **Actual changes:** files changed inside versus outside that scope
- **Write checks:** times the agent asked to edit outside scope, and whether I allowed or denied it
- **Tokens and cost:** input, output, and cache reads/writes, counted separately

Records are signed into a tamper-evident hash chain, so a receipt can't be quietly edited after the fact.

| File | Ticket |
| --- | --- |
| `SETUP-1.md` | Repo scaffold, docs, CI |
| `BE-1.md` … `BE-7.md` | Backend tickets |
| `FE-1.md` … `FE-4.md` | Frontend tickets |
| `OPS-1.md` | Deploy |
