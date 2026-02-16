import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { agendaItemSchema, schemaToPrompt, validateArray } from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, analysis, unansweredQuestions } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fieldDescription = schemaToPrompt(agendaItemSchema, 'Agendapunkt');

    const systemPrompt = `Du bist ein erfahrener SAP-Projektmanager. Erstelle eine professionelle Meeting-Agenda für ein Klärungsgespräch mit dem Kunden zu einem SAP-Projekt. Die Agenda sollte:
- Strukturiert und zeitlich geplant sein
- Alle offenen Punkte aus dem RFP adressieren
- SAP-spezifische Themen berücksichtigen (Systemlandschaft, Module, Migrationsstrategie, Lizenzmodell)
- Raum für Fragen und Diskussion lassen
- Sich an SAP Activate-Phasen orientieren (Discover, Prepare, Explore, Realize, Deploy, Run)

${getSAPContextForPrompt()}

Gib die Agenda als JSON-Objekt mit einem "agenda"-Array zurück.
${fieldDescription}`;

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
              content: `RFP-Analyse:\n${JSON.stringify(analysis, null, 2)}\n\nOffene Fragen:\n${JSON.stringify(unansweredQuestions, null, 2)}\n\nErstelle eine Meeting-Agenda.`,
            },
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const agendaText = data.choices[0]?.message?.content;

      const parsed = extractJson<Record<string, unknown>>(agendaText);

      if (parsed) {
        const rawAgenda = Array.isArray(parsed) ? parsed : (parsed.agenda as unknown[] || []);
        const agenda = validateArray(rawAgenda, agendaItemSchema);

        return NextResponse.json({
          id: crypto.randomUUID(),
          projectId,
          agenda: agenda.map((item, idx) => ({
            ...item,
            id: crypto.randomUUID(),
            order: item.order || idx + 1,
          })),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Fallback mock response
    return NextResponse.json({
      id: crypto.randomUUID(),
      projectId,
      agenda: [
        {
          id: crypto.randomUUID(),
          title: 'Begrüßung und Vorstellung',
          description: 'Vorstellung der Teilnehmer und Projektteams',
          duration: 10,
          order: 1,
        },
        {
          id: crypto.randomUUID(),
          title: 'SAP-Systemlandschaft & Ist-Analyse',
          description: 'Aktuelle SAP-Systemlandschaft (ECC Release, Module, Eigenentwicklungen) und Pain-Points',
          duration: 20,
          order: 2,
        },
        {
          id: crypto.randomUUID(),
          title: 'Anforderungen & Zielbild S/4HANA',
          description: 'Diskussion der fachlichen Anforderungen, Ziel-Module und Migrationsstrategie (Greenfield/Brownfield)',
          duration: 25,
          order: 3,
        },
        {
          id: crypto.randomUUID(),
          title: 'Projektansatz & SAP Activate',
          description: 'Vorstellung des Projektansatzes, Fit-to-Standard, Timeline und Lizenzmodell (RISE/GROW)',
          duration: 20,
          order: 4,
        },
        {
          id: crypto.randomUUID(),
          title: 'Budget, Ressourcen & nächste Schritte',
          description: 'Klärung des Budgetrahmens, Ressourcenplanung und Vereinbarung des weiteren Vorgehens',
          duration: 15,
          order: 5,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Agenda generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
