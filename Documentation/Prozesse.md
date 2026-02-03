✅ **Hier ist die detaillierte Schritt-für-Schritt-Beschreibung des gesamten Prozesses** in deiner RFP-Management-App.

### Der Gesamte Prozess (5 Schritte)

Die App führt den Angebotsprozess linear durch, dargestellt als **Stepper** in der Next.js-Oberfläche (z. B. Fortschrittsbalken oben). Jeder Schritt hat:
- Status-Anzeige (Pending → In Bearbeitung → Abgeschlossen)
- „KI unterstützen“-Button
- Task-Zuweisung an Teammitglieder
- Speicherung aller Daten in Firebase (Firestore + Storage)

#### Schritt 1: RFP Erhalten
**Ziel:** Das RFP-Dokument wird hochgeladen und analysiert.

**Ablauf:**
1. Angebotsleiter lädt das RFP-PDF (und ggf. weitere Anhänge) per Drag-and-Drop hoch.
2. Dokument wird in Firebase Storage gespeichert.
3. Metadaten (Projektname, Kunde, Deadline, Upload-Datum) werden in Firestore angelegt.
4. Status wird auf „In Bearbeitung“ gesetzt.

**Wie die KI (Grok 4.1) unterstützt:**
- Automatische Text-Extraktion aus dem PDF
- Semantische Analyse: Identifiziert Anforderungen, Scope, Fristen, Bewertungskriterien, Budget-Hinweise
- Erstellt eine **Gap-Analyse** (Was fehlt uns? Was passt gut zu uns?)
- Generiert eine **Ressourcen-Checkliste** (benötigte Experten, Abteilungen, Tools, Budgetschätzung)
- Nutzt RAG: Vergleicht RFP mit hochgeladenen Unternehmensdokumenten (vergangene Angebote, Referenzprojekte)

**KI-Output-Beispiel:**
- „Hohe Passung (82%) zu unseren Cloud-Projekten“
- „Kritische Lücken: Keine Angabe zu Skalierbarkeitsanforderungen“
- „Empfohlene Teammitglieder: Senior Cloud Architect, Sales Lead Industrie X“

#### Schritt 2: Fragen Gestellt
**Ziel:** Klärende Fragen an den Kunden formulieren und versenden.

**Ablauf:**
1. KI generiert Fragen-Vorschläge
2. Team prüft, ergänzt oder entfernt Fragen
3. Fragen werden als Excel-Datei exportiert (Spalten: Nr., Persona, Frage, Begründung, Priorität)
4. Excel wird per E-Mail an Kunden geschickt
5. Nach Rücksendung: Excel wieder hochladen → KI integriert die Antworten

**Wie die KI unterstützt:**
- Generiert Fragen aus **mehreren Personas**:
  - Sales-Perspektive (Budget, Timeline, Entscheidungsprozess)
  - Technische Experten-Perspektive (Spezifikationen, Integration, Security)
  - Projektmanagement-Perspektive (Ressourcen, Risiken)
  - Kunden-Perspektive (Pain-Points, Erwartungen)
- Priorisiert die Fragen nach Relevanz und Risiko
- Nutzt RAG für personalisierte Fragen (z. B. „Ähnlich wie bei Kunde Y im letzten Jahr…“)

**KI-Output:** Excel-Datei mit 15–30 Fragen + Begründungen

#### Schritt 3: Kundentermin zur Klärung Gehalten
**Ziel:** Meeting vorbereiten, durchführen und nachbereiten.

**Ablauf:**
1. Team bereitet Agenda vor
2. Termin wird durchgeführt (extern, z. B. via Teams/Zoom)
3. Nach dem Termin: Protokoll/Notizen in der App erfassen
4. Wichtige Erkenntnisse werden dokumentiert

**Wie die KI unterstützt:**
- Generiert **professionelle Agenda** (mit Zeitangaben und Zielen)
- Schlägt Diskussionspunkte basierend auf offenen RFP-Fragen vor
- Nach Upload der Notizen/Protokoll:
  - Extrahiert Key-Insights, neue Anforderungen, Änderungswünsche
  - Aktualisiert den internen Kontext automatisch
  - Erzeugt Zusammenfassung und To-do-Liste

**KI-Output:** 
- Agenda-Dokument
- Nachbereitung: „Neue Anforderung: Multi-Cloud-Support hinzugefügt“, „Budget wurde auf 450k € bestätigt“

#### Schritt 4: Angebot Erstellt
**Ziel:** Das vollständige Angebot erstellen.

**Ablauf:**
1. Word-Template wird hochgeladen (einmalig oder pro Projekt)
2. KI generiert die Kapitel-Struktur
3. KI füllt die Abschnitte mit Inhalten
4. Team bearbeitet den Entwurf kollaborativ
5. Finale Version wird freigegeben

**Wie die KI unterstützt:**
- Erstellt **Kapitel-Struktur** passend zum Word-Template und Unternehmensstandard (z. B. Deckblatt → Executive Summary → Lösung → Preise → Risiken → Anhang)
- Generiert **vollständige Textentwürfe** für jeden Abschnitt unter Nutzung von:
  - RFP-Inhalt
  - Kunden-Antworten aus Schritt 2+3
  - RAG-Unternehmenswissen (Referenzen, Lösungsbeschreibungen, USPs)
- Passt Tonfall, Länge und Struktur an das Template an
- Erzeugt Tabellen (z. B. Preisübersicht, Meilensteinplan)

**KI-Output:** Vorgefülltes Word-Dokument (ca. 70-85 % fertig)

#### Schritt 5: Angebot Angeschickt
**Ziel:** Finale Qualitätsprüfung und Versand.

**Ablauf:**
1. Finale Review durch Angebotsleiter/Team
2. Freigabe
3. Export als PDF/Word
4. Versand per E-Mail oder Portal
5. Projekt wird als „Abgeschlossen“ markiert

**Wie die KI unterstützt:**
- Führt **Vollständigkeits-Check** durch („Sind alle RFP-Anforderungen abgedeckt?“)
- Prüft auf Risiken, Inkonsistenzen, Compliance
- Generiert **personalisierte Anschreiben/E-Mail-Vorlage**
- Erstellt Zusammenfassung für das CRM oder interne Archivierung
- Speichert alle Versionen für zukünftige RAG-Nutzung

**KI-Output:** 
- Compliance-Report
- Fertiges Anschreiben
- Win/Loss-Analyse-Vorschau (optional)

### Zusammenfassung der KI-Unterstützung
Die KI ist in **jedem Schritt aktiv** beteiligt und übernimmt den Großteil der analytischen und textuellen Arbeit.  
Sie nutzt immer **RAG**, um auf dein Unternehmenswissen zuzugreifen.  
Der Mensch bleibt für strategische Entscheidungen, Kundenkommunikation und finale Freigabe verantwortlich.

Möchtest du zu einem bestimmten Schritt noch mehr Details (z. B. konkrete Prompt-Beispiele für Grok oder UI-Beschreibung)?