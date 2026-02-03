# Vertex AI RAG Integration

## Technical Documentation

**Version:** 1.0
**Last Updated:** February 2026
**Author:** SalesAgent Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Prerequisites](#prerequisites)
4. [Installation & Configuration](#installation--configuration)
5. [API Reference](#api-reference)
6. [Usage Examples](#usage-examples)
7. [Integration with Existing Features](#integration-with-existing-features)
8. [Best Practices](#best-practices)
9. [Troubleshooting](#troubleshooting)
10. [Cost Considerations](#cost-considerations)

---

## Overview

### What is RAG?

Retrieval-Augmented Generation (RAG) is a technique that enhances Large Language Model (LLM) responses by retrieving relevant information from a knowledge base before generating answers. Instead of relying solely on the model's training data, RAG pulls context-specific information from your documents.

### Why Vertex AI RAG for SalesAgent?

SalesAgent processes RFP (Request for Proposal) documents that contain specific requirements, deadlines, and technical specifications. Using RAG ensures:

- **Accurate responses** grounded in actual document content
- **Reduced hallucinations** by providing factual context
- **Up-to-date information** from recently uploaded documents
- **Document-specific Q&A** for each project

### Key Components

| Component | Purpose |
|-----------|---------|
| **Vertex AI RAG Engine** | Managed service for document indexing and retrieval |
| **Document AI Layout Parser** | Intelligent PDF/document parsing with structure preservation |
| **Text Embeddings** | Vector representations for semantic search |
| **Corpus** | Searchable index of document chunks |

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              SalesAgent Application                              │
│                                                                                  │
│  ┌────────────────────────────────────────────────────────────────────────────┐ │
│  │                           Frontend (Next.js)                                │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   Upload     │  │   Search     │  │   Analyze    │  │   Generate   │   │ │
│  │  │   Documents  │  │   Documents  │  │   RFP        │  │   Proposal   │   │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │ │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘ │
│            │                 │                 │                 │              │
│  ┌─────────▼─────────────────▼─────────────────▼─────────────────▼───────────┐ │
│  │                         API Routes (/api/rag/*)                            │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │ │
│  │  │   /corpus    │  │  /documents  │  │   /search    │  │   /analyze   │   │ │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘   │ │
│  └─────────┼─────────────────┼─────────────────┼─────────────────┼───────────┘ │
│            │                 │                 │                 │              │
│  ┌─────────▼─────────────────▼─────────────────▼─────────────────▼───────────┐ │
│  │                      Vertex RAG Client (src/lib/vertex-rag.ts)             │ │
│  └─────────┬─────────────────┬─────────────────┬─────────────────┬───────────┘ │
└────────────┼─────────────────┼─────────────────┼─────────────────┼─────────────┘
             │                 │                 │                 │
             ▼                 ▼                 ▼                 ▼
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              Google Cloud Platform                               │
│                                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  Cloud Storage   │  │   Document AI    │  │      Vertex AI RAG Engine    │  │
│  │  (PDF Storage)   │  │  (Layout Parser) │  │  ┌────────┐  ┌────────────┐  │  │
│  │                  │  │                  │  │  │ Corpus │  │ Embeddings │  │  │
│  │  gs://bucket/    │──│  Parse & Chunk   │──│  │ Index  │  │ text-emb-  │  │  │
│  │  rfps/*.pdf      │  │  Documents       │  │  │        │  │ 005        │  │  │
│  └──────────────────┘  └──────────────────┘  │  └────────┘  └────────────┘  │  │
│                                              └──────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Data Flow

#### Document Ingestion Flow

```
1. User uploads RFP document
         │
         ▼
2. Document stored in Firebase Storage
         │
         ▼
3. API triggers Vertex AI RAG ingestion
         │
         ▼
4. Document AI Layout Parser processes document
   - Extracts text while preserving structure
   - Identifies tables, headings, lists
   - Creates semantically coherent chunks
         │
         ▼
5. Chunks are embedded using text-embedding-005
         │
         ▼
6. Embeddings stored in RAG corpus index
         │
         ▼
7. Document ready for semantic search
```

#### Query Flow

```
1. User asks a question about the RFP
         │
         ▼
2. Query is embedded using same embedding model
         │
         ▼
3. Semantic search finds similar chunks in corpus
         │
         ▼
4. Top-K relevant chunks retrieved
         │
         ▼
5. Chunks formatted as context for LLM
         │
         ▼
6. LLM (Grok) generates response with context
         │
         ▼
7. Response returned to user with source citations
```

---

## Prerequisites

### Google Cloud Requirements

1. **Google Cloud Project** with billing enabled
2. **APIs to enable:**
   - Vertex AI API (`aiplatform.googleapis.com`)
   - Document AI API (`documentai.googleapis.com`)
   - Cloud Storage API (`storage.googleapis.com`)

3. **IAM Roles** for the service account:
   - `roles/aiplatform.user` - Vertex AI access
   - `roles/documentai.apiUser` - Document AI access
   - `roles/storage.objectViewer` - Read documents from GCS

### Local Development Requirements

- Node.js 18+
- npm or yarn
- Google Cloud SDK (`gcloud`) installed
- Service account credentials JSON file

---

## Installation & Configuration

### Step 1: Enable Google Cloud APIs

```bash
# Set your project ID
export PROJECT_ID="your-gcp-project-id"
gcloud config set project $PROJECT_ID

# Enable required APIs
gcloud services enable aiplatform.googleapis.com
gcloud services enable documentai.googleapis.com
gcloud services enable storage.googleapis.com
```

### Step 2: Create Service Account

```bash
# Create service account
gcloud iam service-accounts create salesagent-rag \
  --display-name="SalesAgent RAG Service Account" \
  --description="Service account for Vertex AI RAG operations"

# Grant required roles
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:salesagent-rag@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:salesagent-rag@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/documentai.apiUser"

gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:salesagent-rag@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/storage.objectViewer"

# Download credentials
gcloud iam service-accounts keys create ./credentials.json \
  --iam-account=salesagent-rag@$PROJECT_ID.iam.gserviceaccount.com
```

### Step 3: Configure Environment Variables

Create or update `.env.local`:

```env
# Existing Firebase & xAI Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_firebase_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
XAI_API_KEY=your_xai_grok_api_key
XAI_API_URL=https://api.x.ai/v1

# Google Cloud / Vertex AI RAG Configuration
GOOGLE_CLOUD_PROJECT_ID=your-gcp-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=./credentials.json

# Vertex AI RAG Settings (optional - defaults shown)
VERTEX_RAG_EMBEDDING_MODEL=text-embedding-005
VERTEX_RAG_CHUNK_SIZE=1024
VERTEX_RAG_CHUNK_OVERLAP=200
```

### Step 4: Install Dependencies

```bash
npm install
```

The `google-auth-library` package is already added to `package.json`.

### Step 5: Verify Configuration

```bash
# Start the development server
npm run dev

# Test the RAG endpoint (should return configuration status)
curl http://localhost:3000/api/rag/corpus
```

---

## API Reference

### Base URL

```
http://localhost:3000/api/rag
```

### Endpoints

#### 1. Corpus Management

##### Create Corpus

Creates a new RAG corpus for a project.

```http
POST /api/rag/corpus
Content-Type: application/json

{
  "projectId": "project-123",
  "description": "RFP documents for Cloud Migration Project"
}
```

**Response:**
```json
{
  "success": true,
  "corpus": {
    "name": "projects/your-project/locations/us-central1/ragCorpora/corpus-id",
    "displayName": "salesagent-project-project-123",
    "description": "RFP documents for Cloud Migration Project",
    "createdAt": "2026-02-02T10:00:00Z"
  }
}
```

##### List Corpora

```http
GET /api/rag/corpus
```

**Response:**
```json
{
  "success": true,
  "corpora": [
    {
      "name": "projects/.../ragCorpora/corpus-1",
      "displayName": "salesagent-project-project-123",
      "createdAt": "2026-02-02T10:00:00Z"
    }
  ]
}
```

##### Delete Corpus

```http
DELETE /api/rag/corpus?name=projects/.../ragCorpora/corpus-id
```

---

#### 2. Document Management

##### Ingest Document

Ingests a document from Google Cloud Storage into a corpus.

```http
POST /api/rag/documents
Content-Type: application/json

{
  "corpusName": "corpus-id",
  "gcsUri": "gs://your-bucket/rfps/document.pdf",
  "displayName": "Customer RFP 2026",
  "metadata": {
    "customer": "Acme Corp",
    "projectId": "project-123"
  }
}
```

**Response:**
```json
{
  "success": true,
  "document": {
    "name": "projects/.../ragFiles/file-id",
    "displayName": "Customer RFP 2026",
    "status": "PENDING"
  },
  "message": "Document ingestion started. It may take a few minutes to process."
}
```

##### List Documents

```http
GET /api/rag/documents?corpusName=corpus-id
```

##### Delete Document

```http
DELETE /api/rag/documents?name=projects/.../ragFiles/file-id
```

---

#### 3. Search & Retrieval

##### Semantic Search

Searches for relevant document chunks.

```http
POST /api/rag/search
Content-Type: application/json

{
  "corpusName": "corpus-id",
  "query": "What are the security requirements?",
  "topK": 5,
  "minScore": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "query": "What are the security requirements?",
  "results": [
    {
      "content": "The system must implement OAuth 2.0 authentication...",
      "source": "gs://bucket/rfps/document.pdf",
      "score": 0.89,
      "scorePercent": "89.0%"
    }
  ],
  "totalResults": 3
}
```

##### Get Context

Retrieves formatted context for LLM augmentation.

```http
POST /api/rag/context
Content-Type: application/json

{
  "corpusName": "corpus-id",
  "query": "Summarize the project timeline",
  "maxChunks": 3,
  "minScore": 0.5
}
```

**Response:**
```json
{
  "success": true,
  "query": "Summarize the project timeline",
  "context": "[Source 1] (Relevance: 92.3%)\nThe project is expected to...\n\n---\n\n[Source 2]...",
  "hasContext": true
}
```

---

#### 4. RAG-Augmented Analysis

##### Analyze with RAG

Performs analysis using RAG-retrieved context.

```http
POST /api/rag/analyze
Content-Type: application/json

{
  "corpusName": "corpus-id",
  "query": "What are the main technical requirements and their priorities?",
  "analysisType": "rfp"
}
```

**Analysis Types:**
| Type | Description |
|------|-------------|
| `rfp` | RFP analysis with requirements extraction |
| `questions` | Generate clarifying questions |
| `proposal` | Proposal writing assistance |
| `compliance` | Compliance checking |
| `custom` | Custom analysis with `customPrompt` |

**Response:**
```json
{
  "success": true,
  "query": "What are the main technical requirements?",
  "analysisType": "rfp",
  "response": "Based on the RFP documents, the main technical requirements are...",
  "structuredData": {
    "requirements": [...],
    "priorities": [...]
  },
  "sources": [
    {
      "content": "The vendor must provide...",
      "source": "gs://bucket/rfps/document.pdf",
      "score": 0.91
    }
  ],
  "metadata": {
    "sourcesUsed": 5,
    "avgRelevance": 0.85
  }
}
```

---

## Usage Examples

### Example 1: Complete RFP Processing Workflow

```typescript
// 1. Create corpus for new project
const corpusResponse = await fetch('/api/rag/corpus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-123',
    description: 'Cloud Migration RFP'
  })
});
const { corpus } = await corpusResponse.json();

// 2. Ingest RFP document (after uploading to GCS)
await fetch('/api/rag/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corpusName: corpus.name,
    gcsUri: 'gs://bucket/rfps/cloud-migration-rfp.pdf',
    displayName: 'Cloud Migration RFP'
  })
});

// 3. Wait for ingestion (check status periodically)
// In production, implement polling or webhooks

// 4. Analyze the RFP
const analysisResponse = await fetch('/api/rag/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corpusName: corpus.name,
    query: 'Provide a complete analysis of this RFP including requirements, deadlines, and budget information',
    analysisType: 'rfp'
  })
});
const analysis = await analysisResponse.json();
```

### Example 2: Question Generation with RAG

```typescript
const questionsResponse = await fetch('/api/rag/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corpusName: 'corpus-id',
    query: 'Based on the RFP, what clarifying questions should we ask the customer?',
    analysisType: 'questions'
  })
});
```

### Example 3: Direct Search for Specific Information

```typescript
const searchResponse = await fetch('/api/rag/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corpusName: 'corpus-id',
    query: 'payment terms and conditions',
    topK: 3
  })
});
const { results } = await searchResponse.json();

// Display results with relevance scores
results.forEach(result => {
  console.log(`[${result.scorePercent}] ${result.content}`);
});
```

### Example 4: Using RAG in AI Utility Functions

```typescript
import { ragAugmentedCompletion, systemPrompts } from '@/lib/ai';

const response = await ragAugmentedCompletion(
  'What security certifications are required?',
  'corpus-id',
  systemPrompts.rfpAnalysis,
  process.env.XAI_API_KEY!
);
```

---

## Integration with Existing Features

### RFP Analysis Enhancement

The existing `/api/ai/analyze-rfp` endpoint can be enhanced to use RAG:

```typescript
// In src/app/api/ai/analyze-rfp/route.ts

import { getRAGClient } from '@/lib/vertex-rag';

export async function POST(request: NextRequest) {
  const { projectId, documentId, corpusName } = await request.json();

  // If corpus exists, use RAG-augmented analysis
  if (corpusName) {
    const ragClient = getRAGClient();
    const context = await ragClient.getRelevantContext({
      corpusName,
      query: 'Analyze this RFP document',
      maxChunks: 5
    });

    // Include context in the analysis prompt
    // ...
  }
}
```

### Question Generation Enhancement

```typescript
// Generate questions based on actual RFP content
const context = await ragClient.getRelevantContext({
  corpusName,
  query: 'gaps, unclear requirements, missing information',
  maxChunks: 5
});

// Use context to generate targeted questions
```

### Proposal Writing Enhancement

```typescript
// Retrieve relevant RFP sections for proposal writing
const context = await ragClient.getRelevantContext({
  corpusName,
  query: `requirements for ${chapterTitle}`,
  maxChunks: 3
});

// Generate proposal chapter with accurate RFP references
```

---

## Best Practices

### 1. Corpus Organization

- **One corpus per project** - Keeps documents isolated and relevant
- **Descriptive names** - Use `salesagent-project-{projectId}` pattern
- **Clean up** - Delete corpora when projects are archived

### 2. Document Preparation

- **Use PDF** for best layout parsing results
- **Ensure text is selectable** (not scanned images)
- **Remove password protection** before ingestion
- **Maximum file size:** 20MB per document

### 3. Chunking Configuration

| Document Type | Chunk Size | Overlap | Rationale |
|--------------|------------|---------|-----------|
| Technical RFPs | 1024 | 200 | Balanced for detailed specs |
| Legal/Contract | 512 | 100 | Shorter for precise clauses |
| General Business | 1500 | 300 | Longer for context |

### 4. Query Optimization

- **Be specific** - "What are the security requirements?" vs "security"
- **Use domain terms** - Use terminology from the RFP itself
- **Iterate** - Start broad, then narrow down

### 5. Context Length Management

- **3-5 chunks** is usually optimal for LLM context
- **Filter by score** - Use `minScore: 0.5` to exclude low-relevance results
- **Monitor token usage** - Context adds to API costs

---

## Troubleshooting

### Common Errors

#### PERMISSION_DENIED

```
Error: Vertex AI API error (403): Permission denied
```

**Solution:** Ensure the service account has the required IAM roles:
```bash
gcloud projects add-iam-policy-binding $PROJECT_ID \
  --member="serviceAccount:salesagent-rag@$PROJECT_ID.iam.gserviceaccount.com" \
  --role="roles/aiplatform.user"
```

#### RESOURCE_EXHAUSTED

```
Error: Quota exceeded for API calls
```

**Solution:** Request a quota increase in the Google Cloud Console or implement rate limiting.

#### NOT_FOUND (Corpus)

```
Error: Corpus not found
```

**Solution:** Verify the corpus name is correct and includes the full resource path:
```
projects/{project}/locations/{location}/ragCorpora/{corpus_id}
```

#### Document Ingestion Stuck on PENDING

**Causes:**
- Large document processing
- Unsupported file format
- GCS permissions issue

**Solution:**
1. Check Document AI quotas
2. Verify GCS URI is accessible
3. Try a smaller test document

### Debug Mode

Enable debug logging by setting:

```env
DEBUG=vertex-rag:*
```

### Health Check

```typescript
// Check if RAG is properly configured
const ragClient = getRAGClient();
console.log('RAG Configured:', ragClient.isConfigured());
console.log('Config:', ragClient.getConfig());
```

---

## Cost Considerations

### Pricing Components

| Component | Pricing Model | Estimate |
|-----------|--------------|----------|
| **Vertex AI RAG Engine** | Per GB stored + queries | ~$0.01/1K queries |
| **Document AI Layout Parser** | Per page processed | ~$0.01-0.065/page |
| **Text Embeddings** | Per 1K characters | ~$0.0001/1K chars |
| **Cloud Storage** | Per GB stored | ~$0.02/GB/month |

### Cost Optimization Tips

1. **Delete unused corpora** - Don't pay for old project data
2. **Optimize chunk size** - Fewer chunks = fewer embedding calls
3. **Cache repeated queries** - Implement application-level caching
4. **Use appropriate topK** - Don't retrieve more chunks than needed
5. **Batch operations** - Use batch embeddings when possible

### Estimated Monthly Cost (Small Team)

| Usage | Cost |
|-------|------|
| 10 projects, 50 documents total | ~$5-10 storage |
| 1,000 queries/month | ~$10-20 RAG queries |
| Document processing | ~$5-15 one-time |
| **Total** | **~$20-45/month** |

---

## File Reference

### Created Files

| File | Description |
|------|-------------|
| `src/lib/vertex-rag.ts` | Vertex AI RAG client library |
| `src/app/api/rag/corpus/route.ts` | Corpus management API |
| `src/app/api/rag/documents/route.ts` | Document ingestion API |
| `src/app/api/rag/search/route.ts` | Semantic search API |
| `src/app/api/rag/context/route.ts` | Context retrieval API |
| `src/app/api/rag/analyze/route.ts` | RAG-augmented analysis API |

### Modified Files

| File | Changes |
|------|---------|
| `src/lib/ai.ts` | Added `ragAugmentedCompletion()` function |
| `src/types/index.ts` | Added RAG types |
| `.env.local.example` | Added Google Cloud environment variables |
| `package.json` | Added `google-auth-library` dependency |

---

## Support & Resources

### Google Cloud Documentation

- [Vertex AI RAG Engine](https://cloud.google.com/vertex-ai/generative-ai/docs/rag-engine/rag-overview)
- [Document AI Layout Parser](https://cloud.google.com/document-ai/docs/layout-parse-chunk)
- [Text Embeddings](https://cloud.google.com/vertex-ai/generative-ai/docs/embeddings/get-text-embeddings)

### Internal Resources

- Technical Documentation: `Documentation/VertexAI_RAG_Integration.md` (this file)
- API Documentation: `docs/VERTEX_AI_RAG.md`

---

*This documentation is maintained by the SalesAgent development team. For questions or updates, please contact the engineering team.*
