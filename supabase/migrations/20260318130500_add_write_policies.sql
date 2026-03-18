-- Adicionar políticas de escrita (INSERT, UPDATE, DELETE) e cobrir tabelas faltantes para RLS funcionar na versão online

-- 1. Profiles
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can delete own profile" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- 2. Dependents
CREATE POLICY "Primary users can insert own dependents" ON public.dependents FOR INSERT WITH CHECK (auth.uid() = primary_user_id);
CREATE POLICY "Primary users can update own dependents" ON public.dependents FOR UPDATE USING (auth.uid() = primary_user_id) WITH CHECK (auth.uid() = primary_user_id);
CREATE POLICY "Primary users can delete own dependents" ON public.dependents FOR DELETE USING (auth.uid() = primary_user_id);

-- 3. Caregiver Access
CREATE POLICY "Primary users can insert access" ON public.caregiver_access FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can update access" ON public.caregiver_access FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can delete access" ON public.caregiver_access FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);

-- 4. Events
CREATE POLICY "Primary users can insert events" ON public.events FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can update events" ON public.events FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can delete events" ON public.events FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);

-- 5. Medications
CREATE POLICY "Primary users can insert medications" ON public.medications FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can update medications" ON public.medications FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can delete medications" ON public.medications FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);

-- 6. Medication Logs
CREATE POLICY "Primary users can insert logs" ON public.medication_logs FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.medications m 
        JOIN public.dependents d ON m.dependent_id = d.id 
        WHERE m.id = medication_id AND d.primary_user_id = auth.uid()
    )
);
CREATE POLICY "Primary users can update logs" ON public.medication_logs FOR UPDATE USING (
     EXISTS (
        SELECT 1 FROM public.medications m 
        JOIN public.dependents d ON m.dependent_id = d.id 
        WHERE m.id = medication_id AND d.primary_user_id = auth.uid()
    )
);
CREATE POLICY "Primary users can view logs" ON public.medication_logs FOR SELECT USING (
     EXISTS (
        SELECT 1 FROM public.medications m 
        JOIN public.dependents d ON m.dependent_id = d.id 
        WHERE m.id = medication_id AND d.primary_user_id = auth.uid()
    )
);

-- 7. Therapy Notes
CREATE POLICY "Primary users can insert notes" ON public.therapy_notes FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can view notes" ON public.therapy_notes FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can update notes" ON public.therapy_notes FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can delete notes" ON public.therapy_notes FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);

-- 8. Documents
CREATE POLICY "Primary users can insert documents" ON public.documents FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can view documents" ON public.documents FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can update documents" ON public.documents FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
CREATE POLICY "Primary users can delete documents" ON public.documents FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = dependent_id AND primary_user_id = auth.uid())
);
