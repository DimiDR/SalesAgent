import { NextRequest, NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, notes } = await request.json();

    if (!projectId || !notes) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `Du bist ein erfahrener Business Analyst. Analysiere die Meeting-Notizen und extrahiere:
1. Key-Insights: Wichtige Erkenntnisse aus dem Gespräch
2. Action Items: Konkrete To-Dos für das Team

Gib das Ergebnis als JSON zurück mit:
- insights: Array von Strings mit den wichtigsten Erkenntnissen
- actionItems: Array von Strings mit konkreten Aufgaben`;

    if (XAI_API_KEY) {
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
              content: `Meeting-Notizen:\n${notes}\n\nExtrahiere Insights und Action Items.`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const resultText = data.choices[0]?.message?.content;

      const jsonMatch = resultText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        resultText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return NextResponse.json(result);
      }
    }

    // Fallback mock response
    return NextResponse.json({
      insights: [
        'Kunde bevorzugt Azure als Cloud-Plattform',
        'Budget wurde bestätigt',
        'Sicherheit hat höchste Priorität',
      ],
      actionItems: [
        'Azure-Architektur ausarbeiten',
        'Schulungskonzept erstellen',
        'Compliance-Checkliste vorbereiten',
      ],
    });
  } catch (error) {
    console.error('Insight extraction error:', error);
    return NextResponse.json(
      { error: 'Extraction failed' },
      { status: 500 }
    );
  }
}
