import { NextRequest, NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, analysis } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const systemPrompt = `Du bist ein erfahrener Vertriebsberater. Basierend auf der RFP-Analyse, generiere Fragen aus verschiedenen Perspektiven:
1. Sales-Perspektive: Budget, Timeline, Entscheidungsprozess
2. Technische Perspektive: Spezifikationen, Integration, Security
3. Projektmanagement-Perspektive: Ressourcen, Risiken
4. Kunden-Perspektive: Pain-Points, Erwartungen

Für jede Frage gib an:
- persona: 'sales' | 'technical' | 'project_management' | 'customer'
- question: Die Frage
- reasoning: Warum diese Frage wichtig ist
- priority: 'high' | 'medium' | 'low'

Gib die Fragen als JSON-Array zurück.`;

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
              content: `RFP-Analyse:\n${JSON.stringify(analysis, null, 2)}\n\nGeneriere 10-15 relevante Fragen als JSON-Array.`,
            },
          ],
          temperature: 0.5,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const questionsText = data.choices[0]?.message?.content;

      const jsonMatch = questionsText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        questionsText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const questions = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return NextResponse.json(
          questions.map((q: Record<string, unknown>) => ({
            id: crypto.randomUUID(),
            projectId,
            ...q,
            status: 'pending',
            createdAt: new Date().toISOString(),
          }))
        );
      }
    }

    // Fallback mock response
    const mockQuestions = [
      {
        id: crypto.randomUUID(),
        projectId,
        persona: 'sales',
        question: 'Welches Budget haben Sie für dieses Projekt eingeplant?',
        reasoning: 'Ermöglicht genaue Kostenkalkulation',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        projectId,
        persona: 'technical',
        question: 'Welche Cloud-Plattform bevorzugen Sie?',
        reasoning: 'Bestimmt technische Architektur',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        projectId,
        persona: 'project_management',
        question: 'Welche internen Ressourcen können bereitgestellt werden?',
        reasoning: 'Wichtig für Projektplanung',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        projectId,
        persona: 'customer',
        question: 'Was sind Ihre größten Schmerzpunkte mit der aktuellen Lösung?',
        reasoning: 'Hilft bei Fokussierung auf Kundennutzen',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    ];

    return NextResponse.json(mockQuestions);
  } catch (error) {
    console.error('Question generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
