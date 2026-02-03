/**
 * Vertex AI RAG Engine Client
 *
 * Provides integration with Google Cloud Vertex AI RAG Engine for
 * document ingestion, semantic search, and context retrieval.
 */

// Types for Vertex AI RAG
export interface VertexRAGConfig {
  projectId: string;
  location: string;
  embeddingModel?: string;
  chunkSize?: number;
  chunkOverlap?: number;
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
  gcsUri?: string;
  rawContent?: {
    content: string;
    mimeType: string;
  };
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

/**
 * Vertex AI RAG Client
 */
export class VertexRAGClient {
  private config: Required<VertexRAGConfig>;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config?: Partial<VertexRAGConfig>) {
    this.config = {
      projectId: config?.projectId || process.env.GOOGLE_CLOUD_PROJECT_ID || '',
      location: config?.location || process.env.GOOGLE_CLOUD_LOCATION || 'us-central1',
      embeddingModel: config?.embeddingModel || process.env.VERTEX_RAG_EMBEDDING_MODEL || 'text-embedding-005',
      chunkSize: config?.chunkSize || parseInt(process.env.VERTEX_RAG_CHUNK_SIZE || '1024'),
      chunkOverlap: config?.chunkOverlap || parseInt(process.env.VERTEX_RAG_CHUNK_OVERLAP || '200'),
    };

    if (!this.config.projectId) {
      console.warn('GOOGLE_CLOUD_PROJECT_ID not set. Vertex AI RAG operations will fail.');
    }
  }

  /**
   * Get the base URL for Vertex AI API
   */
  private get baseUrl(): string {
    return `https://${this.config.location}-aiplatform.googleapis.com/v1`;
  }

  /**
   * Get the parent resource path
   */
  private get parentPath(): string {
    return `projects/${this.config.projectId}/locations/${this.config.location}`;
  }

  /**
   * Get access token for Google Cloud API
   */
  private async getAccessToken(): Promise<string> {
    // Check if we have a valid cached token
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    // In production, use Google Auth Library or service account
    // For local development, use gcloud auth print-access-token
    const credentials = process.env.GOOGLE_APPLICATION_CREDENTIALS;

    if (credentials) {
      // Use service account credentials
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        keyFilename: credentials,
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      this.accessToken = tokenResponse.token || '';
      this.tokenExpiry = Date.now() + 3500 * 1000; // Token valid for ~1 hour
      return this.accessToken;
    }

    // Fallback: Use default credentials (e.g., from gcloud CLI)
    try {
      const { GoogleAuth } = await import('google-auth-library');
      const auth = new GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/cloud-platform'],
      });
      const client = await auth.getClient();
      const tokenResponse = await client.getAccessToken();
      this.accessToken = tokenResponse.token || '';
      this.tokenExpiry = Date.now() + 3500 * 1000;
      return this.accessToken;
    } catch (error) {
      throw new Error('Failed to obtain Google Cloud access token. Set GOOGLE_APPLICATION_CREDENTIALS or run "gcloud auth application-default login"');
    }
  }

  /**
   * Make an authenticated request to Vertex AI API
   */
  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/${path}`, {
      method,
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Vertex AI API error (${response.status}): ${error}`);
    }

    return response.json();
  }

  // ============================================
  // Corpus Management
  // ============================================

  /**
   * Create a new RAG corpus
   */
  async createCorpus(request: CreateCorpusRequest): Promise<Corpus> {
    const response = await this.request<{ ragCorpus: Corpus }>(
      'POST',
      `${this.parentPath}/ragCorpora`,
      {
        ragCorpus: {
          displayName: request.displayName,
          description: request.description,
          ragEmbeddingModelConfig: {
            vertexPredictionEndpoint: {
              model: `publishers/google/models/${this.config.embeddingModel}`,
            },
          },
        },
      }
    );
    return response.ragCorpus;
  }

  /**
   * Get a corpus by name
   */
  async getCorpus(corpusName: string): Promise<Corpus> {
    return this.request<Corpus>('GET', corpusName);
  }

  /**
   * List all corpora
   */
  async listCorpora(): Promise<Corpus[]> {
    const response = await this.request<{ ragCorpora?: Corpus[] }>(
      'GET',
      `${this.parentPath}/ragCorpora`
    );
    return response.ragCorpora || [];
  }

  /**
   * Delete a corpus
   */
  async deleteCorpus(corpusName: string): Promise<void> {
    await this.request<void>('DELETE', `${corpusName}?force=true`);
  }

  // ============================================
  // Document Management
  // ============================================

  /**
   * Ingest a document into a corpus
   */
  async ingestDocument(request: IngestDocumentRequest): Promise<RagDocument> {
    const importConfig: Record<string, unknown> = {
      ragFileChunkingConfig: {
        chunkSize: this.config.chunkSize,
        chunkOverlap: this.config.chunkOverlap,
      },
    };

    if (request.gcsUri) {
      importConfig.gcsSource = {
        uris: [request.gcsUri],
      };
    }

    const response = await this.request<{ operation: { name: string } }>(
      'POST',
      `${request.corpusName}/ragFiles:import`,
      {
        importRagFilesConfig: importConfig,
      }
    );

    // For simplicity, return a placeholder. In production, poll the operation.
    return {
      name: response.operation.name,
      displayName: request.displayName,
      status: 'PENDING',
    };
  }

  /**
   * Ingest raw text content into a corpus
   */
  async ingestRawContent(
    corpusName: string,
    content: string,
    displayName: string,
    metadata?: Record<string, string>
  ): Promise<RagDocument> {
    // For raw content, we need to upload to GCS first or use inline content
    // This is a simplified version that uses the upload endpoint
    const response = await this.request<{ ragFile: RagDocument }>(
      'POST',
      `${corpusName}/ragFiles:upload`,
      {
        ragFile: {
          displayName,
          description: metadata?.description,
        },
        uploadRagFileConfig: {
          ragFileChunkingConfig: {
            chunkSize: this.config.chunkSize,
            chunkOverlap: this.config.chunkOverlap,
          },
        },
      }
    );
    return response.ragFile;
  }

  /**
   * List documents in a corpus
   */
  async listDocuments(corpusName: string): Promise<RagDocument[]> {
    const response = await this.request<{ ragFiles?: RagDocument[] }>(
      'GET',
      `${corpusName}/ragFiles`
    );
    return response.ragFiles || [];
  }

  /**
   * Delete a document from a corpus
   */
  async deleteDocument(documentName: string): Promise<void> {
    await this.request<void>('DELETE', documentName);
  }

  // ============================================
  // Search & Retrieval
  // ============================================

  /**
   * Perform semantic search across a corpus
   */
  async search(request: SearchRequest): Promise<SearchResult[]> {
    const response = await this.request<{
      contexts?: {
        contexts: Array<{
          sourceUri: string;
          text: string;
          score: number;
        }>;
      };
    }>(
      'POST',
      `${this.parentPath}:retrieveContexts`,
      {
        query: {
          text: request.query,
        },
        vertexRagStore: {
          ragCorpora: [request.corpusName],
        },
        ragRetrievalConfig: {
          topK: request.topK || 5,
        },
      }
    );

    if (!response.contexts?.contexts) {
      return [];
    }

    return response.contexts.contexts.map((ctx, index) => ({
      chunk: {
        id: `chunk-${index}`,
        content: ctx.text,
        documentName: ctx.sourceUri,
      },
      score: ctx.score,
    }));
  }

  /**
   * Get relevant context for a query (formatted for LLM)
   */
  async getRelevantContext(request: RetrieveContextRequest): Promise<string> {
    const results = await this.search({
      corpusName: request.corpusName,
      query: request.query,
      topK: request.maxChunks || 3,
    });

    // Filter by minimum score if specified
    const filtered = request.minScore
      ? results.filter(r => r.score >= request.minScore!)
      : results;

    if (filtered.length === 0) {
      return '';
    }

    // Format context for LLM consumption
    const contextParts = filtered.map((result, index) => {
      return `[Source ${index + 1}] (Relevance: ${(result.score * 100).toFixed(1)}%)\n${result.chunk.content}`;
    });

    return contextParts.join('\n\n---\n\n');
  }

  // ============================================
  // Embeddings
  // ============================================

  /**
   * Generate embeddings for text
   */
  async generateEmbedding(text: string): Promise<EmbeddingResponse> {
    const response = await this.request<{
      predictions: Array<{
        embeddings: {
          values: number[];
          statistics: {
            token_count: number;
          };
        };
      }>;
    }>(
      'POST',
      `${this.parentPath}/publishers/google/models/${this.config.embeddingModel}:predict`,
      {
        instances: [{ content: text }],
      }
    );

    const prediction = response.predictions[0];
    return {
      embedding: prediction.embeddings.values,
      tokenCount: prediction.embeddings.statistics.token_count,
    };
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts: string[]): Promise<EmbeddingResponse[]> {
    const response = await this.request<{
      predictions: Array<{
        embeddings: {
          values: number[];
          statistics: {
            token_count: number;
          };
        };
      }>;
    }>(
      'POST',
      `${this.parentPath}/publishers/google/models/${this.config.embeddingModel}:predict`,
      {
        instances: texts.map(text => ({ content: text })),
      }
    );

    return response.predictions.map(prediction => ({
      embedding: prediction.embeddings.values,
      tokenCount: prediction.embeddings.statistics.token_count,
    }));
  }

  // ============================================
  // Utility Methods
  // ============================================

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    return Boolean(this.config.projectId);
  }

  /**
   * Get current configuration (for debugging)
   */
  getConfig(): VertexRAGConfig {
    return { ...this.config };
  }

  /**
   * Build a full corpus name from a short ID
   */
  buildCorpusName(corpusId: string): string {
    if (corpusId.startsWith('projects/')) {
      return corpusId;
    }
    return `${this.parentPath}/ragCorpora/${corpusId}`;
  }
}

// Export singleton instance
let ragClientInstance: VertexRAGClient | null = null;

export function getRAGClient(): VertexRAGClient {
  if (!ragClientInstance) {
    ragClientInstance = new VertexRAGClient();
  }
  return ragClientInstance;
}

// Helper function to create project-specific corpus name
export function getProjectCorpusDisplayName(projectId: string): string {
  return `salesagent-project-${projectId}`;
}
