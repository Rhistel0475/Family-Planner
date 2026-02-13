-- Add ChoreTemplate support to Chore table and create ChoreTemplate model
-- This migration adds the following changes:
-- 1. Add choreTemplateId, frequency, and eligibleMemberIds columns to Chore table
-- 2. Create ChoreTemplate table for system and custom templates

-- Add new columns to Chore table
ALTER TABLE "Chore" ADD COLUMN "choreTemplateId" TEXT;
ALTER TABLE "Chore" ADD COLUMN "frequency" TEXT DEFAULT 'once';
ALTER TABLE "Chore" ADD COLUMN "eligibleMemberIds" TEXT;

-- Create index for choreTemplateId
CREATE INDEX "Chore_choreTemplateId_idx" ON "Chore"("choreTemplateId");

-- Create ChoreTemplate table
CREATE TABLE "ChoreTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT false,
  "familyId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE("name", "familyId")
);

-- Create indexes for ChoreTemplate
CREATE INDEX "ChoreTemplate_isSystem_idx" ON "ChoreTemplate"("isSystem");
CREATE INDEX "ChoreTemplate_familyId_idx" ON "ChoreTemplate"("familyId");

-- Add foreign key constraint for ChoreTemplate.familyId (optional, can link to families)
-- Note: familyId can be NULL for system templates

-- Add foreign key for choreTemplateId in Chore table
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_choreTemplateId_fkey" 
  FOREIGN KEY ("choreTemplateId") REFERENCES "ChoreTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Insert system chore templates
INSERT INTO "ChoreTemplate" ("id", "name", "description", "isSystem", "familyId", "createdAt", "updatedAt")
VALUES
  (gen_random_uuid()::text, 'Clean Bedroom', 'Tidy and vacuum bedroom', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Clean Kitchen', 'Wipe counters, clean sink, sweep floor', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Clean Living Room', 'Dust furniture, pick up items, vacuum', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Take Out Trash', 'Empty trash cans and take to curb', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Wash Dishes', 'Wash or load dishes into dishwasher', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Do Laundry', 'Wash, dry, and fold laundry', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Vacuum Floors', 'Vacuum all carpeted areas', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Clean Bathroom', 'Clean toilet, sink, and shower', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Mop Floors', 'Mop kitchen and bathroom floors', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Grocery Shopping', 'Shop for weekly groceries', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Yard Work', 'Mow lawn and trim edges', true, NULL, NOW(), NOW()),
  (gen_random_uuid()::text, 'Organize Closet', 'Sort and organize closet', true, NULL, NOW(), NOW());
