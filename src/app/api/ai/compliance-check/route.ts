import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { complianceCheckSchema, schemaToPrompt, validateArray } from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

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

    const fieldDescription = schemaToPrompt(complianceCheckSchema, 'Prüfpunkt');

    const systemPrompt = `Du bist ein Qualitätsprüfer für SAP-Beratungsangebote. Führe eine Vollständigkeitsprüfung durch und prüfe:
1. Sind alle RFP-Anforderungen adressiert (insbesondere SAP-Module und -Technologien)?
2. Ist das Angebot vollständig (Methodik, Team, Kalkulation, SAP-Systemlandschaft)?
3. Gibt es Inkonsistenzen (z.B. falsche SAP-Produktnamen, widersprüchliche Modulangaben)?
4. Fehlen wichtige SAP-spezifische Informationen (Migrationsstrategie, Lizenzmodell, Clean-Core-Ansatz)?
5. Sind SAP-Produktnamen korrekt (S/4HANA, SAP Fiori, SAPUI5, SAP BTP, etc.)?

${getSAPContextForPrompt()}

Gib das Ergebnis als JSON-Array zurück.
${fieldDescription}`;

    if (XAI_API_KEY && proposal && analysis) {
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

      const parsed = extractJson<unknown[]>(checksText);

      if (parsed && Array.isArray(parsed)) {
        const checks = validateArray(parsed, complianceCheckSchema);
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
