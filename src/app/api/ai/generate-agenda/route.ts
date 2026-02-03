import { NextRequest, NextResponse } from 'next/server';

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

    const systemPrompt = `Du bist ein erfahrener Projektmanager. Erstelle eine professionelle Meeting-Agenda für ein Klärungsgespräch mit dem Kunden. Die Agenda sollte:
- Strukturiert und zeitlich geplant sein
- Alle offenen Punkte aus dem RFP adressieren
- Raum für Fragen und Diskussion lassen

Gib die Agenda als JSON-Objekt mit einem "agenda"-Array zurück. Jedes Element hat:
- id: eindeutige ID
- title: Agendapunkt
- description: Kurze Beschreibung
- duration: Geschätzte Dauer in Minuten
- order: Reihenfolge`;

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

      const jsonMatch = agendaText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        agendaText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        const agenda = parsed.agenda || parsed;

        return NextResponse.json({
          id: crypto.randomUUID(),
          projectId,
          agenda: agenda.map((item: Record<string, unknown>, idx: number) => ({
            ...item,
            id: item.id || crypto.randomUUID(),
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
          description: 'Kurze Vorstellung der Teilnehmer',
          duration: 10,
          order: 1,
        },
        {
          id: crypto.randomUUID(),
          title: 'Projektverständnis klären',
          description: 'Zusammenfassung des RFP und Klärung offener Punkte',
          duration: 20,
          order: 2,
        },
        {
          id: crypto.randomUUID(),
          title: 'Technische Anforderungen',
          description: 'Diskussion der technischen Details',
          duration: 25,
          order: 3,
        },
        {
          id: crypto.randomUUID(),
          title: 'Budget und Timeline',
          description: 'Klärung des Budgetrahmens',
          duration: 15,
          order: 4,
        },
        {
          id: crypto.randomUUID(),
          title: 'Nächste Schritte',
          description: 'Vereinbarung des weiteren Vorgehens',
          duration: 10,
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
