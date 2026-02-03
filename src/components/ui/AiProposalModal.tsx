'use client';

import { useState, useRef, useEffect, Fragment } from 'react';
import { X, Mic, Send, Sparkles, Loader2, StopCircle } from 'lucide-react';
import Button from './Button';

// Web Speech API Types
interface SpeechRecognitionEvent {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  isFinal: boolean;
  [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognitionErrorEvent {
  error: string;
}

interface SpeechRecognitionInstance {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ProposalData {
  projectName?: string;
  description?: string;
  requirements?: string[];
  deadline?: string;
  budget?: string;
  notes?: string;
}

interface AiProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: string;
  customerName: string;
  onCreateProposal: (data: ProposalData) => void;
}

export default function AiProposalModal({
  isOpen,
  onClose,
  customerId,
  customerName,
  onCreateProposal,
}: AiProposalModalProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [proposalData, setProposalData] = useState<ProposalData>({});
  const [interimTranscript, setInterimTranscript] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Initial greeting when modal opens
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      const greeting: Message = {
        id: `msg-${Date.now()}`,
        role: 'assistant',
        content: `Hallo! Ich helfe Ihnen dabei, ein neues Angebot für **${customerName}** zu erstellen.\n\nSie können mir per Text oder Sprache folgende Informationen mitteilen:\n\n- Projektname/Titel\n- Beschreibung des Vorhabens\n- Anforderungen\n- Deadline\n- Budgetrahmen\n\nWas möchten Sie mir zuerst mitteilen?`,
        timestamp: new Date(),
      };
      setMessages([greeting]);
    }
  }, [isOpen, customerName, messages.length]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'de-DE';

        recognition.onresult = (event) => {
          let interim = '';
          let final = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              final += transcript;
            } else {
              interim += transcript;
            }
          }

          setInterimTranscript(interim);

          if (final) {
            setInputValue((prev) => prev + (prev ? ' ' : '') + final);
            setInterimTranscript('');
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setInterimTranscript('');
        };

        recognition.onend = () => {
          if (isListening) {
            // Restart if still supposed to be listening
            try {
              recognition.start();
            } catch {
              setIsListening(false);
            }
          }
        };

        recognitionRef.current = recognition;
      }
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Spracherkennung wird von Ihrem Browser nicht unterstützt.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      setInterimTranscript('');
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
      }
    }
  };

  const extractProposalInfo = (text: string): Partial<ProposalData> => {
    const extracted: Partial<ProposalData> = {};
    const lowerText = text.toLowerCase();

    // Simple extraction patterns (in production, this would be done by AI)
    if (lowerText.includes('projekt') || lowerText.includes('titel') || lowerText.includes('name')) {
      const match = text.match(/(?:projekt|titel|name)[:\s]+([^,.\n]+)/i);
      if (match) extracted.projectName = match[1].trim();
    }

    if (lowerText.includes('deadline') || lowerText.includes('bis') || lowerText.includes('fertig')) {
      const dateMatch = text.match(/(\d{1,2}[./]\d{1,2}[./]\d{2,4})/);
      if (dateMatch) extracted.deadline = dateMatch[1];
    }

    if (lowerText.includes('budget') || lowerText.includes('euro') || lowerText.includes('€')) {
      const budgetMatch = text.match(/(\d+(?:[.,]\d+)?)\s*(?:euro|€|eur)/i);
      if (budgetMatch) extracted.budget = budgetMatch[1];
    }

    return extracted;
  };

  const handleSendMessage = async () => {
    const trimmedInput = inputValue.trim();
    if (!trimmedInput || isProcessing) return;

    // Stop listening if active
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      setInterimTranscript('');
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

    // Extract proposal info
    const extracted = extractProposalInfo(trimmedInput);
    const updatedProposalData = { ...proposalData, ...extracted };
    setProposalData(updatedProposalData);

    // Simulate AI response (in production, this would call an AI API)
    await new Promise((resolve) => setTimeout(resolve, 1000));

    let responseContent = '';

    // Check what info we have and what we still need
    const hasName = updatedProposalData.projectName;
    const hasDescription = updatedProposalData.description || trimmedInput.length > 50;

    if (!hasDescription) {
      // Store the message as description if no project name detected
      updatedProposalData.description = trimmedInput;
      setProposalData(updatedProposalData);
    }

    if (!hasName) {
      responseContent = `Verstanden! Ich habe folgende Informationen notiert:\n\n> "${trimmedInput.substring(0, 100)}${trimmedInput.length > 100 ? '...' : ''}"\n\nWie soll das Projekt/Angebot heißen?`;
    } else if (!updatedProposalData.deadline) {
      responseContent = `Sehr gut! Das Projekt heißt **${updatedProposalData.projectName}**.\n\nGibt es eine Deadline oder einen gewünschten Fertigstellungstermin?`;
    } else if (!updatedProposalData.budget) {
      responseContent = `Perfekt! Deadline ist der ${updatedProposalData.deadline}.\n\nHaben Sie einen Budgetrahmen im Kopf?`;
    } else {
      responseContent = `Wunderbar! Ich habe alle wichtigen Informationen:\n\n**Projekt:** ${updatedProposalData.projectName}\n**Deadline:** ${updatedProposalData.deadline}\n**Budget:** ${updatedProposalData.budget} EUR\n\nSoll ich das Angebot jetzt anlegen?`;
    }

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
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }
    setInterimTranscript('');
    onClose();
  };

  const canCreateProposal = proposalData.projectName || proposalData.description;

  if (!isOpen) return null;

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
                <p className="text-sm text-gray-500">für {customerName}</p>
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
          {(proposalData.projectName || proposalData.deadline || proposalData.budget) && (
            <div className="px-6 py-3 bg-blue-50 border-t border-blue-100">
              <p className="text-xs font-medium text-blue-700 mb-2">Gesammelte Informationen:</p>
              <div className="flex flex-wrap gap-2">
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
                Sprachaufnahme aktiv... {interimTranscript && <span className="text-gray-400 italic">"{interimTranscript}"</span>}
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

// Add TypeScript declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognitionInstance;
    webkitSpeechRecognition: new () => SpeechRecognitionInstance;
  }
}
