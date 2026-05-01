import { Answer, ResumeInfo } from '../types';

const K = {
  RESUME: 'hr_resume',
  ANSWERS: 'hr_answers',
  DARK: 'hr_dark',
  DRAFTS: 'hr_drafts',
} as const;

const safe = <T>(fn: () => T, fallback: T): T => {
  try { return fn(); } catch { return fallback; }
};

export const saveResume = (r: ResumeInfo) =>
  safe(() => localStorage.setItem(K.RESUME, JSON.stringify(r)), undefined);

export const loadResume = (): ResumeInfo | null =>
  safe(() => { const v = localStorage.getItem(K.RESUME); return v ? JSON.parse(v) : null; }, null);

export const clearResume = () => localStorage.removeItem(K.RESUME);

export const saveAnswers = (a: Answer[]) =>
  safe(() => localStorage.setItem(K.ANSWERS, JSON.stringify(a)), undefined);

export const loadAnswers = (): Answer[] =>
  safe(() => { const v = localStorage.getItem(K.ANSWERS); return v ? JSON.parse(v) : []; }, []);

export const clearAnswers = () => localStorage.removeItem(K.ANSWERS);

export const saveDarkMode = (v: boolean) => localStorage.setItem(K.DARK, String(v));

export const loadDarkMode = (): boolean =>
  safe(() => {
    const s = localStorage.getItem(K.DARK);
    return s !== null ? s === 'true' : (window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true);
  }, true);

export const saveDraft = (qId: number, text: string) =>
  safe(() => {
    const all = loadDrafts();
    all[qId] = text;
    localStorage.setItem(K.DRAFTS, JSON.stringify(all));
  }, undefined);

export const loadDrafts = (): Record<number, string> =>
  safe(() => { const v = localStorage.getItem(K.DRAFTS); return v ? JSON.parse(v) : {}; }, {});

export const clearDrafts = () => localStorage.removeItem(K.DRAFTS);

export const clearSession = () => {
  clearResume();
  clearAnswers();
  clearDrafts();
};
