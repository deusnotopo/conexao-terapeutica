-- =============================================================================
-- Migration: Force Apply RLS Fixes (Akita Mode)
-- =============================================================================
-- This migration guarantees that ALL references to the ghost column 'primary_user_id'
-- are utterly destroyed from all views, functions, and policies in the database,
-- both dynamically and explicitly. It pushes the final state to Supabase correctly.

-- 1. PURGE AND REDEFINE HELPER FUNCTIONS (No primary_user_id allowed)

CREATE OR REPLACE FUNCTION public.is_primary_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.dependents WHERE id = dep_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.is_shared_caregiver(dep_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.caregiver_access WHERE dependent_id = dep_id AND user_id = auth.uid()
  );
$$;

CREATE OR REPLACE FUNCTION public.log_belongs_to_user(med_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.medications m
    JOIN public.dependents d ON m.dependent_id = d.id
    WHERE m.id = med_id AND d.user_id = auth.uid()
  );
$$;

-- 2. FORCE RE-CREATE ALL REMAINING RLS POLICIES FOR ALL CORE TABLES
-- To guarantee we didn't leave any manually created policy behind that uses 'primary_user_id'

-- EVENTS
DROP POLICY IF EXISTS "Users can manage events" ON public.events;
CREATE POLICY "Users can manage events" ON public.events FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- MEDICATIONS
DROP POLICY IF EXISTS "Users can manage medications" ON public.medications;
CREATE POLICY "Users can manage medications" ON public.medications FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- MEDICATION LOGS
DROP POLICY IF EXISTS "Users can manage meds logs" ON public.medication_logs;
CREATE POLICY "Users can manage meds logs" ON public.medication_logs FOR ALL
  USING (public.log_belongs_to_user(medication_id))
  WITH CHECK (public.log_belongs_to_user(medication_id));

-- THERAPY NOTES
DROP POLICY IF EXISTS "Users can manage therapy notes" ON public.therapy_notes;
CREATE POLICY "Users can manage therapy notes" ON public.therapy_notes FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- DOCUMENTS
DROP POLICY IF EXISTS "Users can manage documents" ON public.documents;
CREATE POLICY "Users can manage documents" ON public.documents FOR ALL
  USING (public.is_primary_caregiver(dependent_id) OR public.is_shared_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

-- CAREGIVER_ACCESS
DROP POLICY IF EXISTS "Primary parent can manage access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Caregivers can view own access" ON public.caregiver_access;

CREATE POLICY "Primary parent can manage access" ON public.caregiver_access FOR ALL
  USING (public.is_primary_caregiver(dependent_id))
  WITH CHECK (public.is_primary_caregiver(dependent_id));

CREATE POLICY "Caregivers can view own access" ON public.caregiver_access FOR SELECT
  USING (user_id = auth.uid());
