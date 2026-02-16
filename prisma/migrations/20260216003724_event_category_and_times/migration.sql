/*
  Warnings:

  - The values [DOCTOR,DENTIST,OTHER] on the enum `EventCategory` will be removed. If these variants are still used in the database, this will fail.
  - Made the column `category` on table `Event` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "EventCategory_new" AS ENUM ('GENERAL', 'FAMILY', 'CHURCH', 'SCHOOL', 'SPORTS', 'BIRTHDAY', 'APPOINTMENT');
ALTER TABLE "Event" ALTER COLUMN "category" DROP DEFAULT;
ALTER TABLE "Event" ALTER COLUMN "category" TYPE "EventCategory_new" USING ("category"::text::"EventCategory_new");
ALTER TYPE "EventCategory" RENAME TO "EventCategory_old";
ALTER TYPE "EventCategory_new" RENAME TO "EventCategory";
DROP TYPE "EventCategory_old";
ALTER TABLE "Event" ALTER COLUMN "category" SET DEFAULT 'GENERAL';
COMMIT;

-- AlterTable
ALTER TABLE "Event" ALTER COLUMN "category" SET NOT NULL,
ALTER COLUMN "category" SET DEFAULT 'GENERAL';

-- CreateIndex
CREATE INDEX "ChoreBoard_templateKey_idx" ON "ChoreBoard"("templateKey");

-- CreateIndex
CREATE INDEX "Event_category_idx" ON "Event"("category");
