import { NextRequest, NextResponse } from 'next/server';
import { getRAGClient } from '@/lib/vertex-rag';

/**
 * POST /api/rag/search
 * Perform semantic search across a RAG corpus
 */
export async function POST(request: NextRequest) {
  try {
    const { corpusName, query, topK = 5, minScore } = await request.json();

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

    const results = await ragClient.search({
      corpusName: ragClient.buildCorpusName(corpusName),
      query,
      topK,
    });

    // Filter by minimum score if specified
    const filteredResults = minScore
      ? results.filter(r => r.score >= minScore)
      : results;

    return NextResponse.json({
      success: true,
      query,
      results: filteredResults.map(result => ({
        content: result.chunk.content,
        source: result.chunk.documentName,
        score: result.score,
        scorePercent: `${(result.score * 100).toFixed(1)}%`,
      })),
      totalResults: filteredResults.length,
    });
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Search failed' },
      { status: 500 }
    );
  }
}
