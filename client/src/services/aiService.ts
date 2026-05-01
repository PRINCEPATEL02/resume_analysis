import { Answer, Feedback, Question } from '../types';

interface FeedbackOpts {
  answers: Answer[];
  questions: Question[];
  resumeInfo?: { name: string; size: number };
}

// ─── Prompt ───────────────────────────────────────────────────────────────────
function buildPrompt(opts: FeedbackOpts): string {
  const qa = opts.answers
    .map((a) => {
      const q = opts.questions.find((q) => q.id === a.questionId);
      return `Q: ${q?.text ?? `Q${a.questionId}`}\nA: ${a.text?.trim() || '[No answer provided]'}`;
    })
    .join('\n\n');

  return `You are a senior HR interviewer and career coach. Analyze the following interview answers and give structured, actionable feedback.
${opts.resumeInfo ? `\nCandidate Resume: ${opts.resumeInfo.name}\n` : ''}
---
${qa}
---
Respond ONLY with valid JSON (no markdown, no code fences):
{
  "summary": "2-3 sentence overall performance summary",
  "strengths": ["point 1", "point 2", "point 3"],
  "improvements": ["area 1", "area 2", "area 3"],
  "overallScore": <integer 1-10>,
  "questionFeedback": [
    { "questionId": 1, "score": <1-10>, "comment": "actionable feedback" },
    { "questionId": 2, "score": <1-10>, "comment": "actionable feedback" },
    { "questionId": 3, "score": <1-10>, "comment": "actionable feedback" },
    { "questionId": 4, "score": <1-10>, "comment": "actionable feedback" },
    { "questionId": 5, "score": <1-10>, "comment": "actionable feedback" }
  ]
}`;
}

// ─── Parser ───────────────────────────────────────────────────────────────────
function parseResponse(raw: string): Feedback {
  const clean = raw.replace(/```json\n?|\n?```|```/g, '').trim();
  const start = clean.indexOf('{');
  const end = clean.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const parsed: any = JSON.parse(clean.slice(start, end + 1));
  return {
    summary: String(parsed.summary || ''),
    strengths: Array.isArray(parsed.strengths) ? (parsed.strengths as unknown[]).map(String) : [],
    improvements: Array.isArray(parsed.improvements) ? (parsed.improvements as unknown[]).map(String) : [],
    overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : undefined,
    rating: typeof parsed.overallScore === 'number' ? Math.round(parsed.overallScore / 2) : undefined,
    questionFeedback: Array.isArray(parsed.questionFeedback)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (parsed.questionFeedback as any[]).map((x) => ({
          questionId: Number(x.questionId),
          score: Number(x.score),
          comment: String(x.comment),
        }))
      : undefined,
  };
}

// ─── Fetch with timeout helper (replaces AbortSignal.timeout for TS compat) ──
function fetchWithTimeout(url: string, options: RequestInit, ms: number): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), ms);
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id));
}

// ─── API Callers ──────────────────────────────────────────────────────────────
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
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
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
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.choices?.[0]?.message?.content ?? '';
}

async function callBackend(prompt: string): Promise<string> {
  const base = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const res = await fetch(`${base}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  });
  if (!res.ok) throw new Error(`Backend ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.text ?? '';
}

async function callOllama(prompt: string): Promise<string> {
  // Use manual timeout instead of AbortSignal.timeout for broader TS compatibility
  const res = await fetchWithTimeout(
    'http://localhost:11434/api/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3', prompt, stream: false }),
    },
    25000
  );
  if (!res.ok) throw new Error(`Ollama ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.response ?? '';
}

// ─── Mock ─────────────────────────────────────────────────────────────────────
export function generateMockFeedback(opts: FeedbackOpts): Feedback {
  const { answers, questions } = opts;
  const answered = answers.filter((a) => (a.text?.trim().length ?? 0) > 0);
  const avgLen = answered.length
    ? Math.round(answered.reduce((s, a) => s + a.text.length, 0) / answered.length)
    : 0;
  const score = Math.min(9, Math.max(3, Math.round(avgLen / 28)));

  return {
    summary: `You completed ${answered.length}/${questions.length} questions with an average response length of ${avgLen} characters. ${
      avgLen > 200
        ? 'Your answers demonstrate strong communication and thoughtful reflection.'
        : avgLen > 80
        ? 'Your responses show good effort — adding specific examples with the STAR method would make them even more compelling.'
        : 'Focus on expanding your answers with concrete, specific examples from your experience.'
    }`,
    strengths: [
      answered.length === questions.length
        ? 'Completed all interview questions — shows commitment and preparedness'
        : `Answered ${answered.length} of ${questions.length} questions`,
      avgLen > 100
        ? 'Provided detailed responses that demonstrate communication skills'
        : 'Addressed each question directly and concisely',
      'Engaged with the full interview process professionally',
    ],
    improvements: [
      avgLen < 150
        ? 'Use the STAR method: Situation, Task, Action, Result for richer answers'
        : 'Continue providing detailed examples — specificity builds credibility',
      'Tailor responses to highlight skills most relevant to the target role',
      'Practice out loud to improve fluency and reduce filler words',
    ],
    overallScore: score,
    rating: Math.round(score / 2),
    questionFeedback: questions.map((q) => {
      const a = answers.find((a) => a.questionId === q.id);
      const len = a?.text?.length ?? 0;
      return {
        questionId: q.id,
        score: Math.min(9, Math.max(2, Math.round(len / 22))),
        comment:
          len === 0
            ? 'No answer provided. This question is asked in nearly every HR interview — prepare a 60-second response.'
            : len < 60
            ? 'Too brief. Expand with a specific personal story or achievement.'
            : len < 150
            ? 'Decent start. A concrete example with measurable results would make this memorable.'
            : 'Well-developed answer with good level of detail and structure.',
      };
    }),
  };
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export async function generateFeedback(opts: FeedbackOpts): Promise<Feedback> {
  const prompt = buildPrompt(opts);
  const providers = [
    { name: 'Gemini', fn: () => callGemini(prompt) },
    { name: 'OpenAI', fn: () => callOpenAI(prompt) },
    { name: 'Backend', fn: () => callBackend(prompt) },
    { name: 'Ollama', fn: () => callOllama(prompt) },
  ];

  for (const { name, fn } of providers) {
    try {
      const raw = await fn();
      if (raw?.trim()) {
        console.info(`✅ [AI] Feedback via ${name}`);
        return parseResponse(raw);
      }
    } catch (err) {
      console.warn(`⚠️ [AI] ${name} failed: ${(err as Error).message}`);
    }
  }

  console.info('ℹ️ [AI] Using smart mock feedback (add an API key for real AI)');
  return generateMockFeedback(opts);
}
