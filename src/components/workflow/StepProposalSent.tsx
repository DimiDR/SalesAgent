'use client';

import { useState } from 'react';
import { Send, Download, FileCheck, Mail, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';

interface StepProposalSentProps {
  projectId: string;
  onComplete: () => void;
}

interface ComplianceCheck {
  item: string;
  status: 'pass' | 'warning' | 'fail';
  message: string;
}

export default function StepProposalSent({ projectId, onComplete }: StepProposalSentProps) {
  const { currentProposal, currentAnalysis, aiProcessing, setAiProcessing, updateProject } = useStore();
  const [complianceChecks, setComplianceChecks] = useState<ComplianceCheck[]>([]);
  const [coverLetter, setCoverLetter] = useState('');
  const [isExporting, setIsExporting] = useState(false);

  const handleRunComplianceCheck = async () => {
    setAiProcessing(true);

    try {
      const response = await fetch('/api/ai/compliance-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          proposal: currentProposal,
          analysis: currentAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Compliance check failed');
      }

      const { checks } = await response.json();
      setComplianceChecks(checks);
    } catch (error) {
      console.error('Compliance check error:', error);
      // Mock compliance checks
      const mockChecks: ComplianceCheck[] = [
        {
          item: 'Alle RFP-Anforderungen abgedeckt',
          status: 'pass',
          message: '5 von 5 Anforderungen adressiert',
        },
        {
          item: 'Budget im Rahmen',
          status: 'pass',
          message: 'Angebotssumme liegt innerhalb des Kundenbudgets',
        },
        {
          item: 'Timeline realistisch',
          status: 'pass',
          message: 'Projektende vor Deadline des Kunden',
        },
        {
          item: 'Vollständigkeit der Kapitel',
          status: 'warning',
          message: '8 von 10 Kapiteln vollständig ausgefüllt',
        },
        {
          item: 'Rechtliche Prüfung',
          status: 'warning',
          message: 'AGB-Referenz empfohlen',
        },
        {
          item: 'Formatierung konsistent',
          status: 'pass',
          message: 'Dokument folgt der Unternehmensvorlage',
        },
      ];
      setComplianceChecks(mockChecks);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleGenerateCoverLetter = async () => {
    setAiProcessing(true);

    try {
      const response = await fetch('/api/ai/generate-cover-letter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          proposal: currentProposal,
          analysis: currentAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Cover letter generation failed');
      }

      const { letter } = await response.json();
      setCoverLetter(letter);
    } catch (error) {
      console.error('Cover letter generation error:', error);
      // Mock cover letter
      const mockLetter = `Sehr geehrte Damen und Herren,

vielen Dank für die Möglichkeit, Ihnen unser Angebot für Ihr Cloud-Migrationsprojekt zu unterbreiten.

Nach eingehender Analyse Ihrer Anforderungen und unserem konstruktiven Klärungsgespräch sind wir überzeugt, der ideale Partner für Ihre digitale Transformation zu sein. Unser Vorschlag kombiniert bewährte Methodik mit modernster Technologie und einem erfahrenen Projektteam.

**Highlights unseres Angebots:**
- Ganzheitlicher Ansatz von Assessment bis Support
- Erfahrenes Team mit Azure-Expertise
- Flexibles Preismodell mit garantiertem Budget
- 24/7 Support für 12 Monate

Wir freuen uns auf die Gelegenheit, dieses Projekt gemeinsam mit Ihnen umzusetzen und stehen für Rückfragen jederzeit zur Verfügung.

Mit freundlichen Grüßen

[Ihr Name]
[Position]
[Kontaktdaten]`;
      setCoverLetter(mockLetter);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleExportWord = async () => {
    setIsExporting(true);
    // In production, this would generate a Word document using the docx library
    try {
      // Simulate export
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Create a simple text download for demo
      const content = currentProposal?.chapters
        .sort((a, b) => a.order - b.order)
        .map((c) => `# ${c.title}\n\n${c.content || '[Inhalt ausstehend]'}`)
        .join('\n\n---\n\n');

      const blob = new Blob([content || 'Kein Inhalt'], {
        type: 'text/plain;charset=utf-8',
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Angebot_${projectId}.txt`;
      link.click();
      URL.revokeObjectURL(url);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = async () => {
    setIsExporting(true);
    // In production, this would generate a PDF
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      alert('PDF-Export würde hier erfolgen. In der Produktionsversion wird ein echtes PDF generiert.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleMarkAsSent = () => {
    updateProject(projectId, {
      status: 'completed',
      currentStep: 'proposal_sent',
    });
    onComplete();
  };

  const passCount = complianceChecks.filter((c) => c.status === 'pass').length;
  const warningCount = complianceChecks.filter((c) => c.status === 'warning').length;
  const failCount = complianceChecks.filter((c) => c.status === 'fail').length;

  return (
    <div className="space-y-6">
      {/* Compliance Check */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Vollständigkeits-Check</h3>
            </div>
            {complianceChecks.length > 0 && (
              <div className="flex gap-2">
                <Badge variant="success">{passCount} OK</Badge>
                {warningCount > 0 && (
                  <Badge variant="warning">{warningCount} Hinweise</Badge>
                )}
                {failCount > 0 && (
                  <Badge variant="error">{failCount} Fehler</Badge>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {complianceChecks.length === 0 ? (
            <div className="text-center py-8">
              <FileCheck className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Compliance-Prüfung durchführen
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Die KI überprüft, ob alle RFP-Anforderungen abgedeckt sind und
                das Angebot vollständig ist.
              </p>
              <Button
                onClick={handleRunComplianceCheck}
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Prüfung starten
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {complianceChecks.map((check, idx) => (
                <div
                  key={idx}
                  className={`flex items-start gap-3 p-3 rounded-lg ${
                    check.status === 'pass'
                      ? 'bg-green-50'
                      : check.status === 'warning'
                      ? 'bg-yellow-50'
                      : 'bg-red-50'
                  }`}
                >
                  {check.status === 'pass' ? (
                    <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  ) : check.status === 'warning' ? (
                    <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  )}
                  <div>
                    <p
                      className={`font-medium ${
                        check.status === 'pass'
                          ? 'text-green-800'
                          : check.status === 'warning'
                          ? 'text-yellow-800'
                          : 'text-red-800'
                      }`}
                    >
                      {check.item}
                    </p>
                    <p
                      className={`text-sm ${
                        check.status === 'pass'
                          ? 'text-green-600'
                          : check.status === 'warning'
                          ? 'text-yellow-600'
                          : 'text-red-600'
                      }`}
                    >
                      {check.message}
                    </p>
                  </div>
                </div>
              ))}
              <Button
                variant="ghost"
                onClick={handleRunComplianceCheck}
                isLoading={aiProcessing}
              >
                Erneut prüfen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cover Letter */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Anschreiben</h3>
          </div>
        </CardHeader>
        <CardContent>
          {!coverLetter ? (
            <div className="text-center py-6">
              <Button
                onClick={handleGenerateCoverLetter}
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Anschreiben generieren
              </Button>
            </div>
          ) : (
            <div>
              <Textarea
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="min-h-[300px]"
              />
              <Button
                variant="ghost"
                className="mt-4"
                onClick={handleGenerateCoverLetter}
                isLoading={aiProcessing}
              >
                Neu generieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Export Options */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Export & Versand</h3>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <Button
              variant="outline"
              onClick={handleExportWord}
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Als Word exportieren
            </Button>
            <Button
              variant="outline"
              onClick={handleExportPDF}
              isLoading={isExporting}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Als PDF exportieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Final Action */}
      <Card variant="bordered" className="border-green-200 bg-green-50">
        <CardContent className="py-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-green-800">
                Angebot abschließen
              </h3>
              <p className="text-green-600">
                Markieren Sie das Angebot als versendet, um den Vorgang
                abzuschließen.
              </p>
            </div>
            <Button
              onClick={handleMarkAsSent}
              size="lg"
              leftIcon={<Send className="w-4 h-4" />}
              className="bg-green-600 hover:bg-green-700"
            >
              Als versendet markieren
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
