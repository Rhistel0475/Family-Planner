-- Add ROLE_BASED to EligibilityMode for DBs that had the enum created with only ALL, SELECTED (e.g. from legacy add_chore_board.sql).
-- No-op when the value already exists (e.g. from 20250215000000_add_chore_board).
ALTER TYPE "EligibilityMode" ADD VALUE IF NOT EXISTS 'ROLE_BASED';
