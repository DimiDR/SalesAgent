import { NextRequest, NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, analysis, meeting, answeredQuestions, templateId } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `Du bist ein erfahrener Angebotsschreiber. Erstelle eine professionelle Kapitelstruktur für ein Beratungsangebot. Die Struktur sollte:
- Alle wichtigen Aspekte des RFP adressieren
- Dem Standard-Format für Beratungsangebote folgen
- Klar und logisch aufgebaut sein

Gib die Struktur als JSON-Array von Kapiteln zurück:
- id: eindeutige ID
- title: Kapitelüberschrift
- order: Reihenfolge
- status: 'pending'`;

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
              content: `RFP-Analyse:\n${JSON.stringify(analysis, null, 2)}\n\nMeeting-Insights:\n${JSON.stringify(meeting?.insights || [], null, 2)}\n\nErstelle eine Kapitelstruktur für das Angebot.`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const structureText = data.choices[0]?.message?.content;

      const jsonMatch = structureText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        structureText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const chapters = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return NextResponse.json({
          id: crypto.randomUUID(),
          projectId,
          templateId,
          chapters: chapters.map((ch: Record<string, unknown>, idx: number) => ({
            ...ch,
            id: ch.id || crypto.randomUUID(),
            order: ch.order || idx + 1,
            content: '',
            status: 'pending',
          })),
          status: 'draft',
          version: 1,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Fallback mock structure
    return NextResponse.json({
      id: crypto.randomUUID(),
      projectId,
      templateId,
      chapters: [
        { id: crypto.randomUUID(), title: 'Deckblatt', order: 1, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Executive Summary', order: 2, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Ausgangssituation und Zielsetzung', order: 3, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Unser Lösungsansatz', order: 4, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Projektmethodik', order: 5, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Zeitplan und Meilensteine', order: 6, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Unser Team', order: 7, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Investition', order: 8, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Warum wir', order: 9, content: '', status: 'pending' },
        { id: crypto.randomUUID(), title: 'Anhang', order: 10, content: '', status: 'pending' },
      ],
      status: 'draft',
      version: 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Structure generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
