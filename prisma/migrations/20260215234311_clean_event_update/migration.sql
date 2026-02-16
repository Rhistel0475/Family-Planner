/*
  Fix for Postgres enum "unsafe use of new value" error:
  - Step 1 migration: add enum values only (NO DEFAULT/NOT NULL using the new values)
  - Step 2 migration will backfill + set NOT NULL + set DEFAULT after values are committed
*/

-- 1) Add enum values (safe as long as we don't USE them in this same migration)
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'GENERAL';
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'SPORTS';
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'BIRTHDAY';
ALTER TYPE "EventCategory" ADD VALUE IF NOT EXISTS 'APPOINTMENT';

-- 2) Drop indexes if they exist (safe guards)
DROP INDEX IF EXISTS "ChoreBoard_templateKey_idx";
DROP INDEX IF EXISTS "Event_category_idx";

-- 3) Drop table only if you're sure it is no longer used
DROP TABLE IF EXISTS "ChoreTemplate";

