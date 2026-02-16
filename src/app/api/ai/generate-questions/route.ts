import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { questionSchema, schemaToPrompt, validateArray } from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

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

    const fieldDescription = schemaToPrompt(questionSchema, 'Frage');

    const systemPrompt = `Du bist ein erfahrener SAP-Vertriebsberater. Basierend auf der RFP-Analyse, generiere Fragen aus verschiedenen Perspektiven:
1. Sales-Perspektive: Budget, Timeline, Entscheidungsprozess, Lizenzmodell (RISE/GROW with SAP)
2. Technische Perspektive: SAP-Systemlandschaft, Module, Customizing, ABAP-Entwicklung, Integration, Cloud vs. On-Premise
3. Projektmanagement-Perspektive: Ressourcen, Risiken, SAP Activate-Methodik, Go-Live-Planung
4. Kunden-Perspektive: Pain-Points mit bestehendem SAP-System, Erwartungen an S/4HANA-Transformation

${getSAPContextForPrompt()}

${fieldDescription}

Gib die Fragen als JSON-Array zurück.`;

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

      const parsed = extractJson<unknown[]>(questionsText);

      if (parsed && Array.isArray(parsed)) {
        const questions = validateArray(parsed, questionSchema);
        return NextResponse.json(
          questions.map((q) => ({
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
        question: 'Welches Lizenzmodell bevorzugen Sie – RISE with SAP oder GROW with SAP?',
        reasoning: 'Bestimmt den Implementierungsansatz und die Kostenstruktur',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        projectId,
        persona: 'technical',
        question: 'Welchen SAP ECC Release-Stand nutzen Sie aktuell und wie viele Z-Entwicklungen (Custom ABAP) sind im System?',
        reasoning: 'Bestimmt den Migrationsaufwand und die Clean-Core-Strategie',
        priority: 'high',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        projectId,
        persona: 'project_management',
        question: 'Haben Sie bereits Erfahrung mit der SAP Activate-Methodik und stehen interne Key-User als Projektteam zur Verfügung?',
        reasoning: 'Wichtig für die Projektplanung und den Fit-to-Standard-Ansatz',
        priority: 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
      {
        id: crypto.randomUUID(),
        projectId,
        persona: 'customer',
        question: 'Was sind Ihre größten Pain-Points mit dem aktuellen SAP-System und welche Prozesse sollen mit S/4HANA optimiert werden?',
        reasoning: 'Hilft bei der Fokussierung auf Quick-Wins und Kundennutzen',
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
