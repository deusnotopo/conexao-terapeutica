-- =============================================================================
-- Migration: Alinhamento completo do schema existente com o app TypeScript
-- Ordem: colunas primeiro, depois funções/policies
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. DEPENDENTS: adicionar user_id e name
-- ---------------------------------------------------------------------------
ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS user_id UUID;
UPDATE public.dependents SET user_id = primary_user_id WHERE user_id IS NULL;
ALTER TABLE public.dependents DROP CONSTRAINT IF EXISTS dependents_user_id_fkey;
ALTER TABLE public.dependents ADD CONSTRAINT dependents_user_id_fkey
  FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.dependents ALTER COLUMN user_id SET NOT NULL;

ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS name TEXT;
UPDATE public.dependents
  SET name = TRIM(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
  WHERE name IS NULL OR name = '';
ALTER TABLE public.dependents ALTER COLUMN name SET NOT NULL;

ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS diagnosis TEXT;
ALTER TABLE public.dependents ADD COLUMN IF NOT EXISTS relationship TEXT;

-- ---------------------------------------------------------------------------
-- 2. CAREGIVER_ACCESS: adicionar caregiver_id (coluna nova, alias de user_id)
-- DEVE vir antes dos helpers que referenciam caregiver_id
-- ---------------------------------------------------------------------------
ALTER TABLE public.caregiver_access ADD COLUMN IF NOT EXISTS caregiver_id UUID;
UPDATE public.caregiver_access
  SET caregiver_id = user_id
  WHERE caregiver_id IS NULL;
ALTER TABLE public.caregiver_access ALTER COLUMN caregiver_id SET NOT NULL;
ALTER TABLE public.caregiver_access DROP CONSTRAINT IF EXISTS caregiver_access_caregiver_id_fkey;
ALTER TABLE public.caregiver_access ADD CONSTRAINT caregiver_access_caregiver_id_fkey
  FOREIGN KEY (caregiver_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
ALTER TABLE public.caregiver_access DROP CONSTRAINT IF EXISTS caregiver_access_dependent_id_caregiver_id_key;
ALTER TABLE public.caregiver_access ADD CONSTRAINT caregiver_access_dependent_id_caregiver_id_key
  UNIQUE (dependent_id, caregiver_id);

-- ---------------------------------------------------------------------------
-- 3. PROFILES: garantir colunas extras
-- ---------------------------------------------------------------------------
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- ---------------------------------------------------------------------------
-- 4. SECURITY DEFINER helpers (agora que user_id e caregiver_id existem)
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- 5. RLS: Dependents
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Users can insert own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Users can update own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Users can delete own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can view own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can insert own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can update own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Primary users can delete own dependents" ON public.dependents;
DROP POLICY IF EXISTS "Caregivers can view shared dependents" ON public.dependents;
DROP POLICY IF EXISTS "dep_select" ON public.dependents;
DROP POLICY IF EXISTS "dep_insert" ON public.dependents;
DROP POLICY IF EXISTS "dep_update" ON public.dependents;
DROP POLICY IF EXISTS "dep_delete" ON public.dependents;

CREATE POLICY "dep_select" ON public.dependents FOR SELECT USING (public.can_access(id));
CREATE POLICY "dep_insert" ON public.dependents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "dep_update" ON public.dependents FOR UPDATE USING (public.is_owner(id)) WITH CHECK (public.is_owner(id));
CREATE POLICY "dep_delete" ON public.dependents FOR DELETE USING (public.is_owner(id));

-- ---------------------------------------------------------------------------
-- 6. RLS: Caregiver Access
-- ---------------------------------------------------------------------------
DROP POLICY IF EXISTS "Primary parent can manage access" ON public.caregiver_access;
DROP POLICY IF EXISTS "Caregivers can view own access" ON public.caregiver_access;
DROP POLICY IF EXISTS "ca_select" ON public.caregiver_access;
DROP POLICY IF EXISTS "ca_insert" ON public.caregiver_access;
DROP POLICY IF EXISTS "ca_delete" ON public.caregiver_access;

CREATE POLICY "ca_select" ON public.caregiver_access FOR SELECT
  USING (public.is_owner(dependent_id) OR caregiver_id = auth.uid());
CREATE POLICY "ca_insert" ON public.caregiver_access FOR INSERT
  WITH CHECK (public.is_owner(dependent_id));
CREATE POLICY "ca_delete" ON public.caregiver_access FOR DELETE
  USING (public.is_owner(dependent_id));

-- ---------------------------------------------------------------------------
-- 7. Trigger: auto-criar profile ao registrar
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 8. Tabela extra: caregiver_invites
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
DROP POLICY IF EXISTS "invites_all" ON public.caregiver_invites;
CREATE POLICY "invites_all" ON public.caregiver_invites FOR ALL
  USING (public.is_owner(dependent_id)) WITH CHECK (public.is_owner(dependent_id));
