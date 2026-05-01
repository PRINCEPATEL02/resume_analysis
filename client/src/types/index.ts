// ── Domain types ─────────────────────────────────────────────────────────────

export interface ResumeInfo {
  name: string;
  size: number;
  uploadTimestamp: string;
}

export interface Question {
  id: number;
  text: string;
  hint: string;
  category: string;
  icon: string;
}

export interface Answer {
  questionId: number;
  text: string;
  timestamp: string;
  duration?: number;
}

export interface QuestionFeedback {
  questionId: number;
  score: number;
  comment: string;
}

export interface Feedback {
  summary: string;
  strengths: string[];
  improvements: string[];
  rating?: number;
  overallScore?: number;
  questionFeedback?: QuestionFeedback[];
}

export type InterviewStep = 'home' | 'upload' | 'questions' | 'submitting' | 'feedback';
