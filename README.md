# SalesAgent

KI-gestütztes RFP-Management System zur Automatisierung von Angebotsprozessen für SAP-Beratungsunternehmen.

## Features

- **RFP-Analyse** - Automatische Analyse von RFP-Dokumenten mit KI-Unterstützung und Gap-Analyse
- **KI-Generierung** - Generierung von Fragen, Agenden und Angebotsinhalten (powered by xAI Grok 4.1)
- **RAG-System** - ChromaDB-basierte Wissensdatenbank mit semantischer Suche über Unternehmensdokumente
- **Spracheingabe** - Voice-gesteuerte Ressourcenerfassung mit SAP-Terminologie-Korrektur
- **Kalkulation** - Automatische Kostenkalkulation mit rollenbasierten Tagessätzen
- **Admin-Interface** - RAG-Corpus-Verwaltung, Dokumenten-Management und Suchtest
- **Team-Kollaboration** - Zusammenarbeit im Team mit Aufgabenzuweisung
- **Workflow-Management** - Strukturierter 5-Schritte-Prozess

## 5-Schritte-Workflow

1. **RFP Erhalten** - Upload und KI-Analyse von RFP-Dokumenten (Gap-Analyse, Ressourcen-Checkliste, Kompatibilitäts-Score)
2. **Fragen Stellen** - Multi-Persona-Fragen (Sales, Technik, PM, Kunde) mit Excel-Export/Import
3. **Kundentermin** - KI-generierte Agenda, Protokoll-Erfassung und Insights-Extraktion
4. **Angebot Erstellen** - Automatische Kapitelstruktur, KI-Textgenerierung, Spracheingabe für Ressourcen, Kalkulation
5. **Angebot Senden** - Compliance-Check, Vollständigkeitsprüfung, Anschreiben-Generierung

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **KI:** xAI Grok 4.1
- **RAG:** ChromaDB (lokal) + Adesso AI Hub Embeddings (text-embedding-3-small)
- **Dokumente:** pdf-parse, docx, xlsx
- **Icons:** Lucide React

## Installation

```bash
# Repository klonen
git clone https://github.com/YOUR_USERNAME/SalesAgent.git

# In das Verzeichnis wechseln
cd SalesAgent

# Abhängigkeiten installieren
npm install

# ChromaDB starten (Option A: Docker)
docker run -p 8000:8000 chromadb/chroma

# ChromaDB starten (Option B: Python)
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # macOS/Linux
pip install chromadb
chroma run --host 0.0.0.0 --port 8000

# Entwicklungsserver starten
npm run dev
```

## Umgebungsvariablen

Erstellen Sie eine `.env.local` Datei basierend auf `.env.local.example`:

```env
# xAI Grok API
XAI_API_KEY=your_xai_api_key
XAI_API_URL=https://api.x.ai/v1

# ChromaDB RAG
CHROMA_URL=http://localhost:8000
EMBEDDING_API_URL=https://adesso-ai-hub.3asabc.de/v1
EMBEDDING_API_KEY=your_embedding_api_key
EMBEDDING_MODEL=text-embedding-3-small

# ChromaDB RAG Settings (optional)
CHROMA_CHUNK_SIZE=1024
CHROMA_CHUNK_OVERLAP=200
```

## Scripts

```bash
npm run dev      # Entwicklungsserver starten
npm run build    # Produktions-Build erstellen
npm run start    # Produktionsserver starten
npm run lint     # Code-Linting ausführen
```

## Projektstruktur

```
src/
├── app/                        # Next.js App Router
│   ├── admin/                  # RAG Admin-Interface
│   ├── api/
│   │   ├── ai/                # KI-Endpunkte
│   │   │   ├── analyze-rfp/           # RFP-Analyse
│   │   │   ├── compliance-check/      # Compliance-Prüfung
│   │   │   ├── extract-insights/      # Insights-Extraktion
│   │   │   ├── extract-proposal-fields/ # Feld-Extraktion
│   │   │   ├── generate-agenda/       # Agenda-Generierung
│   │   │   ├── generate-calculation/  # Kalkulation
│   │   │   ├── generate-chapter-content/ # Kapitel-Inhalte
│   │   │   ├── generate-cover-letter/ # Anschreiben
│   │   │   ├── generate-proposal-structure/ # Angebotsstruktur
│   │   │   ├── generate-questions/    # Fragen-Generierung
│   │   │   └── parse-resources-from-speech/ # Spracheingabe
│   │   └── rag/               # RAG-Endpunkte
│   │       ├── analyze/       # RAG-gestützte Analyse
│   │       ├── context/       # Kontext-Abruf
│   │       ├── corpus/        # Corpus-Verwaltung
│   │       ├── documents/     # Dokumenten-Verwaltung
│   │       └── search/        # Semantische Suche
│   ├── auth/                  # Authentifizierung
│   ├── customers/             # Kundenverwaltung
│   ├── dashboard/             # Dashboard
│   ├── project/[id]/          # Einzelprojekt-Ansicht
│   ├── projects/              # Projektübersicht
│   ├── references/            # Referenzprojekte
│   └── resources/             # Ressourcenverwaltung
├── components/
│   ├── layout/                # Navbar, Sidebar
│   ├── ui/                    # UI-Komponenten (Input mit Voice-Support)
│   └── workflow/              # Workflow-Schritte inkl. Kalkulation
├── hooks/
│   └── useSpeechRecognition.ts # Speech-to-Text mit SAP-Korrektur
├── lib/
│   ├── ai.ts                  # KI-Hilfsfunktionen (Grok API)
│   ├── ai-schema.ts           # Schema-Definitionen für KI-Felder
│   ├── chroma-rag.ts          # ChromaDB RAG Client
│   ├── sap-terminology.ts     # SAP-Terminologie für Spracherkennung
│   └── utils.ts               # Allgemeine Hilfsfunktionen
├── store/
│   └── useStore.ts            # Zustand Store
└── types/
    └── index.ts               # TypeScript-Typen
```

## RAG-System

Das RAG-System nutzt **ChromaDB** als lokale Vektordatenbank und **Adesso AI Hub** für Embeddings.

### Architektur

```
Dokument-Upload → Text-Extraktion → Chunking → Embedding → ChromaDB
                                                                ↓
Benutzer-Anfrage → Query-Embedding → Semantische Suche → Kontext → Grok 4.1 → Antwort
```

### Verwaltung

Über das Admin-Interface (`/admin`) können Sie:
- Corpora erstellen und löschen
- Dokumente hochladen und verwalten
- Semantische Suche testen
- Statistiken einsehen

Weitere Details: [ChromaDB RAG Integration](Documentation/ChromaDB_RAG_Integration.md)

## Lizenz

MIT License
