import { NextRequest, NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, proposal, analysis } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `Du bist ein erfahrener Vertriebsprofi. Schreibe ein professionelles Anschreiben für die Übersendung eines Beratungsangebots. Das Anschreiben sollte:
- Persönlich und professionell sein
- Die wichtigsten Vorteile hervorheben
- Zum Handeln auffordern
- Etwa 150-200 Wörter umfassen

Gib nur den Brief-Text zurück.`;

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
              content: `Projektkontext:
${analysis?.summary || 'IT-Beratungsprojekt'}

Schreibe ein Anschreiben für die Übersendung des Angebots.`,
            },
          ],
          temperature: 0.6,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const letter = data.choices[0]?.message?.content;

      return NextResponse.json({ letter });
    }

    // Fallback mock letter
    return NextResponse.json({
      letter: `Sehr geehrte Damen und Herren,

vielen Dank für die Möglichkeit, Ihnen unser Angebot zu unterbreiten.

Nach eingehender Analyse Ihrer Anforderungen sind wir überzeugt, der ideale Partner für Ihr Projekt zu sein. Unser Vorschlag kombiniert bewährte Methodik mit modernster Technologie und einem erfahrenen Projektteam.

**Highlights unseres Angebots:**
- Ganzheitlicher Ansatz von Assessment bis Support
- Erfahrenes Team mit relevanter Expertise
- Flexibles Preismodell mit garantiertem Budget
- Kontinuierliche Betreuung während der gesamten Projektlaufzeit

Wir freuen uns auf die Gelegenheit, dieses Projekt gemeinsam mit Ihnen umzusetzen und stehen für Rückfragen jederzeit zur Verfügung.

Mit freundlichen Grüßen

[Ihr Name]
[Position]
[Kontaktdaten]`,
    });
  } catch (error) {
    console.error('Cover letter generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
