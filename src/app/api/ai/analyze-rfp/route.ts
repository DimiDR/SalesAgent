import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import { rfpAnalysisSchema, schemaToPrompt, validateItem } from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';
const MAX_PDF_TEXT_LENGTH = 30000;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const projectId = formData.get('projectId') as string | null;
    const documentId = formData.get('documentId') as string | null;

    if (!projectId || !documentId || !file) {
      return NextResponse.json(
        { error: 'Missing required fields (projectId, documentId, file)' },
        { status: 400 }
      );
    }

    // Extract text from the uploaded PDF using pdf-parse v2
    const arrayBuffer = await file.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    const parser = new PDFParse({ data: pdfBuffer });
    const pdfResult = await parser.getText();
    await parser.destroy();
    let pdfText = pdfResult.text;

    // Truncate if necessary to stay within API limits
    if (pdfText.length > MAX_PDF_TEXT_LENGTH) {
      pdfText = pdfText.substring(0, MAX_PDF_TEXT_LENGTH) + '\n\n[... Text gekürzt ...]';
    }

    const fieldDescription = schemaToPrompt(rfpAnalysisSchema, 'Analyse', { mode: 'object' });

    const systemPrompt = `Du bist ein erfahrener Vertriebsexperte und RFP-Analyst für SAP-Beratungsprojekte.

${getSAPContextForPrompt()}

Analysiere das folgende RFP-Dokument und erstelle eine strukturierte Analyse im JSON-Format.

${fieldDescription}`;

    if (XAI_API_KEY) {
      // Call Grok API with actual PDF text
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
              content: `Analysiere dieses RFP-Dokument und gib die Analyse als JSON zurück.\n\n--- RFP-Dokument ---\n${pdfText}`,
            },
          ],
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const analysisText = data.choices[0]?.message?.content;

      const parsed = extractJson<Record<string, unknown>>(analysisText);

      if (parsed) {
        const analysis = validateItem(parsed, rfpAnalysisSchema);
        return NextResponse.json({
          id: crypto.randomUUID(),
          projectId,
          documentId,
          ...analysis,
          createdAt: new Date().toISOString(),
        });
      }
    }

    // Fallback mock response for demo
    return NextResponse.json({
      id: crypto.randomUUID(),
      projectId,
      documentId,
      summary:
        'Das RFP beschreibt eine S/4HANA-Transformation für einen mittelständischen Kunden. Der Fokus liegt auf der Migration von SAP ECC auf S/4HANA Cloud mit Neuimplementierung der Kernprozesse in FI/CO, MM und SD.',
      requirements: [
        'Migration von SAP ECC 6.0 auf S/4HANA Cloud (RISE with SAP)',
        'Neugestaltung der Fiori-Oberflächen für Endanwender',
        'Integration mit bestehenden Non-SAP-Systemen via SAP Integration Suite',
        'Datenmigration und Bereinigung der Altdaten',
        'Schulung der Key-User und Endanwender',
      ],
      deadlines: [
        'Angebotsfrist: 15. März 2026',
        'Projektstart (Explore-Phase): 1. Mai 2026',
        'Go-Live: Q1 2027',
      ],
      budgetHints: ['Gesamtbudget: 800.000 - 1.200.000 EUR'],
      gaps: [
        'Keine Angabe zur aktuellen SAP-Systemlandschaft (Release-Stand ECC)',
        'Customizing-Umfang im bestehenden System unklar',
        'Anzahl der zu migrierenden Custom-ABAP-Entwicklungen fehlt',
        'Lizenzmodell (RISE vs. GROW with SAP) nicht spezifiziert',
      ],
      matchScore: 85,
      recommendedResources: [
        {
          type: 'expert',
          name: 'Senior S/4HANA Solution Architect',
          reason: 'Gesamtarchitektur und Migrationsstrategie',
          priority: 'high',
        },
        {
          type: 'expert',
          name: 'SAP FI/CO Berater',
          reason: 'Kernprozess-Design Finance & Controlling',
          priority: 'high',
        },
        {
          type: 'expert',
          name: 'SAP ABAP/Fiori Entwickler',
          reason: 'Custom-Code-Migration und Fiori-Apps',
          priority: 'high',
        },
        {
          type: 'expert',
          name: 'SAP Basis/Cloud Berater',
          reason: 'Systemlandschaft und Cloud-Migration',
          priority: 'medium',
        },
      ],
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('RFP analysis error:', error);
    return NextResponse.json(
      { error: 'Analysis failed' },
      { status: 500 }
    );
  }
}
