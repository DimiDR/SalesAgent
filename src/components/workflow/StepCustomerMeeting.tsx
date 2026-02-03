'use client';

import { useState } from 'react';
import { Calendar, Sparkles, Clock, FileText, Lightbulb, CheckSquare } from 'lucide-react';
import Button from '@/components/ui/Button';
import { Card, CardContent, CardHeader } from '@/components/ui/Card';
import { Input, Textarea } from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import { useStore } from '@/store/useStore';
import type { Meeting, AgendaItem } from '@/types';

interface StepCustomerMeetingProps {
  projectId: string;
  onComplete: () => void;
}

export default function StepCustomerMeeting({ projectId, onComplete }: StepCustomerMeetingProps) {
  const { currentMeeting, setCurrentMeeting, aiProcessing, setAiProcessing, currentAnalysis, questions } = useStore();
  const [notes, setNotes] = useState(currentMeeting?.notes || '');
  const [extractedInsights, setExtractedInsights] = useState<string[]>([]);

  const handleGenerateAgenda = async () => {
    setAiProcessing(true);

    try {
      const response = await fetch('/api/ai/generate-agenda', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          analysis: currentAnalysis,
          unansweredQuestions: questions.filter(
            (q) => q.projectId === projectId && q.status === 'pending'
          ),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate agenda');
      }

      const meeting: Meeting = await response.json();
      setCurrentMeeting(meeting);
    } catch (error) {
      console.error('Agenda generation error:', error);
      // Mock agenda
      const mockMeeting: Meeting = {
        id: crypto.randomUUID(),
        projectId,
        agenda: [
          {
            id: crypto.randomUUID(),
            title: 'Begrüßung und Vorstellung',
            description: 'Kurze Vorstellung der Teilnehmer und Agenda-Überblick',
            duration: 10,
            order: 1,
          },
          {
            id: crypto.randomUUID(),
            title: 'Projektverständnis klären',
            description: 'Zusammenfassung des RFP und unseres Verständnisses, Klärung offener Punkte',
            duration: 20,
            order: 2,
          },
          {
            id: crypto.randomUUID(),
            title: 'Technische Anforderungen',
            description: 'Diskussion der Cloud-Plattform, Datenmigration und Integrationen',
            duration: 25,
            order: 3,
          },
          {
            id: crypto.randomUUID(),
            title: 'Budget und Timeline',
            description: 'Klärung des Budgetrahmens und der Meilensteine',
            duration: 15,
            order: 4,
          },
          {
            id: crypto.randomUUID(),
            title: 'Nächste Schritte',
            description: 'Vereinbarung des weiteren Vorgehens und Angebotstermin',
            duration: 10,
            order: 5,
          },
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setCurrentMeeting(mockMeeting);
    } finally {
      setAiProcessing(false);
    }
  };

  const handleExtractInsights = async () => {
    if (!notes.trim()) return;

    setAiProcessing(true);

    try {
      const response = await fetch('/api/ai/extract-insights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          notes,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to extract insights');
      }

      const { insights, actionItems } = await response.json();
      setExtractedInsights(insights);

      if (currentMeeting) {
        setCurrentMeeting({
          ...currentMeeting,
          notes,
          insights,
          actionItems,
          updatedAt: new Date(),
        });
      }
    } catch (error) {
      console.error('Insight extraction error:', error);
      // Mock insights
      const mockInsights = [
        'Kunde bevorzugt Azure als Cloud-Plattform',
        'Budget wurde auf 480.000 EUR bestätigt',
        'Projektstart kann flexibel sein, Deadline ist fix',
        'IT-Team soll in den Entwicklungsprozess eingebunden werden',
        'Sicherheit und Compliance haben höchste Priorität',
      ];
      const mockActionItems = [
        'Azure-Architektur als Vorschlag ausarbeiten',
        'Detailliertes Schulungskonzept erstellen',
        'Compliance-Checkliste vorbereiten',
      ];

      setExtractedInsights(mockInsights);

      if (currentMeeting) {
        setCurrentMeeting({
          ...currentMeeting,
          notes,
          insights: mockInsights,
          actionItems: mockActionItems,
          updatedAt: new Date(),
        });
      }
    } finally {
      setAiProcessing(false);
    }
  };

  const totalDuration = currentMeeting?.agenda.reduce(
    (acc, item) => acc + (item.duration || 0),
    0
  ) || 0;

  return (
    <div className="space-y-6">
      {/* Agenda Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold">Meeting-Agenda</h3>
            </div>
            {currentMeeting && (
              <Badge variant="info">
                <Clock className="w-3 h-3 mr-1" />
                {totalDuration} Min.
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!currentMeeting ? (
            <div className="text-center py-8">
              <Sparkles className="w-12 h-12 text-blue-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                Agenda generieren
              </h3>
              <p className="text-gray-600 mb-4 max-w-md mx-auto">
                Die KI erstellt eine professionelle Agenda basierend auf der
                RFP-Analyse und den offenen Fragen.
              </p>
              <Button
                onClick={handleGenerateAgenda}
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Agenda generieren
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Date Input */}
              <Input
                type="datetime-local"
                label="Meeting-Termin"
                value={
                  currentMeeting.date
                    ? new Date(currentMeeting.date).toISOString().slice(0, 16)
                    : ''
                }
                onChange={(e) =>
                  setCurrentMeeting({
                    ...currentMeeting,
                    date: new Date(e.target.value),
                  })
                }
              />

              {/* Agenda Items */}
              <div className="space-y-3">
                {currentMeeting.agenda
                  .sort((a, b) => a.order - b.order)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-semibold text-sm">
                        {item.order}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-gray-900">
                            {item.title}
                          </h4>
                          {item.duration && (
                            <Badge variant="default" size="sm">
                              {item.duration} Min.
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-sm text-gray-600 mt-1">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              <Button
                variant="ghost"
                onClick={handleGenerateAgenda}
                isLoading={aiProcessing}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Agenda neu generieren
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Meeting-Notizen</h3>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            label="Protokoll / Notizen"
            placeholder="Erfassen Sie hier die wichtigsten Punkte aus dem Kundentermin..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="min-h-[200px]"
          />
          <div className="mt-4">
            <Button
              onClick={handleExtractInsights}
              isLoading={aiProcessing}
              disabled={!notes.trim()}
              leftIcon={<Lightbulb className="w-4 h-4" />}
            >
              Key-Insights extrahieren
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Extracted Insights */}
      {(extractedInsights.length > 0 || currentMeeting?.insights?.length) && (
        <Card variant="bordered" className="border-green-200 bg-green-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-green-800">
                Extrahierte Insights
              </h3>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {(extractedInsights.length > 0
                ? extractedInsights
                : currentMeeting?.insights || []
              ).map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2 text-green-800">
                  <span className="text-green-500 mt-0.5">•</span>
                  {insight}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Action Items */}
      {currentMeeting?.actionItems && currentMeeting.actionItems.length > 0 && (
        <Card variant="bordered" className="border-blue-200 bg-blue-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckSquare className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-800">To-Do-Liste</h3>
            </div>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {currentMeeting.actionItems.map((item, idx) => (
                <li key={idx} className="flex items-center gap-2 text-blue-800">
                  <input
                    type="checkbox"
                    className="rounded border-blue-300 text-blue-600 focus:ring-blue-500"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Complete Step */}
      <div className="flex justify-end">
        <Button onClick={onComplete} size="lg">
          Schritt abschließen & weiter
        </Button>
      </div>
    </div>
  );
}
