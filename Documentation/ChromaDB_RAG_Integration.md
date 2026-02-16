# ChromaDB RAG Integration

## Technische Dokumentation

**Version:** 2.0
**Zuletzt aktualisiert:** Februar 2026
**Autor:** SalesAgent Development Team

---

## Inhaltsverzeichnis

1. [Überblick](#überblick)
2. [Architektur](#architektur)
3. [Voraussetzungen](#voraussetzungen)
4. [Installation & Konfiguration](#installation--konfiguration)
5. [API-Referenz](#api-referenz)
6. [Nutzungsbeispiele](#nutzungsbeispiele)
7. [Integration mit bestehenden Features](#integration-mit-bestehenden-features)
8. [Best Practices](#best-practices)
9. [Fehlerbehebung](#fehlerbehebung)
10. [Migration von Vertex AI](#migration-von-vertex-ai)

---

## Überblick

### Was ist RAG?

Retrieval-Augmented Generation (RAG) ist eine Technik, die LLM-Antworten verbessert, indem relevante Informationen aus einer Wissensdatenbank abgerufen werden, bevor Antworten generiert werden. Anstatt sich nur auf die Trainingsdaten des Modells zu verlassen, greift RAG auf kontextspezifische Informationen aus Ihren Dokumenten zu.

### Warum ChromaDB für SalesAgent?

SalesAgent verarbeitet RFP-Dokumente (Request for Proposal) mit spezifischen Anforderungen, Fristen und technischen Spezifikationen. ChromaDB als lokale Vektordatenbank bietet:

- **Datensouveränität** - Alle Daten bleiben lokal
- **Keine Cloud-Kosten** - Keine GCP- oder AWS-Gebühren für Vektorsuche
- **Schnelle Iteration** - Lokale Instanz für schnelle Entwicklung
- **Genaue Antworten** basierend auf tatsächlichem Dokumenteninhalt
- **Reduzierte Halluzinationen** durch faktischen Kontext

### Kernkomponenten

| Komponente | Zweck |
|-----------|---------|
| **ChromaDB** | Lokale Vektordatenbank für Dokumentenindizierung und -abruf |
| **Adesso AI Hub** | OpenAI-kompatibler Embedding-Service |
| **text-embedding-3-small** | Embedding-Modell für semantische Suche |
| **Corpus (Collection)** | Durchsuchbarer Index von Dokumenten-Chunks |

---

## Architektur

### Systemarchitektur

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         SalesAgent Application                           │
│                                                                          │
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                      Frontend (Next.js 16)                         │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐             │  │
│  │  │   Upload     │  │   Search     │  │   Admin      │             │  │
│  │  │   Documents  │  │   Documents  │  │   Interface  │             │  │
│  │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘             │  │
│  └─────────┼─────────────────┼─────────────────┼─────────────────────┘  │
│            │                 │                 │                         │
│  ┌─────────▼─────────────────▼─────────────────▼─────────────────────┐  │
│  │                    API Routes (/api/rag/*)                         │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │  │
│  │  │ /corpus  │  │ /docs    │  │ /search  │  │ /corpus/stats    │  │  │
│  │  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘  │  │
│  └───────┼──────────────┼─────────────┼─────────────────┼────────────┘  │
│          │              │             │                 │                │
│  ┌───────▼──────────────▼─────────────▼─────────────────▼────────────┐  │
│  │                 ChromaDB RAG Client (src/lib/chroma-rag.ts)       │  │
│  └───────┬──────────────┬─────────────────────────────────────────────┘  │
└──────────┼──────────────┼────────────────────────────────────────────────┘
           │              │
           ▼              ▼
┌──────────────────┐  ┌──────────────────────────────────────────────────┐
│   ChromaDB       │  │        Adesso AI Hub                             │
│   (localhost)    │  │        (Embedding Service)                       │
│                  │  │                                                   │
│  ┌────────────┐  │  │  POST /v1/embeddings                            │
│  │ Collections│  │  │  Model: text-embedding-3-small                   │
│  │ (Corpora)  │  │  │  OpenAI-kompatible API                          │
│  └────────────┘  │  └──────────────────────────────────────────────────┘
│  ┌────────────┐  │
│  │ Embeddings │  │
│  │ + Chunks   │  │
│  └────────────┘  │
└──────────────────┘
```

### Datenfluss

#### Dokumenten-Ingestion

```
1. Benutzer lädt Dokument hoch
         │
         ▼
2. Text wird aus Dokument extrahiert (PDF, DOCX, XLSX)
         │
         ▼
3. Text wird in Chunks aufgeteilt (1024 Zeichen, 200 Überlappung)
         │
         ▼
4. Chunks werden über Adesso AI Hub embedded
         │
         ▼
5. Embeddings + Chunks in ChromaDB Collection gespeichert
         │
         ▼
6. Dokument bereit für semantische Suche
```

#### Abfragefluss

```
1. Benutzer stellt Frage zum RFP
         │
         ▼
2. Frage wird mit gleichem Embedding-Modell embedded
         │
         ▼
3. Semantische Suche in ChromaDB (Cosine Distance)
         │
         ▼
4. Top-K relevante Chunks abgerufen
         │
         ▼
5. Chunks als Kontext für Grok 4.1 formatiert
         │
         ▼
6. Grok generiert Antwort mit Kontext
         │
         ▼
7. Antwort mit Quellverweisen zurückgegeben
```

---

## Voraussetzungen

### Lokale Anforderungen

1. **Node.js 20+**
2. **Docker** (für ChromaDB) oder ChromaDB nativ installiert
3. **Zugang zu Adesso AI Hub** (Embedding API Key)

### Keine Cloud-Anforderungen

Im Gegensatz zur vorherigen Vertex AI Integration werden **keine** Google Cloud Services benötigt.

---

## Installation & Konfiguration

### Schritt 1: ChromaDB starten

```bash
# Option A: Docker (empfohlen)
docker run -d --name chromadb -p 8000:8000 chromadb/chroma

# Option B: Docker Compose
# docker-compose.yml:
# services:
#   chromadb:
#     image: chromadb/chroma
#     ports:
#       - "8000:8000"
#     volumes:
#       - chroma-data:/chroma/chroma
# volumes:
#   chroma-data:

# Option C: Python (lokal)
pip install chromadb
chroma run --host 0.0.0.0 --port 8000
```

### Schritt 2: Umgebungsvariablen konfigurieren

In `.env.local`:

```env
# ChromaDB RAG Configuration
CHROMA_URL=http://localhost:8000
EMBEDDING_API_URL=https://adesso-ai-hub.3asabc.de/v1
EMBEDDING_API_KEY=your_embedding_api_key
EMBEDDING_MODEL=text-embedding-3-small

# Optionale Einstellungen (Standardwerte gezeigt)
CHROMA_CHUNK_SIZE=1024
CHROMA_CHUNK_OVERLAP=200
```

### Schritt 3: Installation verifizieren

```bash
# Entwicklungsserver starten
npm run dev

# ChromaDB Healthcheck
curl http://localhost:8000/api/v1/heartbeat

# Corpus-Endpunkt testen
curl http://localhost:3000/api/rag/corpus
```

---

## API-Referenz

### Basis-URL

```
http://localhost:3000/api/rag
```

### Endpunkte

#### 1. Corpus-Verwaltung

##### Corpus erstellen

```http
POST /api/rag/corpus
Content-Type: application/json

{
  "projectId": "project-123",
  "description": "RFP-Dokumente für Cloud-Migrationsprojekt"
}
```

**Antwort:**
```json
{
  "success": true,
  "corpus": {
    "name": "collection-uuid",
    "displayName": "salesagent-project-project-123",
    "description": "RFP-Dokumente für Cloud-Migrationsprojekt",
    "createdAt": "2026-02-16T10:00:00Z"
  }
}
```

##### Corpora auflisten

```http
GET /api/rag/corpus
```

##### Corpus löschen

```http
DELETE /api/rag/corpus?name=collection-uuid
```

##### Corpus-Statistiken

```http
GET /api/rag/corpus/stats?name=collection-uuid
```

---

#### 2. Dokumenten-Verwaltung

##### Dokument aufnehmen

Nimmt ein Dokument in einen Corpus auf (Text wird gechunkt und embedded).

```http
POST /api/rag/documents
Content-Type: application/json

{
  "corpusName": "collection-uuid",
  "content": "Extrahierter Dokumententext...",
  "displayName": "Kunden-RFP 2026",
  "metadata": {
    "customer": "Acme Corp",
    "projectId": "project-123"
  }
}
```

**Antwort:**
```json
{
  "success": true,
  "document": {
    "name": "doc-1708070400000-abc123",
    "displayName": "Kunden-RFP 2026",
    "status": "ACTIVE"
  }
}
```

##### Dokumente auflisten

```http
GET /api/rag/documents?corpusName=collection-uuid
```

##### Dokument löschen

```http
DELETE /api/rag/documents?name=doc-name
```

---

#### 3. Suche & Abruf

##### Semantische Suche

```http
POST /api/rag/search
Content-Type: application/json

{
  "corpusName": "collection-uuid",
  "query": "Welche Sicherheitsanforderungen gibt es?",
  "topK": 5
}
```

**Antwort:**
```json
{
  "success": true,
  "query": "Welche Sicherheitsanforderungen gibt es?",
  "results": [
    {
      "chunk": {
        "id": "doc-123-chunk-0",
        "content": "Das System muss OAuth 2.0 Authentifizierung implementieren...",
        "documentName": "Kunden-RFP 2026"
      },
      "score": 0.89
    }
  ],
  "totalResults": 3
}
```

##### Kontext abrufen

Formatierter Kontext für LLM-Augmentierung.

```http
POST /api/rag/context
Content-Type: application/json

{
  "corpusName": "collection-uuid",
  "query": "Fasse die Projekt-Timeline zusammen",
  "maxChunks": 3,
  "minScore": 0.5
}
```

---

#### 4. RAG-gestützte Analyse

```http
POST /api/rag/analyze
Content-Type: application/json

{
  "corpusName": "collection-uuid",
  "query": "Was sind die technischen Hauptanforderungen?",
  "analysisType": "rfp"
}
```

**Analysetypen:**

| Typ | Beschreibung |
|------|-------------|
| `rfp` | RFP-Analyse mit Anforderungsextraktion |
| `questions` | Klärende Fragen generieren |
| `proposal` | Unterstützung beim Angebotsschreiben |
| `compliance` | Compliance-Prüfung |
| `custom` | Benutzerdefinierte Analyse mit `customPrompt` |

---

## Nutzungsbeispiele

### Beispiel 1: Kompletter RFP-Verarbeitungs-Workflow

```typescript
// 1. Corpus für neues Projekt erstellen
const corpusResponse = await fetch('/api/rag/corpus', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    projectId: 'project-123',
    description: 'Cloud-Migration RFP'
  })
});
const { corpus } = await corpusResponse.json();

// 2. Dokument aufnehmen (Text vorher extrahiert)
await fetch('/api/rag/documents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corpusName: corpus.name,
    content: extractedText,
    displayName: 'Cloud-Migration RFP'
  })
});

// 3. RFP analysieren
const analysis = await fetch('/api/rag/analyze', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corpusName: corpus.name,
    query: 'Analysiere dieses RFP inklusive Anforderungen, Fristen und Budget',
    analysisType: 'rfp'
  })
});
```

### Beispiel 2: Direkte Suche in der Wissensdatenbank

```typescript
const searchResponse = await fetch('/api/rag/search', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    corpusName: 'collection-uuid',
    query: 'Zahlungsbedingungen und Konditionen',
    topK: 3
  })
});
const { results } = await searchResponse.json();

results.forEach(result => {
  console.log(`[${(result.score * 100).toFixed(1)}%] ${result.chunk.content}`);
});
```

### Beispiel 3: RAG-Client direkt verwenden

```typescript
import { getRAGClient } from '@/lib/chroma-rag';

const ragClient = getRAGClient();

// Kontext für KI-Prompt abrufen
const context = await ragClient.getRelevantContext({
  corpusName: 'collection-uuid',
  query: 'Budget-Anforderungen zusammenfassen',
  maxChunks: 3,
  minScore: 0.5,
});

// Kontext mit Grok API verwenden
const response = await chatCompletion([
  { role: 'system', content: systemPrompts.rfpAnalysis },
  { role: 'user', content: `Kontext:\n${context}\n\nFrage: ${query}` },
], apiKey);
```

---

## Integration mit bestehenden Features

### RFP-Analyse (`/api/ai/analyze-rfp`)

Alle KI-Endpunkte nutzen automatisch RAG-Kontext, wenn ein Corpus für das Projekt existiert:

```typescript
import { getRAGClient } from '@/lib/chroma-rag';

const ragClient = getRAGClient();
const context = await ragClient.getRelevantContext({
  corpusName,
  query: 'Analysiere dieses RFP-Dokument',
  maxChunks: 5
});
```

### Fragen-Generierung (`/api/ai/generate-questions`)

RAG liefert Kontext aus vergangenen Angeboten für personalisierte Fragen.

### Angebots-Generierung (`/api/ai/generate-chapter-content`)

RAG-Kontext wird für jeden Kapitelabschnitt separat abgerufen, um relevante Unternehmensinformationen einzubinden.

### Compliance-Check (`/api/ai/compliance-check`)

RAG-gestützter Abgleich zwischen RFP-Anforderungen und Angebotsinhalt.

---

## Best Practices

### 1. Corpus-Organisation

- **Ein Corpus pro Projekt** - Hält Dokumente isoliert und relevant
- **Beschreibende Namen** - Nutzt das `salesagent-project-{projectId}`-Muster
- **Aufräumen** - Corpora löschen wenn Projekte archiviert werden

### 2. Dokument-Vorbereitung

- **PDF** liefert die besten Ergebnisse bei der Textextraktion
- **Selektierbarer Text** sicherstellen (keine gescannten Bilder)
- **Maximale Dateigröße:** abhängig von der Text-Extraktion

### 3. Chunking-Konfiguration

| Dokumenttyp | Chunk-Größe | Überlappung | Begründung |
|-------------|-------------|-------------|-----------|
| Technische RFPs | 1024 | 200 | Ausgewogen für detaillierte Specs |
| Rechtliche Dokumente | 512 | 100 | Kürzer für präzise Klauseln |
| Allgemeine Business-Docs | 1500 | 300 | Länger für mehr Kontext |

### 4. Abfrage-Optimierung

- **Spezifisch sein** - "Welche Sicherheitsanforderungen gibt es?" statt "Sicherheit"
- **Fachbegriffe verwenden** - Terminologie aus dem RFP selbst nutzen
- **3-5 Chunks** sind meist optimal für den LLM-Kontext

---

## Fehlerbehebung

### Häufige Fehler

#### ChromaDB nicht erreichbar

```
Error: ChromaDB API error (ECONNREFUSED)
```

**Lösung:** ChromaDB starten:
```bash
docker start chromadb
# oder
docker run -d --name chromadb -p 8000:8000 chromadb/chroma
```

#### Embedding-API-Fehler

```
Error: Embedding API error (401): Unauthorized
```

**Lösung:** `EMBEDDING_API_KEY` in `.env.local` prüfen.

#### Leere Suchergebnisse

**Ursachen:**
- Corpus enthält keine Dokumente
- Abfrage zu spezifisch oder anderer Sprachstil als die Dokumente
- `minScore` zu hoch gesetzt

**Lösung:**
1. Corpus-Statistiken über Admin-Interface prüfen
2. Abfrage umformulieren
3. `minScore` auf 0.3 senken

### Health Check

```typescript
import { getRAGClient } from '@/lib/chroma-rag';

const ragClient = getRAGClient();
console.log('RAG konfiguriert:', ragClient.isConfigured());
console.log('Konfiguration:', ragClient.getConfig());
```

```bash
# ChromaDB direkt prüfen
curl http://localhost:8000/api/v1/heartbeat
```

---

## Migration von Vertex AI

### Was sich geändert hat

| Aspekt | Vorher (Vertex AI) | Jetzt (ChromaDB) |
|--------|-------------------|-------------------|
| **Vektordatenbank** | Google Vertex AI RAG Engine | Lokale ChromaDB-Instanz |
| **Embedding-Modell** | text-embedding-005 (Google) | text-embedding-3-small (Adesso AI Hub) |
| **Dokument-Parsing** | Document AI Layout Parser | Lokale Extraktion (pdf-parse, docx, xlsx) |
| **Infrastruktur** | Google Cloud Platform | Lokal (Docker) |
| **Kosten** | GCP-nutzungsbasiert | Kostenlos (lokal) |
| **Client-Bibliothek** | `src/lib/vertex-rag.ts` (gelöscht) | `src/lib/chroma-rag.ts` |
| **Env-Variablen** | `GOOGLE_CLOUD_*`, `VERTEX_RAG_*` | `CHROMA_URL`, `EMBEDDING_API_*` |

### Gelöschte Abhängigkeiten

- `google-auth-library` - Nicht mehr benötigt

### API-Kompatibilität

Die RAG-API-Endpunkte (`/api/rag/*`) behalten die gleiche Schnittstelle. Interne Aufrufe nutzen jetzt `ChromaRAGClient` statt `VertexRAGClient`.

---

## Datei-Referenz

### Dateien

| Datei | Beschreibung |
|------|-------------|
| `src/lib/chroma-rag.ts` | ChromaDB RAG Client-Bibliothek |
| `src/app/api/rag/corpus/route.ts` | Corpus-Verwaltung API |
| `src/app/api/rag/corpus/stats/route.ts` | Corpus-Statistiken API |
| `src/app/api/rag/documents/route.ts` | Dokumenten-Aufnahme API |
| `src/app/api/rag/search/route.ts` | Semantische Suche API |
| `src/app/api/rag/context/route.ts` | Kontext-Abruf API |
| `src/app/api/rag/analyze/route.ts` | RAG-gestützte Analyse API |
| `src/app/admin/page.tsx` | Admin-Interface für RAG-Verwaltung |

---

*Diese Dokumentation wird vom SalesAgent-Entwicklungsteam gepflegt.*
