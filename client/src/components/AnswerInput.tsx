import React from 'react';

interface Props {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  isListening?: boolean;
}

export default function AnswerInput({ value, onChange, placeholder, isListening }: Props) {
  return (
    <div className="relative">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder ?? 'Type your answer here, or use the voice recorder below...'}
        rows={5}
        className={`textarea-base w-full transition-all duration-300
          ${isListening
            ? 'border-red-500/50 ring-2 ring-red-500/20 bg-red-500/[0.03]'
            : ''
          }`}
        aria-label="Answer input"
      />

      {/* Character count */}
      <div className="absolute bottom-2.5 right-3 text-xs text-slate-600 select-none">
        {value.length} chars
      </div>

      {/* Live indicator */}
      {isListening && (
        <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
          <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse" />
          <span className="text-xs text-red-400 font-medium">Live</span>
        </div>
      )}
    </div>
  );
}
