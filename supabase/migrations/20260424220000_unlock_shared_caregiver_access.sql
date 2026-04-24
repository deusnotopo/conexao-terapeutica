-- Migration: Unlock Shared Caregiver Access
-- Goal: Ensure shared caregivers can INSERT and UPDATE records across all feature modules.
-- Previously, the `WITH CHECK` constraint was restricted to `public.is_owner(dependent_id)`.
-- This migration updates all feature policies to `WITH CHECK (public.can_access(dependent_id))`.

-- 1. MEDICAL RECORDS
DROP POLICY IF EXISTS "medical_all" ON public.medical_records;
CREATE POLICY "medical_all" ON public.medical_records FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 2. EVENTS
DROP POLICY IF EXISTS "events_all" ON public.events;
CREATE POLICY "events_all" ON public.events FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 3. MEDICATIONS
DROP POLICY IF EXISTS "meds_all" ON public.medications;
CREATE POLICY "meds_all" ON public.medications FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 4. MEDICATION LOGS
DROP POLICY IF EXISTS "med_logs_all" ON public.medication_logs;
CREATE POLICY "med_logs_all" ON public.medication_logs FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.medications m
      WHERE m.id = medication_id AND public.can_access(m.dependent_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.medications m
      WHERE m.id = medication_id AND public.can_access(m.dependent_id)
    )
  );

-- 5. VACCINES
DROP POLICY IF EXISTS "vaccines_all" ON public.vaccines;
CREATE POLICY "vaccines_all" ON public.vaccines FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 6. CRISIS EVENTS
DROP POLICY IF EXISTS "crisis_all" ON public.crisis_events;
CREATE POLICY "crisis_all" ON public.crisis_events FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 7. GROWTH MEASUREMENTS
DROP POLICY IF EXISTS "growth_all" ON public.growth_measurements;
CREATE POLICY "growth_all" ON public.growth_measurements FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 8. GOALS
DROP POLICY IF EXISTS "goals_all" ON public.goals;
CREATE POLICY "goals_all" ON public.goals FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 9. GOAL NOTES
DROP POLICY IF EXISTS "goal_notes_all" ON public.goal_notes;
CREATE POLICY "goal_notes_all" ON public.goal_notes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_id AND public.can_access(g.dependent_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.goals g
      WHERE g.id = goal_id AND public.can_access(g.dependent_id)
    )
  );

-- 10. SLEEP LOGS
DROP POLICY IF EXISTS "sleep_all" ON public.sleep_logs;
CREATE POLICY "sleep_all" ON public.sleep_logs FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 11. PARENT DIARY
DROP POLICY IF EXISTS "diary_all" ON public.parent_diary;
CREATE POLICY "diary_all" ON public.parent_diary FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 12. EXPENSES
DROP POLICY IF EXISTS "expenses_all" ON public.expenses;
CREATE POLICY "expenses_all" ON public.expenses FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 13. DOCUMENTS
DROP POLICY IF EXISTS "docs_all" ON public.documents;
CREATE POLICY "docs_all" ON public.documents FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));

-- 14. PROFESSIONALS
DROP POLICY IF EXISTS "prof_all" ON public.professionals;
CREATE POLICY "prof_all" ON public.professionals FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.can_access(dependent_id));
