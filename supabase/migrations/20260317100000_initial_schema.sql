-- Esquema de Banco de Dados: Conexão Terapêutica
-- Banco de Dados: PostgreSQL (Supabase)

-- Hibilitar a extensão uuid-ossp se necessário (no Supabase geralmente já vem habilitada)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABELA DE PERFIS DE USUÁRIO (Extensão do auth.users do Supabase)
-- Armazena dados adicionais dos pais/responsáveis e terapeutas
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  role VARCHAR(50) NOT NULL DEFAULT 'parent', -- 'parent', 'therapist', 'admin'
  full_name VARCHAR(255) NOT NULL,
  phone_number VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABELA DE DEPENDENTES (Crianças pacientes da clínica)
CREATE TABLE public.dependents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  primary_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birth_date DATE NOT NULL,
  diagnosis TEXT, -- TEA, Paralisia Cerebral, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABELA DE ACESSO COMPARTILHADO (Para convidar cônjuges, avós, etc.)
CREATE TABLE public.caregiver_access (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  access_level VARCHAR(50) DEFAULT 'viewer', -- 'viewer', 'editor'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(dependent_id, user_id)
);

-- 4. TABELA DE AGENDA / EVENTOS (Equoterapia, Médico, etc.)
CREATE TABLE public.events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(200) NOT NULL,
  event_type VARCHAR(100), -- 'Equoterapia', 'Fisioterapia', 'Pediatra'
  description TEXT,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  location VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABELA DE MEDICAMENTOS (Para envio de notificações)
CREATE TABLE public.medications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100),
  frequency_desc TEXT, -- Ex: "A cada 8 horas"
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABELA DE LOGS DE MEDICAMENTOS (Para checar se tomou ou não)
CREATE TABLE public.medication_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  medication_id UUID REFERENCES public.medications(id) ON DELETE CASCADE NOT NULL,
  scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
  taken_at TIMESTAMP WITH TIME ZONE,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'taken', 'skipped'
  notes TEXT
);

-- 7. TABELA DE PRONTUÁRIOS/EVOLUÇÃO (Preenchido por Terapeutas, visível aos Pais)
CREATE TABLE public.therapy_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  therapist_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_date DATE NOT NULL,
  content TEXT NOT NULL,
  progress_rating INTEGER CHECK (progress_rating >= 1 AND progress_rating <= 5),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TABELA DE DOCUMENTOS (Cofre digital) - Metadata dos arquivos do Storage
CREATE TABLE public.documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  dependent_id UUID REFERENCES public.dependents(id) ON DELETE CASCADE NOT NULL,
  title VARCHAR(255) NOT NULL,
  category VARCHAR(100), -- 'Laudo', 'Receita', 'Exame'
  file_path TEXT NOT NULL, -- Caminho no Supabase Storage
  uploaded_by UUID REFERENCES public.profiles(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-------------------------------------------------------------------
-- SEGURANÇA: ROW LEVEL SECURITY (RLS)
-------------------------------------------------------------------

-- Habilitar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caregiver_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS

-- PROFILES
-- Usuário pode ver e atualizar seu próprio perfil
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- DEPENDENTS
-- Usuário pode ver seus dependentes (pai principal)
CREATE POLICY "Primary users can view own dependents" ON public.dependents FOR SELECT USING (auth.uid() = primary_user_id);
-- Usuário pode ver dependentes que lhe foram compartilhados
CREATE POLICY "Caregivers can view shared dependents" ON public.dependents FOR SELECT 
  USING (EXISTS (SELECT 1 FROM public.caregiver_access WHERE dependent_id = dependents.id AND user_id = auth.uid()));

-- CAREGIVER_ACCESS
CREATE POLICY "Primary parent can manage access" ON public.caregiver_access FOR ALL
  USING (EXISTS (SELECT 1 FROM public.dependents WHERE id = caregiver_access.dependent_id AND primary_user_id = auth.uid()));

-- Outras tabelas relacionadas ao dependente (Events, Medications, Notes, Documents)
-- Vamos criar uma policy padrão: Se você pode ver o dependente, você pode ver seus dados associados.

-- EVENTS
CREATE POLICY "Users can view events of their dependents" ON public.events FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.dependents WHERE id = events.dependent_id AND primary_user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.caregiver_access WHERE dependent_id = events.dependent_id AND user_id = auth.uid())
  );

-- O ideal é replicar essa lógica genérica em uma App Role/Função no Postgres para performance, 
-- mas isso define o comportamento fundamental da LGPD no app.
