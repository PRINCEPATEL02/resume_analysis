import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle, Clock, ChevronDown, ChevronUp, Save } from 'lucide-react';
import AnswerInput from './AnswerInput';
import VoiceRecorder from './VoiceRecorder';
import { useTimer } from '../hooks/useTimer';
import { saveDraft } from '../services/storage';
import { Question, Answer } from '../types';

interface Props {
  question: Question;
  index: number;
  totalQuestions: number;
  existingAnswer?: Answer;
  onAnswerChange: (questionId: number, text: string, duration: number) => void;
}

export default function QuestionCard({ question, index, totalQuestions, existingAnswer, onAnswerChange }: Props) {
  const [text, setText] = useState(existingAnswer?.text ?? '');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const timer = useTimer();
  const draftTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const hasInteracted = useRef(false);

  // Start timer when user first interacts
  const handleTextChange = (newText: string) => {
    setText(newText);
    if (!hasInteracted.current) {
      hasInteracted.current = true;
      timer.start();
    }

    // Auto-save draft with debounce
    clearTimeout(draftTimeoutRef.current);
    draftTimeoutRef.current = setTimeout(() => {
      saveDraft(question.id, newText);
      onAnswerChange(question.id, newText, timer.seconds);
      if (newText.trim()) {
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 2000);
      }
    }, 800);
  };

  const handleVoiceTranscript = (voiceText: string) => {
    handleTextChange(voiceText);
    setIsVoiceActive(true);
    setTimeout(() => setIsVoiceActive(false), 500);
  };

  const handleManualSave = () => {
    saveDraft(question.id, text);
    onAnswerChange(question.id, text, timer.seconds);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Update parent whenever text changes (no debounce for final submit)
  useEffect(() => {
    onAnswerChange(question.id, text, timer.seconds);
  }, []); // eslint-disable-line

  useEffect(() => {
    return () => clearTimeout(draftTimeoutRef.current);
  }, []);

  const hasAnswer = text.trim().length > 0;
  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div className={`card transition-all duration-300 overflow-hidden
      ${hasAnswer ? 'border-emerald-500/20' : 'border-white/[0.08]'}`}
    >
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-start gap-4 p-5 text-left hover:bg-white/[0.02] transition-colors"
        aria-expanded={isExpanded}
      >
        {/* Question number */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold
          ${hasAnswer
            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            : 'bg-violet-500/20 text-violet-400 border border-violet-500/30'}`}
        >
          {hasAnswer ? <CheckCircle className="w-4 h-4" /> : index + 1}
        </div>

        <div className="flex-1 min-w-0">
          {/* Category & timer */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-medium text-violet-400 bg-violet-500/10
                           px-2 py-0.5 rounded-full border border-violet-500/20">
              {question.icon} {question.category}
            </span>
            {timer.seconds > 0 && (
              <span className="flex items-center gap-1 text-xs text-slate-500">
                <Clock className="w-3 h-3" /> {timer.formatted}
              </span>
            )}
            {hasAnswer && (
              <span className="text-xs text-slate-500">{wordCount} words</span>
            )}
          </div>
          <h3 className="text-base font-semibold text-slate-100 leading-snug">
            {question.text}
          </h3>
          {!isExpanded && hasAnswer && (
            <p className="mt-1 text-sm text-slate-400 truncate">{text}</p>
          )}
        </div>

        <ChevronDown className={`flex-shrink-0 w-5 h-5 text-slate-500 transition-transform duration-300
          ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Body */}
      {isExpanded && (
        <div className="px-5 pb-5 space-y-3 animate-fade-in">
          {/* Hint */}
          <p className="text-xs text-slate-500 border-l-2 border-violet-500/30 pl-3 italic">
            💡 {question.hint}
          </p>

          {/* Answer input */}
          <AnswerInput
            value={text}
            onChange={handleTextChange}
            isListening={isVoiceActive}
          />

          {/* Voice Recorder */}
          <VoiceRecorder
            onTranscript={handleVoiceTranscript}
            currentText={text}
          />

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-1">
            <div className="text-xs text-slate-600">
              Q {index + 1} of {totalQuestions}
            </div>
            <button
              onClick={handleManualSave}
              disabled={!hasAnswer}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed
                ${isSaved
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-white/[0.06] text-slate-400 border border-white/[0.1] hover:bg-white/[0.1]'
                }`}
              aria-label="Save answer"
            >
              {isSaved ? (
                <><CheckCircle className="w-3.5 h-3.5" /> Saved</>
              ) : (
                <><Save className="w-3.5 h-3.5" /> Save Draft</>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
