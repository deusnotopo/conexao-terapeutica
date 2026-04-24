-- Migration: Fix documents table schema to match DocumentSchema
-- Add file_type column (used by upload screen but missing from DB)
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS file_type TEXT;
