/**
 * Supabase pgvector RAG Client
 *
 * Provides integration with Supabase (pgvector) for
 * document ingestion, semantic search, and context retrieval.
 * Uses Adesso AI Hub (OpenAI-compatible) for embeddings.
 */

import { getSupabaseClient } from './supabase';
import { chunkText } from './ai';

// ============================================
// Types
// ============================================

export interface SupabaseRAGConfig {
  embeddingApiUrl: string;
  embeddingApiKey: string;
  embeddingModel: string;
  chunkSize: number;
  chunkOverlap: number;
}

export interface Corpus {
  name: string;
  displayName: string;
  description?: string;
  createTime?: string;
  updateTime?: string;
}

export interface CreateCorpusRequest {
  displayName: string;
  description?: string;
}

export interface RagDocument {
  name: string;
  displayName: string;
  createTime?: string;
  updateTime?: string;
  status?: 'PENDING' | 'ACTIVE' | 'ERROR';
}

export interface IngestDocumentRequest {
  corpusName: string;
  content: string;
  displayName: string;
  metadata?: Record<string, string>;
}

export interface SearchRequest {
  corpusName: string;
  query: string;
  topK?: number;
  filter?: Record<string, string>;
}

export interface SearchResult {
  chunk: {
    id: string;
    content: string;
    documentName: string;
    metadata?: Record<string, unknown>;
  };
  score: number;
}

export interface RetrieveContextRequest {
  corpusName: string;
  query: string;
  maxChunks?: number;
  minScore?: number;
}

export interface EmbeddingResponse {
  embedding: number[];
  tokenCount: number;
}

// ============================================
// Embedding Function (Adesso AI Hub / OpenAI-compatible)
// ============================================

async function fetchEmbeddings(
  texts: string[],
  apiUrl: string,
  apiKey: string,
  model: string
): Promise<number[][]> {
  const response = await fetch(`${apiUrl}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: texts,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Embedding API error (${response.status}): ${error}`);
  }

  const data = await response.json();
  return data.data
    .sort((a: { index: number }, b: { index: number }) => a.index - b.index)
    .map((item: { embedding: number[] }) => item.embedding);
}

// ============================================
// Supabase RAG Client
// ============================================

export class SupabaseRAGClient {
  private config: SupabaseRAGConfig;

  constructor(config?: Partial<SupabaseRAGConfig>) {
    this.config = {
      embeddingApiUrl: config?.embeddingApiUrl || process.env.EMBEDDING_API_URL || 'https://adesso-ai-hub.3asabc.de/v1',
      embeddingApiKey: config?.embeddingApiKey || process.env.EMBEDDING_API_KEY || '',
      embeddingModel: config?.embeddingModel || process.env.EMBEDDING_MODEL || 'text-embedding-3-large',
      chunkSize: config?.chunkSize || parseInt(process.env.CHROMA_CHUNK_SIZE || '1024'),
      chunkOverlap: config?.chunkOverlap || parseInt(process.env.CHROMA_CHUNK_OVERLAP || '200'),
    };

    if (!this.config.embeddingApiKey) {
      console.warn('EMBEDDING_API_KEY not set. Embedding operations will fail.');
    }
  }

  // ============================================
  // Embeddings
  // ============================================

  private async embed(texts: string[]): Promise<number[][]> {
    return fetchEmbeddings(
      texts,
      this.config.embeddingApiUrl,
      this.config.embeddingApiKey,
      this.config.embeddingModel
    );
  }

  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const [embedding] = await this.embed([text]);
    return { embedding, tokenCount: 0 };
  }

  async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    const embeddings = await this.embed(texts);
    return embeddings.map(embedding => ({ embedding, tokenCount: 0 }));
  }

  // ============================================
  // Corpus Management
  // ============================================

  async createCorpus(request: CreateCorpusRequest): Promise<Corpus> {
    const supabase = getSupabaseClient();

    // Upsert: if a corpus with this name already exists, return it
    const { data, error } = await supabase
      .from('SALES_corpora')
      .upsert(
        {
          name: request.displayName,
          display_name: request.displayName,
          description: request.description || '',
        },
        { onConflict: 'name' }
      )
      .select()
      .single();

    if (error) throw new Error(`Failed to create corpus: ${error.message}`);

    return {
      name: data.id,
      displayName: data.display_name,
      description: data.description,
      createTime: data.created_at,
      updateTime: data.updated_at,
    };
  }

  async getCorpus(corpusName: string): Promise<Corpus> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('SALES_corpora')
      .select()
      .eq('name', corpusName)
      .single();

    if (error) throw new Error(`Corpus not found: ${error.message}`);

    return {
      name: data.id,
      displayName: data.display_name,
      description: data.description,
      createTime: data.created_at,
      updateTime: data.updated_at,
    };
  }

  async listCorpora(): Promise<Corpus[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
      .from('SALES_corpora')
      .select()
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list corpora: ${error.message}`);

    return (data || []).map(c => ({
      name: c.id,
      displayName: c.display_name,
      description: c.description,
      createTime: c.created_at,
      updateTime: c.updated_at,
    }));
  }

  async deleteCorpus(corpusName: string): Promise<void> {
    const supabase = getSupabaseClient();

    // corpusName here is the display_name (used as the unique `name` column)
    const { data: corpus, error: findError } = await supabase
      .from('SALES_corpora')
      .select('id, name')
      .eq('name', corpusName)
      .single();

    if (findError) throw new Error(`Corpus not found: ${findError.message}`);

    // Remove storage folder for this corpus
    try {
      const folderPath = `SALES_${corpus.name}`;
      const { data: files } = await supabase.storage
        .from('sales-documents')
        .list(folderPath);

      if (files && files.length > 0) {
        const filePaths = files.map(f => `${folderPath}/${f.name}`);
        await supabase.storage.from('sales-documents').remove(filePaths);
      }
    } catch {
      // Storage cleanup is best-effort
    }

    // Delete corpus (cascades to documents and chunks)
    const { error } = await supabase
      .from('SALES_corpora')
      .delete()
      .eq('id', corpus.id);

    if (error) throw new Error(`Failed to delete corpus: ${error.message}`);
  }

  // ============================================
  // Document Management
  // ============================================

  async ingestDocument(request: IngestDocumentRequest): Promise<RagDocument> {
    const supabase = getSupabaseClient();

    // Resolve corpus ID from name
    const { data: corpus, error: corpusError } = await supabase
      .from('SALES_corpora')
      .select('id')
      .eq('name', request.corpusName)
      .single();

    if (corpusError) throw new Error(`Corpus not found: ${corpusError.message}`);

    const chunks = chunkText(
      request.content,
      this.config.chunkSize,
      this.config.chunkOverlap
    );

    if (chunks.length === 0) {
      throw new Error('Document produced no text chunks');
    }

    // Generate embeddings in batches to avoid API limits
    const BATCH_SIZE = 50;
    const embeddings: number[][] = [];
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchEmbeddings = await this.embed(batch);
      embeddings.push(...batchEmbeddings);
    }

    if (embeddings.length !== chunks.length) {
      throw new Error(`Embedding count mismatch: got ${embeddings.length} embeddings for ${chunks.length} chunks`);
    }

    const docId = `doc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Insert document record
    const { data: docData, error: docError } = await supabase
      .from('SALES_documents')
      .insert({
        corpus_id: corpus.id,
        name: docId,
        display_name: request.displayName,
        status: 'ACTIVE',
        metadata: request.metadata || {},
      })
      .select()
      .single();

    if (docError) throw new Error(`Failed to insert document: ${docError.message}`);

    // Insert chunks with embeddings
    const chunkRows = chunks.map((content, i) => ({
      document_id: docData.id,
      corpus_id: corpus.id,
      chunk_index: i,
      content,
      embedding: JSON.stringify(embeddings[i]),
      metadata: {
        documentName: request.displayName,
        chunkIndex: String(i),
        totalChunks: String(chunks.length),
        ...request.metadata,
      },
    }));

    const { error: chunkError } = await supabase
      .from('SALES_chunks')
      .insert(chunkRows);

    if (chunkError) throw new Error(`Failed to insert chunks: ${chunkError.message}`);

    return {
      name: docData.id,
      displayName: request.displayName,
      status: 'ACTIVE',
      createTime: docData.created_at,
    };
  }

  async listDocuments(corpusName: string): Promise<RagDocument[]> {
    const supabase = getSupabaseClient();

    // Resolve corpus ID
    const { data: corpus, error: corpusError } = await supabase
      .from('SALES_corpora')
      .select('id')
      .eq('name', corpusName)
      .single();

    if (corpusError) return [];

    const { data, error } = await supabase
      .from('SALES_documents')
      .select()
      .eq('corpus_id', corpus.id)
      .order('created_at', { ascending: false });

    if (error) throw new Error(`Failed to list documents: ${error.message}`);

    return (data || []).map(doc => ({
      name: doc.id,
      displayName: doc.display_name,
      status: doc.status as RagDocument['status'],
      createTime: doc.created_at,
      updateTime: doc.updated_at,
    }));
  }

  async deleteDocument(documentId: string): Promise<void> {
    const supabase = getSupabaseClient();

    // Get doc info for storage cleanup
    const { data: doc } = await supabase
      .from('SALES_documents')
      .select('id, storage_path')
      .eq('id', documentId)
      .single();

    if (doc?.storage_path) {
      try {
        await supabase.storage
          .from('sales-documents')
          .remove([doc.storage_path]);
      } catch {
        // Storage cleanup is best-effort
      }
    }

    // Delete document (cascades to chunks)
    const { error } = await supabase
      .from('SALES_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw new Error(`Failed to delete document: ${error.message}`);
  }

  // ============================================
  // Search & Retrieval
  // ============================================

  async search(request: SearchRequest): Promise<SearchResult[]> {
    const supabase = getSupabaseClient();

    // Resolve corpus ID
    const { data: corpus, error: corpusError } = await supabase
      .from('SALES_corpora')
      .select('id')
      .eq('name', request.corpusName)
      .single();

    if (corpusError) return [];

    // Generate query embedding
    const [queryEmbedding] = await this.embed([request.query]);

    // Call the RPC function for cosine similarity search
    const { data, error } = await supabase.rpc('SALES_match_chunks', {
      query_embedding: JSON.stringify(queryEmbedding),
      match_corpus_id: corpus.id,
      match_count: request.topK || 5,
    });

    if (error) throw new Error(`Search failed: ${error.message}`);

    if (!data || data.length === 0) return [];

    // Look up document display names
    const docIds = [...new Set(data.map((r: { document_id: string }) => r.document_id))];
    const { data: docs } = await supabase
      .from('SALES_documents')
      .select('id, display_name')
      .in('id', docIds);

    const docNameMap: Record<string, string> = {};
    for (const doc of docs || []) {
      docNameMap[doc.id] = doc.display_name;
    }

    return data.map((row: {
      id: string;
      document_id: string;
      content: string;
      metadata: Record<string, unknown>;
      similarity: number;
    }) => ({
      chunk: {
        id: row.id,
        content: row.content,
        documentName: docNameMap[row.document_id] || 'unknown',
        metadata: row.metadata,
      },
      score: row.similarity,
    }));
  }

  async getRelevantContext(request: RetrieveContextRequest): Promise<string> {
    const results = await this.search({
      corpusName: request.corpusName,
      query: request.query,
      topK: request.maxChunks || 3,
    });

    const filtered = request.minScore
      ? results.filter(r => r.score >= request.minScore!)
      : results;

    if (filtered.length === 0) {
      return '';
    }

    const contextParts = filtered.map((result, index) => {
      return `[Source ${index + 1}] (Relevance: ${(result.score * 100).toFixed(1)}%)\n${result.chunk.content}`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  // ============================================
  // Collection Stats
  // ============================================

  async getCollectionCount(corpusName: string): Promise<number> {
    const supabase = getSupabaseClient();

    const { data: corpus, error: corpusError } = await supabase
      .from('SALES_corpora')
      .select('id')
      .eq('name', corpusName)
      .single();

    if (corpusError) return 0;

    const { count, error } = await supabase
      .from('SALES_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('corpus_id', corpus.id);

    if (error) return 0;

    return count || 0;
  }

  // ============================================
  // Utility Methods
  // ============================================

  isConfigured(): boolean {
    return Boolean(
      this.config.embeddingApiKey &&
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }

  getConfig(): SupabaseRAGConfig {
    return { ...this.config };
  }

  buildCorpusName(corpusId: string): string {
    return corpusId;
  }
}

// ============================================
// Singleton & Helpers
// ============================================

let ragClientInstance: SupabaseRAGClient | null = null;

export function getRAGClient(): SupabaseRAGClient {
  if (!ragClientInstance) {
    ragClientInstance = new SupabaseRAGClient();
  }
  return ragClientInstance;
}

export function getProjectCorpusDisplayName(projectId: string): string {
  return `salesagent-project-${projectId}`;
}
