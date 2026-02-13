#!/usr/bin/env node
/**
 * Script to apply Prisma migrations for recurring events
 * Run this when the Supabase connection is available
 */

const { spawn } = require('child_process');

console.log('🔄 Attempting to apply database migrations...\n');
console.log('Environment loaded from .env and .env.local');
console.log('Database connection: aws-1-us-east-1.pooler.supabase.com:6543\n');

const child = spawn('npx', ['prisma', 'db', 'push', '--skip-generate'], {
  stdio: 'inherit',
  timeout: 120000 // 2 minute timeout
});

child.on('error', (err) => {
  console.error('\n❌ Migration failed:', err.message);
  console.log('\n📋 To manually apply the migration via Supabase SQL Editor:');
  console.log(`
Copy and run these SQL commands in the Supabase SQL Editor:

-- Add isRecurring column to Event table
ALTER TABLE "Event" ADD COLUMN "isRecurring" boolean NOT NULL DEFAULT false;

-- Add recurrence columns to Event table  
ALTER TABLE "Event" ADD COLUMN "recurrencePattern" text;
ALTER TABLE "Event" ADD COLUMN "recurrenceInterval" integer;
ALTER TABLE "Event" ADD COLUMN "recurrenceEndDate" timestamp(3);
ALTER TABLE "Event" ADD COLUMN "parentEventId" text;

-- Add indexes for recurring events
CREATE INDEX "Event_parentEventId_idx" ON "Event"("parentEventId");

-- Add recurring columns to Chore table
ALTER TABLE "Chore" ADD COLUMN "isRecurring" boolean NOT NULL DEFAULT false;
ALTER TABLE "Chore" ADD COLUMN "recurrencePattern" text;
ALTER TABLE "Chore" ADD COLUMN "recurrenceInterval" integer;
ALTER TABLE "Chore" ADD COLUMN "recurrenceEndDate" timestamp(3);
ALTER TABLE "Chore" ADD COLUMN "parentEventId" text;
ALTER TABLE "Chore" ADD COLUMN "completed" boolean NOT NULL DEFAULT false;
ALTER TABLE "Chore" ADD COLUMN "completedAt" timestamp(3);

-- Add indexes for chores  
CREATE INDEX "Chore_parentEventId_idx" ON "Chore"("parentEventId");
CREATE INDEX "Chore_completed_idx" ON "Chore"("completed");
  `);
  process.exit(1);
});

child.on('exit', (code) => {
  if (code === 0) {
    console.log('\n✅ Migrations applied successfully!');
    console.log('The recurring events feature is now fully operational.\n');
  } else {
    console.log('\n⚠️  Migration process exited with code', code);
  }
  process.exit(code);
});
