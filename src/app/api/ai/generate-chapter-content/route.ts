import { NextRequest, NextResponse } from 'next/server';

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

    const systemPrompt = `Du bist ein erfahrener Angebotsschreiber für IT-Beratungsprojekte. Schreibe den Inhalt für das Kapitel "${chapterTitle}" eines Beratungsangebots.

Der Text sollte:
- Professionell und überzeugend sein
- Auf die spezifischen Kundenanforderungen eingehen
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
          model: 'grok-2-latest',
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

Wir freuen uns, Ihnen unser Angebot für Ihr Transformationsprojekt zu unterbreiten. Als erfahrener Partner im Bereich IT-Beratung bieten wir eine ganzheitliche Lösung, die technische Exzellenz mit nachhaltigem Wissenstransfer verbindet.

**Unsere Lösung umfasst:**
- Vollständige Analyse und Planung
- Implementierung nach Best Practices
- Umfassende Schulung Ihres Teams
- Kontinuierlicher Support

Wir sind überzeugt, der ideale Partner für dieses Projekt zu sein und freuen uns auf die Zusammenarbeit.`,

      'Unser Lösungsansatz': `## Unser Lösungsansatz

Basierend auf unserer Analyse schlagen wir einen dreistufigen Ansatz vor:

### Phase 1: Assessment & Planung
- Detaillierte Ist-Analyse
- Erstellung der Zielarchitektur
- Migrationsplan mit Risikobewertung

### Phase 2: Implementierung
- Schrittweise Umsetzung
- Kontinuierliches Testing
- Regelmäßige Status-Updates

### Phase 3: Optimierung & Übergabe
- Performance-Optimierung
- Schulungen und Dokumentation
- Übergabe an den Regelbetrieb`,

      'Unser Team': `## Unser Team

Für Ihr Projekt stellen wir ein erfahrenes Team zusammen:

**Projektleitung:**
- Erfahrener Projektmanager mit PMP-Zertifizierung

**Technisches Team:**
- Senior Architects mit Cloud-Expertise
- Erfahrene Entwickler und DevOps-Engineers
- Security-Spezialisten

**Support:**
- Dedizierter Account Manager
- 24/7 Support-Hotline

Alle Teammitglieder verfügen über relevante Zertifizierungen und umfangreiche Projekterfahrung.`,
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
