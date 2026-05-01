import { Answer, Feedback, Question } from '../types';
import { API_URL, GEMINI_KEY, OPENAI_KEY } from '../config';

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
    strengths:    Array.isArray(parsed.strengths)    ? (parsed.strengths    as unknown[]).map(String) : [],
    improvements: Array.isArray(parsed.improvements) ? (parsed.improvements as unknown[]).map(String) : [],
    overallScore: typeof parsed.overallScore === 'number' ? parsed.overallScore : undefined,
    rating:       typeof parsed.overallScore === 'number' ? Math.round(parsed.overallScore / 2) : undefined,
    questionFeedback: Array.isArray(parsed.questionFeedback)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (parsed.questionFeedback as any[]).map((x) => ({
          questionId: Number(x.questionId),
          score:      Number(x.score),
          comment:    String(x.comment),
        }))
      : undefined,
  };
}

// ─── Timeout helper ───────────────────────────────────────────────────────────
function fetchWithTimeout(url: string, options: RequestInit, ms = 20000): Promise<Response> {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return fetch(url, { ...options, signal: ctrl.signal }).finally(() => clearTimeout(id));
}

// ─── Provider: Backend proxy (server has real keys — most reliable) ───────────
async function callBackend(prompt: string): Promise<string> {
  const res = await fetchWithTimeout(
    `${API_URL}/api/feedback`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt }),
    }
  );
  if (!res.ok) throw new Error(`Backend /api/feedback → ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  if (!d?.text) throw new Error('Backend returned empty text');
  return d.text;
}

// ─── Provider: Gemini direct (optional client key) ────────────────────────────
async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_KEY) throw new Error('VITE_GEMINI_API_KEY not set');
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_KEY}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1500 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini direct → ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

// ─── Provider: OpenAI direct (optional client key) ────────────────────────────
async function callOpenAI(prompt: string): Promise<string> {
  if (!OPENAI_KEY) throw new Error('VITE_OPENAI_API_KEY not set');
  const res = await fetchWithTimeout(
    'https://api.openai.com/v1/chat/completions',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${OPENAI_KEY}` },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    }
  );
  if (!res.ok) throw new Error(`OpenAI direct → ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.choices?.[0]?.message?.content ?? '';
}

// ─── Provider: Ollama local ───────────────────────────────────────────────────
async function callOllama(prompt: string): Promise<string> {
  const res = await fetchWithTimeout(
    'http://localhost:11434/api/generate',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model: 'llama3', prompt, stream: false }),
    },
    25000
  );
  if (!res.ok) throw new Error(`Ollama → ${res.status}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const d: any = await res.json();
  return d?.response ?? '';
}

// ─── Mock fallback ────────────────────────────────────────────────────────────
export function generateMockFeedback(opts: FeedbackOpts): Feedback {
  const { answers, questions } = opts;
  const answered = answers.filter((a) => (a.text?.trim().length ?? 0) > 0);
  const avgLen = answered.length
    ? Math.round(answered.reduce((s, a) => s + a.text.length, 0) / answered.length)
    : 0;
  const score = Math.min(9, Math.max(3, Math.round(avgLen / 28)));
  return {
    summary: `You completed ${answered.length}/${questions.length} questions (avg ${avgLen} chars). ${
      avgLen > 200 ? 'Strong communication shown.' : avgLen > 80 ? 'Good effort — add STAR examples.' : 'Expand answers with specific examples.'
    }`,
    strengths: [
      answered.length === questions.length ? 'Completed all questions' : `Answered ${answered.length}/${questions.length}`,
      avgLen > 100 ? 'Detailed responses show communication skills' : 'Concise and direct answers',
      'Engaged with the full interview process',
    ],
    improvements: [
      avgLen < 150 ? 'Use STAR method for richer answers' : 'Keep adding specific examples',
      'Tailor responses to the target role',
      'Practice out loud for fluency',
    ],
    overallScore: score,
    rating: Math.round(score / 2),
    questionFeedback: questions.map((q) => {
      const a = answers.find((a) => a.questionId === q.id);
      const len = a?.text?.length ?? 0;
      return {
        questionId: q.id,
        score: Math.min(9, Math.max(2, Math.round(len / 22))),
        comment: len === 0 ? 'No answer — prepare a 60-second response.' :
                 len < 60  ? 'Too brief. Add a personal story or achievement.' :
                 len < 150 ? 'Good start. Add a measurable result.' :
                             'Well-developed answer.',
      };
    }),
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────
// Order: Backend first (server has keys) → Gemini direct → OpenAI direct → Ollama → Mock
export async function generateFeedback(opts: FeedbackOpts): Promise<Feedback> {
  const prompt = buildPrompt(opts);
  const providers = [
    { name: 'Backend',  fn: () => callBackend(prompt) },
    { name: 'Gemini',   fn: () => callGemini(prompt) },
    { name: 'OpenAI',   fn: () => callOpenAI(prompt) },
    { name: 'Ollama',   fn: () => callOllama(prompt) },
  ];

  for (const { name, fn } of providers) {
    try {
      const raw = await fn();
      if (raw?.trim()) {
        console.info(`✅ [Feedback] via ${name}`);
        return parseResponse(raw);
      }
    } catch (err) {
      console.warn(`⚠️ [Feedback] ${name} failed: ${(err as Error).message}`);
    }
  }

  console.info('ℹ️ [Feedback] Using mock (no AI provider available)');
  return generateMockFeedback(opts);
}
