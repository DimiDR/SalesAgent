import { NextRequest, NextResponse } from 'next/server';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, documentId, documentUrl } = await request.json();

    if (!projectId || !documentId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // In production, you would:
    // 1. Download the PDF from documentUrl
    // 2. Extract text using pdf-parse
    // 3. Send to Grok API for analysis
    // 4. Store results in Firebase

    const systemPrompt = `Du bist ein erfahrener Vertriebsexperte und RFP-Analyst. Analysiere das folgende RFP-Dokument und erstelle eine strukturierte Analyse im JSON-Format mit folgenden Feldern:
- summary: Eine Zusammenfassung des RFP (2-3 Sätze)
- requirements: Array mit den wichtigsten Anforderungen
- deadlines: Array mit identifizierten Fristen
- budgetHints: Array mit Budget-Hinweisen
- gaps: Array mit identifizierten Lücken oder fehlenden Informationen
- matchScore: Geschätzte Übereinstimmung mit typischen Beratungsleistungen (0-100)
- recommendedResources: Array mit empfohlenen Ressourcen (type, name, reason, priority)`;

    if (XAI_API_KEY) {
      // Call Grok API
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
              content: `Analysiere dieses RFP-Dokument und gib die Analyse als JSON zurück. Dokument-ID: ${documentId}`,
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

      // Parse the JSON from the response
      const jsonMatch = analysisText.match(/```json\n?([\s\S]*?)\n?```/) ||
                        analysisText.match(/\{[\s\S]*\}/);

      if (jsonMatch) {
        const analysis = JSON.parse(jsonMatch[1] || jsonMatch[0]);
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
        'Das RFP beschreibt ein Cloud-Migrationsprojekt für einen mittelständischen Kunden. Der Fokus liegt auf der Modernisierung der bestehenden IT-Infrastruktur.',
      requirements: [
        'Cloud-Migration bestehender On-Premise-Systeme',
        'Implementierung einer CI/CD-Pipeline',
        'Schulung des IT-Teams',
        'Sicherheitsaudit und Compliance-Dokumentation',
      ],
      deadlines: [
        'Angebotsfrist: 15. März 2026',
        'Projektstart: 1. April 2026',
      ],
      budgetHints: ['Gesamtbudget: 450.000 - 500.000 EUR'],
      gaps: [
        'Keine Angabe zur aktuellen Datenmenge',
        'Skalierbarkeitsanforderungen unklar',
      ],
      matchScore: 82,
      recommendedResources: [
        {
          type: 'expert',
          name: 'Senior Cloud Architect',
          reason: 'AWS/Azure Expertise erforderlich',
          priority: 'high',
        },
        {
          type: 'expert',
          name: 'DevOps Engineer',
          reason: 'CI/CD-Implementation',
          priority: 'high',
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
