# Migrations

- **Timestamped folders** (e.g. `20250215000000_add_chore_board/`) are used by `prisma migrate deploy` and `prisma migrate dev`. Do not add non-Prisma content to `schema.prisma`.

- **Existing databases** that already have the `ChoreBoard` table (e.g. from a previous manual run of `add_chore_board.sql`) should mark the ChoreBoard migration as applied without running it:
  ```bash
  npx prisma migrate resolve --applied 20250215000000_add_chore_board
  ```
  Then run `npx prisma migrate deploy` so later migrations (e.g. description columns, ROLE_BASED enum value) are applied.
