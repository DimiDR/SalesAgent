import { NextRequest, NextResponse } from 'next/server';
import { getRAGClient } from '@/lib/vertex-rag';

/**
 * POST /api/rag/documents
 * Ingest a document into a RAG corpus
 */
export async function POST(request: NextRequest) {
  try {
    const { corpusName, gcsUri, displayName, metadata } = await request.json();

    if (!corpusName) {
      return NextResponse.json(
        { error: 'corpusName is required' },
        { status: 400 }
      );
    }

    if (!gcsUri) {
      return NextResponse.json(
        { error: 'gcsUri is required (gs://bucket/path/to/file)' },
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

    const document = await ragClient.ingestDocument({
      corpusName: ragClient.buildCorpusName(corpusName),
      gcsUri,
      displayName: displayName || gcsUri.split('/').pop() || 'document',
      metadata,
    });

    return NextResponse.json({
      success: true,
      document: {
        name: document.name,
        displayName: document.displayName,
        status: document.status,
      },
      message: 'Document ingestion started. It may take a few minutes to process.',
    });
  } catch (error) {
    console.error('Ingest document error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to ingest document' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/rag/documents
 * List documents in a corpus
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
        { error: 'Vertex AI RAG is not configured' },
        { status: 503 }
      );
    }

    const documents = await ragClient.listDocuments(
      ragClient.buildCorpusName(corpusName)
    );

    return NextResponse.json({
      success: true,
      documents: documents.map(doc => ({
        name: doc.name,
        displayName: doc.displayName,
        status: doc.status,
        createdAt: doc.createTime,
        updatedAt: doc.updateTime,
      })),
    });
  } catch (error) {
    console.error('List documents error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to list documents' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/rag/documents
 * Delete a document from a corpus
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const documentName = searchParams.get('name');

    if (!documentName) {
      return NextResponse.json(
        { error: 'Document name is required' },
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

    await ragClient.deleteDocument(documentName);

    return NextResponse.json({
      success: true,
      message: `Document ${documentName} deleted successfully`,
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete document' },
      { status: 500 }
    );
  }
}
