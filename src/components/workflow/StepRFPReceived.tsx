'use client';

import { useState } from 'react';
import { FileText, Sparkles, CheckCircle, AlertTriangle, Users, Target } from 'lucide-react';
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
  const { documents, addDocument, currentAnalysis, setCurrentAnalysis, aiProcessing, setAiProcessing } = useStore();
  const [uploadedRFP, setUploadedRFP] = useState<DocType | null>(null);

  const handleUpload = async (files: File[]) => {
    // In production, this would upload to Firebase Storage
    const file = files[0];
    const newDoc: DocType = {
      id: crypto.randomUUID(),
      projectId,
      name: file.name,
      type: 'rfp',
      mimeType: file.type,
      url: URL.createObjectURL(file),
      storagePath: `projects/${projectId}/rfp/${file.name}`,
      size: file.size,
      uploadedBy: 'current-user',
      createdAt: new Date(),
    };

    addDocument(newDoc);
    setUploadedRFP(newDoc);
  };

  const handleAnalyze = async () => {
    if (!uploadedRFP) return;

    setAiProcessing(true);

    try {
      // Call AI API for analysis
      const response = await fetch('/api/ai/analyze-rfp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          documentId: uploadedRFP.id,
          documentUrl: uploadedRFP.url,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed');
      }

      const analysis: RFPAnalysis = await response.json();
      setCurrentAnalysis(analysis);
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
            <div className="mt-4 p-4 bg-green-50 rounded-lg flex items-center gap-3">
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
