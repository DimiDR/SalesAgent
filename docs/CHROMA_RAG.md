# ChromaDB RAG Integration - Kurzreferenz

## Überblick

Die RAG-Integration nutzt ChromaDB als lokale Vektordatenbank mit Adesso AI Hub für Embeddings. Sie ersetzt die frühere Vertex AI RAG Engine.

## Architektur

```
┌──────────────────────────────────────────────────────────────────────┐
│                       SalesAgent Application                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐            │
│  │   Upload     │───▶│  Text-       │───▶│  ChromaDB    │            │
│  │   RFP PDF    │    │  Extraktion  │    │  Ingestion   │            │
│  └──────────────┘    └──────────────┘    └──────────────┘            │
│                             │                    │                    │
│                             ▼                    ▼                    │
│                      ┌──────────────┐    ┌──────────────┐            │
│                      │  Chunking    │    │  Collection  │            │
│                      │  (1024/200)  │    │  (Corpus)    │            │
│                      └──────────────┘    └──────────────┘            │
│                             │                    │                    │
│                             ▼                    ▼                    │
│                      ┌──────────────┐    ┌──────────────┐            │
│                      │  Adesso AI   │───▶│  Embeddings  │            │
│                      │  Hub Embed   │    │  + Chunks    │            │
│                      └──────────────┘    └──────────────┘            │
│                                                  │                    │
│  ┌──────────────┐    ┌──────────────┐            │                    │
│  │   Query      │───▶│  Semantische │───▶ Suche  │                    │
│  │   (User)     │    │   Suche      │            │                    │
│  └──────────────┘    └──────────────┘    ┌───────▼──────┐            │
│                                          │  Augmented   │            │
│                                          │  Response    │            │
│                                          └──────────────┘            │
└──────────────────────────────────────────────────────────────────────┘
```

## Komponenten

### 1. ChromaDB (Lokale Vektordatenbank)

Verwaltet:
- **Collections (Corpora)**: Durchsuchbare Indizes von Dokumenten-Chunks
- **Dokumente**: Aufgenommene Dateien mit extrahiertem Inhalt
- **Embeddings**: Vektordarstellungen für semantische Suche

### 2. Adesso AI Hub (Embedding-Service)

OpenAI-kompatibler Embedding-Service:
- Modell: `text-embedding-3-small`
- Endpunkt: `POST /v1/embeddings`

### 3. Integration Layer (`src/lib/chroma-rag.ts`)

Node.js Client für ChromaDB RAG-Operationen:
- Corpus-Verwaltung (erstellen, auflisten, löschen)
- Dokumenten-Aufnahme mit automatischem Chunking
- Semantische Suche und Abruf
- Kontext-Generierung für LLM-Prompts

## API-Endpunkte

### RAG Corpus-Verwaltung

| Endpunkt | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/rag/corpus` | POST | Neuen Corpus erstellen |
| `/api/rag/corpus` | GET | Alle Corpora auflisten |
| `/api/rag/corpus` | DELETE | Corpus löschen |
| `/api/rag/corpus/stats` | GET | Corpus-Statistiken |

### Dokumenten-Operationen

| Endpunkt | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/rag/documents` | POST | Dokument in Corpus aufnehmen |
| `/api/rag/documents` | GET | Dokumente in einem Corpus auflisten |
| `/api/rag/documents` | DELETE | Dokument aus Corpus entfernen |

### Suche & Abruf

| Endpunkt | Methode | Beschreibung |
|----------|---------|-------------|
| `/api/rag/search` | POST | Semantische Suche im Corpus |
| `/api/rag/context` | POST | Relevanten Kontext für eine Abfrage abrufen |
| `/api/rag/analyze` | POST | RAG-gestützte Analyse |

## Konfiguration

### Umgebungsvariablen

```env
# ChromaDB RAG Konfiguration
CHROMA_URL=http://localhost:8000
EMBEDDING_API_URL=https://adesso-ai-hub.3asabc.de/v1
EMBEDDING_API_KEY=your_embedding_api_key
EMBEDDING_MODEL=text-embedding-3-small

# Optionale RAG-Einstellungen
CHROMA_CHUNK_SIZE=1024
CHROMA_CHUNK_OVERLAP=200
```

### ChromaDB Setup

```bash
# Docker (empfohlen)
docker run -d --name chromadb -p 8000:8000 chromadb/chroma

# Health Check
curl http://localhost:8000/api/v1/heartbeat
```

## Nutzungsbeispiele

### Corpus erstellen und Dokument aufnehmen

```typescript
import { getRAGClient, getProjectCorpusDisplayName } from '@/lib/chroma-rag';

const ragClient = getRAGClient();

// Corpus erstellen
const corpus = await ragClient.createCorpus({
  displayName: getProjectCorpusDisplayName('project-123'),
  description: 'RFP-Dokumente für Projekt XYZ',
});

// Dokument aufnehmen
const document = await ragClient.ingestDocument({
  corpusName: corpus.name,
  content: 'Extrahierter Text aus dem RFP...',
  displayName: 'Kunden-RFP 2026',
  metadata: { customer: 'Acme Corp' },
});
```

### Semantische Suche

```typescript
const results = await ragClient.search({
  corpusName: corpus.name,
  query: 'Welche Sicherheitsanforderungen gibt es?',
  topK: 5,
});

results.forEach(result => {
  console.log(`Score: ${(result.score * 100).toFixed(1)}%`);
  console.log(`Content: ${result.chunk.content}`);
});
```

### Kontext für KI-Augmentierung

```typescript
const context = await ragClient.getRelevantContext({
  corpusName: corpus.name,
  query: 'Budget-Anforderungen zusammenfassen',
  maxChunks: 3,
  minScore: 0.5,
});

// Kontext in Grok-Prompt einbinden
```

## Unterstützte Dokumenttypen

| Format | Erweiterung | Hinweise |
|--------|-----------|-------|
| PDF | .pdf | Textextraktion mit pdf-parse |
| Word | .docx | Textextraktion mit docx |
| Excel | .xlsx | Tabellenextraktion mit xlsx |
| Text | .txt | Direkte Aufnahme |

## Admin-Interface

Unter `/admin` steht ein Verwaltungs-Interface zur Verfügung:
- Corpora erstellen und löschen
- Dokumente hochladen und verwalten
- Semantische Suche testen
- Chunk-Statistiken einsehen

## Fehlerbehebung

| Fehler | Ursache | Lösung |
|-------|--------|--------|
| `ECONNREFUSED` | ChromaDB nicht gestartet | `docker start chromadb` |
| `401 Unauthorized` | Ungültiger Embedding API Key | `EMBEDDING_API_KEY` prüfen |
| Leere Ergebnisse | Corpus leer oder Abfrage unpassend | Admin-Interface prüfen, Abfrage umformulieren |

## Vollständige Dokumentation

Siehe [ChromaDB RAG Integration](../Documentation/ChromaDB_RAG_Integration.md) für die ausführliche technische Dokumentation.
