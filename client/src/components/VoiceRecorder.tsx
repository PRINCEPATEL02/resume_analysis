import React from 'react';
import { Mic, MicOff, AlertTriangle } from 'lucide-react';
import { useVoiceRecorder } from '../hooks/useVoiceRecorder';

interface Props {
  onTranscript: (text: string) => void;
  currentText: string;
}

export default function VoiceRecorder({ onTranscript, currentText }: Props) {
  const {
    isListening,
    interimTranscript,
    isSupported,
    error,
    startListening,
    stopListening,
  } = useVoiceRecorder((text) => {
    // Append to existing typed text if any
    const base = currentText.trimEnd();
    const combined = base ? `${base} ${text}` : text;
    onTranscript(combined);
  });

  if (!isSupported) {
    return (
      <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl
                     bg-amber-500/10 border border-amber-500/30">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
        <p className="text-sm text-amber-300">
          Voice input is not supported in this browser. Please use Chrome or Edge.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        {/* Record / Stop button */}
        <button
          onClick={isListening ? stopListening : startListening}
          className={`relative flex items-center justify-center w-11 h-11 rounded-xl
            font-medium transition-all duration-200 active:scale-95 select-none
            ${isListening
              ? 'bg-red-500 text-white animate-recording shadow-lg shadow-red-900/50'
              : 'bg-white/10 text-slate-300 border border-white/15 hover:bg-white/15 hover:text-white'
            }`}
          aria-label={isListening ? 'Stop recording' : 'Start voice recording'}
          title={isListening ? 'Stop recording' : 'Start recording'}
        >
          {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
        </button>

        {/* Status */}
        <div className="flex-1 min-w-0">
          {isListening ? (
            <div className="flex items-center gap-3">
              {/* Wave bars animation */}
              <div className="flex items-end gap-[3px] h-6">
                {[1,2,3,4,5].map((i) => (
                  <div key={i} className="wave-bar" style={{ animationDelay: `${(i-1)*0.12}s` }} />
                ))}
              </div>
              <span className="text-sm text-red-400 font-medium">Listening… speak now</span>
            </div>
          ) : (
            <span className="text-sm text-slate-500">
              {currentText ? 'Recording stopped — edit text above' : 'Click to record your answer'}
            </span>
          )}
        </div>
      </div>

      {/* Interim transcript preview */}
      {isListening && interimTranscript && (
        <div className="px-3 py-2 rounded-lg bg-white/[0.04] border border-white/[0.08] text-sm
                       text-slate-400 italic truncate">
          "{interimTranscript}…"
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10
                       border border-red-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-xs text-red-300">{error}</p>
        </div>
      )}
    </div>
  );
}
