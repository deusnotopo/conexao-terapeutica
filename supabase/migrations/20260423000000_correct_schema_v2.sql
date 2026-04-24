-- =============================================================================
-- Conexão Terapêutica — Schema V2 (IDEMPOTENTE)
-- Usa CREATE TABLE IF NOT EXISTS + ADD COLUMN IF NOT EXISTS para ser seguro
-- quando executado após as migrações V1 de 20260317/20260318.
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. PROFILES — adicionar colunas extras que V1 não tinha
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url   TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS updated_at   TIMESTAMPTZ DEFAULT now() NOT NULL;
-- full_name pode já existir (adicionada no align_schema) — seguro com IF NOT EXISTS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name     TEXT;

-- ---------------------------------------------------------------------------
-- 2. DEPENDENTS — migrar primary_user_id → user_id  e  first_name+last_name → name
-- ---------------------------------------------------------------------------
-- 2a. Adicionar user_id apontando para primary_user_id se existir
ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS user_id UUID;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='dependents' AND column_name='primary_user_id') THEN
    UPDATE public.dependents SET user_id = primary_user_id WHERE user_id IS NULL;
  END IF;
END $$;

-- 2b. Garantir FK e NOT NULL
ALTER TABLE public.dependents DROP CONSTRAINT IF EXISTS dependents_user_id_fkey;
ALTER TABLE public.dependents ADD CONSTRAINT dependents_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.dependents ALTER COLUMN user_id SET NOT NULL;

-- 2c. Coluna name (concatenar first_name + last_name se existirem)
ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS name TEXT;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='dependents' AND column_name='first_name') THEN
    UPDATE public.dependents
      SET name = TRIM(COALESCE(first_name,'') || ' ' || COALESCE(last_name,''))
      WHERE name IS NULL OR name = '';
  END IF;
END $$;
ALTER TABLE public.dependents ALTER COLUMN name SET NOT NULL;

-- 2d. Demais colunas
ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS birth_date   DATE;
ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS diagnosis    TEXT;
ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS relationship TEXT;

-- ---------------------------------------------------------------------------
-- 3. CAREGIVER_ACCESS — migrar user_id → caregiver_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.caregiver_access ADD COLUMN IF NOT EXISTS caregiver_id UUID;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns
             WHERE table_name='caregiver_access' AND column_name='user_id') THEN
    UPDATE public.caregiver_access SET caregiver_id = user_id WHERE caregiver_id IS NULL;
  END IF;
END $$;
ALTER TABLE public.caregiver_access DROP CONSTRAINT IF EXISTS caregiver_access_caregiver_id_fkey;
ALTER TABLE public.caregiver_access ADD CONSTRAINT caregiver_access_caregiver_id_fkey
  FOREIGN KEY (caregiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.caregiver_access ALTER COLUMN caregiver_id SET NOT NULL;
ALTER TABLE public.caregiver_access DROP CONSTRAINT IF EXISTS caregiver_access_dependent_id_caregiver_id_key;
ALTER TABLE public.caregiver_access ADD CONSTRAINT caregiver_access_dependent_id_caregiver_id_key
  UNIQUE (dependent_id, caregiver_id);

-- ---------------------------------------------------------------------------
-- 4. MEDICATIONS — colunas extras de V1
-- ---------------------------------------------------------------------------
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS dosage         TEXT;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS frequency_desc TEXT;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS stock_count    INTEGER;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS stock_alert_at INTEGER;
ALTER TABLE public.medications ADD COLUMN IF NOT EXISTS reminder_times TEXT[] DEFAULT '{}';

-- ---------------------------------------------------------------------------
-- 5. MEDICATION_LOGS — garantir colunas canônicas
-- ---------------------------------------------------------------------------
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS taken_at   TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS status      TEXT DEFAULT 'taken';
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS notes       TEXT;
ALTER TABLE public.medication_logs ADD COLUMN IF NOT EXISTS created_at  TIMESTAMPTZ DEFAULT now();

-- ---------------------------------------------------------------------------
-- 6. EVENTS — coluna pre_notes
-- ---------------------------------------------------------------------------
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS pre_notes TEXT;

-- ---------------------------------------------------------------------------
-- 7. EXPENSES — tabela nova (criada em 20260318161000 como outra, OK com IF NOT EXISTS)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.expenses (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id  UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  category      TEXT NOT NULL,
  amount_cents  INTEGER NOT NULL CHECK (amount_cents >= 0),
  date          DATE NOT NULL,
  description   TEXT,
  reimbursable  BOOLEAN DEFAULT false,
  reimbursed    BOOLEAN DEFAULT false,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 8. GOALS — substituindo therapeutic_goals com tabela canônica
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.goals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','achieved','abandoned')),
  target_date  DATE,
  achieved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS public.goal_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id    UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.goal_notes ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 9. CAREGIVER_INVITES
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.caregiver_invites (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  invited_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);
ALTER TABLE public.caregiver_invites ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- 10. TRIGGER: Auto-criar profile quando usuário se registra
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- SECURITY DEFINER helpers V2 (is_owner, is_shared, can_access)
-- Substituem is_primary_caregiver / is_shared_caregiver / log_belongs_to_user
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_owner(dep_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.dependents WHERE id = dep_id AND user_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.is_shared(dep_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.caregiver_access WHERE dependent_id = dep_id AND caregiver_id = auth.uid());
$$;

CREATE OR REPLACE FUNCTION public.can_access(dep_id UUID)
RETURNS BOOLEAN LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_owner(dep_id) OR public.is_shared(dep_id);
$$;

-- =============================================================================
-- POLICIES V2
-- =============================================================================

-- PROFILES
DROP POLICY IF EXISTS "profiles_select" ON public.profiles;
DROP POLICY IF EXISTS "profiles_insert" ON public.profiles;
DROP POLICY IF EXISTS "profiles_update" ON public.profiles;
DROP POLICY IF EXISTS "profiles_delete" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile"   ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can delete own profile" ON public.profiles;
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- DEPENDENTS
DROP POLICY IF EXISTS "dependents_select" ON public.dependents;
DROP POLICY IF EXISTS "dependents_insert" ON public.dependents;
DROP POLICY IF EXISTS "dependents_update" ON public.dependents;
DROP POLICY IF EXISTS "dependents_delete" ON public.dependents;
DROP POLICY IF EXISTS "dep_select"                         ON public.dependents;
DROP POLICY IF EXISTS "dep_insert"                         ON public.dependents;
DROP POLICY IF EXISTS "dep_update"                         ON public.dependents;
DROP POLICY IF EXISTS "dep_delete"                         ON public.dependents;
DROP POLICY IF EXISTS "Primary users can view own dependents"   ON public.dependents;
DROP POLICY IF EXISTS "Primary users can insert own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can update own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can delete own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Caregivers can view shared dependents"   ON public.dependents;
DROP POLICY IF EXISTS "Users can view own dependents"           ON public.dependents;
DROP POLICY IF EXISTS "Users can insert own dependents"         ON public.dependents;
DROP POLICY IF EXISTS "Users can update own dependents"         ON public.dependents;
DROP POLICY IF EXISTS "Users can delete own dependents"         ON public.dependents;

CREATE POLICY "dep_select" ON public.dependents FOR SELECT USING (public.can_access(id));
CREATE POLICY "dep_insert" ON public.dependents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dep_update" ON public.dependents FOR UPDATE USING (public.is_owner(id)) WITH CHECK (public.is_owner(id));
CREATE POLICY "dep_delete" ON public.dependents FOR DELETE USING (public.is_owner(id));

-- CAREGIVER_ACCESS
DROP POLICY IF EXISTS "access_select"                ON public.caregiver_access;
DROP POLICY IF EXISTS "access_insert"                ON public.caregiver_access;
DROP POLICY IF EXISTS "access_delete"                ON public.caregiver_access;
DROP POLICY IF EXISTS "ca_select"                    ON public.caregiver_access;
DROP POLICY IF EXISTS "ca_insert"                    ON public.caregiver_access;
DROP POLICY IF EXISTS "ca_delete"                    ON public.caregiver_access;
DROP POLICY IF EXISTS "Primary parent can manage access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Caregivers can view own access"   ON public.caregiver_access;

CREATE POLICY "ca_select" ON public.caregiver_access FOR SELECT
  USING (public.is_owner(dependent_id) OR caregiver_id = auth.uid());
CREATE POLICY "ca_insert" ON public.caregiver_access FOR INSERT
  WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "ca_delete" ON public.caregiver_access FOR DELETE
  USING (public.is_owner(dependent_id));

-- EVENTS
DROP POLICY IF EXISTS "events_all"                         ON public.events;
DROP POLICY IF EXISTS "Users can manage events"            ON public.events;
DROP POLICY IF EXISTS "Users can view events of their dependents" ON public.events;
DROP POLICY IF EXISTS "Users can manage events of their dependents" ON public.events;
CREATE POLICY "events_all" ON public.events FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- MEDICATIONS
DROP POLICY IF EXISTS "meds_all"                    ON public.medications;
DROP POLICY IF EXISTS "Users can manage medications" ON public.medications;
DROP POLICY IF EXISTS "Users can manage meds of their dependents" ON public.medications;
CREATE POLICY "meds_all" ON public.medications FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- MEDICATION_LOGS
DROP POLICY IF EXISTS "med_logs_all"              ON public.medication_logs;
DROP POLICY IF EXISTS "Users can manage meds logs" ON public.medication_logs;
CREATE POLICY "med_logs_all" ON public.medication_logs FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.dependents d ON m.dependent_id = d.id
    WHERE m.id = medication_id AND public.can_access(d.id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.medications m
    JOIN public.dependents d ON m.dependent_id = d.id
    WHERE m.id = medication_id AND public.is_owner(d.id)
  ));

-- DOCUMENTS
DROP POLICY IF EXISTS "docs_all"                   ON public.documents;
DROP POLICY IF EXISTS "Users can manage documents" ON public.documents;
CREATE POLICY "docs_all" ON public.documents FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- EXPENSES
DROP POLICY IF EXISTS "expenses_all"              ON public.expenses;
DROP POLICY IF EXISTS "Users can manage expenses" ON public.expenses;
CREATE POLICY "expenses_all" ON public.expenses FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- GOALS
DROP POLICY IF EXISTS "goals_all"              ON public.goals;
DROP POLICY IF EXISTS "Users can manage goals" ON public.therapeutic_goals;
CREATE POLICY "goals_all" ON public.goals FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- GOAL_NOTES
DROP POLICY IF EXISTS "goal_notes_all" ON public.goal_notes;
CREATE POLICY "goal_notes_all" ON public.goal_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id AND public.can_access(g.dependent_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id AND public.is_owner(g.dependent_id)
  ));

-- MEDICAL_RECORDS
DROP POLICY IF EXISTS "medical_all"                    ON public.medical_records;
DROP POLICY IF EXISTS "Users can manage medical records" ON public.medical_records;
CREATE POLICY "medical_all" ON public.medical_records FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- CONSULTATIONS
DROP POLICY IF EXISTS "consults_all"                   ON public.consultations;
DROP POLICY IF EXISTS "Users can manage consultations" ON public.consultations;
CREATE POLICY "consults_all" ON public.consultations FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- PROFESSIONALS
DROP POLICY IF EXISTS "profs_all"                     ON public.professionals;
DROP POLICY IF EXISTS "Users can manage professionals" ON public.professionals;
CREATE POLICY "profs_all" ON public.professionals FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- VACCINES
DROP POLICY IF EXISTS "vaccines_all"              ON public.vaccines;
DROP POLICY IF EXISTS "Users can manage vaccines" ON public.vaccines;
CREATE POLICY "vaccines_all" ON public.vaccines FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- CRISIS_EVENTS
DROP POLICY IF EXISTS "crisis_all"                    ON public.crisis_events;
DROP POLICY IF EXISTS "Users can manage crisis events" ON public.crisis_events;
CREATE POLICY "crisis_all" ON public.crisis_events FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- GROWTH_MEASUREMENTS
DROP POLICY IF EXISTS "growth_all"              ON public.growth_measurements;
DROP POLICY IF EXISTS "Users can manage growth" ON public.growth_measurements;
CREATE POLICY "growth_all" ON public.growth_measurements FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- SLEEP_LOGS
DROP POLICY IF EXISTS "sleep_all"                   ON public.sleep_logs;
DROP POLICY IF EXISTS "Users can manage sleep logs" ON public.sleep_logs;
CREATE POLICY "sleep_all" ON public.sleep_logs FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- PARENT_DIARY
DROP POLICY IF EXISTS "diary_all"                      ON public.parent_diary;
DROP POLICY IF EXISTS "Users can manage parent diary"  ON public.parent_diary;
CREATE POLICY "diary_all" ON public.parent_diary FOR ALL
  USING (public.can_access(dependent_id))
  WITH CHECK (public.is_owner(dependent_id));

-- CAREGIVER_WELLBEING (próprio usuário)
DROP POLICY IF EXISTS "wellbeing_all"                     ON public.caregiver_wellbeing;
DROP POLICY IF EXISTS "Users can manage own wellbeing"    ON public.caregiver_wellbeing;
CREATE POLICY "wellbeing_all" ON public.caregiver_wellbeing FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CAREGIVER_INVITES
DROP POLICY IF EXISTS "invites_all"              ON public.caregiver_invites;
DROP POLICY IF EXISTS "Inviter can manage invites" ON public.caregiver_invites;
CREATE POLICY "invites_all" ON public.caregiver_invites FOR ALL
  USING (public.is_owner(dependent_id)) WITH CHECK (public.is_owner(dependent_id));

-- =============================================================================
-- STORAGE: Bucket para documentos e avatares
-- =============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "doc_upload"  ON storage.objects;
DROP POLICY IF EXISTS "doc_select"  ON storage.objects;
DROP POLICY IF EXISTS "doc_delete"  ON storage.objects;
DROP POLICY IF EXISTS "avatar_upload" ON storage.objects;
DROP POLICY IF EXISTS "avatar_select" ON storage.objects;
DROP POLICY IF EXISTS "avatar_update" ON storage.objects;

CREATE POLICY "doc_upload"    ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "doc_select"    ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "doc_delete"    ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatar_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
