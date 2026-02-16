import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { resourceFieldSchema, schemaToPrompt, validateArray } from '@/lib/ai-schema';
import { chatCompletion, extractJson } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { transcript, employees } = await request.json();

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: 'Kein Text vorhanden', resources: [] },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json(
        { error: 'KI-API ist nicht konfiguriert (XAI_API_KEY fehlt)', resources: [] },
        { status: 500 }
      );
    }

    const fieldDescription = schemaToPrompt(resourceFieldSchema, 'Ressource');

    const systemPrompt = `Du bist ein Experte für SAP-Projektkalkulation. Der Benutzer beschreibt Ressourcen für ein SAP-Beratungsprojekt. Parse den Text und extrahiere daraus ein JSON-Array von Ressourcen.

${getSAPContextForPrompt()}

${fieldDescription}

WICHTIG: Der Text kann aus Spracheingabe oder manueller Texteingabe stammen. Interpretiere den Text großzügig:
- "einen Berater" / "ein Consultant" / "ein ein Berater" → eine Ressource (Wiederholungen ignorieren)
- "zwei Entwickler" / "2 Berater" → zwei separate Ressourcen mit gleicher Rolle

Häufige Spracherkennungsfehler:
- "fiberater" = "FI-Berater" (FI = Financial Accounting)
- "ein ein" = "ein" (Wiederholung durch Spracherkennung)
- Modulkürzel können ohne "SAP" Prefix gesprochen werden

Gib NUR ein JSON-Array zurück, ohne weitere Erklärung:
[{ "role": "...", "dailyRate": ..., "plannedDays": ... }]`;

    const text = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Text:\n"${transcript}"\n\n${employees?.length ? `Verfügbare Mitarbeiter:\n${JSON.stringify(employees, null, 2)}` : ''}`,
        },
      ],
      XAI_API_KEY,
      { temperature: 0.3 },
    );

    const raw = extractJson<unknown>(text);
    const parsed = raw == null ? null : Array.isArray(raw) ? raw : [raw];

    if (parsed && Array.isArray(parsed)) {
      const resources = validateArray(parsed, resourceFieldSchema);
      if (resources.length === 0) {
        return NextResponse.json({
          error: 'Keine Ressourcen im Text erkannt. Bitte beschreiben Sie Rolle, Tage und Tagessatz.',
          resources: [],
        });
      }
      return NextResponse.json({ resources });
    }

    return NextResponse.json({
      error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
      resources: [],
    });
  } catch (error) {
    console.error('Parse resources from speech error:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { error: `Fehler bei der Ressourcen-Erkennung: ${message}`, resources: [] },
      { status: 500 }
    );
  }
}
