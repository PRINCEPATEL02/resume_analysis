import React, { useState, useCallback, useEffect } from 'react';
import {
  FileText, Brain, Loader2, AlertCircle,
  ChevronRight, Home, Upload, ArrowLeft, Sparkles
} from 'lucide-react';
import ResumeUploader from '../components/ResumeUploader';
import QuestionCard from '../components/QuestionCard';
import Summary from '../components/Summary';
import HomePage from './HomePage';
import { generateFeedback } from '../services/aiService';
import { extractPdfText } from '../services/pdfService';
import { generateQuestionsFromResume, FALLBACK_QUESTIONS, QuestionSource } from '../services/questionService';
import {
  saveResume, saveAnswers, loadAnswers,
  loadResume, clearSession
} from '../services/storage';
import { Question, Answer, Feedback, InterviewStep, ResumeInfo } from '../types';

// ─── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ answered, total }: { answered: number; total: number }) {
  const pct = total > 0 ? Math.round((answered / total) * 100) : 0;
  return (
    <div className="space-y-1.5">
      <div className="flex justify-between text-xs text-slate-500">
        <span>{answered} of {total} answered</span>
        <span>{pct}%</span>
      </div>
      <div className="h-1.5 bg-white/[0.07] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full progress-bar transition-all duration-700"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

// ─── Step Breadcrumb ──────────────────────────────────────────────────────────
function StepBreadcrumb({ step }: { step: 'upload' | 'questions' | 'feedback' }) {
  const steps = [
    { id: 'upload', label: 'Resume' },
    { id: 'questions', label: 'Interview' },
    { id: 'feedback', label: 'Feedback' },
  ];
  const activeIdx = steps.findIndex((s) => s.id === step);
  return (
    <div className="flex items-center gap-2">
      {steps.map((s, i) => (
        <React.Fragment key={s.id}>
          <div className="flex items-center gap-1.5">
            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold
              transition-all duration-300
              ${i < activeIdx
                ? 'bg-emerald-500/30 text-emerald-400 border border-emerald-500/40'
                : i === activeIdx
                ? 'bg-violet-500/30 text-violet-300 border border-violet-500/50 ring-2 ring-violet-500/20'
                : 'bg-white/[0.06] text-slate-600 border border-white/[0.08]'}`}
            >
              {i < activeIdx ? '✓' : i + 1}
            </div>
            <span className={`text-xs font-medium hidden sm:block transition-colors
              ${i === activeIdx ? 'text-slate-300' : i < activeIdx ? 'text-emerald-500' : 'text-slate-600'}`}>
              {s.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <ChevronRight className={`w-3 h-3 flex-shrink-0 ${i < activeIdx ? 'text-emerald-600' : 'text-slate-700'}`} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ─── Questions Page Nav Bar ───────────────────────────────────────────────────
function QuestionsNavBar({ onGoHome, onGoUpload }: { onGoHome: () => void; onGoUpload: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 p-3 rounded-2xl
                    bg-white/[0.03] border border-white/[0.08]">
      <StepBreadcrumb step="questions" />
      <div className="flex items-center gap-2">
        <button
          onClick={onGoUpload}
          id="go-upload-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                     bg-white/[0.07] text-slate-300 border border-white/[0.12]
                     hover:bg-violet-500/15 hover:border-violet-500/30 hover:text-violet-300
                     active:scale-95 transition-all duration-200"
          title="Change resume"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Change Resume</span>
          <span className="sm:hidden">Resume</span>
        </button>
        <button
          onClick={onGoHome}
          id="exit-to-home-btn"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                     bg-white/[0.07] text-slate-300 border border-white/[0.12]
                     hover:bg-red-500/15 hover:border-red-500/30 hover:text-red-300
                     active:scale-95 transition-all duration-200"
          title="Exit interview"
        >
          <Home className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Exit to Home</span>
          <span className="sm:hidden">Home</span>
        </button>
      </div>
    </div>
  );
}

// ─── Generating Questions Overlay ─────────────────────────────────────────────
function GeneratingOverlay({ fileName }: { fileName: string }) {
  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center
                    justify-center z-50 animate-fade-in">
      <div className="card p-8 text-center space-y-5 max-w-sm mx-4">
        <div className="relative mx-auto w-20 h-20">
          <div className="w-20 h-20 rounded-2xl bg-violet-500/20 border border-violet-500/30
                          flex items-center justify-center">
            <Sparkles className="w-9 h-9 text-violet-400 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2
                          border-slate-950 flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-white animate-spin" />
          </div>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-100">Analysing Your Resume</p>
          <p className="text-sm text-slate-400 mt-1 leading-relaxed">
            AI is reading <span className="text-violet-300 font-medium truncate">{fileName}</span>
            {' '}and crafting personalised questions just for you…
          </p>
        </div>
        <div className="space-y-2">
          {['Extracting resume content…', 'Identifying your skills…', 'Generating your questions…'].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-2 text-xs text-slate-500">
                <div className={`w-1.5 h-1.5 rounded-full ${i === 0 ? 'bg-emerald-400' : i === 1 ? 'bg-violet-400 animate-pulse' : 'bg-slate-700'}`} />
                {step}
              </div>
            )
          )}
        </div>
        <div className="h-1 bg-white/[0.07] rounded-full overflow-hidden">
          <div className="h-full w-2/3 progress-bar rounded-full" />
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InterviewFlowPage() {
  const [step, setStep] = useState<InterviewStep>('home');
  const [resumeInfo, setResumeInfo] = useState<ResumeInfo | null>(null);
  const [questions, setQuestions] = useState<Question[]>(FALLBACK_QUESTIONS);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGeneratingQuestions, setIsGeneratingQuestions] = useState(false);
  const [questionSource, setQuestionSource] = useState<QuestionSource>('fallback');

  // Restore session on mount
  useEffect(() => {
    const savedResume = loadResume();
    const savedAnswers = loadAnswers();
    if (savedResume) {
      setResumeInfo(savedResume);
      if (savedAnswers.length > 0) setAnswers(savedAnswers);
    }
  }, []);

  const goHome = useCallback(() => setStep('home'), []);
  const goUpload = useCallback(() => setStep('upload'), []);

  // ── Resume uploaded → extract text → generate questions ──────────────────
  const handleResumeUpload = useCallback(async (info: ResumeInfo, file: File) => {
    setResumeInfo(info);
    saveResume(info);
    setAnswers([]);  // clear old answers for new resume
    setIsGeneratingQuestions(true);
    setStep('questions'); // show page with overlay

    try {
      const resumeText = await extractPdfText(file);
      const { questions: generated, source } = await generateQuestionsFromResume(resumeText, info.name);
      setQuestions(generated);
      setQuestionSource(source);
    } catch (err) {
      console.warn('Question generation failed, using fallback:', err);
      setQuestions(FALLBACK_QUESTIONS);
      setQuestionSource('fallback');
    } finally {
      setIsGeneratingQuestions(false);
    }
  }, []);

  const handleAnswerChange = useCallback(
    (questionId: number, text: string, duration: number) => {
      setAnswers((prev) => {
        const idx = prev.findIndex((a) => a.questionId === questionId);
        const updated: Answer = { questionId, text, timestamp: new Date().toISOString(), duration };
        const next = idx >= 0
          ? prev.map((a, i) => (i === idx ? updated : a))
          : [...prev, updated];
        saveAnswers(next);
        return next;
      });
    },
    []
  );

  const handleSubmit = async () => {
    setSubmitError(null);
    setIsSubmitting(true);
    setStep('submitting');
    try {
      const result = await generateFeedback({ answers, questions, resumeInfo: resumeInfo ?? undefined });
      setFeedback(result);
      setStep('feedback');
    } catch {
      setSubmitError('Something went wrong generating feedback. Please try again.');
      setStep('questions');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = useCallback(() => {
    clearSession();
    setResumeInfo(null);
    setAnswers([]);
    setFeedback(null);
    setSubmitError(null);
    setIsSubmitting(false);
    setQuestions(FALLBACK_QUESTIONS);
    setStep('home');
  }, []);

  const answeredCount = answers.filter((a) => a.text?.trim().length > 0).length;
  const canSubmit = answeredCount > 0 && !isSubmitting && !isGeneratingQuestions;

  return (
    <div className="min-h-screen">

      {/* ── Home ──────────────────────────────────────────────────────────── */}
      {step === 'home' && <HomePage onStart={goUpload} />}

      {/* ── Upload ────────────────────────────────────────────────────────── */}
      {step === 'upload' && (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 py-10 animate-fade-in">
          <div className="w-full max-w-xl">
            {/* Back nav */}
            <div className="flex items-center justify-between mb-6">
              <button onClick={goHome}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                           text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]
                           active:scale-95 transition-all duration-200">
                <ArrowLeft className="w-4 h-4" /> Back to Home
              </button>
              <StepBreadcrumb step="upload" />
            </div>

            <div className="text-center mb-8 space-y-2">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">Upload Your Resume</h2>
              <p className="text-slate-400 text-sm">
                AI will analyse your resume and create <span className="text-violet-300 font-medium">personalised interview questions</span> just for you
              </p>
            </div>

            <ResumeUploader onResumeUpload={handleResumeUpload} />

            {resumeInfo && answers.length > 0 && (
              <div className="mt-4 flex items-center justify-between gap-3 px-4 py-3
                              rounded-xl bg-violet-500/10 border border-violet-500/20">
                <div className="text-sm min-w-0">
                  <p className="text-violet-300 font-medium">Previous session found</p>
                  <p className="text-slate-500 text-xs truncate">{resumeInfo.name}</p>
                </div>
                <button onClick={() => setStep('questions')}
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg
                             text-xs font-semibold bg-violet-500/20 text-violet-300
                             border border-violet-500/30 hover:bg-violet-500/30 transition-all">
                  Continue <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Questions ─────────────────────────────────────────────────────── */}
      {(step === 'questions' || step === 'submitting') && (
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-5 animate-fade-in">

          {/* Top nav: Exit + Change Resume */}
          <QuestionsNavBar onGoHome={goHome} onGoUpload={goUpload} />

          {/* AI-generated / fallback badge */}
          {!isGeneratingQuestions && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-xl border
              ${ questionSource === 'fallback'
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                : 'bg-violet-500/10 border-violet-500/20 text-violet-300'
              }`}>
              <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
              { questionSource === 'fallback'
                ? <span>Using <strong>default questions</strong> — restart server & ensure Gemini key is set for personalised questions</span>
                : <span>Questions <strong>generated from your resume</strong> via {questionSource === 'ai-backend' ? 'Gemini (server)' : questionSource === 'ai-gemini' ? 'Gemini (direct)' : 'OpenAI'}</span>
              }
            </div>
          )}

          {/* Resume badge */}
          {resumeInfo && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl
                            bg-emerald-500/10 border border-emerald-500/20 text-sm text-emerald-300">
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate font-medium">{resumeInfo.name}</span>
              <span className="text-emerald-600 text-xs flex-shrink-0 ml-auto">
                {(resumeInfo.size / 1024).toFixed(0)} KB
              </span>
            </div>
          )}

          {/* Progress */}
          <ProgressBar answered={answeredCount} total={questions.length} />

          {/* Question cards */}
          <div className="space-y-4">
            {questions.map((q, i) => (
              <QuestionCard
                key={`${q.id}-${q.text.slice(0, 20)}`}
                question={q}
                index={i}
                totalQuestions={questions.length}
                existingAnswer={answers.find((a) => a.questionId === q.id)}
                onAnswerChange={handleAnswerChange}
              />
            ))}
          </div>

          {/* Error */}
          {submitError && (
            <div className="flex items-start gap-3 px-4 py-3 rounded-xl
                            bg-red-500/10 border border-red-500/30 animate-slide-up">
              <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-300">{submitError}</p>
            </div>
          )}

          {/* Submit */}
          <div className="sticky bottom-4 pt-2">
            <button
              onClick={handleSubmit}
              disabled={!canSubmit}
              className="btn-primary w-full py-4 text-base shadow-xl shadow-violet-900/40"
            >
              {isSubmitting
                ? <><Loader2 className="w-5 h-5 animate-spin" /> Generating AI Feedback…</>
                : <><Brain className="w-5 h-5" /> Get AI Feedback ({answeredCount}/{questions.length} answered)</>
              }
            </button>
          </div>
        </div>
      )}

      {/* ── Generating questions overlay ───────────────────────────────────── */}
      {isGeneratingQuestions && <GeneratingOverlay fileName={resumeInfo?.name ?? 'your resume'} />}

      {/* ── Submitting overlay ────────────────────────────────────────────── */}
      {step === 'submitting' && !isGeneratingQuestions && (
        <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm flex items-center
                        justify-center z-50 animate-fade-in">
          <div className="card p-8 text-center space-y-4 max-w-sm mx-4">
            <div className="w-16 h-16 rounded-2xl bg-violet-500/20 border border-violet-500/30
                            flex items-center justify-center mx-auto">
              <Brain className="w-8 h-8 text-violet-400 animate-pulse" />
            </div>
            <div>
              <p className="text-lg font-semibold text-slate-100">Analysing your answers…</p>
              <p className="text-sm text-slate-400 mt-1">AI is crafting your personalised feedback</p>
            </div>
            <div className="h-1 bg-white/[0.07] rounded-full overflow-hidden">
              <div className="h-full w-3/5 progress-bar rounded-full" />
            </div>
          </div>
        </div>
      )}

      {/* ── Feedback ──────────────────────────────────────────────────────── */}
      {step === 'feedback' && feedback && (
        <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-white">Your Interview Feedback</h2>
            <button onClick={goHome}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                         text-slate-400 hover:text-slate-200 hover:bg-white/[0.07]
                         active:scale-95 transition-all duration-200">
              <Home className="w-4 h-4" /> Home
            </button>
          </div>
          <Summary
            feedback={feedback}
            questions={questions}
            resumeInfo={resumeInfo}
            onRestart={handleRestart}
          />
        </div>
      )}
    </div>
  );
}
