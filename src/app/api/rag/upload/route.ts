import { NextRequest, NextResponse } from 'next/server';
import { PDFParse } from 'pdf-parse';
import { getRAGClient } from '@/lib/supabase-rag';
import { getSupabaseClient } from '@/lib/supabase';

/**
 * POST /api/rag/upload
 * Upload a file (PDF, DOCX, TXT) to a RAG corpus.
 * Accepts multipart/form-data with fields: file, corpusName
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const corpusName = formData.get('corpusName') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }

    if (!corpusName) {
      return NextResponse.json({ error: 'corpusName is required' }, { status: 400 });
    }

    const ragClient = getRAGClient();
    if (!ragClient.isConfigured()) {
      return NextResponse.json(
        { error: 'Supabase RAG is not configured. Check environment variables.' },
        { status: 503 }
      );
    }

    // Extract text based on file type
    const mimeType = file.type;
    const buffer = Buffer.from(await file.arrayBuffer());
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      const parser = new PDFParse({ data: buffer });
      const pdfResult = await parser.getText();
      await parser.destroy();
      extractedText = pdfResult.text;
    } else if (
      mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {
      const mammoth = await import('mammoth');
      const result = await mammoth.extractRawText({ buffer });
      extractedText = result.value;
    } else if (mimeType === 'text/plain') {
      extractedText = buffer.toString('utf-8');
    } else {
      return NextResponse.json(
        { error: `Unsupported file type: ${mimeType}. Supported: PDF, DOCX, TXT` },
        { status: 400 }
      );
    }

    if (!extractedText.trim()) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file' },
        { status: 400 }
      );
    }

    // Upload file to Supabase Storage
    const supabase = getSupabaseClient();
    const storagePath = `SALES_${corpusName}/SALES_${file.name}`;

    await supabase.storage
      .from('sales-documents')
      .upload(storagePath, buffer, {
        contentType: mimeType,
        upsert: true,
      });

    // Ingest extracted text into RAG corpus
    const document = await ragClient.ingestDocument({
      corpusName,
      content: extractedText,
      displayName: file.name,
      metadata: {
        mimeType,
        fileSize: String(file.size),
        storagePath,
      },
    });

    // Update the document record with storage info
    const supabaseClient = getSupabaseClient();
    await supabaseClient
      .from('SALES_documents')
      .update({
        storage_path: storagePath,
        mime_type: mimeType,
        file_size: file.size,
      })
      .eq('id', document.name);

    return NextResponse.json({
      success: true,
      document: {
        name: document.name,
        displayName: document.displayName,
        status: document.status,
      },
      message: `File "${file.name}" uploaded and ingested successfully.`,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
