-- CreateEnum
CREATE TYPE "EventType" AS ENUM ('WORK', 'EVENT');

-- CreateEnum
CREATE TYPE "EventCategory" AS ENUM ('DOCTOR', 'DENTIST', 'SCHOOL', 'FAMILY', 'CHURCH', 'OTHER');

-- CreateEnum
CREATE TYPE "RecurrencePattern" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY');

-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EligibilityMode" AS ENUM ('ALL', 'SELECTED');

-- CreateTable
CREATE TABLE "Family" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "setupComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Family_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FamilyMember" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT DEFAULT 'member',
    "workingHours" TEXT,
    "color" TEXT DEFAULT '#3b82f6',
    "avatar" TEXT DEFAULT '👤',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FamilyMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "type" "EventType" NOT NULL DEFAULT 'EVENT',
    "category" "EventCategory" DEFAULT 'OTHER',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3),
    "location" TEXT,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" "RecurrencePattern",
    "recurrenceInterval" INTEGER,
    "recurrenceEndDate" TIMESTAMP(3),
    "parentEventId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chore" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "assignedTo" TEXT NOT NULL,
    "dueDay" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "recurrencePattern" "RecurrencePattern",
    "recurrenceInterval" INTEGER,
    "recurrenceEndDate" TIMESTAMP(3),
    "parentEventId" TEXT,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chore_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Recipe" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "ingredients" TEXT NOT NULL,
    "cookDay" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recipe_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "familyId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoreTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChoreBoard" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequencyType" "FrequencyType" NOT NULL DEFAULT 'ONE_TIME',
    "customEveryDays" INTEGER,
    "eligibilityMode" "EligibilityMode" NOT NULL DEFAULT 'ALL',
    "eligibleMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultAssigneeMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoreBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Family_name_key" ON "Family"("name");

-- CreateIndex
CREATE INDEX "Family_createdAt_idx" ON "Family"("createdAt");

-- CreateIndex
CREATE INDEX "FamilyMember_familyId_idx" ON "FamilyMember"("familyId");

-- CreateIndex
CREATE INDEX "Event_familyId_startsAt_idx" ON "Event"("familyId", "startsAt");

-- CreateIndex
CREATE INDEX "Event_startsAt_idx" ON "Event"("startsAt");

-- CreateIndex
CREATE INDEX "Event_parentEventId_idx" ON "Event"("parentEventId");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");

-- CreateIndex
CREATE INDEX "Chore_familyId_dueDay_idx" ON "Chore"("familyId", "dueDay");

-- CreateIndex
CREATE INDEX "Chore_completed_idx" ON "Chore"("completed");

-- CreateIndex
CREATE INDEX "Chore_parentEventId_idx" ON "Chore"("parentEventId");

-- CreateIndex
CREATE INDEX "Recipe_familyId_cookDay_idx" ON "Recipe"("familyId", "cookDay");

-- CreateIndex
CREATE INDEX "ChoreTemplate_isSystem_idx" ON "ChoreTemplate"("isSystem");

-- CreateIndex
CREATE INDEX "ChoreTemplate_familyId_idx" ON "ChoreTemplate"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChoreTemplate_name_familyId_key" ON "ChoreTemplate"("name", "familyId");

-- CreateIndex
CREATE INDEX "ChoreBoard_familyId_idx" ON "ChoreBoard"("familyId");

-- CreateIndex
CREATE INDEX "ChoreBoard_templateKey_idx" ON "ChoreBoard"("templateKey");

-- CreateIndex
CREATE UNIQUE INDEX "ChoreBoard_familyId_templateKey_key" ON "ChoreBoard"("familyId", "templateKey");

-- AddForeignKey
ALTER TABLE "FamilyMember" ADD CONSTRAINT "FamilyMember_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Chore" ADD CONSTRAINT "Chore_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recipe" ADD CONSTRAINT "Recipe_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChoreBoard" ADD CONSTRAINT "ChoreBoard_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
