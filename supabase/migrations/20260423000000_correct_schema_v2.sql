-- =============================================================================
-- Conexão Terapêutica — Schema Correto (V2)
-- Alinhado com os schemas TypeScript/Zod da aplicação
-- Projeto: brrdtmzbuettqwjkzjli
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ---------------------------------------------------------------------------
-- 1. PROFILES (Pais/Responsáveis — extensão do auth.users)
-- ---------------------------------------------------------------------------
CREATE TABLE public.profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name   TEXT,
  role        TEXT NOT NULL DEFAULT 'parent',
  phone_number TEXT,
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 2. DEPENDENTS (Crianças)
-- Usa: user_id (FK para profiles), name (campo único), diagnosis
-- ---------------------------------------------------------------------------
CREATE TABLE public.dependents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  birth_date   DATE,
  diagnosis    TEXT,
  relationship TEXT,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 3. CAREGIVER_ACCESS (Compartilhamento)
-- ---------------------------------------------------------------------------
CREATE TABLE public.caregiver_access (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id  UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  caregiver_id  UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_level  TEXT DEFAULT 'viewer',
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(dependent_id, caregiver_id)
);

-- ---------------------------------------------------------------------------
-- 4. EVENTS (Agenda)
-- ---------------------------------------------------------------------------
CREATE TABLE public.events (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  event_type   TEXT DEFAULT 'Outro',
  description  TEXT,
  pre_notes    TEXT,
  start_time   TIMESTAMPTZ NOT NULL,
  end_time     TIMESTAMPTZ,
  location     TEXT,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 5. MEDICATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE public.medications (
  id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id     UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  name             TEXT NOT NULL,
  dosage           TEXT,
  frequency_desc   TEXT,
  is_active        BOOLEAN DEFAULT true,
  stock_count      INTEGER,
  stock_alert_at   INTEGER,
  reminder_times   TEXT[] DEFAULT '{}',
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 6. MEDICATION_LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE public.medication_logs (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  taken_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  status        TEXT DEFAULT 'taken' CHECK (status IN ('taken','missed','late')),
  notes         TEXT,
  created_at    TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 7. DOCUMENTS (Cofre digital)
-- ---------------------------------------------------------------------------
CREATE TABLE public.documents (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  category     TEXT,
  file_path    TEXT NOT NULL,
  uploaded_by  UUID REFERENCES public.profiles(id),
  uploaded_at  TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 8. EXPENSES
-- ---------------------------------------------------------------------------
CREATE TABLE public.expenses (
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

-- ---------------------------------------------------------------------------
-- 9. GOALS (Metas terapêuticas)
-- ---------------------------------------------------------------------------
CREATE TABLE public.goals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  title        TEXT NOT NULL,
  description  TEXT,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','in_progress','achieved','abandoned')),
  target_date  DATE,
  achieved_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE public.goal_notes (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  goal_id    UUID NOT NULL REFERENCES public.goals(id) ON DELETE CASCADE,
  note       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 10. CONSULTATIONS
-- ---------------------------------------------------------------------------
CREATE TABLE public.consultations (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id      UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  professional_id   UUID,
  date              DATE NOT NULL,
  specialty         TEXT NOT NULL,
  physician_name    TEXT,
  cid_code          TEXT,
  notes             TEXT,
  next_appointment  DATE,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 11. PROFESSIONALS
-- ---------------------------------------------------------------------------
CREATE TABLE public.professionals (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  specialty    TEXT NOT NULL,
  clinic       TEXT,
  phone        TEXT,
  email        TEXT,
  address      TEXT,
  notes        TEXT,
  is_primary   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 12. VACCINES
-- ---------------------------------------------------------------------------
CREATE TABLE public.vaccines (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id   UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  name           TEXT NOT NULL,
  applied_date   DATE,
  next_dose_date DATE,
  dose_number    INTEGER DEFAULT 1,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 13. CRISIS_EVENTS
-- ---------------------------------------------------------------------------
CREATE TABLE public.crisis_events (
  id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id      UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  date              DATE NOT NULL,
  time              TEXT,
  duration_minutes  INTEGER,
  severity          INTEGER CHECK (severity BETWEEN 1 AND 5),
  triggers          TEXT,
  symptoms          TEXT,
  post_symptoms     TEXT,
  medication_used   TEXT,
  context           TEXT,
  created_at        TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 14. GROWTH_MEASUREMENTS
-- ---------------------------------------------------------------------------
CREATE TABLE public.growth_measurements (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  weight_kg    NUMERIC(5,2),
  height_cm    NUMERIC(5,2),
  head_cm      NUMERIC(5,2),
  notes        TEXT,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 15. SLEEP_LOGS
-- ---------------------------------------------------------------------------
CREATE TABLE public.sleep_logs (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id   UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  date           DATE NOT NULL,
  sleep_time     TEXT,
  wake_time      TEXT,
  duration_hours NUMERIC(4,2),
  quality        INTEGER CHECK (quality BETWEEN 1 AND 5),
  awakenings     INTEGER DEFAULT 0,
  notes          TEXT,
  created_at     TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 16. PARENT_DIARY
-- ---------------------------------------------------------------------------
CREATE TABLE public.parent_diary (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  date         DATE NOT NULL,
  mood         TEXT NOT NULL,
  content      TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 17. CAREGIVER_WELLBEING
-- ---------------------------------------------------------------------------
CREATE TABLE public.caregiver_wellbeing (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  date       DATE NOT NULL,
  mood       TEXT NOT NULL,
  notes      TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 18. MEDICAL_RECORDS (Prontuário do dependente)
-- ---------------------------------------------------------------------------
CREATE TABLE public.medical_records (
  id                     UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id           UUID NOT NULL UNIQUE REFERENCES public.dependents(id) ON DELETE CASCADE,
  blood_type             TEXT,
  health_plan            TEXT,
  health_plan_number     TEXT,
  allergies              TEXT,
  primary_physician_name TEXT,
  primary_physician_phone TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  notes                  TEXT,
  updated_at             TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ---------------------------------------------------------------------------
-- 19. CAREGIVER_INVITES (Convites pendentes)
-- ---------------------------------------------------------------------------
CREATE TABLE public.caregiver_invites (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dependent_id UUID NOT NULL REFERENCES public.dependents(id) ON DELETE CASCADE,
  invited_by   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  email        TEXT NOT NULL,
  status       TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined')),
  created_at   TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =============================================================================
-- TRIGGER: Auto-criar profile quando usuário se registra
-- =============================================================================
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
  );
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================================================
-- RLS — Row Level Security
-- =============================================================================
ALTER TABLE public.profiles          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependents         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_access   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goals              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_notes         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccines           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crisis_events      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.growth_measurements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sleep_logs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_diary       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_wellbeing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_invites  ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- SECURITY DEFINER helpers (evitam recursão infinita no RLS)
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
-- POLICIES
-- =============================================================================

-- PROFILES
CREATE POLICY "profiles_select" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "profiles_delete" ON public.profiles FOR DELETE USING (auth.uid() = id);

-- DEPENDENTS
CREATE POLICY "dependents_select" ON public.dependents FOR SELECT USING (public.can_access(id));
CREATE POLICY "dependents_insert" ON public.dependents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dependents_update" ON public.dependents FOR UPDATE USING (public.is_owner(id));
CREATE POLICY "dependents_delete" ON public.dependents FOR DELETE USING (public.is_owner(id));

-- CAREGIVER_ACCESS
CREATE POLICY "access_select" ON public.caregiver_access FOR SELECT USING (public.is_owner(dependent_id) OR caregiver_id = auth.uid());
CREATE POLICY "access_insert" ON public.caregiver_access FOR INSERT WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "access_delete" ON public.caregiver_access FOR DELETE USING (public.is_owner(dependent_id));

-- Generic policy for dependent-linked tables
CREATE POLICY "events_all"      ON public.events              FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "meds_all"        ON public.medications         FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "docs_all"        ON public.documents           FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "expenses_all"    ON public.expenses            FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "goals_all"       ON public.goals               FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "consults_all"    ON public.consultations       FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "profs_all"       ON public.professionals       FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "vaccines_all"    ON public.vaccines            FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "crisis_all"      ON public.crisis_events       FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "growth_all"      ON public.growth_measurements FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "sleep_all"       ON public.sleep_logs          FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "diary_all"       ON public.parent_diary        FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "medical_all"     ON public.medical_records     FOR ALL USING (public.can_access(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "invites_all"     ON public.caregiver_invites   FOR ALL USING (public.is_owner(dependent_id)) WITH CHECK (public.is_owner(dependent_id));

-- MEDICATION_LOGS (sem dependent_id direto — via medications)
CREATE POLICY "med_logs_all"    ON public.medication_logs FOR ALL
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

-- GOAL_NOTES (sem dependent_id direto — via goals)
CREATE POLICY "goal_notes_all" ON public.goal_notes FOR ALL
  USING (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id AND public.can_access(g.dependent_id)
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.goals g WHERE g.id = goal_id AND public.is_owner(g.dependent_id)
  ));

-- CAREGIVER_WELLBEING (próprio usuário)
CREATE POLICY "wellbeing_all" ON public.caregiver_wellbeing FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- STORAGE: Bucket para documentos e avatares
-- =============================================================================
INSERT INTO storage.buckets (id, name, public) VALUES ('documents', 'documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT DO NOTHING;

CREATE POLICY "doc_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "doc_select" ON storage.objects FOR SELECT USING (bucket_id = 'documents' AND auth.role() = 'authenticated');
CREATE POLICY "doc_delete" ON storage.objects FOR DELETE USING (bucket_id = 'documents' AND auth.role() = 'authenticated');

CREATE POLICY "avatar_upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.role() = 'authenticated');
CREATE POLICY "avatar_select" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatar_update" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
