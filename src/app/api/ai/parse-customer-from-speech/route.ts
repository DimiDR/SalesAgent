import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { customerFieldSchema, schemaToPrompt, validateItem } from '@/lib/ai-schema';
import { chatCompletion, extractJson } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;

export async function POST(request: NextRequest) {
  try {
    const { transcript } = await request.json();

    if (!transcript?.trim()) {
      return NextResponse.json(
        { error: 'Kein Text vorhanden', customer: null },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json(
        { error: 'KI-API ist nicht konfiguriert (XAI_API_KEY fehlt)', customer: null },
        { status: 500 }
      );
    }

    const fieldDescription = schemaToPrompt(customerFieldSchema, 'Kunde', { mode: 'object' });

    const systemPrompt = `Du bist ein Experte für CRM-Datenerfassung in SAP-Beratungsunternehmen. Der Benutzer beschreibt einen neuen Kunden per Sprache oder Text. Parse den Text und extrahiere daraus ein JSON-Objekt mit den Kundendaten.

${getSAPContextForPrompt()}

${fieldDescription}

WICHTIG: Der Text kann aus Spracheingabe oder manueller Texteingabe stammen. Interpretiere den Text großzügig:
- E-Mail-Adressen: "at" / "ät" → "@", "punkt" → "."
- Telefonnummern: Zahlen zusammenfassen, "plus neunundvierzig" → "+49"
- Firmennamen: Gängige Abkürzungen ergänzen (z.B. "GmbH", "AG")
- Wenn der Ansprechpartner mit "Herr" oder "Frau" beginnt, diesen Titel beibehalten
- Felder die nicht genannt werden → null setzen

Häufige Spracherkennungsfehler:
- "ät" / "et" = "@"
- "punkt" = "."
- Doppelte Wörter ignorieren ("der der Kunde" = "der Kunde")

Gib NUR ein JSON-Objekt zurück, ohne weitere Erklärung:
{ "companyName": "...", "industry": "...", ... }`;

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
      const customer = validateItem(raw, customerFieldSchema);
      if (!customer.companyName && !customer.contactPerson) {
        return NextResponse.json({
          error: 'Keine Kundendaten im Text erkannt. Bitte nennen Sie mindestens Firmenname und Ansprechpartner.',
          customer: null,
        });
      }
      return NextResponse.json({ customer });
    }

    return NextResponse.json({
      error: 'KI-Antwort konnte nicht verarbeitet werden. Bitte versuchen Sie es erneut.',
      customer: null,
    });
  } catch (error) {
    console.error('Parse customer from speech error:', error);
    const message = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return NextResponse.json(
      { error: `Fehler bei der Kunden-Erkennung: ${message}`, customer: null },
      { status: 500 }
    );
  }
}
