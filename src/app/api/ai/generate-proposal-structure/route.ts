import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { chapterSchema, schemaToPrompt, validateArray, DEFAULT_CHAPTER_TITLES } from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

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

    const fieldDescription = schemaToPrompt(chapterSchema, 'Kapitel');

    const systemPrompt = `Du bist ein erfahrener Angebotsschreiber für SAP-Beratungsprojekte. Erstelle eine professionelle Kapitelstruktur für ein SAP-Beratungsangebot. Die Struktur sollte:
- Alle wichtigen Aspekte des RFP adressieren, insbesondere SAP-spezifische Themen
- Dem Standard-Format für SAP-Beratungsangebote folgen
- SAP Activate-Methodik und Migrationsstrategie berücksichtigen
- Klar und logisch aufgebaut sein

${getSAPContextForPrompt()}

Gib die Struktur als JSON-Array von Kapiteln zurück.
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

      const parsed = extractJson<unknown[]>(structureText);

      if (parsed && Array.isArray(parsed)) {
        const chapters = validateArray(parsed, chapterSchema);
        return NextResponse.json({
          id: crypto.randomUUID(),
          projectId,
          templateId,
          chapters: chapters.map((ch, idx) => ({
            ...ch,
            id: crypto.randomUUID(),
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

    // Fallback mock structure using default chapter titles
    return NextResponse.json({
      id: crypto.randomUUID(),
      projectId,
      templateId,
      chapters: DEFAULT_CHAPTER_TITLES.map((title, idx) => ({
        id: crypto.randomUUID(),
        title,
        order: idx + 1,
        content: '',
        status: 'pending',
      })),
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
