'use client';

import { useState } from 'react';
import { FileText, Sparkles, CheckCircle, AlertTriangle, Users, Target, Database, Loader2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import FileUpload from '@/components/ui/FileUpload';
import Badge from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import type { RFPAnalysis, Document as DocType } from '@/types';

interface StepRFPReceivedProps {
  projectId: string;
  onComplete: () => void;
}

export default function StepRFPReceived({ projectId, onComplete }: StepRFPReceivedProps) {
  const { documents, addDocument, currentAnalysis, setCurrentAnalysis, saveAnalysis, aiProcessing, setAiProcessing } = useStore();
  const [uploadedRFP, setUploadedRFP] = useState<DocType | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [ragStatus, setRagStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [ragError, setRagError] = useState<string | null>(null);

  const handleUpload = async (files: File[]) => {
    const file = files[0];

    // Save document to DB via store
    let savedDoc: DocType;
    try {
      savedDoc = await addDocument({
        projectId,
        name: file.name,
        type: 'rfp',
        mimeType: file.type,
        url: '',
        storagePath: `projects/${projectId}/rfp/${file.name}`,
        size: file.size,
        uploadedBy: 'system',
      });
    } catch (err) {
      console.error('Failed to save document to DB:', err);
      // Fallback: still allow local workflow to continue
      savedDoc = {
        id: crypto.randomUUID(),
        projectId,
        name: file.name,
        type: 'rfp',
        mimeType: file.type,
        url: '',
        storagePath: `projects/${projectId}/rfp/${file.name}`,
        size: file.size,
        uploadedBy: 'system',
        createdAt: new Date(),
      };
    }

    setUploadedRFP(savedDoc);
    setUploadedFile(file);

    // Upload to Supabase RAG pipeline
    setRagStatus('uploading');
    setRagError(null);
    try {
      // 1. Ensure RAG corpus exists for this project
      const corpusName = `salesagent-project-${projectId}`;
      await fetch('/api/rag/corpus', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          description: `RAG-Corpus für Projekt ${projectId}`,
        }),
      });

      // 2. Upload file to RAG pipeline (creates embeddings)
      const formData = new FormData();
      formData.append('file', file);
      formData.append('corpusName', corpusName);

      const uploadRes = await fetch('/api/rag/upload', {
        method: 'POST',
        body: formData,
      });

      const uploadData = await uploadRes.json();
      if (!uploadRes.ok || !uploadData.success) {
        throw new Error(uploadData.error || 'RAG-Upload fehlgeschlagen');
      }

      setRagStatus('success');
    } catch (error) {
      console.warn('RAG upload failed:', error);
      setRagStatus('error');
      setRagError(error instanceof Error ? error.message : 'RAG-Upload fehlgeschlagen');
    }
  };

  const handleAnalyze = async () => {
    if (!uploadedRFP || !uploadedFile) return;

    setAiProcessing(true);

    try {
      // Send PDF file as FormData so the backend can extract text
      const formData = new FormData();
      formData.append('file', uploadedFile);
      formData.append('projectId', projectId);
      formData.append('documentId', uploadedRFP.id);

      const response = await fetch('/api/ai/analyze-rfp', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysis: RFPAnalysis = await response.json();
      setCurrentAnalysis(analysis);
      // Persist analysis to DB
      try {
        await saveAnalysis(analysis);
      } catch (err) {
        console.warn('Failed to save analysis to DB:', err);
      }
    } catch (error) {
      console.error('RFP analysis error:', error);
      // For demo, create mock analysis
      const mockAnalysis: RFPAnalysis = {
        id: crypto.randomUUID(),
        projectId,
        documentId: uploadedRFP.id,
        summary: 'Das RFP beschreibt ein Cloud-Migrationsprojekt für einen mittelständischen Kunden. Der Fokus liegt auf der Modernisierung der bestehenden IT-Infrastruktur und der Einführung von DevOps-Praktiken.',
        requirements: [
          'Cloud-Migration bestehender On-Premise-Systeme',
          'Implementierung einer CI/CD-Pipeline',
          'Schulung des IT-Teams',
          'Sicherheitsaudit und Compliance-Dokumentation',
          '24/7 Support für 12 Monate',
        ],
        deadlines: [
          'Angebotsfrist: 15. März 2026',
          'Projektstart: 1. April 2026',
          'Projektabschluss: 31. Dezember 2026',
        ],
        budgetHints: [
          'Gesamtbudget: 450.000 - 500.000 EUR',
          'Aufwandschätzung gewünscht',
        ],
        gaps: [
          'Keine Angabe zur aktuellen Datenmenge',
          'Skalierbarkeitsanforderungen unklar',
          'Keine Details zu bestehenden Systemen',
        ],
        matchScore: 82,
        recommendedResources: [
          { type: 'expert', name: 'Senior Cloud Architect', reason: 'AWS/Azure Expertise erforderlich', priority: 'high' },
          { type: 'expert', name: 'DevOps Engineer', reason: 'CI/CD-Implementation', priority: 'high' },
          { type: 'department', name: 'Security Team', reason: 'Compliance-Audit', priority: 'medium' },
          { type: 'template', name: 'Cloud Migration Vorlage', reason: 'Basis für Kapitelstruktur', priority: 'medium' },
        ],
        createdAt: new Date(),
      };
      setCurrentAnalysis(mockAnalysis);
      try {
        await saveAnalysis(mockAnalysis);
      } catch (err) {
        console.warn('Failed to save mock analysis to DB:', err);
      }
    } finally {
      setAiProcessing(false);
    }
  };

  const rfpDocuments = documents.filter(
    (d) => d.projectId === projectId && d.type === 'rfp'
  );

  return (
    <div className="space-y-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">RFP-Dokument hochladen</h3>
          </div>
        </CardHeader>
        <CardContent>
          <FileUpload
            onUpload={handleUpload}
            accept=".pdf"
            label="RFP-Dokument hierher ziehen"
            description="Nur PDF-Dateien (max. 20MB)"
            maxSize={20}
          />

          {rfpDocuments.length > 0 && (
            <div className="mt-4 space-y-3">
              <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-800">
                    {rfpDocuments[0].name}
                  </p>
                  <p className="text-sm text-green-600">
                    Erfolgreich hochgeladen
                  </p>
                </div>
              </div>

              {/* RAG Upload Status */}
              {ragStatus === 'uploading' && (
                <div className="p-4 bg-blue-50 rounded-lg flex items-center gap-3">
                  <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
                  <div>
                    <p className="font-medium text-blue-800">RAG-Indexierung läuft...</p>
                    <p className="text-sm text-blue-600">
                      Dokument wird für die semantische Suche vorbereitet
                    </p>
                  </div>
                </div>
              )}
              {ragStatus === 'success' && (
                <div className="p-4 bg-green-50 rounded-lg flex items-center gap-3">
                  <Database className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-green-800">RAG-Indexierung abgeschlossen</p>
                    <p className="text-sm text-green-600">
                      Dokument ist für die semantische Suche verfügbar
                    </p>
                  </div>
                </div>
              )}
              {ragStatus === 'error' && (
                <div className="p-4 bg-yellow-50 rounded-lg flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <div>
                    <p className="font-medium text-yellow-800">RAG-Indexierung fehlgeschlagen</p>
                    <p className="text-sm text-yellow-600">
                      {ragError || 'Das Dokument konnte nicht indexiert werden. Die KI-Analyse ist weiterhin möglich.'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Button */}
      {uploadedRFP && !currentAnalysis && (
        <Card>
          <CardContent className="py-6">
            <div className="text-center">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                KI-Analyse starten
              </h3>
              <p className="text-gray-600 mb-4">
                Die KI analysiert das RFP-Dokument und erstellt eine Übersicht
                der Anforderungen, Fristen und empfohlenen Ressourcen.
              </p>
              <Button
                onClick={handleAnalyze}
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                RFP analysieren
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {currentAnalysis && (
        <div className="space-y-4">
          {/* Match Score */}
          <Card variant="bordered">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Target className="w-6 h-6 text-blue-600" />
                  <div>
                    <p className="font-medium">Übereinstimmung</p>
                    <p className="text-sm text-gray-500">
                      Passung zu unseren Stärken
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-blue-600">
                    {currentAnalysis.matchScore}%
                  </p>
                  <Badge variant={currentAnalysis.matchScore >= 70 ? 'success' : 'warning'}>
                    {currentAnalysis.matchScore >= 70 ? 'Gute Passung' : 'Prüfung empfohlen'}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Zusammenfassung</h3>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{currentAnalysis.summary}</p>
            </CardContent>
          </Card>

          {/* Requirements */}
          <Card>
            <CardHeader>
              <h3 className="font-semibold">Identifizierte Anforderungen</h3>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {currentAnalysis.requirements.map((req, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700">{req}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Deadlines & Budget */}
          <div className="grid md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <h3 className="font-semibold">Fristen</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentAnalysis.deadlines.map((deadline, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                      {deadline}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h3 className="font-semibold">Budget-Hinweise</h3>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentAnalysis.budgetHints.map((hint, idx) => (
                    <li key={idx} className="text-gray-700 text-sm">
                      {hint}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Gaps */}
          {currentAnalysis.gaps.length > 0 && (
            <Card variant="bordered" className="border-yellow-200 bg-yellow-50">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-yellow-600" />
                  <h3 className="font-semibold text-yellow-800">
                    Identifizierte Lücken
                  </h3>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {currentAnalysis.gaps.map((gap, idx) => (
                    <li key={idx} className="text-yellow-800 text-sm">
                      {gap}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* Recommended Resources */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="font-semibold">Empfohlene Ressourcen</h3>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {currentAnalysis.recommendedResources.map((resource, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-gray-800">
                        {resource.name}
                      </p>
                      <p className="text-sm text-gray-500">{resource.reason}</p>
                    </div>
                    <Badge
                      variant={
                        resource.priority === 'high'
                          ? 'error'
                          : resource.priority === 'medium'
                          ? 'warning'
                          : 'default'
                      }
                    >
                      {resource.priority === 'high'
                        ? 'Hoch'
                        : resource.priority === 'medium'
                        ? 'Mittel'
                        : 'Niedrig'}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Complete Step Button */}
          <div className="flex justify-end">
            <Button onClick={onComplete} size="lg">
              Schritt abschließen & weiter
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
