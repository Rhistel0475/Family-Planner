-- Add color and avatar to FamilyMember if missing (run once: npx prisma db execute --file prisma/add-family-member-color-avatar.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'FamilyMember' AND column_name = 'color'
  ) THEN
    ALTER TABLE "FamilyMember" ADD COLUMN "color" TEXT DEFAULT '#3b82f6';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'FamilyMember' AND column_name = 'avatar'
  ) THEN
    ALTER TABLE "FamilyMember" ADD COLUMN "avatar" TEXT DEFAULT '👤';
  END IF;
END $$;
