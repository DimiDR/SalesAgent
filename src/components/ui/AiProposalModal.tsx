'use client';

import { useState, useRef, useEffect, useCallback, Fragment } from 'react';
import { X, Mic, Send, Sparkles, Loader2, StopCircle } from 'lucide-react';
import Button from './Button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface ProposalData {
  projectName?: string;
  description?: string;
  requirements?: string[];
  deadline?: string;
  budget?: string;
  notes?: string;
  customerCompany?: string;
  customerContact?: string;
  customerEmail?: string;
}

interface AiProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId?: string;
  customerName?: string;
  onCreateProposal: (data: ProposalData) => void;
}

// Tracks which question was last asked so user's reply maps to the right field
type PendingQuestion = 'customerInfo' | 'projectName' | 'deadline' | 'budget' | 'confirm' | null;

export default function AiProposalModal({
  isOpen,
  onClose,
  customerName,
  onCreateProposal,
}: AiProposalModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposalData, setProposalData] = useState<ProposalData>({});
  const [pendingQuestion, setPendingQuestion] = useState<PendingQuestion>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleTranscript = useCallback((text: string) => {
    setInputValue((prev) => prev + (prev ? ' ' : '') + text);
  }, []);

  const { isListening, interimTranscript, toggleListening, stopListening } =
    useSpeechRecognition({ onTranscript: handleTranscript });

  // Initial greeting when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: customerName
          ? `Hallo! Ich helfe Ihnen dabei, ein neues Angebot für **${customerName}** zu erstellen.\n\nSie können mir per Text oder Sprache folgende Informationen mitteilen:\n\n- Projektname/Titel\n- Beschreibung des Vorhabens\n- Anforderungen\n- Deadline\n- Budgetrahmen\n\nWas möchten Sie mir zuerst mitteilen?`
          : `Hallo! Ich helfe Ihnen dabei, ein neues Angebot zu erstellen.\n\nSie können mir per Text oder Sprache alle relevanten Informationen mitteilen, z.B.:\n\n- **Kundeninfo**: Firmenname, Ansprechpartner, E-Mail\n- **Projektdetails**: Name, Beschreibung, Anforderungen\n- **Rahmenbedingungen**: Deadline, Budget\n\nTeilen Sie mir einfach alles mit, was Sie wissen!`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, customerName, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const extractProposalInfo = async (
    text: string,
    existingData: Partial<ProposalData>
  ): Promise<Partial<ProposalData>> => {
    try {
      const response = await fetch('/api/ai/extract-proposal-fields', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, existingData }),
      });

      if (!response.ok) return {};

      return await response.json();
    } catch {
      return {};
    }
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isProcessing) return;

    // Stop listening if active
    if (isListening) {
      stopListening();
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: trimmedInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsProcessing(true);

    // Extract proposal info via AI
    const extracted = await extractProposalInfo(trimmedInput, proposalData);
    const updatedProposalData = { ...proposalData, ...extracted };

    // Context-aware extraction: if the AI asked a specific question,
    // use the user's reply as the answer even if AI didn't extract it
    if (pendingQuestion === 'customerInfo' && !extracted.customerCompany) {
      updatedProposalData.customerCompany = trimmedInput;
    } else if (pendingQuestion === 'projectName' && !extracted.projectName) {
      updatedProposalData.projectName = trimmedInput;
    } else if (pendingQuestion === 'deadline' && !extracted.deadline) {
      updatedProposalData.deadline = trimmedInput;
    } else if (pendingQuestion === 'budget' && !extracted.budget) {
      updatedProposalData.budget = trimmedInput;
    }

    // Store description from first substantial message
    if (!updatedProposalData.description && pendingQuestion === null) {
      updatedProposalData.description = trimmedInput;
    }

    setProposalData(updatedProposalData);

    let responseContent = '';
    let nextQuestion: PendingQuestion = null;

    // Check what info we have and what we still need
    const hasName = updatedProposalData.projectName;
    const hasCustomerInfo = customerName || updatedProposalData.customerCompany;

    if (!hasCustomerInfo && !customerName) {
      responseContent = `Verstanden! Ich habe folgende Informationen notiert:\n\n> "${trimmedInput.substring(0, 100)}${trimmedInput.length > 100 ? '...' : ''}"\n\nFür welche **Firma/Unternehmen** soll das Angebot erstellt werden?`;
      nextQuestion = 'customerInfo';
    } else if (!hasName) {
      responseContent = `Verstanden! Ich habe folgende Informationen notiert:\n\n> "${trimmedInput.substring(0, 100)}${trimmedInput.length > 100 ? '...' : ''}"\n\nWie soll das Projekt/Angebot heißen?`;
      nextQuestion = 'projectName';
    } else if (!updatedProposalData.deadline) {
      responseContent = `Sehr gut! Das Projekt heißt **${updatedProposalData.projectName}**.\n\nGibt es eine Deadline oder einen gewünschten Fertigstellungstermin?`;
      nextQuestion = 'deadline';
    } else if (!updatedProposalData.budget) {
      responseContent = `Perfekt! Deadline ist der ${updatedProposalData.deadline}.\n\nHaben Sie einen Budgetrahmen im Kopf?`;
      nextQuestion = 'budget';
    } else {
      const customerDisplay = customerName || updatedProposalData.customerCompany;
      responseContent = `Wunderbar! Ich habe alle wichtigen Informationen:\n\n${customerDisplay ? `**Kunde:** ${customerDisplay}\n` : ''}**Projekt:** ${updatedProposalData.projectName}\n**Deadline:** ${updatedProposalData.deadline}\n**Budget:** ${updatedProposalData.budget} EUR\n\nSoll ich das Angebot jetzt anlegen?`;
      nextQuestion = 'confirm';
    }

    setPendingQuestion(nextQuestion);

    const assistantMessage: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: responseContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, assistantMessage]);
    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleCreateProposal = () => {
    onCreateProposal(proposalData);
    handleClose();
  };

  const handleClose = () => {
    setMessages([]);
    setInputValue('');
    setProposalData({});
    setIsProcessing(false);
    setPendingQuestion(null);
    if (isListening) {
      stopListening();
    }
    onClose();
  };

  const hasCustomerInfo = customerName || proposalData.customerCompany;
  const canCreateProposal = hasCustomerInfo && (proposalData.projectName || proposalData.description);

  if (!isOpen) return null;

  const headerSubtitle = customerName
    ? `für ${customerName}`
    : proposalData.customerCompany
    ? `für ${proposalData.customerCompany}`
    : 'Kunde wird aus Text erkannt';

  return (
    <Fragment>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-xl shadow-xl w-full max-w-2xl transform transition-all max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Angebot mit KI erstellen</h2>
                <p className="text-sm text-gray-500">{headerSubtitle}</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 min-h-[300px] max-h-[400px]">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">
                    {message.content.split(/(\*\*[^*]+\*\*)/).map((part, i) => {
                      if (part.startsWith('**') && part.endsWith('**')) {
                        return <strong key={i}>{part.slice(2, -2)}</strong>;
                      }
                      return part;
                    })}
                  </p>
                  <span className={`text-xs mt-1 block ${
                    message.role === 'user' ? 'text-blue-200' : 'text-gray-400'
                  }`}>
                    {message.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))}

            {isProcessing && (
              <div className="flex justify-start">
                <div className="bg-gray-100 rounded-2xl px-4 py-3">
                  <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Collected Info Summary */}
          {(proposalData.customerCompany || proposalData.projectName || proposalData.deadline || proposalData.budget) && (
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">Gesammelte Informationen:</p>
              <div className="flex flex-wrap gap-2">
                {proposalData.customerCompany && !customerName && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    Kunde: {proposalData.customerCompany}
                  </span>
                )}
                {proposalData.customerContact && !customerName && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    Kontakt: {proposalData.customerContact}
                  </span>
                )}
                {proposalData.customerEmail && !customerName && (
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
                    E-Mail: {proposalData.customerEmail}
                  </span>
                )}
                {proposalData.projectName && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Projekt: {proposalData.projectName}
                  </span>
                )}
                {proposalData.deadline && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Deadline: {proposalData.deadline}
                  </span>
                )}
                {proposalData.budget && (
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                    Budget: {proposalData.budget} EUR
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="px-6 py-4 border-t border-gray-100">
            {/* Voice Status */}
            {isListening && (
              <div className="flex items-center gap-2 mb-3 text-sm text-red-600">
                <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                Sprachaufnahme aktiv... {interimTranscript && <span className="text-gray-400 italic">&quot;{interimTranscript}&quot;</span>}
              </div>
            )}

            <div className="flex items-end gap-2">
              <div className="flex-1 relative">
                <textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Beschreiben Sie das Angebot oder sprechen Sie..."
                  rows={2}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                />
              </div>

              {/* Voice Button */}
              <Button
                variant={isListening ? 'danger' : 'outline'}
                size="lg"
                onClick={toggleListening}
                className={`rounded-xl ${isListening ? 'animate-pulse' : ''}`}
                title={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
              >
                {isListening ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>

              {/* Send Button */}
              <Button
                size="lg"
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isProcessing}
                className="rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 flex justify-between items-center">
            <p className="text-xs text-gray-500">
              Tipp: Drücken Sie Enter zum Senden oder Shift+Enter für neue Zeile
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleClose}>
                Abbrechen
              </Button>
              <Button
                onClick={handleCreateProposal}
                disabled={!canCreateProposal}
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Angebot anlegen
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
}
