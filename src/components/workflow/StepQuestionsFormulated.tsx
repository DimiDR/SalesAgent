'use client';

import { useState } from 'react';
import { MessageCircleQuestion, Sparkles, Download, Upload, User, Briefcase, Settings, UserCheck } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import Badge from '@/components/ui/Badge';
import FileUpload from '@/components/ui/FileUpload';
import { useStore } from '@/store/useStore';
import type { Question } from '@/types';

interface StepQuestionsFormulatedProps {
  projectId: string;
  onComplete: () => void;
}

const PERSONA_CONFIG = {
  sales: { icon: Briefcase, label: 'Sales', color: 'text-blue-600' },
  technical: { icon: Settings, label: 'Technisch', color: 'text-purple-600' },
  project_management: { icon: User, label: 'Projektmanagement', color: 'text-green-600' },
  customer: { icon: UserCheck, label: 'Kunde', color: 'text-orange-600' },
};

export default function StepQuestionsFormulated({ projectId, onComplete }: StepQuestionsFormulatedProps) {
  const { questions, setQuestions, aiProcessing, setAiProcessing, currentAnalysis } = useStore();
  const [showAnswerUpload, setShowAnswerUpload] = useState(false);
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null);

  const projectQuestions = questions.filter((q) => q.projectId === projectId);

  const handleGenerateQuestions = async () => {
    setAiProcessing(true);

    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          analysis: currentAnalysis,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate questions');
      }

      const generatedQuestions: Question[] = await response.json();
      setQuestions([...questions, ...generatedQuestions]);
    } catch (error) {
      console.error('Question generation error:', error);
      // Mock questions for demo
      const mockQuestions: Question[] = [
        // Sales questions
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'sales',
          question: 'Welches Budget haben Sie für dieses Projekt eingeplant?',
          reasoning: 'Ermöglicht genaue Kostenkalkulation und Scope-Definition',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'sales',
          question: 'Wer sind die Entscheidungsträger für dieses Projekt?',
          reasoning: 'Wichtig für Stakeholder-Management und Kommunikation',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'sales',
          question: 'Gibt es Wettbewerber, die ebenfalls ein Angebot abgeben?',
          reasoning: 'Ermöglicht strategische Positionierung',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
        // Technical questions
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'technical',
          question: 'Welche Cloud-Plattform (AWS, Azure, GCP) bevorzugen Sie?',
          reasoning: 'Bestimmt technische Architektur und Ressourcenplanung',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'technical',
          question: 'Wie groß ist die aktuelle Datenmenge, die migriert werden soll?',
          reasoning: 'Kritisch für Zeit- und Kostenplanung der Migration',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'technical',
          question: 'Welche bestehenden Systeme müssen integriert werden?',
          reasoning: 'Beeinflusst Komplexität und Schnittstellendesign',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
        // Project Management questions
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'project_management',
          question: 'Welche internen Ressourcen können Sie für das Projekt bereitstellen?',
          reasoning: 'Wichtig für Projektplanung und Teamaufstellung',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'project_management',
          question: 'Gibt es bekannte Risiken oder Einschränkungen?',
          reasoning: 'Ermöglicht proaktives Risikomanagement',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
        // Customer perspective questions
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'customer',
          question: 'Was sind Ihre größten Schmerzpunkte mit der aktuellen Lösung?',
          reasoning: 'Hilft bei der Fokussierung auf den Kundennutzen',
          priority: 'high',
          status: 'pending',
          createdAt: new Date(),
        },
        {
          id: crypto.randomUUID(),
          projectId,
          persona: 'customer',
          question: 'Wie messen Sie den Erfolg dieses Projekts?',
          reasoning: 'Definiert klare Erfolgskriterien und KPIs',
          priority: 'medium',
          status: 'pending',
          createdAt: new Date(),
        },
      ];
      setQuestions([...questions, ...mockQuestions]);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleExportExcel = async () => {
    // In production, this would generate and download an Excel file
    const csvContent = [
      ['Nr.', 'Persona', 'Frage', 'Begründung', 'Priorität', 'Antwort'],
      ...projectQuestions.map((q, idx) => [
        idx + 1,
        PERSONA_CONFIG[q.persona]?.label || q.persona,
        q.question,
        q.reasoning,
        q.priority === 'high' ? 'Hoch' : q.priority === 'medium' ? 'Mittel' : 'Niedrig',
        q.answer || '',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Fragen_${projectId}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const handleAnswerUpload = async (files: File[]) => {
    // In production, this would parse the Excel file and update questions
    console.log('Uploaded answer file:', files[0]?.name);
    setShowAnswerUpload(false);

    // Mock: Mark some questions as answered
    const updatedQuestions = projectQuestions.map((q, idx) => ({
      ...q,
      answer: idx < 5 ? 'Beispielantwort vom Kunden' : undefined,
      status: idx < 5 ? 'answered' as const : 'pending' as const,
      answeredAt: idx < 5 ? new Date() : undefined,
    }));

    setQuestions([
      ...questions.filter((q) => q.projectId !== projectId),
      ...updatedQuestions,
    ]);
  };

  const filteredQuestions = selectedPersona
    ? projectQuestions.filter((q) => q.persona === selectedPersona)
    : projectQuestions;

  const answeredCount = projectQuestions.filter((q) => q.status === 'answered').length;

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircleQuestion className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Fragen an den Kunden</h3>
            </div>
            {projectQuestions.length > 0 && (
              <Badge variant="info">
                {answeredCount}/{projectQuestions.length} beantwortet
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {projectQuestions.length === 0 ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Fragen generieren
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Die KI generiert Fragen aus verschiedenen Perspektiven (Sales,
                Technik, Projektmanagement, Kunde) basierend auf der RFP-Analyse.
              </p>
              <Button
                onClick={handleGenerateQuestions}
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Fragen generieren
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleExportExcel}
                variant="outline"
                leftIcon={<Download className="w-4 h-4" />}
              >
                Als Excel exportieren
              </Button>
              <Button
                onClick={() => setShowAnswerUpload(true)}
                variant="outline"
                leftIcon={<Upload className="w-4 h-4" />}
              >
                Antworten hochladen
              </Button>
              <Button
                onClick={handleGenerateQuestions}
                variant="ghost"
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Weitere Fragen generieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Answer Upload Modal */}
      {showAnswerUpload && (
        <Card variant="bordered" className="border-blue-200 bg-blue-50">
          <CardHeader>
            <h3 className="font-semibold">Kunden-Antworten hochladen</h3>
          </CardHeader>
          <CardContent>
            <FileUpload
              onUpload={handleAnswerUpload}
              accept=".xlsx,.xls,.csv"
              label="Excel mit Antworten hochladen"
              description="Excel oder CSV-Datei mit ausgefüllten Antworten"
            />
            <Button
              variant="ghost"
              className="mt-4"
              onClick={() => setShowAnswerUpload(false)}
            >
              Abbrechen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Persona Filter */}
      {projectQuestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <Button
            variant={selectedPersona === null ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setSelectedPersona(null)}
          >
            Alle ({projectQuestions.length})
          </Button>
          {(Object.entries(PERSONA_CONFIG) as [keyof typeof PERSONA_CONFIG, typeof PERSONA_CONFIG.sales][]).map(
            ([key, config]) => {
              const count = projectQuestions.filter((q) => q.persona === key).length;
              if (count === 0) return null;
              const Icon = config.icon;
              return (
                <Button
                  key={key}
                  variant={selectedPersona === key ? 'primary' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedPersona(key)}
                  leftIcon={<Icon className="w-4 h-4" />}
                >
                  {config.label} ({count})
                </Button>
              );
            }
          )}
        </div>
      )}

      {/* Questions List */}
      {filteredQuestions.length > 0 && (
        <div className="space-y-4">
          {filteredQuestions.map((question, idx) => {
            const config = PERSONA_CONFIG[question.persona];
            const Icon = config?.icon || User;

            return (
              <Card key={question.id} variant="bordered">
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`p-2 rounded-lg bg-gray-100 ${config?.color || 'text-gray-600'}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="default" size="sm">
                          {config?.label || question.persona}
                        </Badge>
                        <Badge
                          variant={
                            question.priority === 'high'
                              ? 'error'
                              : question.priority === 'medium'
                              ? 'warning'
                              : 'default'
                          }
                          size="sm"
                        >
                          {question.priority === 'high'
                            ? 'Hoch'
                            : question.priority === 'medium'
                            ? 'Mittel'
                            : 'Niedrig'}
                        </Badge>
                        {question.status === 'answered' && (
                          <Badge variant="success" size="sm">
                            Beantwortet
                          </Badge>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 mb-1">
                        {idx + 1}. {question.question}
                      </p>
                      <p className="text-sm text-gray-500">{question.reasoning}</p>

                      {question.answer && (
                        <div className="mt-3 p-3 bg-green-50 rounded-lg">
                          <p className="text-sm font-medium text-green-800">
                            Antwort:
                          </p>
                          <p className="text-sm text-green-700">{question.answer}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Complete Step */}
      {projectQuestions.length > 0 && (
        <div className="flex justify-end">
          <Button onClick={onComplete} size="lg">
            Schritt abschließen & weiter
          </Button>
        </div>
      )}
    </div>
  );
}
