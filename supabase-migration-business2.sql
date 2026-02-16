-- Supabase Business Tables Migration for SalesAgent
-- Run this in the Supabase SQL Editor AFTER the RAG migration (supabase-migration.sql)

-- ============================================================
-- 1. SALES_customers
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_customers" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  industry TEXT,
  contact_person TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  contact_phone TEXT,
  address JSONB,
  website TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 2. SALES_customer_appointments
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_customer_appointments" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES "SALES_customers"(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL DEFAULT 'meeting',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_customer_appointments_customer
  ON "SALES_customer_appointments" (customer_id);

-- ============================================================
-- 3. SALES_projects
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_projects" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  customer TEXT NOT NULL,
  customer_id UUID REFERENCES "SALES_customers"(id) ON DELETE SET NULL,
  description TEXT,
  deadline TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'active',
  current_step TEXT NOT NULL DEFAULT 'rfp_received',
  created_by TEXT NOT NULL DEFAULT 'system',
  team_members TEXT[] DEFAULT '{}',
  proposal_value NUMERIC,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_status
  ON "SALES_projects" (status);

CREATE INDEX IF NOT EXISTS idx_projects_customer_id
  ON "SALES_projects" (customer_id);

-- ============================================================
-- 4. SALES_project_documents
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_project_documents" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "SALES_projects"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'other',
  mime_type TEXT,
  url TEXT,
  storage_path TEXT,
  size BIGINT,
  uploaded_by TEXT NOT NULL DEFAULT 'system',
  rag_document_id UUID REFERENCES "SALES_documents"(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_project_documents_project
  ON "SALES_project_documents" (project_id);

-- ============================================================
-- 5. SALES_rfp_analyses
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_rfp_analyses" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "SALES_projects"(id) ON DELETE CASCADE,
  document_id TEXT NOT NULL,
  summary TEXT NOT NULL,
  requirements JSONB NOT NULL DEFAULT '[]',
  deadlines JSONB NOT NULL DEFAULT '[]',
  budget_hints JSONB NOT NULL DEFAULT '[]',
  gaps JSONB NOT NULL DEFAULT '[]',
  match_score INTEGER NOT NULL DEFAULT 0,
  recommended_resources JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rfp_analyses_project
  ON "SALES_rfp_analyses" (project_id);

-- ============================================================
-- 6. SALES_questions
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_questions" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "SALES_projects"(id) ON DELETE CASCADE,
  persona TEXT NOT NULL DEFAULT 'sales',
  question TEXT NOT NULL,
  reasoning TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium',
  answer TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_questions_project
  ON "SALES_questions" (project_id);

-- ============================================================
-- 7. SALES_meetings
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_meetings" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "SALES_projects"(id) ON DELETE CASCADE,
  date TIMESTAMPTZ,
  agenda JSONB NOT NULL DEFAULT '[]',
  notes TEXT,
  insights JSONB DEFAULT '[]',
  action_items JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_meetings_project
  ON "SALES_meetings" (project_id);

-- ============================================================
-- 8. SALES_proposals
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_proposals" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "SALES_projects"(id) ON DELETE CASCADE,
  template_id TEXT,
  chapters JSONB NOT NULL DEFAULT '[]',
  status TEXT NOT NULL DEFAULT 'draft',
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proposals_project
  ON "SALES_proposals" (project_id);

-- ============================================================
-- 9. SALES_calculations
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_calculations" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES "SALES_projects"(id) ON DELETE CASCADE,
  resources JSONB NOT NULL DEFAULT '[]',
  project_start TEXT,
  project_end TEXT,
  overhead_percent NUMERIC NOT NULL DEFAULT 0,
  margin_percent NUMERIC NOT NULL DEFAULT 0,
  discount_percent NUMERIC NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_calculations_project
  ON "SALES_calculations" (project_id);

-- ============================================================
-- 10. SALES_employees
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_employees" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  position TEXT NOT NULL,
  department TEXT,
  skills JSONB NOT NULL DEFAULT '[]',
  certifications JSONB NOT NULL DEFAULT '[]',
  project_experience JSONB NOT NULL DEFAULT '[]',
  availability TEXT NOT NULL DEFAULT 'available',
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 11. SALES_references
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_references" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES "SALES_customers"(id) ON DELETE CASCADE,
  customer_name TEXT NOT NULL,
  project_title TEXT NOT NULL,
  description TEXT NOT NULL,
  industry TEXT,
  technologies JSONB DEFAULT '[]',
  project_duration TEXT,
  project_value NUMERIC,
  completion_date TIMESTAMPTZ,
  contact_person TEXT,
  testimonial TEXT,
  is_public BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_references_customer
  ON "SALES_references" (customer_id);

-- ============================================================
-- 12. SALES_notifications
-- ============================================================
CREATE TABLE IF NOT EXISTS "SALES_notifications" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES "SALES_projects"(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'task_assigned',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- updated_at triggers
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'SALES_customers',
    'SALES_projects',
    'SALES_meetings',
    'SALES_proposals',
    'SALES_calculations',
    'SALES_employees',
    'SALES_references'
  ]
  LOOP
    EXECUTE format(
      'CREATE OR REPLACE TRIGGER %I
       BEFORE UPDATE ON %I
       FOR EACH ROW
       EXECUTE FUNCTION update_updated_at_column()',
      'trigger_updated_at_' || tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- Disable RLS on all business tables (no auth)
-- ============================================================
DO $$
DECLARE
  tbl TEXT;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'SALES_customers',
    'SALES_customer_appointments',
    'SALES_projects',
    'SALES_project_documents',
    'SALES_rfp_analyses',
    'SALES_questions',
    'SALES_meetings',
    'SALES_proposals',
    'SALES_calculations',
    'SALES_employees',
    'SALES_references',
    'SALES_notifications'
  ]
  LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY', tbl);
  END LOOP;
END;
$$;
