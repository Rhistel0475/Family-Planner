-- CreateEnum for FrequencyType and EligibilityMode
CREATE TYPE "FrequencyType" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'CUSTOM');
CREATE TYPE "EligibilityMode" AS ENUM ('ALL', 'SELECTED', 'ROLE_BASED');

-- CreateTable ChoreBoard
CREATE TABLE "ChoreBoard" (
    "id" TEXT NOT NULL,
    "familyId" TEXT NOT NULL,
    "templateKey" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "isRecurring" BOOLEAN NOT NULL DEFAULT false,
    "frequencyType" "FrequencyType",
    "customEveryDays" INTEGER,
    "eligibilityMode" "EligibilityMode" NOT NULL DEFAULT 'ALL',
    "eligibleMemberIds" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "defaultAssigneeMemberId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChoreBoard_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ChoreBoard_templateKey_key" ON "ChoreBoard"("templateKey");

-- CreateIndex
CREATE INDEX "ChoreBoard_familyId_idx" ON "ChoreBoard"("familyId");

-- CreateIndex
CREATE UNIQUE INDEX "ChoreBoard_familyId_templateKey_key" ON "ChoreBoard"("familyId", "templateKey");

-- AddForeignKey
ALTER TABLE "ChoreBoard" ADD CONSTRAINT "ChoreBoard_familyId_fkey" FOREIGN KEY ("familyId") REFERENCES "Family"("id") ON DELETE CASCADE ON UPDATE CASCADE;
