-- =============================================================================
-- Migration: Nuke ALL dependents policies dynamically and rebuild
-- =============================================================================

DO $$ 
DECLARE 
  pol record;
BEGIN 
  FOR pol IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'dependents' AND schemaname = 'public' 
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.dependents', pol.policyname);
  END LOOP; 
END $$;


-- Recreate the policies cleanly
CREATE POLICY "dependents_select" ON public.dependents 
  FOR SELECT 
  USING (
    user_id = auth.uid() OR public.is_shared(id)
  );

CREATE POLICY "dependents_insert" ON public.dependents 
  FOR INSERT 
  WITH CHECK (
    user_id = auth.uid()
  );

CREATE POLICY "dependents_update" ON public.dependents 
  FOR UPDATE 
  USING (user_id = auth.uid()) 
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "dependents_delete" ON public.dependents 
  FOR DELETE 
  USING (user_id = auth.uid());
