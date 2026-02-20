# Migrations

- **Timestamped folders** (e.g. `20250217000000_add_chore_description/`) are used by `prisma migrate deploy` and `prisma migrate dev`. Do not add non-Prisma content to `schema.prisma`.

- **`add_chore_board.sql`** is a one-off SQL script for the ChoreBoard table and related enums. It may already have been applied manually or via an earlier migration. Do not run it via `prisma migrate`; treat it as reference only. Current schema is the source of truth.
