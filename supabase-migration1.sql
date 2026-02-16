-- Supabase pgvector Migration for SalesAgent RAG
-- Run this in the Supabase SQL Editor

-- 1. Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Table: SALES_corpora
CREATE TABLE IF NOT EXISTS "SALES_corpora" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Table: SALES_documents
CREATE TABLE IF NOT EXISTS "SALES_documents" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  corpus_id UUID NOT NULL REFERENCES "SALES_corpora"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  status TEXT DEFAULT 'ACTIVE',
  storage_path TEXT,
  mime_type TEXT,
  file_size BIGINT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Table: SALES_chunks
CREATE TABLE IF NOT EXISTS "SALES_chunks" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES "SALES_documents"(id) ON DELETE CASCADE,
  corpus_id UUID NOT NULL REFERENCES "SALES_corpora"(id) ON DELETE CASCADE,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Index for faster similarity search
CREATE INDEX IF NOT EXISTS idx_sales_chunks_embedding
  ON "SALES_chunks"
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

CREATE INDEX IF NOT EXISTS idx_sales_chunks_corpus_id
  ON "SALES_chunks" (corpus_id);

CREATE INDEX IF NOT EXISTS idx_sales_documents_corpus_id
  ON "SALES_documents" (corpus_id);

-- 6. RPC function: SALES_match_chunks (cosine similarity search)
CREATE OR REPLACE FUNCTION "SALES_match_chunks"(
  query_embedding vector(1536),
  match_corpus_id UUID,
  match_count INT DEFAULT 5
)
RETURNS TABLE (
  id UUID,
  document_id UUID,
  corpus_id UUID,
  chunk_index INTEGER,
  content TEXT,
  metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.document_id,
    c.corpus_id,
    c.chunk_index,
    c.content,
    c.metadata,
    1 - (c.embedding <=> query_embedding) AS similarity
  FROM "SALES_chunks" c
  WHERE c.corpus_id = match_corpus_id
    AND c.embedding IS NOT NULL
  ORDER BY c.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- 7. Storage bucket (run via Supabase Dashboard or use the SQL below)
-- Note: Storage bucket creation via SQL may require superuser privileges.
-- If this fails, create the bucket manually in the Supabase Dashboard:
--   Name: sales-documents, Public: false, File size limit: 20MB
--   Allowed MIME types: application/pdf, application/vnd.openxmlformats-officedocument.wordprocessingml.document, text/plain

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'sales-documents',
  'sales-documents',
  false,
  20971520,
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- Open storage policy (no RLS, service role access)
CREATE POLICY "Service role full access" ON storage.objects
  FOR ALL
  USING (bucket_id = 'sales-documents')
  WITH CHECK (bucket_id = 'sales-documents');
