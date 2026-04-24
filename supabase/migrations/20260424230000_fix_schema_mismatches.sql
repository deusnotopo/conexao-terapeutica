-- Migration: Fix schema mismatches found during Akita Audit
-- 1. Add missing professional_id FK to consultations
ALTER TABLE public.consultations 
  ADD COLUMN IF NOT EXISTS professional_id UUID REFERENCES public.professionals(id) ON DELETE SET NULL;

-- 2. Remove orphan tables with RLS enabled but no policies (block all access = data black hole)
-- These are V1 dead tables that must be properly cleaned up
DROP TABLE IF EXISTS public.therapeutic_goals CASCADE;
DROP TABLE IF EXISTS public.goal_progress_notes CASCADE;
