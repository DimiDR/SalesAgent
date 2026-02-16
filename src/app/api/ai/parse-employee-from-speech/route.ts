import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { employeeFieldSchema, schemaToPrompt, validateItem } from '@/lib/ai-schema';
import { chatCompletion, extractJson } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: 'Kein Text vorhanden', employee: null },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json(
        { error: 'KI-API ist nicht konfiguriert (XAI_API_KEY fehlt)', employee: null },
        { status: 500 }
      );
    }

    const fieldDescription = schemaToPrompt(employeeFieldSchema, 'Mitarbeiter', { mode: 'object' });

    const systemPrompt = `Du bist ein Experte für HR-Datenerfassung in SAP-Beratungsunternehmen. Der Benutzer beschreibt einen neuen Mitarbeiter per Sprache oder Text. Parse den Text und extrahiere daraus ein JSON-Objekt mit den Mitarbeiterdaten.

${getSAPContextForPrompt()}

${fieldDescription}

WICHTIG: Der Text kann aus Spracheingabe oder manueller Texteingabe stammen. Interpretiere den Text großzügig:
- SAP-Rollen korrekt zuordnen: "FI-Berater" → "SAP FI-Berater", "ABAP Entwickler" → "ABAP-Entwickler"
- E-Mail-Adressen: "at" / "ät" → "@", "punkt" → "."
- Skills als einfache String-Liste extrahieren (nur Skill-Namen, kein Level)
- Verfügbarkeit: "frei"/"verfügbar" → "available", "teilweise" → "partially_available", "belegt"/"ausgebucht" → "unavailable"
- Felder die nicht genannt werden → null setzen

Häufige Spracherkennungsfehler:
- "fiberater" = "FI-Berater"
- "äm äm berater" = "MM-Berater"
- "ät" / "et" = "@"
- "punkt" = "."
- Doppelte Wörter ignorieren

Gib NUR ein JSON-Objekt zurück, ohne weitere Erklärung:
{ "firstName": "...", "lastName": "...", "email": "...", ... }`;

    const text = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Text:\n"${transcript}"` },
      ],
      XAI_API_KEY,
      { temperature: 0.3 },
    );

    const raw = extractJson<Record<string, unknown>>(text);

    if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
      const employee = validateItem(raw, employeeFieldSchema);
      if (!employee.firstName && !employee.lastName) {
        return NextResponse.json({
          error: 'Keine Mitarbeiterdaten im Text erkannt. Bitte nennen Sie mindestens Vor- und Nachname.',
          employee: null,
        });
      }
      return NextResponse.json({ employee });
    }

    return NextResponse.json({
      error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
      employee: null,
    });
  } catch (error) {
    console.error('Parse employee from speech error:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { error: `Fehler bei der Mitarbeiter-Erkennung: ${message}`, employee: null },
      { status: 500 }
    );
  }
}
