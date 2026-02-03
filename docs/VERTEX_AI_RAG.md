# Vertex AI RAG Integration - Technical Documentation

## Overview

This document describes the Vertex AI RAG (Retrieval-Augmented Generation) integration for the SalesAgent application. The implementation uses Google Cloud's Vertex AI RAG Engine with Document AI Layout Parser for intelligent document processing.

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            SalesAgent Application                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Upload     │───▶│  Document    │───▶│   Vertex AI  │                   │
│  │   RFP PDF    │    │  Processing  │    │  RAG Engine  │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                             │                    │                           │
│                             ▼                    ▼                           │
│                      ┌──────────────┐    ┌──────────────┐                   │
│                      │  Document AI │    │   Corpus     │                   │
│                      │Layout Parser │    │   (Index)    │                   │
│                      └──────────────┘    └──────────────┘                   │
│                             │                    │                           │
│                             ▼                    ▼                           │
│                      ┌──────────────┐    ┌──────────────┐                   │
│                      │   Chunks +   │───▶│  Embeddings  │                   │
│                      │   Metadata   │    │ text-emb-005 │                   │
│                      └──────────────┘    └──────────────┘                   │
│                                                  │                           │
│                                                  ▼                           │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Query      │───▶│  Semantic    │───▶│  Augmented   │                   │
│  │   (User)     │    │   Search     │    │   Response   │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Components

### 1. Vertex AI RAG Engine

The RAG Engine manages:
- **Corpus**: A searchable index of document chunks
- **Documents**: Ingested files with extracted content
- **Embeddings**: Vector representations using `text-embedding-005`

### 2. Document AI Layout Parser

Provides intelligent document parsing:
- Layout-aware chunking (respects document structure)
- Table extraction with context preservation
- Heading hierarchy maintenance

### 3. Integration Layer (`src/lib/vertex-rag.ts`)

Node.js client for Vertex AI RAG operations:
- Corpus management (create, list, delete)
- Document ingestion from Firebase Storage
- Semantic search and retrieval
- Context generation for LLM prompts

## API Endpoints

### RAG Corpus Management

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/corpus` | POST | Create a new corpus for a project |
| `/api/rag/corpus` | GET | List all corpora |
| `/api/rag/corpus/[id]` | DELETE | Delete a corpus |

### Document Operations

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/documents` | POST | Ingest a document into a corpus |
| `/api/rag/documents` | GET | List documents in a corpus |
| `/api/rag/documents/[id]` | DELETE | Remove document from corpus |

### Search & Retrieval

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/rag/search` | POST | Semantic search across corpus |
| `/api/rag/context` | POST | Get relevant context for a query |

## Configuration

### Environment Variables

```env
# Google Cloud Configuration
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# Vertex AI RAG Settings
VERTEX_RAG_EMBEDDING_MODEL=text-embedding-005
VERTEX_RAG_CHUNK_SIZE=1024
VERTEX_RAG_CHUNK_OVERLAP=200
```

### Google Cloud Setup

1. **Enable APIs**:
   ```bash
   gcloud services enable aiplatform.googleapis.com
   gcloud services enable documentai.googleapis.com
   gcloud services enable storage.googleapis.com
   ```

2. **Create Service Account**:
   ```bash
   gcloud iam service-accounts create salesagent-rag \
     --display-name="SalesAgent RAG Service Account"

   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:salesagent-rag@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/aiplatform.user"

   gcloud projects add-iam-policy-binding PROJECT_ID \
     --member="serviceAccount:salesagent-rag@PROJECT_ID.iam.gserviceaccount.com" \
     --role="roles/documentai.apiUser"
   ```

3. **Download Credentials**:
   ```bash
   gcloud iam service-accounts keys create ./credentials.json \
     --iam-account=salesagent-rag@PROJECT_ID.iam.gserviceaccount.com
   ```

## Usage Examples

### 1. Create Corpus for Project

```typescript
import { VertexRAGClient } from '@/lib/vertex-rag';

const ragClient = new VertexRAGClient();

// Create a corpus for an RFP project
const corpus = await ragClient.createCorpus({
  displayName: `project-${projectId}-corpus`,
  description: 'RFP documents for Project XYZ',
});
```

### 2. Ingest RFP Document

```typescript
// After uploading PDF to Firebase Storage
const document = await ragClient.ingestDocument({
  corpusId: corpus.name,
  gcsUri: `gs://bucket/rfps/${documentId}.pdf`,
  displayName: 'Customer RFP 2024',
  mimeType: 'application/pdf',
});
```

### 3. Search for Relevant Content

```typescript
// Find relevant sections for a query
const results = await ragClient.search({
  corpusId: corpus.name,
  query: 'What are the security requirements?',
  topK: 5,
});

// Results include chunks with relevance scores
results.forEach(chunk => {
  console.log(`Score: ${chunk.score}`);
  console.log(`Content: ${chunk.content}`);
});
```

### 4. Generate Augmented Response

```typescript
// Get context for AI prompt
const context = await ragClient.getRelevantContext({
  corpusId: corpus.name,
  query: 'Summarize the budget requirements',
  maxChunks: 3,
});

// Use context with Grok API
const response = await chatCompletion([
  { role: 'system', content: systemPrompts.rfpAnalysis },
  { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` },
], apiKey);
```

## Data Flow

### Document Ingestion Flow

```
1. User uploads RFP (PDF/DOCX) → Firebase Storage
2. API triggers ingestion → Vertex AI RAG Engine
3. Document AI parses document → Extracts text with layout
4. RAG Engine chunks content → Creates embeddings
5. Chunks stored in corpus → Ready for retrieval
```

### Query Flow

```
1. User asks question → API receives query
2. Query embedded → Same model as documents
3. Semantic search → Find similar chunks
4. Chunks retrieved → Ranked by relevance
5. Context assembled → Sent to LLM
6. Augmented response → Returned to user
```

## Supported Document Types

| Format | Extension | Notes |
|--------|-----------|-------|
| PDF | .pdf | Full layout parsing support |
| Word | .docx | Text and basic structure |
| PowerPoint | .pptx | Slide content extraction |
| Excel | .xlsx | Table data extraction |
| Text | .txt | Direct text ingestion |
| HTML | .html | Cleaned text extraction |

## Best Practices

### 1. Corpus Organization

- Create one corpus per project for isolation
- Use descriptive display names
- Clean up corpora when projects are archived

### 2. Chunk Configuration

- Default: 1024 tokens with 200 overlap
- Increase overlap for documents with flowing text
- Decrease chunk size for Q&A style documents

### 3. Query Optimization

- Be specific in queries
- Use domain terminology from the RFP
- Request 3-5 chunks for context (balance relevance vs. noise)

### 4. Cost Management

- Monitor embedding API calls
- Delete unused corpora
- Use caching for repeated queries

## Error Handling

| Error | Cause | Resolution |
|-------|-------|------------|
| `PERMISSION_DENIED` | Missing IAM roles | Add required roles to service account |
| `RESOURCE_EXHAUSTED` | Quota exceeded | Request quota increase or reduce calls |
| `INVALID_ARGUMENT` | Unsupported file type | Convert to supported format |
| `NOT_FOUND` | Corpus/Document deleted | Recreate resource |

## Monitoring

### Metrics to Track

- Document ingestion success rate
- Average query latency
- Chunk retrieval relevance scores
- API cost per project

### Logging

All RAG operations are logged with:
- Operation type
- Corpus/Document IDs
- Query (sanitized)
- Response time
- Error details (if any)

## Security Considerations

1. **Service Account**: Use minimal required permissions
2. **Data Residency**: Choose appropriate GCP region
3. **Access Control**: Validate user permissions before RAG operations
4. **Audit Logging**: Enable Cloud Audit Logs for compliance

## Migration Notes

### From Mock Embeddings

The existing `generateEmbeddings()` function in `src/lib/ai.ts` returns mock data. Replace with:

```typescript
import { VertexRAGClient } from '@/lib/vertex-rag';

const ragClient = new VertexRAGClient();
const embedding = await ragClient.generateEmbedding(text);
```

### Existing Projects

For projects created before RAG integration:
1. Create corpus for the project
2. Re-ingest existing documents
3. Update project metadata with corpus ID
