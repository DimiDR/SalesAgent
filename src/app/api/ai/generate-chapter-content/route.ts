import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, chapterId, chapterTitle, analysis, meeting, answeredQuestions } = await request.json();

    if (!projectId || !chapterId || !chapterTitle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `Du bist ein erfahrener Angebotsschreiber für SAP-Beratungsprojekte. Schreibe den Inhalt für das Kapitel "${chapterTitle}" eines SAP-Beratungsangebots.

${getSAPContextForPrompt()}

Der Text sollte:
- Professionell und überzeugend sein, mit korrekter SAP-Terminologie
- Auf die spezifischen SAP-Anforderungen des Kunden eingehen
- SAP Best Practices und Methodik (SAP Activate) berücksichtigen
- Klar strukturiert sein (Markdown-Format)
- Circa 200-400 Wörter umfassen

Gib nur den Kapitelinhalt zurück, ohne zusätzliche Erklärungen.`;

    if (XAI_API_KEY && analysis) {
      const response = await fetch(`${XAI_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${XAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'grok-4-1-fast-non-reasoning',
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: `Kontext:
RFP-Zusammenfassung: ${analysis?.summary || 'Nicht verfügbar'}
Anforderungen: ${JSON.stringify(analysis?.requirements || [])}
Meeting-Insights: ${JSON.stringify(meeting?.insights || [])}

Schreibe den Inhalt für das Kapitel "${chapterTitle}".`,
            },
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;

      return NextResponse.json({ content });
    }

    // Fallback mock content based on chapter title
    const mockContents: Record<string, string> = {
      'Executive Summary': `## Executive Summary

Wir freuen uns, Ihnen unser Angebot für Ihre S/4HANA-Transformation zu unterbreiten. Als erfahrener SAP-Beratungspartner bieten wir eine ganzheitliche Lösung, die SAP Best Practices mit nachhaltigem Wissenstransfer verbindet.

**Unsere Lösung umfasst:**
- Umfassende Analyse Ihrer bestehenden SAP-Systemlandschaft
- S/4HANA-Migration nach SAP Activate-Methodik
- Fit-to-Standard-Ansatz mit Clean-Core-Strategie
- Implementierung moderner SAP Fiori-Oberflächen
- Schulung Ihrer Key-User und Endanwender

Wir sind überzeugt, der ideale Partner für Ihre SAP-Transformation zu sein und freuen uns auf die Zusammenarbeit.`,

      'Unser Lösungsansatz': `## Unser Lösungsansatz

Basierend auf unserer Analyse Ihres RFP und der aktuellen SAP-Systemlandschaft schlagen wir folgenden Ansatz vor:

### Discover & Prepare Phase
- SAP Readiness Check und Custom Code Analyse
- Fit-to-Standard Workshops für alle relevanten Module (FI/CO, MM, SD)
- Definition der Migrationsstrategie (Greenfield/Brownfield/Bluefield)

### Explore & Realize Phase
- Konfiguration der S/4HANA-Standardprozesse
- Entwicklung notwendiger Erweiterungen (ABAP on HANA, RAP, Fiori)
- Integration via SAP BTP/Integration Suite
- Datenmigration und Testzyklen

### Deploy & Run Phase
- Cutover-Planung und Go-Live-Unterstützung
- Hypercare-Phase mit dediziertem Support
- Übergabe an den Regelbetrieb und Wissenstransfer`,

      'Unser Team': `## Unser Team

Für Ihr SAP-Projekt stellen wir ein erfahrenes, zertifiziertes Team zusammen:

**Projektleitung:**
- SAP-zertifizierter Projektmanager mit Erfahrung in S/4HANA-Transformationen

**SAP-Berater:**
- Senior S/4HANA Solution Architect
- SAP FI/CO-Berater mit Migrationserfahrung
- SAP MM/SD-Berater für Logistikprozesse

**Entwicklung:**
- ABAP on HANA / RAP-Entwickler
- SAP Fiori/SAPUI5-Entwickler
- SAP BTP Integration-Spezialist

**Basis & Operations:**
- SAP Basis-Berater für Systemlandschaft und Cloud-Migration
- Dedizierter SAP Support nach Go-Live

Alle Teammitglieder verfügen über relevante SAP-Zertifizierungen und umfangreiche Projekterfahrung.`,
    };

    const content = mockContents[chapterTitle] ||
      `## ${chapterTitle}\n\n[Generierter Inhalt für dieses Kapitel basierend auf den Projektanforderungen und dem Kundenkontext.]\n\nDieser Abschnitt wird automatisch mit relevanten Informationen gefüllt.`;

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Content generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
