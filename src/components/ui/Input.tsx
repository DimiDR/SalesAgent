'use client';

import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, useRef, useCallback } from 'react';
import { Mic, StopCircle } from 'lucide-react';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

const SPEECH_ENABLED_TYPES = new Set([undefined, '', 'text', 'email', 'tel', 'url', 'search']);

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  enableSpeech?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, helperText, className = '', id, enableSpeech, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const internalRef = useRef<HTMLInputElement>(null);

    const speechEnabled = enableSpeech ?? SPEECH_ENABLED_TYPES.has(props.type);

    const mergedRef = useCallback(
      (node: HTMLInputElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLInputElement | null>).current = node;
      },
      [ref]
    );

    const handleTranscript = useCallback((text: string) => {
      const el = internalRef.current;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLInputElement.prototype,
        'value'
      )?.set;
      if (setter) {
        const cur = el.value;
        setter.call(el, cur + (cur ? ' ' : '') + text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, []);

    const { isListening, interimTranscript, isSupported, toggleListening } =
      useSpeechRecognition({ onTranscript: handleTranscript });

    const showSpeech = speechEnabled && isSupported && !props.disabled;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <input
            ref={mergedRef}
            id={inputId}
            className={`
              w-full px-4 py-2 border rounded-lg transition-colors
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }
              ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              ${showSpeech ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {showSpeech && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
              className={`
                absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-md transition-colors
                ${
                  isListening
                    ? 'text-red-500 hover:bg-red-50 animate-pulse'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {isListening ? (
                <StopCircle className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {isListening && interimTranscript && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="italic truncate">&quot;{interimTranscript}&quot;</span>
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helperText?: string;
  enableSpeech?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, helperText, className = '', id, enableSpeech = true, ...props }, ref) => {
    const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-');
    const internalRef = useRef<HTMLTextAreaElement>(null);

    const mergedRef = useCallback(
      (node: HTMLTextAreaElement | null) => {
        internalRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) (ref as React.MutableRefObject<HTMLTextAreaElement | null>).current = node;
      },
      [ref]
    );

    const handleTranscript = useCallback((text: string) => {
      const el = internalRef.current;
      if (!el) return;
      const setter = Object.getOwnPropertyDescriptor(
        window.HTMLTextAreaElement.prototype,
        'value'
      )?.set;
      if (setter) {
        const cur = el.value;
        setter.call(el, cur + (cur ? ' ' : '') + text);
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }, []);

    const { isListening, interimTranscript, isSupported, toggleListening } =
      useSpeechRecognition({ onTranscript: handleTranscript });

    const showSpeech = enableSpeech && isSupported && !props.disabled;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={mergedRef}
            id={textareaId}
            className={`
              w-full px-4 py-2 border rounded-lg transition-colors resize-y min-h-[100px]
              focus:outline-none focus:ring-2 focus:ring-offset-0
              ${
                error
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
              }
              ${props.disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              ${showSpeech ? 'pr-10' : ''}
              ${className}
            `}
            {...props}
          />
          {showSpeech && (
            <button
              type="button"
              onClick={toggleListening}
              title={isListening ? 'Aufnahme stoppen' : 'Spracheingabe starten'}
              className={`
                absolute right-2 top-2 p-1 rounded-md transition-colors
                ${
                  isListening
                    ? 'text-red-500 hover:bg-red-50 animate-pulse'
                    : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                }
              `}
            >
              {isListening ? (
                <StopCircle className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        {isListening && interimTranscript && (
          <div className="flex items-center gap-1.5 mt-1 text-xs text-gray-400">
            <span className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" />
            <span className="italic truncate">&quot;{interimTranscript}&quot;</span>
          </div>
        )}
        {error && <p className="mt-1 text-sm text-red-500">{error}</p>}
        {helperText && !error && (
          <p className="mt-1 text-sm text-gray-500">{helperText}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export { Input, Textarea };
