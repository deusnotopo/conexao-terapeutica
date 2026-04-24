-- =============================================================================
-- Migration: Clean obsolete columns from Dependents to guarantee safe inserts
-- =============================================================================

-- We previously added `user_id` but left `primary_user_id` lingering.
-- We must safely ensure that `user_id` is the ONLY owner column.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'primary_user_id') THEN
        ALTER TABLE public.dependents DROP COLUMN primary_user_id CASCADE;
    END IF;
END $$;
