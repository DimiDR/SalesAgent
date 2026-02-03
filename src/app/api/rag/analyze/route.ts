import { NextRequest, NextResponse } from 'next/server';
import { getRAGClient } from '@/lib/vertex-rag';
import { chatCompletion, extractJson, systemPrompts } from '@/lib/ai';

const XAI_API_KEY = process.env.XAI_API_KEY;

interface AnalysisRequest {
  corpusName: string;
  query: string;
  analysisType: 'rfp' | 'questions' | 'proposal' | 'compliance' | 'custom';
  customPrompt?: string;
}

/**
 * POST /api/rag/analyze
 * Perform RAG-augmented analysis on documents
 */
export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const { corpusName, query, analysisType, customPrompt } = body;

    if (!corpusName || !query) {
      return NextResponse.json(
        { error: 'corpusName and query are required' },
        { status: 400 }
      );
    }

    if (!XAI_API_KEY) {
      return NextResponse.json(
        { error: 'XAI_API_KEY not configured' },
        { status: 503 }
      );
    }

    const ragClient = getRAGClient();

    if (!ragClient.isConfigured()) {
      return NextResponse.json(
        { error: 'Vertex AI RAG is not configured' },
        { status: 503 }
      );
    }

    // Step 1: Retrieve relevant context from RAG corpus
    const searchResults = await ragClient.search({
      corpusName: ragClient.buildCorpusName(corpusName),
      query,
      topK: 5,
    });

    if (searchResults.length === 0) {
      return NextResponse.json(
        { error: 'No relevant content found in corpus' },
        { status: 404 }
      );
    }

    // Step 2: Build context from search results
    const context = searchResults
      .map((result, index) => {
        return `[Document ${index + 1}] (Relevance: ${(result.score * 100).toFixed(1)}%)\n${result.chunk.content}`;
      })
      .join('\n\n---\n\n');

    // Step 3: Select appropriate system prompt
    const systemPromptMap: Record<string, string> = {
      rfp: systemPrompts.rfpAnalysis,
      questions: systemPrompts.questionGeneration,
      proposal: systemPrompts.proposalWriting,
      compliance: systemPrompts.complianceCheck,
      custom: customPrompt || 'Du bist ein hilfreicher Assistent für Dokumentenanalyse.',
    };

    const systemPrompt = systemPromptMap[analysisType] || systemPromptMap.custom;

    // Step 4: Generate RAG-augmented response
    const userMessage = `Basierend auf den folgenden Dokumentauszügen, beantworte die Frage oder führe die Analyse durch.

DOKUMENTKONTEXT:
${context}

ANFRAGE:
${query}

Antworte strukturiert und beziehe dich auf die relevanten Stellen im Dokumentkontext.`;

    const response = await chatCompletion(
      [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
      XAI_API_KEY,
      { temperature: 0.3 }
    );

    // Step 5: Try to extract JSON if the response contains it
    const jsonData = extractJson(response);

    return NextResponse.json({
      success: true,
      query,
      analysisType,
      response: response,
      structuredData: jsonData,
      sources: searchResults.map(r => ({
        content: r.chunk.content.substring(0, 200) + '...',
        source: r.chunk.documentName,
        score: r.score,
      })),
      metadata: {
        sourcesUsed: searchResults.length,
        avgRelevance: searchResults.reduce((acc, r) => acc + r.score, 0) / searchResults.length,
      },
    });
  } catch (error) {
    console.error('RAG analysis error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Analysis failed' },
      { status: 500 }
    );
  }
}
