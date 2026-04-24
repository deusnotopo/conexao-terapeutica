-- =============================================================================
-- Migration: Final Cleanup of Deprecated Columns to prevent NOT NULL crashes
-- =============================================================================

DO $$
BEGIN
    -- 1. Rename date_of_birth to birth_date if it hasn't been done
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'date_of_birth') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'birth_date') THEN
            ALTER TABLE public.dependents RENAME COLUMN date_of_birth TO birth_date;
        ELSE
            -- Both exist, just drop the old one
            ALTER TABLE public.dependents DROP COLUMN date_of_birth CASCADE;
        END IF;
    END IF;

    -- 2. Drop first_name and last_name since we migrated to standard `name`
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'first_name') THEN
        ALTER TABLE public.dependents DROP COLUMN first_name CASCADE;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'dependents' AND column_name = 'last_name') THEN
        ALTER TABLE public.dependents DROP COLUMN last_name CASCADE;
    END IF;
END $$;
