/**
 * AI utility functions for interacting with the Grok API
 */

import { getSAPContextForPrompt } from './sap-terminology';

const XAI_API_URL = process.env.XAI_API_URL || 'https://api.x.ai/v1';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface ChatCompletionOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
}

/**
 * Send a chat completion request to the Grok API
 */
export async function chatCompletion(
  messages: ChatMessage[],
  apiKey: string,
  options: ChatCompletionOptions = {}
) {
  const {
    model = 'grok-4-1-fast-non-reasoning',
    temperature = 0.5,
    maxTokens = 4096,
  } = options;

  const response = await fetch(`${XAI_API_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Grok API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || '';
}

/**
 * Extract JSON from a text response
 */
export function extractJson<T>(text: string): T | null {
  // Try to find JSON in code blocks
  const codeBlockMatch = text.match(/```(?:json)?\n?([\s\S]*?)\n?```/);
  if (codeBlockMatch) {
    try {
      return JSON.parse(codeBlockMatch[1]);
    } catch {
      // Continue to other methods
    }
  }

  // Try to find raw JSON array (before object, so [{}] isn't parsed as {})
  const arrayMatch = text.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch {
      // Continue to other methods
    }
  }

  // Try to find raw JSON object
  const objectMatch = text.match(/\{[\s\S]*\}/);
  if (objectMatch) {
    try {
      return JSON.parse(objectMatch[0]);
    } catch {
      // Parsing failed
    }
  }

  return null;
}

/**
 * SAP domain context included in all relevant prompts
 */
const sapContext = getSAPContextForPrompt();

/**
 * System prompts for different AI tasks
 */
export const systemPrompts = {
  rfpAnalysis: `Du bist ein erfahrener Vertriebsexperte und RFP-Analyst für SAP-Beratungsprojekte.

${sapContext}

Analysiere RFP-Dokumente und erstelle strukturierte Analysen mit:
- Zusammenfassung des Projekts
- Identifizierte Anforderungen (insbesondere SAP-Module, Produkte und Technologien)
- Wichtige Fristen
- Budget-Hinweise
- Lücken und fehlende Informationen
- Übereinstimmung mit typischen SAP-Beratungsleistungen
- Empfohlene SAP-Ressourcen und -Beraterprofile (z.B. ABAP-Entwickler, S/4HANA-Berater, Fiori-Entwickler)
- Identifizierte SAP-Systemlandschaft (ECC, S/4HANA, BTP, etc.)`,

  questionGeneration: `Du bist ein erfahrener SAP-Vertriebsberater. Generiere Fragen aus verschiedenen Perspektiven:
1. Sales: Budget, Timeline, Entscheidungsprozess, Lizenzmodell (RISE/GROW with SAP)
2. Technisch: SAP-Systemlandschaft, Module, Integration, Customizing, ABAP-Entwicklung, Cloud vs. On-Premise
3. Projektmanagement: Ressourcen, Risiken, SAP Activate-Methodik, Go-Live-Planung
4. Kunde: Pain-Points mit bestehendem SAP-System, Erwartungen an S/4HANA-Transformation

${sapContext}

Für jede Frage: Persona, Frage, Begründung, Priorität (high/medium/low)`,

  agendaGeneration: `Du bist ein erfahrener SAP-Projektmanager. Erstelle professionelle Meeting-Agenden mit:
- Strukturierte Punkte mit Zeitangaben
- Klare Ziele für jeden Punkt
- Logischer Ablauf (z.B. Fit-to-Standard Workshop, Blueprint-Review, Sprint-Review)
- Raum für Fragen und Diskussion
- Berücksichtigung von SAP Activate-Phasen (Discover, Prepare, Explore, Realize, Deploy, Run)`,

  proposalWriting: `Du bist ein erfahrener Angebotsschreiber für SAP-Beratungsprojekte. Schreibe:
- Professionelle und überzeugende Texte für SAP-Transformationsprojekte
- Kundenspezifische Inhalte mit Bezug auf die SAP-Systemlandschaft des Kunden
- Klar strukturierte Kapitel
- Fokus auf Kundennutzen, SAP-Best-Practices und USPs
- Korrekte Verwendung von SAP-Terminologie und Produktnamen

${sapContext}`,

  insightExtraction: `Du bist ein erfahrener SAP-Business-Analyst. Extrahiere aus Meeting-Notizen:
- Key-Insights: Wichtige Erkenntnisse zu SAP-Anforderungen und Systemlandschaft
- Neue Anforderungen (Module, Schnittstellen, Customizing)
- Geänderte Rahmenbedingungen (Timeline, Budget, Scope, Lizenzmodell)
- Action Items: Konkrete To-Dos mit SAP-Bezug
- Genannte SAP-Produkte und -Technologien`,

  complianceCheck: `Du bist ein Qualitätsprüfer für SAP-Beratungsangebote. Prüfe:
- Vollständigkeit (alle RFP-Anforderungen adressiert? Alle genannten SAP-Module abgedeckt?)
- Konsistenz (keine Widersprüche? Korrekte SAP-Terminologie?)
- Compliance (rechtliche Anforderungen erfüllt? SAP-Lizenzierung korrekt dargestellt?)
- Qualität (professionelle Darstellung? SAP-Best-Practices berücksichtigt?)
- SAP-Produktnamen korrekt geschrieben (S/4HANA, nicht S4 Hana; SAP Fiori, nicht SAP Fiore, etc.)`,
};

/**
 * Generate embeddings using Adesso AI Hub (via ChromaDB RAG client)
 * Falls back to mock embeddings if not configured
 */
export async function generateEmbeddings(text: string, _apiKey?: string): Promise<number[]> {
  try {
    const { getRAGClient } = await import('./supabase-rag');
    const ragClient = getRAGClient();

    if (ragClient.isConfigured()) {
      const response = await ragClient.generateEmbedding(text);
      return response.embedding;
    }
  } catch (error) {
    console.warn('Embedding API unavailable, using mock:', error);
  }

  // Fallback: return mock embedding
  return new Array(768).fill(0).map(() => Math.random() - 0.5);
}

/**
 * RAG-augmented chat completion
 * Retrieves relevant context from the corpus before generating a response
 */
export async function ragAugmentedCompletion(
  query: string,
  corpusName: string,
  systemPrompt: string,
  apiKey: string,
  options: ChatCompletionOptions = {}
): Promise<string> {
  try {
    const { getRAGClient } = await import('./supabase-rag');
    const ragClient = getRAGClient();

    let context = '';

    if (ragClient.isConfigured() && corpusName) {
      // Retrieve relevant context from RAG
      context = await ragClient.getRelevantContext({
        corpusName,
        query,
        maxChunks: 5,
        minScore: 0.3,
      });
    }

    // Build the user message with context
    const userMessage = context
      ? `Relevant context from documents:\n\n${context}\n\n---\n\nUser query: ${query}`
      : query;

    // Call the LLM with augmented context
    return chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      apiKey,
      options
    );
  } catch (error) {
    console.error('RAG augmented completion error:', error);
    // Fallback to regular completion without RAG
    return chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: query },
      ],
      apiKey,
      options
    );
  }
}

/**
 * Calculate cosine similarity between two vectors
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Chunk text for embedding
 */
export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  if (!text || chunkSize <= 0) return [];
  if (overlap >= chunkSize) overlap = 0;

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    if (end >= text.length) break;
    start = end - overlap;
  }

  return chunks;
}
