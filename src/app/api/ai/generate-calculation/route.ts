import { NextRequest, NextResponse } from 'next/server';
import { getSAPContextForPrompt } from '@/lib/sap-terminology';
import {
  calculationSchema,
  schemaToPrompt,
  validateItem,
  DEFAULT_ROLE_RATES,
  DEFAULT_OVERHEAD_PERCENT,
  DEFAULT_MARGIN_PERCENT,
  DEFAULT_DISCOUNT_PERCENT,
} from '@/lib/ai-schema';
import { extractJson } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

export async function POST(request: NextRequest) {
  try {
    const { projectId, analysis, meeting, questions, employees } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const fieldDescription = schemaToPrompt(calculationSchema, 'Kalkulation', { mode: 'object' });

    const systemPrompt = `Du bist ein erfahrener SAP-Projektkalkulierer. Erstelle einen Kalkulationsvorschlag für ein SAP-Beratungsprojekt basierend auf der RFP-Analyse, Meeting-Erkenntnissen und verfügbaren Mitarbeitern.

${getSAPContextForPrompt()}

${fieldDescription}

Wähle passende Mitarbeiter basierend auf deren SAP-Skills und Verfügbarkeit. Berücksichtige die SAP Activate-Phasen bei der Auslastungsverteilung (höhere Auslastung in Explore/Realize, geringere in Discover/Deploy).`;

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
              content: `RFP-Analyse:\n${JSON.stringify(analysis, null, 2)}\n\nMeeting-Erkenntnisse:\n${JSON.stringify(meeting, null, 2)}\n\nOffene Fragen:\n${JSON.stringify(questions, null, 2)}\n\nVerfügbare Mitarbeiter:\n${JSON.stringify(employees, null, 2)}\n\nErstelle einen Kalkulationsvorschlag.`,
            },
          ],
          temperature: 0.4,
        }),
      });

      if (!response.ok) {
        throw new Error('Grok API call failed');
      }

      const data = await response.json();
      const calcText = data.choices[0]?.message?.content;

      const parsed = extractJson<Record<string, unknown>>(calcText);

      if (parsed) {
        const validated = validateItem(parsed, calculationSchema);

        return NextResponse.json({
          id: crypto.randomUUID(),
          projectId,
          resources: ((validated.resources as Record<string, unknown>[]) || []).map((r) => ({
            ...r,
            id: crypto.randomUUID(),
          })),
          projectStart: validated.projectStart,
          projectEnd: validated.projectEnd,
          overheadPercent: validated.overheadPercent,
          marginPercent: validated.marginPercent,
          discountPercent: validated.discountPercent,
          notes: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Fallback: Generate mock calculation based on available employees
    const availableEmployees = (employees || []).slice(0, 3);
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 7, 0);

    const months: string[] = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      months.push(`${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, '0')}`);
      current.setMonth(current.getMonth() + 1);
    }

    const roleEntries = Object.entries(DEFAULT_ROLE_RATES);
    const defaultDays = [30, 60, 45];

    const resources = availableEmployees.map((emp: Record<string, string>, idx: number) => {
      const [role, rate] = roleEntries[idx % roleEntries.length];
      return {
        id: crypto.randomUUID(),
        employeeId: emp.id || crypto.randomUUID(),
        role,
        dailyRate: rate,
        plannedDays: defaultDays[idx % defaultDays.length],
        monthlyAllocations: months.map((month) => ({
          month,
          allocationPercent: [60, 80, 40, 100, 50][Math.floor(Math.random() * 5)],
        })),
      };
    });

    return NextResponse.json({
      id: crypto.randomUUID(),
      projectId,
      resources,
      projectStart: startDate.toISOString().split('T')[0],
      projectEnd: endDate.toISOString().split('T')[0],
      overheadPercent: DEFAULT_OVERHEAD_PERCENT,
      marginPercent: DEFAULT_MARGIN_PERCENT,
      discountPercent: DEFAULT_DISCOUNT_PERCENT,
      notes: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Calculation generation error:', error);
    return NextResponse.json(
      { error: 'Generation failed' },
      { status: 500 }
    );
  }
}
