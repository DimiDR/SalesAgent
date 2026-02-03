import { NextRequest, NextResponse } from 'next/server';
import { getRAGClient } from '@/lib/vertex-rag';

/**
 * POST /api/rag/context
 * Get relevant context for a query, formatted for LLM consumption
 */
export async function POST(request: NextRequest) {
  try {
    const { corpusName, query, maxChunks = 3, minScore = 0.5 } = await request.json();

    if (!corpusName) {
      return NextResponse.json(
        { error: 'corpusName is required' },
        { status: 400 }
      );
    }

    if (!query) {
      return NextResponse.json(
        { error: 'query is required' },
        { status: 400 }
      );
    }

    const ragClient = getRAGClient();

    if (!ragClient.isConfigured()) {
      return NextResponse.json(
        { error: 'Vertex AI RAG is not configured' },
        { status: 503 }
      );
    }

    const context = await ragClient.getRelevantContext({
      corpusName: ragClient.buildCorpusName(corpusName),
      query,
      maxChunks,
      minScore,
    });

    return NextResponse.json({
      success: true,
      query,
      context,
      hasContext: context.length > 0,
    });
  } catch (error) {
    console.error('Get context error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get context' },
      { status: 500 }
    );
  }
}
