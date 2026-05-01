/**
 * questionService.ts
 * Generates personalised interview questions from resume text using AI.
 * Strategy: Backend proxy first (server has real keys) → Gemini direct → OpenAI direct → Fallback
 */

import { Question } from '../types';
import { API_URL, GEMINI_KEY, OPENAI_KEY } from '../config';

// ─── Fallback questions ───────────────────────────────────────────────────────
export const FALLBACK_QUESTIONS: Question[] = [
  { id: 1, text: 'Tell me about yourself.', hint: 'Give a 2-minute overview: background, key skills, and why you are here.', category: 'Introduction', icon: '👤' },
  { id: 2, text: 'Why should we hire you?', hint: 'Highlight 2-3 unique strengths and how they directly benefit the role.', category: 'Value Proposition', icon: '🎯' },
  { id: 3, text: 'What are your greatest strengths and weaknesses?', hint: 'For weaknesses, choose real ones and explain what you are doing to improve.', category: 'Self-Assessment', icon: '⚖️' },
  { id: 4, text: 'Describe a challenge you faced and how you overcame it.', hint: 'Use the STAR method: Situation, Task, Action, Result.', category: 'Behavioral', icon: '🔥' },
  { id: 5, text: 'Where do you see yourself in 5 years?', hint: "Show ambition aligned with the company's direction.", category: 'Career Vision', icon: '🚀' },
];

// ─── Prompt builder ───────────────────────────────────────────────────────────
function buildPrompt(resumeText: string, fileName: string): string {
  const hasContent = resumeText.length > 50 && resumeText !== fileName;
  return `You are a senior HR interviewer. ${hasContent
    ? `Based on this candidate's resume, generate exactly 5 highly specific interview questions tailored to their unique background, skills, projects, and experience.`
    : `Generate 5 professional HR interview questions for a candidate whose resume file is named "${fileName}".`
  }

${hasContent ? `RESUME CONTENT:\n---\n${resumeText.slice(0, 3000)}\n---\n` : ''}
STRICT RULES:
- Each question must reference something specific from the candidate's background (if resume provided)
- Include a mix: at least 1 behavioral, 1 role-specific/technical, 1 motivation, 1 strength/challenge
- Questions must be different every time — never generic
- Keep each question to 1-2 sentences

Respond ONLY with a valid JSON array (no markdown fences, no extra text):
[
  { "id": 1, "text": "...", "hint": "one-sentence coaching tip", "category": "Introduction|Behavioral|Technical|Leadership|Career Vision|Self-Assessment|Motivation|Experience", "icon": "emoji" },
  { "id": 2, "text": "...", "hint": "...", "category": "...", "icon": "..." },
  { "id": 3, "text": "...", "hint": "...", "category": "...", "icon": "..." },
  { "id": 4, "text": "...", "hint": "...", "category": "...", "icon": "..." },
  { "id": 5, "text": "...", "hint": "...", "category": "...", "icon": "..." }
]`;
}

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseQuestions(raw: string): Question[] {
  const clean = raw.replace(/```json\n?|\n?```|```/g, '').trim();
  const start = clean.indexOf('[');
  const end = clean.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array in response');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const arr: any[] = JSON.parse(clean.slice(start, end + 1));
  if (!Array.isArray(arr) || arr.length < 3) throw new Error('Too few questions returned');
  return arr.slice(0, 5).map((q, i) => ({
    id: i + 1,
    text: String(q.text || '').trim(),
    hint: String(q.hint || '').trim(),
    category: String(q.category || 'Interview').trim(),
    icon: String(q.icon || '💬').trim(),
  }));
}

// ─── Fetch with timeout ───────────────────────────────────────────────────────
async function fetchWithTimeout(url: string, opts: RequestInit, ms = 20000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(id);
  }
}

// ─── Provider: Backend proxy (uses server-side API keys — most reliable) ──────
async function callBackend(prompt: string): Promise<string> {
  const base = API_URL;
  const res = await fetchWithTimeout(`${base}/api/questions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    },
    20000
  );
  if (!res.ok) throw new Error(`Backend /api/questions → ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  if (!d?.text) throw new Error('Backend returned empty text');
  return d.text;
}

// ─── Provider: Gemini direct (client-side key) ────────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('VITE_GEMINI_API_KEY not set in client/.env');
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.9, maxOutputTokens: 1000 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini direct → ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── Provider: OpenAI direct (client-side key) ────────────────────────────────
async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error('VITE_OPENAI_API_KEY not set in client/.env');
  const res = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a senior HR interviewer generating personalized interview questions.' },
          { role: 'user', content: prompt },
        ],
        max_tokens: 1000,
        temperature: 0.9,
      }),
    }
  );
  if (!res.ok) throw new Error(`OpenAI direct → ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.choices?.[0]?.message?.content ?? '';
}

// ─── Main export ──────────────────────────────────────────────────────────────
export type QuestionSource = 'ai-backend' | 'ai-gemini' | 'ai-openai' | 'fallback';

export async function generateQuestionsFromResume(
  resumeText: string,
  fileName: string
): Promise<{ questions: Question[]; source: QuestionSource }> {
  const prompt = buildPrompt(resumeText, fileName);

  // Order: Backend proxy first (server has keys) → Gemini direct → OpenAI direct
  const providers: Array<{ name: QuestionSource; fn: () => Promise<string> }> = [
    { name: 'ai-backend', fn: () => callBackend(prompt) },
    { name: 'ai-gemini',  fn: () => callGemini(prompt) },
    { name: 'ai-openai',  fn: () => callOpenAI(prompt) },
  ];

  for (const { name, fn } of providers) {
    try {
      console.info(`[Questions] Trying ${name}…`);
      const raw = await fn();
      if (raw?.trim()) {
        const questions = parseQuestions(raw);
        console.info(`✅ [Questions] Success via ${name}`);
        return { questions, source: name };
      }
    } catch (err) {
      console.warn(`⚠️ [Questions] ${name} failed:`, (err as Error).message);
    }
  }

  console.info('ℹ️ [Questions] All AI providers failed — using fallback questions');
  return { questions: FALLBACK_QUESTIONS, source: 'fallback' };
}
