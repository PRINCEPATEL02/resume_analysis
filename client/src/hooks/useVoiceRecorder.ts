import { useState, useRef, useCallback, useEffect } from 'react';

// ─── Local type definitions for Web Speech API ────────────────────────────────
// These are defined here because TypeScript's lib.dom.d.ts doesn't always include
// the Speech Recognition API types, causing red errors in strict mode.

interface ISpeechRecognitionResult {
  readonly isFinal: boolean;
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}

interface ISpeechRecognitionResultList {
  readonly length: number;
  item(index: number): ISpeechRecognitionResult;
  [index: number]: ISpeechRecognitionResult;
}

interface ISpeechRecognitionEvent extends Event {
  readonly resultIndex: number;
  readonly results: ISpeechRecognitionResultList;
}

interface ISpeechRecognitionErrorEvent extends Event {
  readonly error: string;
  readonly message: string;
}

interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onstart: (() => void) | null;
  onend: (() => void) | null;
  onresult: ((event: ISpeechRecognitionEvent) => void) | null;
  onerror: ((event: ISpeechRecognitionErrorEvent) => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type ISpeechRecognitionConstructor = new () => ISpeechRecognition;

// ─── Return type ──────────────────────────────────────────────────────────────
interface UseVoiceRecorderReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  isSupported: boolean;
  error: string | null;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useVoiceRecorder(
  onTranscript: (text: string) => void
): UseVoiceRecorderReturn {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [error, setError] = useState<string | null>(null);
  const recognitionRef = useRef<ISpeechRecognition | null>(null);
  const finalTranscriptRef = useRef('');

  // Detect browser support using our local constructor type
  const getSpeechRecognitionAPI = (): ISpeechRecognitionConstructor | null => {
    if (typeof window === 'undefined') return null;
    const w = window as Window & {
      SpeechRecognition?: ISpeechRecognitionConstructor;
      webkitSpeechRecognition?: ISpeechRecognitionConstructor;
    };
    return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  };

  const SpeechRecognitionAPI = getSpeechRecognitionAPI();
  const isSupported = Boolean(SpeechRecognitionAPI);

  useEffect(() => {
    const API = getSpeechRecognitionAPI();
    if (!API) return;

    const rec = new API();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = 'en-US';
    rec.maxAlternatives = 1;

    rec.onstart = () => {
      setError(null);
      setIsListening(true);
    };

    rec.onresult = (event: ISpeechRecognitionEvent) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscriptRef.current += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }
      setTranscript(finalTranscriptRef.current);
      setInterimTranscript(interim);
      onTranscript((finalTranscriptRef.current + interim).trim());
    };

    rec.onerror = (event: ISpeechRecognitionErrorEvent) => {
      const msg =
        event.error === 'no-speech'
          ? 'No speech detected. Try speaking closer to your microphone.'
          : event.error === 'audio-capture'
          ? 'Microphone not found. Please check your device settings.'
          : event.error === 'not-allowed'
          ? 'Microphone access denied. Please allow microphone access in your browser.'
          : `Speech recognition error: ${event.error}`;
      setError(msg);
      setIsListening(false);
    };

    rec.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = rec;

    return () => {
      rec.stop();
    };
  }, []); // run once on mount

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
    setError(null);
    try {
      recognitionRef.current.start();
    } catch {
      // Ignore "already started" errors thrown by some browsers
    }
  }, []);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const resetTranscript = useCallback(() => {
    finalTranscriptRef.current = '';
    setTranscript('');
    setInterimTranscript('');
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
    resetTranscript,
  };
}
