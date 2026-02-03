# Anforderungsdokument für die Entwicklung einer AI-gestützten RFP-Management-App

**Dokumentversion:** 1.0  
**Datum:** 02. Februar 2026  
**Autor:** Grok 4 (xAI)  
**Zielgruppe:** Claude (Anthropic) als Entwicklungsassistent für die Code-Generierung und Implementierung  
**Zweck:** Dieses Dokument beschreibt die vollständigen Anforderungen für die Entwicklung einer webbasierten App, die als Clone/Verbesserung von AutoRFP.ai dient. Die App strukturiert Angebotsprozesse, analysiert RFP-Dokumente, generiert Vorschläge und koordiniert Teams mit KI-Unterstützung. Die Implementierung soll mit Next.js als Frontend/Backend-Framework, Firebase als Hosting- und Backend-Service (soweit möglich) und xAI Grok 4.1 als KI-Kern erfolgen. Ein Standard-RAG-System (Retrieval-Augmented Generation) wird integriert, um auf hochgeladene Unternehmensdokumente zuzugreifen. Keine Integration mit SharePoint; alle Speicher- und Upload-Funktionen laufen über Firebase.

## 1. Einleitung

### 1.1 Projektübersicht
Die App ist ein reines KI-Tool zur Strukturierung und Automatisierung von Angebotsprozessen (basierend auf RFPs – Request for Proposals). Sie greift auf hochgeladene RFP-Dokumente zu, analysiert diese, erstellt Vorschläge für benötigte Ressourcen, generiert Fragen an Kunden, strukturiert Kapitel und schreibt Texte basierend auf Vorlagen. Die App koordiniert Teammitglieder (z. B. Experten, Sales) über einen simplen Workflow und eine benutzerfreundliche UI/UX.

Schlüsselmerkmale:
- KI-basierte Analyse und Generierung (mit Grok 4.1).
- Standard-RAG für den Zugriff auf Unternehmenswissen (Expertenprofile, Sales-Infos, Kunden-Daten, vergangene Angebote).
- Dokumenten-Uploads und -Speicherung ausschließlich über Firebase.
- Simpler Prozess-Workflow: RFP erhalten → Fragen stellen → Kundentermin klären → Angebot erstellen → Angebot versenden.
- Export/Import von Daten als Excel und Generierung von Word-Dokumenten basierend auf Templates.

Die App soll skalierbar, sicher und einfach zu deployen sein. Ziel: Ein MVP (Minimum Viable Product), das in 1-3 Monaten implementiert werden kann.

### 1.2 Technologie-Stack
- **Frontend/Backend:** Next.js (für SSR, API-Routes und Pages).
- **Hosting und Deployment:** Firebase Hosting (für die App), Firebase Functions (für serverless Backend-Logik, z. B. KI-Aufrufe).
- **Datenbank und Speicher:** Firebase Firestore (für strukturierte Daten wie Workflows, User-Profile), Firebase Storage (für Dokumenten-Uploads: PDFs, Excels, Words).
- **KI-Kern:** xAI Grok 4.1 API (für Textanalyse, Generierung von Fragen/Vorschlägen, RAG-Integration).
- **RAG-System:** Standard-Implementierung mit Embeddings (z. B. via Grok API oder open-source wie Sentence-Transformers), gespeichert in Firestore (Vektoren als Arrays) oder einer einfachen Vector-DB-Extension in Firebase.
- **Dokumenten-Handling:** Bibliotheken wie pdf-lib (für PDF-Parsing), xlsx (für Excel), docx (für Word) – integriert in Next.js API-Routes oder Firebase Functions.
- **Authentifizierung:** Firebase Authentication (Email/Password, Google OAuth).
- **Weitere Libs:** React für UI-Komponenten, Tailwind CSS für Styling, LangChain.js (für RAG-Chain mit Grok).

**Einschränkung:** Alles soweit möglich in Firebase halten – keine externen Services wie SharePoint. Für RAG: Embeddings lokal generieren oder via Grok API.

### 1.3 Annahmen und Abhängigkeiten
- Zugang zur xAI Grok 4.1 API (API-Key erforderlich).
- Benutzer haben Firebase-Konto für Deployment.
- Keine sensiblen Daten in diesem MVP; Datenschutz (GDPR) in späteren Versionen erweitern.
- Browser-kompatibel (Chrome, Firefox, etc.).

## 2. Funktionale Anforderungen

### 2.1 Benutzerrollen
- **Admin/Angebotsleiter:** Erstellt Projekte, lädt RFPs hoch, weist Tasks zu, überprüft KI-Generierungen.
- **Teammitglied (Experte/Sales):** Bearbeitet zugewiesene Tasks, lädt Ergänzungen hoch, kollaboriert.
- **KI-Assistent:** Automatisiert Analyse und Generierung (kein echter User, aber integriert).

### 2.2 Kernfunktionen

#### 2.2.1 Dokumenten-Upload und Speicherung
- Upload von RFP-Dokumenten (PDFs) via Drag-and-Drop oder File-Input in der UI.
- Speicherung in Firebase Storage; Metadaten (z. B. Projekt-ID, Upload-Datum) in Firestore.
- Upload von Unternehmenswissen: Expertenprofile (JSON/Excel), Sales-Infos, Kunden-Daten, Word-Templates.
- Für RAG: Automatische Embeddings-Generierung der hochgeladenen Dokumente (Chunks extrahieren, via Grok API embedden, in Firestore speichern).

#### 2.2.2 RFP-Analyse
- Nach Upload: KI (Grok 4.1) parst PDF (Text-Extraktion), identifiziert Schlüsselabschnitte (z. B. Anforderungen, Fristen).
- Generiert Vorschläge: "Was braucht man zum Bearbeiten?" (z. B. benötigte Experten, Ressourcen) basierend auf RAG (Abgleich mit Unternehmens-DB).

#### 2.2.3 Workflow-Management
- Simpler Prozess als Stepper/Timeline in UI: 
  1. RFP erhalten (Upload + Analyse).
  2. Fragen an Kunden stellen (KI-generiert).
  3. Kundentermin zur Klärung (manuelle Notizen, KI-Vorschläge).
  4. Angebot erstellen (Kapitel strukturieren, Texte schreiben).
  5. Angebot versenden (Export als Word/PDF).
- Jeder Schritt: Status-Tracking in Firestore (z. B. "pending", "in progress", "done").
- Task-Zuweisung: Admin weist Teammitglieder zu (via Firestore-Docs, Benachrichtigungen per Email oder Firebase Cloud Messaging).

#### 2.2.4 KI-Unterstützung pro Schritt
- **Schritt 1 (RFP erhalten):** KI analysiert und schlägt Ressourcen vor.
- **Schritt 2 (Fragen stellen):** KI generiert Fragen aus verschiedenen Personas (Sales, Experte, etc.) via Grok-Prompts. Export als Excel (generiert in Backend, Download-Link).
  - Nach Kunden-Antworten: Excel-Upload, KI parst und integriert in RAG.
- **Schritt 3 (Kundentermin):** KI schlägt Agenda-Punkte vor; manuelle Eingabe von Notizen.
- **Schritt 4 (Angebot erstellen):** KI strukturiert Kapitel (basierend auf RFP + Template), generiert Texte mit RAG (z. B. "Einführung: [KI-generierter Text aus Unternehmenswissen]").
  - Anpassung an vorgegebenes Word-Template (Upload in Firebase, füllen via docx-Lib).
- **Schritt 5 (Versenden):** Export des finalen Angebots als Word/PDF.

#### 2.2.5 RAG-Integration
- Standard-RAG: 
  - Retrieval: Suche nach relevanten Chunks in Firestore (Cosine-Similarity auf Embeddings).
  - Augmentation: Füge retrieved Inhalte in Grok-Prompts ein.
  - Generation: Grok 4.1 generiert Antworten.
- Beispiel-Prompt: "Basierend auf RFP [Auszug] und Unternehmenswissen [retrieved Chunks], generiere Fragen aus Sales-Perspektive."

#### 2.2.6 Kollaboration und Bearbeitung
- Echtzeit-Updates via Firestore (z. B. mit React Hooks).
- Kommentar-Funktion pro Schritt (Firestore-Subcollections).
- Versionierung von Dokumenten in Firebase Storage.

#### 2.2.7 UI/UX-Elemente
- Dashboard: Übersicht über aktive Projekte.
- Stepper-Komponente (z. B. mit Material-UI oder custom).
- Forms für Uploads/Bearbeitungen.
- KI-Buttons: "Generiere Vorschläge" (ruft Backend-API auf, die Grok nutzt).

### 2.3 Integrationen
- Keine externen (außer Grok API).
- Interne: Firebase Services (Auth, Firestore, Storage, Functions, Hosting).

## 3. Nicht-funktionale Anforderungen

### 3.1 Leistung
- Ladezeiten: < 2 Sekunden pro Seite.
- KI-Aufrufe: Asynchron, mit Loading-Spinnern.
- Skalierbarkeit: Firebase auto-skaliert; bis 100 User/Projekte im MVP.

### 3.2 Sicherheit
- Auth: Firebase Auth erforderlich für alle Actions.
- Daten: Encryption in Firebase; Zugriffsregeln in Firestore (z. B. nur Owner kann löschen).
- KI: API-Keys sicher in Firebase Environment Variables speichern.

### 3.3 Usability
- Responsiv (Mobile/Desktop).
- Intuitive UI: Keine komplexen Menüs; Fokus auf Workflow-Stepper.
- Zugänglichkeit: ARIA-Labels, Kontrastverhältnisse.

### 3.4 Wartbarkeit
- Code-Struktur: Next.js Pages/API-Routes, separate Komponenten.
- Tests: Unit-Tests für KI-Prompts und RAG (z. B. mit Jest).

## 4. Architektur-Überblick

- **Client-Side:** Next.js Pages für UI, React-State für lokale Daten.
- **Server-Side:** Next.js API-Routes oder Firebase Functions für sensible Logik (z. B. Grok-Aufrufe, Dokument-Processing).
- **Datenfluss:** User → UI → API-Route → Firebase/Grok → Rückgabe an UI.
- **RAG-Pipeline:** Upload → Chunking/Embedding (in Function) → Speicher in Firestore → Query → Retrieve → Grok-Generate.

## 5. Implementierungsplan
- **Phase 1 (Woche 1-2):** Setup (Next.js + Firebase Init, Auth, Basic UI).
- **Phase 2 (Woche 3-4):** Upload/Speicher, RFP-Parsing.
- **Phase 3 (Woche 5-6):** Workflow + KI-Integration (Grok API).
- **Phase 4 (Woche 7-8):** RAG, Excel/Word-Handling.
- **Phase 5 (Woche 9):** Testing, Deployment auf Firebase Hosting.

## 6. Offene Punkte
- API-Key für Grok 4.1 bereitstellen.
- Beispiel-Daten für Testing (Dummy-RFPs, Templates).

Claude, basierend auf diesem Dokument, generiere bitte den initialen Code-Struktur (z. B. Next.js Boilerplate mit Firebase-Integration) und detaillierte Prompts für Grok-Aufrufe. Lass uns iterativ bauen!