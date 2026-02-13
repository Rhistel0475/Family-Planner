-- CreateEnum
CREATE TYPE "FrequencyType" AS ENUM ('ONE_TIME', 'DAILY', 'WEEKLY', 'BIWEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateEnum
CREATE TYPE "EligibilityMode" AS ENUM ('ALL', 'SELECTED');

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
CREATE UNIQUE INDEX "ChoreBoard_familyId_templateKey_key" ON "ChoreBoard"("familyId", "templateKey");

-- CreateIndex
CREATE INDEX "ChoreBoard_familyId_idx" ON "ChoreBoard"("familyId");

-- CreateIndex
CREATE INDEX "ChoreBoard_templateKey_idx" ON "ChoreBoard"("templateKey");

-- AddForeignKey
ALTER TABLE "ChoreBoard" ADD CONSTRAINT "ChoreBoard_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
