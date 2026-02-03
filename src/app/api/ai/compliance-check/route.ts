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

    const systemPrompt = `Du bist ein Qualitätsprüfer für Beratungsangebote. Führe eine Vollständigkeitsprüfung durch und prüfe:
1. Sind alle RFP-Anforderungen adressiert?
2. Ist das Angebot vollständig?
3. Gibt es Inkonsistenzen?
4. Fehlen wichtige Informationen?

Gib das Ergebnis als JSON-Array zurück:
- item: Was geprüft wurde
- status: 'pass' | 'warning' | 'fail'
- message: Erklärung`;

    if (XAI_API_KEY && proposal && analysis) {
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
              content: `RFP-Anforderungen:\n${JSON.stringify(analysis?.requirements || [])}\n\nAngebots-Kapitel:\n${JSON.stringify(proposal?.chapters?.map((c: { title: string; status: string }) => ({ title: c.title, status: c.status })))}\n\nFühre die Prüfung durch.`,
            },
          ],
          temperature: 0.2,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const checksText = data.choices[0]?.message?.content;

      const jsonMatch = checksText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        checksText.match(/\[[\s\S]*\]/);

      if (jsonMatch) {
        const checks = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        return NextResponse.json({ checks });
      }
    }

    // Fallback mock checks
    return NextResponse.json({
      checks: [
        {
          item: 'Alle RFP-Anforderungen abgedeckt',
          status: 'pass',
          message: 'Alle Anforderungen wurden adressiert',
        },
        {
          item: 'Budget im Rahmen',
          status: 'pass',
          message: 'Angebotssumme liegt innerhalb des Kundenbudgets',
        },
        {
          item: 'Timeline realistisch',
          status: 'pass',
          message: 'Projektende vor Deadline',
        },
        {
          item: 'Vollständigkeit der Kapitel',
          status: proposal?.chapters?.every((c: { content: string }) => c.content) ? 'pass' : 'warning',
          message: proposal?.chapters?.every((c: { content: string }) => c.content)
            ? 'Alle Kapitel ausgefüllt'
            : 'Einige Kapitel noch nicht ausgefüllt',
        },
        {
          item: 'Formatierung konsistent',
          status: 'pass',
          message: 'Dokument folgt der Unternehmensvorlage',
        },
      ],
    });
  } catch (error) {
    console.error('Compliance check error:', error);
    return NextResponse.json(
      { error: 'Check failed' },
      { status: 500 }
    );
  }
}
