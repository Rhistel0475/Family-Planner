-- Allow same templateKey for different families; keep only (familyId, templateKey) unique
ALTER TABLE "ChoreBoard" DROP CONSTRAINT IF EXISTS "ChoreBoard_templateKey_key";
