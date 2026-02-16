import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { proposalFieldsSchema, schemaToPrompt, validateItem } from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { text, existingData } = await request.json();

    if (!text) {
      return NextResponse.json(
        { error: 'Missing required field: text' },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json({});
    }

    const existingContext = existingData && Object.keys(existingData).length > 0
      ? `\n\nBereits bekannte Daten (nicht nochmal extrahieren, es sei denn der Benutzer korrigiert sie):\n${JSON.stringify(existingData, null, 2)}`
      : '';

    const fieldDescription = schemaToPrompt(proposalFieldsSchema, 'Ergebnis', { mode: 'object' });

    const systemPrompt = `Du bist ein Extraktions-Assistent für SAP-Beratungsangebote. Deine Aufgabe ist es, aus dem Text des Benutzers strukturierte Felder zu extrahieren.

${getSAPContextForPrompt()}

Extrahiere NUR die Felder, die du im Text eindeutig erkennen kannst. Setze nicht erkannte Felder auf null.

${fieldDescription}

Wichtige Regeln:
- Gib NUR valides JSON zurück, keine Erklärungen
- Wenn ein Feld nicht im Text vorkommt, setze es auf null
- Interpretiere SAP-spezifische Begriffe korrekt (z.B. "S/4 Migration" = SAP S/4HANA Migration)${existingContext}`;

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
            content: text,
          },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error('Grok API call failed');
    }

    const data = await response.json();
    const resultText = data.choices[0]?.message?.content;

    const parsed = extractJson<Record<string, unknown>>(resultText);

    if (parsed) {
      const validated = validateItem(parsed, proposalFieldsSchema);

      // Filter out null values so only recognized fields are returned
      const result: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(validated)) {
        if (value !== null && value !== undefined && value !== '') {
          result[key] = value;
        }
      }

      return NextResponse.json(result);
    }

    // Could not parse JSON from AI response
    return NextResponse.json({});
  } catch (error) {
    console.error('Proposal field extraction error:', error);
    return NextResponse.json({});
  }
}
