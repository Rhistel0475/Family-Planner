-- Recurring Events Migration for Supabase
-- Run these batches one at a time in Supabase SQL Editor

-- BATCH 1: Create enum type
CREATE TYPE "public"."RecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- BATCH 2: Add Event table columns
ALTER TABLE "Event" ADD COLUMN "isRecurring" boolean NOT NULL DEFAULT false;
ALTER TABLE "Event" ADD COLUMN "recurrencePattern" text;
ALTER TABLE "Event" ADD COLUMN "recurrenceInterval" integer;
ALTER TABLE "Event" ADD COLUMN "recurrenceEndDate" timestamp(3);
ALTER TABLE "Event" ADD COLUMN "parentEventId" text;

-- BATCH 3: Convert Event recurrencePattern to enum
ALTER TABLE "Event" ALTER COLUMN "recurrencePattern" TYPE "RecurrencePattern" USING "recurrencePattern"::"RecurrencePattern";

-- BATCH 4: Add Event index
CREATE INDEX "Event_parentEventId_idx" ON "Event"("parentEventId");

-- BATCH 5: Add Chore table columns
ALTER TABLE "Chore" ADD COLUMN "isRecurring" boolean NOT NULL DEFAULT false;
ALTER TABLE "Chore" ADD COLUMN "recurrencePattern" text;
ALTER TABLE "Chore" ADD COLUMN "recurrenceInterval" integer;
ALTER TABLE "Chore" ADD COLUMN "recurrenceEndDate" timestamp(3);
ALTER TABLE "Chore" ADD COLUMN "parentEventId" text;
ALTER TABLE "Chore" ADD COLUMN "completed" boolean NOT NULL DEFAULT false;
ALTER TABLE "Chore" ADD COLUMN "completedAt" timestamp(3);

-- BATCH 6: Convert Chore recurrencePattern to enum
ALTER TABLE "Chore" ALTER COLUMN "recurrencePattern" TYPE "RecurrencePattern" USING "recurrencePattern"::"RecurrencePattern";

-- BATCH 7: Add Chore indexes
CREATE INDEX "Chore_parentEventId_idx" ON "Chore"("parentEventId");
CREATE INDEX "Chore_completed_idx" ON "Chore"("completed");
