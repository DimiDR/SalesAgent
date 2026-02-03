'use client';

import { useState } from 'react';
import { FileEdit, Sparkles, Upload, GripVertical, Check, RefreshCw } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import FileUpload from '@/components/ui/FileUpload';
import { useStore } from '@/store/useStore';
import type { Proposal, ProposalChapter, Document as DocType } from '@/types';

interface StepProposalCreatedProps {
  projectId: string;
  onComplete: () => void;
}

export default function StepProposalCreated({ projectId, onComplete }: StepProposalCreatedProps) {
  const {
    currentProposal,
    setCurrentProposal,
    updateProposalChapter,
    aiProcessing,
    setAiProcessing,
    currentAnalysis,
    currentMeeting,
    questions,
    documents,
    addDocument,
  } = useStore();

  const [showTemplateUpload, setShowTemplateUpload] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  const projectQuestions = questions.filter((q) => q.projectId === projectId);
  const templateDoc = documents.find(
    (d) => d.projectId === projectId && d.type === 'template'
  );

  const handleTemplateUpload = async (files: File[]) => {
    const file = files[0];
    const newDoc: DocType = {
      id: crypto.randomUUID(),
      projectId,
      name: file.name,
      type: 'template',
      mimeType: file.type,
      url: URL.createObjectURL(file),
      storagePath: `projects/${projectId}/templates/${file.name}`,
      size: file.size,
      uploadedBy: 'current-user',
      createdAt: new Date(),
    };
    addDocument(newDoc);
    setShowTemplateUpload(false);
  };

  const handleGenerateStructure = async () => {
    setAiProcessing(true);

    try {
      const response = await fetch('/api/ai/generate-proposal-structure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          analysis: currentAnalysis,
          meeting: currentMeeting,
          answeredQuestions: projectQuestions.filter((q) => q.status === 'answered'),
          templateId: templateDoc?.id,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate structure');
      }

      const proposal: Proposal = await response.json();
      setCurrentProposal(proposal);
    } catch (error) {
      console.error('Structure generation error:', error);
      // Mock proposal structure
      const mockProposal: Proposal = {
        id: crypto.randomUUID(),
        projectId,
        templateId: templateDoc?.id,
        chapters: [
          {
            id: crypto.randomUUID(),
            title: 'Deckblatt',
            content: '',
            order: 1,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Executive Summary',
            content: '',
            order: 2,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Ausgangssituation und Zielsetzung',
            content: '',
            order: 3,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Unser Lösungsansatz',
            content: '',
            order: 4,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Projektmethodik',
            content: '',
            order: 5,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Zeitplan und Meilensteine',
            content: '',
            order: 6,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Unser Team',
            content: '',
            order: 7,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Investition',
            content: '',
            order: 8,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Warum wir der richtige Partner sind',
            content: '',
            order: 9,
            status: 'pending',
          },
          {
            id: crypto.randomUUID(),
            title: 'Anhang',
            content: '',
            order: 10,
            status: 'pending',
          },
        ],
        status: 'draft',
        version: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentProposal(mockProposal);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleGenerateChapterContent = async (chapter: ProposalChapter) => {
    setAiProcessing(true);

    try {
      const response = await fetch('/api/ai/generate-chapter-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          chapterId: chapter.id,
          chapterTitle: chapter.title,
          analysis: currentAnalysis,
          meeting: currentMeeting,
          answeredQuestions: projectQuestions.filter((q) => q.status === 'answered'),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const { content } = await response.json();
      updateProposalChapter(chapter.id, content);
    } catch (error) {
      console.error('Content generation error:', error);
      // Mock content based on chapter title
      const mockContents: Record<string, string> = {
        'Executive Summary': `## Executive Summary

Die [Kundenname] GmbH steht vor der strategischen Herausforderung, ihre IT-Infrastruktur in die Cloud zu migrieren und gleichzeitig moderne DevOps-Praktiken einzuführen. Als erfahrener Partner im Bereich Cloud-Transformation bieten wir eine ganzheitliche Lösung, die nicht nur technische Exzellenz, sondern auch einen nachhaltigen Wissenstransfer gewährleistet.

**Unsere Lösung umfasst:**
- Vollständige Migration der bestehenden On-Premise-Systeme auf Azure
- Implementierung einer modernen CI/CD-Pipeline
- Umfassende Schulung Ihres IT-Teams
- 24/7 Support für 12 Monate nach Go-Live

**Ihr Nutzen:**
- Reduzierung der Betriebskosten um bis zu 30%
- Erhöhte Skalierbarkeit und Flexibilität
- Verbesserte Time-to-Market für neue Features
- Zukunftssichere IT-Architektur`,
        'Unser Lösungsansatz': `## Unser Lösungsansatz

Basierend auf unserer Analyse Ihrer Anforderungen und den Erkenntnissen aus dem Klärungsgespräch schlagen wir einen dreistufigen Ansatz vor:

### Phase 1: Assessment & Planung (Woche 1-4)
- Detaillierte Ist-Analyse der bestehenden Systeme
- Cloud-Readiness-Assessment
- Erstellung der Zielarchitektur
- Migrationsplan mit Risikobewertung

### Phase 2: Migration & Implementierung (Woche 5-20)
- Schrittweise Migration der Workloads
- Einrichtung der Azure-Infrastruktur
- CI/CD-Pipeline-Implementierung
- Parallelbetrieb und Testing

### Phase 3: Optimierung & Übergabe (Woche 21-24)
- Performance-Optimierung
- Schulungen und Dokumentation
- Übergabe an den Regelbetrieb
- Start des Support-Vertrags`,
        'Unser Team': `## Unser Team

Für Ihr Projekt stellen wir ein erfahrenes Team zusammen:

**Projektleitung:**
- Dr. Maria Schmidt, PMP - 15 Jahre Erfahrung in IT-Projekten

**Technisches Team:**
- Thomas Weber - Senior Cloud Architect (Azure Certified Expert)
- Lisa Müller - DevOps Engineer (5+ Jahre Kubernetes/CI-CD)
- Markus Braun - Security Specialist (CISSP)

**Support:**
- 24/7 Support-Team mit dediziertem Account Manager

Alle Teammitglieder verfügen über relevante Zertifizierungen und umfangreiche Projekterfahrung in vergleichbaren Transformationsprojekten.`,
      };

      const content =
        mockContents[chapter.title] ||
        `## ${chapter.title}\n\n[KI-generierter Inhalt basierend auf RFP-Analyse und Kundenkontext wird hier eingefügt.]\n\nDieser Abschnitt wird automatisch mit relevanten Informationen aus Ihrem Unternehmenswissen und den spezifischen Projektanforderungen gefüllt.`;

      updateProposalChapter(chapter.id, content);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleStartEdit = (chapter: ProposalChapter) => {
    setEditingChapterId(chapter.id);
    setEditContent(chapter.content);
  };

  const handleSaveEdit = () => {
    if (editingChapterId) {
      updateProposalChapter(editingChapterId, editContent);
      setEditingChapterId(null);
      setEditContent('');
    }
  };

  const handleCancelEdit = () => {
    setEditingChapterId(null);
    setEditContent('');
  };

  const generatedChaptersCount =
    currentProposal?.chapters.filter(
      (c) => c.status === 'generated' || c.status === 'edited'
    ).length || 0;

  return (
    <div className="space-y-6">
      {/* Template Upload */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Word-Vorlage</h3>
            </div>
            {templateDoc && (
              <Badge variant="success">Vorlage hochgeladen</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showTemplateUpload ? (
            <div>
              <FileUpload
                onUpload={handleTemplateUpload}
                accept=".docx,.doc"
                label="Word-Vorlage hochladen"
                description="DOCX oder DOC-Datei"
              />
              <Button
                variant="ghost"
                className="mt-4"
                onClick={() => setShowTemplateUpload(false)}
              >
                Abbrechen
              </Button>
            </div>
          ) : templateDoc ? (
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span className="text-gray-700">{templateDoc.name}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTemplateUpload(true)}
              >
                Ändern
              </Button>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-gray-600 mb-4">
                Optional: Laden Sie eine Word-Vorlage hoch, die als Basis für
                das Angebot verwendet wird.
              </p>
              <Button
                variant="outline"
                onClick={() => setShowTemplateUpload(true)}
              >
                Vorlage hochladen
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Structure Generation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileEdit className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Angebotsstruktur</h3>
            </div>
            {currentProposal && (
              <Badge variant="info">
                {generatedChaptersCount}/{currentProposal.chapters.length} Kapitel
                generiert
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!currentProposal ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Kapitelstruktur generieren
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Die KI erstellt eine passende Kapitelstruktur basierend auf dem
                RFP, den Kunden-Antworten und Ihrer Vorlage.
              </p>
              <Button
                onClick={handleGenerateStructure}
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Struktur generieren
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {currentProposal.chapters
                .sort((a, b) => a.order - b.order)
                .map((chapter) => (
                  <div
                    key={chapter.id}
                    className="border rounded-lg overflow-hidden"
                  >
                    {/* Chapter Header */}
                    <div className="flex items-center gap-3 p-4 bg-gray-50">
                      <GripVertical className="w-4 h-4 text-gray-400" />
                      <span className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {chapter.order}
                      </span>
                      <h4 className="font-medium text-gray-900 flex-1">
                        {chapter.title}
                      </h4>
                      <div className="flex items-center gap-2">
                        {chapter.status === 'generated' ||
                        chapter.status === 'edited' ? (
                          <Badge
                            variant={
                              chapter.status === 'edited' ? 'success' : 'info'
                            }
                            size="sm"
                          >
                            {chapter.status === 'edited'
                              ? 'Bearbeitet'
                              : 'Generiert'}
                          </Badge>
                        ) : (
                          <Badge variant="default" size="sm">
                            Ausstehend
                          </Badge>
                        )}
                        {chapter.content ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleStartEdit(chapter)}
                          >
                            Bearbeiten
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleGenerateChapterContent(chapter)}
                            isLoading={aiProcessing}
                            leftIcon={<Sparkles className="w-3 h-3" />}
                          >
                            Generieren
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Chapter Content */}
                    {editingChapterId === chapter.id ? (
                      <div className="p-4 border-t">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[300px] font-mono text-sm"
                        />
                        <div className="flex gap-2 mt-4">
                          <Button onClick={handleSaveEdit} size="sm">
                            <Check className="w-4 h-4 mr-1" />
                            Speichern
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCancelEdit}
                          >
                            Abbrechen
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() =>
                              handleGenerateChapterContent(chapter)
                            }
                            isLoading={aiProcessing}
                            leftIcon={<RefreshCw className="w-3 h-3" />}
                          >
                            Neu generieren
                          </Button>
                        </div>
                      </div>
                    ) : chapter.content ? (
                      <div className="p-4 border-t prose prose-sm max-w-none">
                        <div
                          className="text-gray-700 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{
                            __html: chapter.content.replace(/\n/g, '<br />'),
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Complete Step */}
      {currentProposal && generatedChaptersCount > 0 && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Schritt abschließen & weiter
          </Button>
        </div>
      )}
    </div>
  );
}
