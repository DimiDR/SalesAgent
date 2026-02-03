import { NextRequest, NextResponse } from 'next/server';
import { getRAGClient, getProjectCorpusDisplayName } from '@/lib/vertex-rag';

/**
 * POST /api/rag/corpus
 * Create a new RAG corpus for a project
 */
export async function POST(request: NextRequest) {
  try {
    const { projectId, description } = await request.json();

    if (!projectId) {
      return NextResponse.json(
        { error: 'projectId is required' },
        { status: 400 }
      );
    }

    const ragClient = getRAGClient();

    if (!ragClient.isConfigured()) {
      return NextResponse.json(
        { error: 'Vertex AI RAG is not configured. Set GOOGLE_CLOUD_PROJECT_ID.' },
        { status: 503 }
      );
    }

    const corpus = await ragClient.createCorpus({
      displayName: getProjectCorpusDisplayName(projectId),
      description: description || `RAG corpus for project ${projectId}`,
    });

    return NextResponse.json({
      success: true,
      corpus: {
        name: corpus.name,
        displayName: corpus.displayName,
        description: corpus.description,
        createdAt: corpus.createTime,
      },
    });
  } catch (error) {
    console.error('Create corpus error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create corpus' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rag/corpus
 * List all RAG corpora
 */
export async function GET() {
  try {
    const ragClient = getRAGClient();

    if (!ragClient.isConfigured()) {
      return NextResponse.json(
        { error: 'Vertex AI RAG is not configured' },
        { status: 503 }
      );
    }

    const corpora = await ragClient.listCorpora();

    return NextResponse.json({
      success: true,
      corpora: corpora.map(corpus => ({
        name: corpus.name,
        displayName: corpus.displayName,
        description: corpus.description,
        createdAt: corpus.createTime,
        updatedAt: corpus.updateTime,
      })),
    });
  } catch (error) {
    console.error('List corpora error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list corpora' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rag/corpus
 * Delete a RAG corpus
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const corpusName = searchParams.get('name');

    if (!corpusName) {
      return NextResponse.json(
        { error: 'Corpus name is required' },
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

    await ragClient.deleteCorpus(corpusName);

    return NextResponse.json({
      success: true,
      message: `Corpus ${corpusName} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete corpus error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete corpus' },
      { status: 500 }
    );
  }
}
