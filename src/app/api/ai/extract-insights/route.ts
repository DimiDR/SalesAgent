import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { insightResponseSchema, schemaToPrompt, validateItem } from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

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

    const fieldDescription = schemaToPrompt(insightResponseSchema, 'Ergebnis', { mode: 'object' });

    const systemPrompt = `Du bist ein erfahrener SAP-Business-Analyst. Analysiere die Meeting-Notizen im Kontext eines SAP-Beratungsprojekts und extrahiere:
1. Key-Insights: Wichtige Erkenntnisse aus dem Gespräch (insbesondere zu SAP-Systemlandschaft, Modulen, Anforderungen)
2. Action Items: Konkrete To-Dos für das SAP-Projektteam

${getSAPContextForPrompt()}

${fieldDescription}`;

    if (XAI_API_KEY) {
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

      const parsed = extractJson<Record<string, unknown>>(resultText);

      if (parsed) {
        const result = validateItem(parsed, insightResponseSchema);
        return NextResponse.json(result);
      }
    }

    // Fallback mock response
    return NextResponse.json({
      insights: [
        'Kunde nutzt aktuell SAP ECC 6.0 EHP8 mit den Modulen FI, CO, MM und SD',
        'Migration auf S/4HANA Cloud (RISE with SAP) ist bevorzugt',
        'Ca. 200 Z-Programme/Eigenentwicklungen müssen auf Clean Core geprüft werden',
        'Fiori-Oberflächen für Einkauf und Vertrieb haben hohe Priorität',
      ],
      actionItems: [
        'Custom-Code-Analyse mit SAP Readiness Check durchführen',
        'Fit-to-Standard Workshop für FI/CO planen',
        'Datenmigrationsstrategie für Stammdaten und Bewegungsdaten erstellen',
        'SAP BTP-Architektur für Integrationsszenarien ausarbeiten',
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
