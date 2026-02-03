# SalesAgent

KI-gestütztes RFP-Management System zur Automatisierung von Angebotsprozessen.

## Features

- **RFP-Analyse** - Automatische Analyse von RFP-Dokumenten mit KI-Unterstützung
- **KI-Generierung** - Generierung von Fragen, Agenden und Angebotsinhalten (powered by xAI Grok)
- **Team-Kollaboration** - Zusammenarbeit im Team mit Aufgabenzuweisung
- **Workflow-Management** - Strukturierter 5-Schritte-Prozess

## 5-Schritte-Workflow

1. **RFP Erhalten** - Upload und Analyse von RFP-Dokumenten
2. **Fragen Stellen** - KI-generierte Rückfragen an den Kunden
3. **Kundentermin** - Agenda-Erstellung und Meeting-Vorbereitung
4. **Angebot Erstellen** - Automatische Angebotsgenerierung
5. **Angebot Senden** - Finalisierung und Versand

## Tech Stack

- **Frontend:** Next.js 16, React 19, TypeScript
- **Styling:** Tailwind CSS 4
- **State Management:** Zustand
- **Backend:** Firebase
- **KI:** xAI Grok 4.1
- **Icons:** Lucide React

## Installation

```bash
# Repository klonen
git clone https://github.com/YOUR_USERNAME/SalesAgent.git

# In das Verzeichnis wechseln
cd SalesAgent

# Abhängigkeiten installieren
npm install

# Entwicklungsserver starten
npm run dev
```

## Umgebungsvariablen

Erstellen Sie eine `.env.local` Datei mit folgenden Variablen:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# xAI API
XAI_API_KEY=your_xai_api_key
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
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── auth/              # Authentifizierung
│   ├── customers/         # Kundenverwaltung
│   ├── dashboard/         # Dashboard
│   ├── project/           # Einzelprojekt-Ansicht
│   ├── projects/          # Projektübersicht
│   └── resources/         # Ressourcen
├── components/            # React-Komponenten
│   ├── layout/           # Layout-Komponenten
│   ├── ui/               # UI-Komponenten
│   └── workflow/         # Workflow-Schritte
├── hooks/                 # Custom Hooks
├── lib/                   # Hilfsfunktionen
├── store/                 # Zustand Store
└── types/                 # TypeScript-Typen
```

## Lizenz

MIT License
