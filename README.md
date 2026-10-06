# CardStats — Pokémon → catalog migration rehearsal

`pokemon_new` is the incoming Pokémon data. `catalog_old` is the existing catalog it merges into.

Proves that the incoming Pokémon database can be promoted into the LAN catalog
without creating duplicates, orphaning foreign keys, or disturbing existing
sports data — and that re-running it changes nothing.

Everything below runs locally against two throwaway databases. No real server
is touched.

---

## Findings

**1. `set_code` is NULL on all 203 card sets.**
The natural key previously agreed on — `set_code + card_number + language_id +
version_kind_id` — cannot be built from this data. Two of its four components
don't exist.

**2. The replacement key is unique across the full dataset.**
`(year, release name, set name, card number)` yields 20,443 distinct keys
across 20,443 cards. Zero collisions. Product releases (196) and card sets
(203) are likewise unique. This key is already encoded in the schema as
`product_release_identity_unique`, `card_set_identity_unique` and
`card_identity_unique`, so `ON CONFLICT` resolves against it natively.

**3. `card_variant` and `card_version` are empty — and so is `version_kind`.**
No card in this dataset has a `card_version_id`. That is the identifier the
grading pipeline returns, that `card_image` and `card_sale` attach to, and that
a user's collection would reference. `card_variant.version_kind_id` is NOT NULL
while `version_kind` has zero rows, so variants cannot be created until that
lookup table is seeded. `language` and `card_external_id` are also empty, so
there is currently no upstream anchor for matching against other sources.

This migration therefore covers `card_rarity → product_release → card_set →
card`. The variant and version layers are out of scope because they contain no
data, not because the pattern doesn't extend to them.

## Row counts in the source

| table | rows |
|---|---|
| `card` | 20,443 |
| `card_set` | 203 |
| `product_release` | 196 |
| `card_rarity` | 22 |
| `set_family` | 20 |
| `source_system` | 3 |
| `brand` / `category` / `genre` | 1 each |
| `card_variant`, `card_version`, `version_kind`, `language`, `card_external_id` | 0 |

---

## The problem this solves

Both databases generate their own primary keys with `gen_random_uuid()`. The
same logical row — the TCG category, the Pokémon genre — carries a different
UUID on each side. Copying rows across verbatim produces a second TCG category,
and every Pokémon record underneath attaches to whichever one the loader
happened to reference.

PostgreSQL raises no error. The catalog is simply split in two, and nobody
notices until search returns duplicates of everything.

The migration resolves identity by natural key instead, records every
`source_id → target_id` pair in `staging.id_map`, and rewrites foreign keys in
dependency order — parents before children.

## Prerequisites

PostgreSQL **18** or newer; the dumps are 18.4. On macOS, Postgres.app is the
path of least resistance. Confirm with:

```bash
PG=/Applications/Postgres.app/Contents/Versions/latest/bin
$PG/psql --version
```

Use `$PG/` on every command — a system Postgres earlier on `PATH` will shadow
it and fail with `unsupported version` errors.

## Files

| file | purpose |
|---|---|
| `01_seed_catalog_old.sql` | Makes the target look like LAN, with a deliberate `TCG` collision |
| `02_create_staging.sql` | Staging tables for the reference rows, plus `staging.id_map` |
| `03_migrate.sql` | Promotes reference rows by natural key |
| `04_assert.sql` | 10 checks on the reference layer |
| `05_stage_cards.sql` | Staging tables for the card hierarchy |
| `06_migrate_cards.sql` | Promotes `card_rarity → product_release → card_set → card` |
| `07_assert_cards.sql` | 12 checks on the card layer |
| `run.sh` | Full end-to-end run |

## Running it

```bash
cd ~/migration
bash run.sh 2>&1 | tail -60
```

Expected on a first run: reference rows promote with `category` reporting
`matched_existing` — the planted collision resolving — then 22 / 196 / 203 /
20,443 rows `inserted_new`, then 10/10 and 12/12 assertions passing.

## Proving idempotency

```bash
$PG/psql -d catalog_old -f 03_migrate.sql
$PG/psql -d catalog_old -f 06_migrate_cards.sql
$PG/psql -d catalog_old -f 04_assert.sql
$PG/psql -d catalog_old -f 07_assert_cards.sql
```

Second run: every table reports `matched_existing`, row counts unchanged, all
assertions still passing.

## The negative control

Shows what the naive approach does:

```sql
INSERT INTO catalog.category (id, name, normalized_name, sort_order)
SELECT gen_random_uuid(), name, name || ' ', 1 FROM staging.category;

SELECT id, name, normalized_name FROM catalog.category ORDER BY name;
```

Two `TCG` rows, two different UUIDs, no error raised. The trailing space
sidesteps the unique constraint, which is exactly what two systems with
slightly different normalization rules would produce in practice.

Reset with `01_seed_catalog_old.sql` afterwards.

## What comes next

- Seed `version_kind` and `language`, then load `card_variant` and
  `card_version` upstream. Until that happens, nothing downstream of `card` can
  be built.
- Populate `card_external_id` from the PokemonTCG API so there is a stable
  upstream anchor for cross-source matching.
- Extend the same map-then-rewrite pattern to the variant and version layers
  once they hold data.
- With multiple scraped sources, staging becomes per-source and identity
  resolution needs arbitration. The schema already anticipates this:
  `source_system.priority`, `card_external_id.match_confidence` and
  `.is_primary`, and the alias tables for sets, releases, players and
  parallels.
