import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.FRONTEND_URL || ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));
app.use(express.json({ limit: '4mb' }));

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    gemini: !!process.env.GEMINI_API_KEY,
    openai: !!process.env.OPENAI_API_KEY,
  });
});

// ─── AI helpers ───────────────────────────────────────────────────────────────
async function callGemini(prompt) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY not set');
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.8, maxOutputTokens: 1500 },
      }),
    }
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? '';
}

async function callOpenAI(prompt, systemMsg = '') {
  const key = process.env.OPENAI_API_KEY;
  if (!key) throw new Error('OPENAI_API_KEY not set');
  const messages = systemMsg
    ? [{ role: 'system', content: systemMsg }, { role: 'user', content: prompt }]
    : [{ role: 'user', content: prompt }];
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
    body: JSON.stringify({ model: 'gpt-3.5-turbo', messages, max_tokens: 1500, temperature: 0.8 }),
  });
  if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
  const data = await res.json();
  return data?.choices?.[0]?.message?.content ?? '';
}

async function tryProviders(prompt, systemMsg = '') {
  for (const [name, fn] of [
    ['Gemini', () => callGemini(prompt)],
    ['OpenAI', () => callOpenAI(prompt, systemMsg)],
  ]) {
    try {
      const text = await fn();
      if (text?.trim()) { console.log(`✅ [${name}]`); return text; }
    } catch (e) { console.warn(`⚠️ [${name}] ${e.message}`); }
  }
  return null;
}

// ─── /api/feedback ────────────────────────────────────────────────────────────
app.post('/api/feedback', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const text = await tryProviders(prompt, 'You are an expert HR interviewer and career coach.');
  if (!text) return res.status(503).json({ error: 'No AI provider available' });
  res.json({ text });
});

// ─── /api/questions ───────────────────────────────────────────────────────────
app.post('/api/questions', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt) return res.status(400).json({ error: 'prompt required' });
  const text = await tryProviders(prompt, 'You are an expert HR interviewer who creates personalized interview questions.');
  if (!text) return res.status(503).json({ error: 'No AI provider available' });
  res.json({ text });
});

// ─── 404 / Error handlers ─────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Route not found' }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`
  ┌──────────────────────────────────────┐
  │   HireReady AI Server                │
  │   http://localhost:${PORT}              │
  │   Gemini: ${process.env.GEMINI_API_KEY ? '✅ Configured    ' : '❌ Not configured'} │
  │   OpenAI: ${process.env.OPENAI_API_KEY ? '✅ Configured    ' : '❌ Not configured'} │
  └──────────────────────────────────────┘
  `);
});
