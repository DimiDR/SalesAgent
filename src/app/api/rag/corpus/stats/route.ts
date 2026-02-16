import { NextRequest, NextResponse } from 'next/server';
import { getRAGClient } from '@/lib/supabase-rag';

/**
 * GET /api/rag/corpus/stats?corpusName=xxx
 * Get statistics for a specific corpus (document count, chunk count, document list)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const corpusName = searchParams.get('corpusName');

    if (!corpusName) {
      return NextResponse.json(
        { error: 'corpusName query parameter is required' },
        { status: 400 }
      );
    }

    const ragClient = getRAGClient();

    if (!ragClient.isConfigured()) {
      return NextResponse.json(
        { error: 'Supabase RAG is not configured' },
        { status: 503 }
      );
    }

    const [documents, chunkCount] = await Promise.all([
      ragClient.listDocuments(ragClient.buildCorpusName(corpusName)),
      ragClient.getCollectionCount(ragClient.buildCorpusName(corpusName)),
    ]);

    return NextResponse.json({
      success: true,
      documentCount: documents.length,
      chunkCount,
      documents: documents.map(doc => ({
        name: doc.name,
        displayName: doc.displayName,
        status: doc.status,
      })),
    });
  } catch (error) {
    console.error('Corpus stats error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get corpus stats' },
      { status: 500 }
    );
  }
}
