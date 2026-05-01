/**
 * questionService.ts
 * Generates personalised interview questions from resume text using the AI provider chain.
 */

import { Question } from '../types';

// ─── Fallback questions (used when AI fails) ──────────────────────────────────
export const FALLBACK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: 'Tell me about yourself.',
    hint: 'Give a 2-minute overview: background, key skills, and why you are here.',
    category: 'Introduction',
    icon: '👤',
  },
  {
    id: 2,
    text: 'Why should we hire you?',
    hint: 'Highlight 2-3 unique strengths and how they directly benefit the role.',
    category: 'Value Proposition',
    icon: '🎯',
  },
  {
    id: 3,
    text: 'What are your greatest strengths and weaknesses?',
    hint: 'For weaknesses, choose real ones and explain what you are doing to improve them.',
    category: 'Self-Assessment',
    icon: '⚖️',
  },
  {
    id: 4,
    text: 'Describe a challenge you faced and how you overcame it.',
    hint: 'Use the STAR method: Situation, Task, Action, Result.',
    category: 'Behavioral',
    icon: '🔥',
  },
  {
    id: 5,
    text: 'Where do you see yourself in 5 years?',
    hint: "Show ambition aligned with the company's direction.",
    category: 'Career Vision',
    icon: '🚀',
  },
];

const CATEGORY_ICONS: Record<string, string> = {
  Introduction:       '👤',
  'Value Proposition': '🎯',
  'Self-Assessment':   '⚖️',
  Behavioral:          '🔥',
  Technical:           '💻',
  Leadership:          '🏆',
  'Career Vision':     '🚀',
  Cultural:            '🤝',
  Motivation:          '💡',
  Experience:          '📋',
};

// ─── Prompt ───────────────────────────────────────────────────────────────────
function buildQuestionPrompt(resumeText: string, fileName: string): string {
  return `You are an expert HR interviewer. Based on the candidate's resume below, generate exactly 5 personalised interview questions that are specific to their background, skills, and experience.

Resume file name: ${fileName}
Resume content:
---
${resumeText.slice(0, 3500)}
---

Rules:
- Each question must be directly relevant to something in their resume (skills, projects, roles, education, achievements)
- Mix question types: at least 1 behavioral, 1 technical/role-specific, 1 motivation/vision, 1 strength/weakness, 1 situational
- Make questions feel natural and conversational
- Keep each question concise (1-2 sentences max)

Respond ONLY with valid JSON (no markdown, no code fences):
[
  {
    "id": 1,
    "text": "question text here",
    "hint": "brief coaching tip for the candidate (1 sentence)",
    "category": "one of: Introduction | Behavioral | Technical | Leadership | Career Vision | Self-Assessment | Cultural | Motivation | Experience",
    "icon": "single relevant emoji"
  },
  ... (5 total)
]`;
}

// ─── API callers (mirrors aiService.ts pattern) ───────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error('No VITE_GEMINI_API_KEY');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1000 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAI(prompt: string): Promise<string> {
  const key = import.meta.env.VITE_OPENAI_API_KEY;
  if (!key) throw new Error('No VITE_OPENAI_API_KEY');
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert HR interviewer who creates personalized interview questions.',
        },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1000,
      temperature: 0.8,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.choices?.[0]?.message?.content ?? '';
}

async function callBackend(prompt: string): Promise<string> {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const res = await fetch(`${base}/api/questions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.text ?? '';
}

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseQuestions(raw: string): Question[] {
  const clean = raw.replace(/```json\n?|\n?```|```/g, '').trim();
  const start = clean.indexOf('[');
  const end = clean.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('No JSON array found');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any[] = JSON.parse(clean.slice(start, end + 1));
  if (!Array.isArray(parsed) || parsed.length === 0) throw new Error('Empty questions array');

  return parsed.slice(0, 5).map((q, i) => ({
    id: i + 1,
    text: String(q.text || '').trim(),
    hint: String(q.hint || '').trim(),
    category: String(q.category || 'Interview').trim(),
    icon: String(q.icon || CATEGORY_ICONS[q.category] || '💬').trim(),
  }));
}

// ─── Main export ──────────────────────────────────────────────────────────────
export async function generateQuestionsFromResume(
  resumeText: string,
  fileName: string
): Promise<Question[]> {
  const prompt = buildQuestionPrompt(resumeText, fileName);

  const providers = [
    { name: 'Gemini', fn: () => callGemini(prompt) },
    { name: 'OpenAI', fn: () => callOpenAI(prompt) },
    { name: 'Backend', fn: () => callBackend(prompt) },
  ];

  for (const { name, fn } of providers) {
    try {
      const raw = await fn();
      if (raw?.trim()) {
        const questions = parseQuestions(raw);
        console.info(`✅ [Questions] Generated via ${name}`);
        return questions;
      }
    } catch (err) {
      console.warn(`⚠️ [Questions] ${name} failed: ${(err as Error).message}`);
    }
  }

  console.info('ℹ️ [Questions] Using fallback questions (no AI available)');
  return FALLBACK_QUESTIONS;
}
