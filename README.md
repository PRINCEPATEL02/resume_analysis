# 🎯 HireReady AI

**An AI-powered automated interview and coaching platform.**

Upload your resume → Answer 5 HR interview questions (voice or text) → Get instant AI feedback with scores, strengths, and improvement tips.

---

## ✨ Features

| Feature | Details |
|---|---|
| 📄 Resume Upload | PDF-only, drag & drop, MIME validation, size check |
| 🎤 Voice Input | Web Speech API, real-time transcript, interim preview |
| ✍️ Text Input | Editable textarea, synced with voice |
| 💾 Auto-Save | Draft saved per question to localStorage |
| 🤖 AI Feedback | Gemini → OpenAI → Ollama → Smart Mock fallback |
| 📊 Score Report | Overall score ring, per-question breakdown, star rating |
| ⬇️ Download | Export feedback as .txt report |
| 🌙 Dark Mode | System preference + manual toggle, persisted |
| ⏱️ Timer | Per-question time tracking |
| 📱 Responsive | Mobile + desktop optimized |

---

## 🏗️ Project Structure

```
resume_analysis/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── App.tsx           # Root component with header/footer
│   │   ├── main.tsx          # React entry point
│   │   ├── index.css         # Global styles + Tailwind
│   │   ├── pages/
│   │   │   └── InterviewFlowPage.tsx  # Main interview flow
│   │   ├── components/
│   │   │   ├── ResumeUploader.tsx    # Drag & drop PDF upload
│   │   │   ├── QuestionCard.tsx      # Collapsible Q&A card
│   │   │   ├── AnswerInput.tsx       # Controlled textarea
│   │   │   ├── VoiceRecorder.tsx     # Mic + wave animation
│   │   │   └── Summary.tsx           # Feedback display
│   │   ├── hooks/
│   │   │   ├── useVoiceRecorder.ts   # Web Speech API hook
│   │   │   └── useTimer.ts           # Question timer hook
│   │   ├── services/
│   │   │   ├── aiService.ts          # AI provider chain
│   │   │   ├── fallbackService.ts    # Mock feedback
│   │   │   └── storage.ts            # localStorage helpers
│   │   └── types/
│   │       └── index.ts              # TypeScript types
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   └── .env.example
└── server/                  # Node.js + Express backend
    ├── index.js             # API proxy (Gemini / OpenAI)
    ├── package.json
    └── .env.example
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm 9+

### 1. Install dependencies

```bash
# Frontend
cd client
npm install

# Backend (optional)
cd ../server
npm install
```

### 2. Configure environment

```bash
# Client
cd client
copy .env.example .env
# Edit .env and add your API key

# Server
cd ../server
copy .env.example .env
# Edit .env and add your API key
```

### 3. Start the app

**Frontend only (works without backend — uses mock AI):**
```bash
cd client
npm run dev
# Open http://localhost:3000
```

**With backend:**
```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

---

## 🔑 API Key Setup

The app uses a **fallback chain** — if one provider fails, it tries the next:

```
Gemini → OpenAI → Backend Proxy → Ollama → Smart Mock
```

### Option A: Gemini (Recommended — Free tier available)
1. Go to [aistudio.google.com](https://aistudio.google.com)
2. Create a free API key
3. Add to `client/.env`:
   ```
   VITE_GEMINI_API_KEY=AIza...
   ```

### Option B: OpenAI
1. Go to [platform.openai.com](https://platform.openai.com)
2. Create an API key
3. Add to `client/.env`:
   ```
   VITE_OPENAI_API_KEY=sk-...
   ```

### Option C: Backend Proxy (More secure)
Add keys to `server/.env` instead — the frontend calls your server which calls the AI.

### Option D: Ollama (Local, no API key needed)
1. Install [Ollama](https://ollama.ai)
2. Run: `ollama pull llama3`
3. Start: `ollama serve`

### No API Key
The app works perfectly with the built-in **Smart Mock** AI — it generates realistic feedback based on answer length and completeness.

---

## 🌐 Deployment (Vercel)

### Frontend

```bash
cd client
npm run build
```

Then deploy `client/dist` to Vercel:

```bash
npx vercel --prod
```

Or connect your GitHub repo to Vercel and set:
- **Framework**: Vite
- **Root Directory**: `client`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

**Environment Variables in Vercel:**
```
VITE_GEMINI_API_KEY = your_key
VITE_API_URL = https://your-backend.railway.app
```

### Backend (Railway / Render)

```bash
cd server
# Deploy to Railway:
railway up
# Or Render: connect repo, set root dir to /server
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| Styling | TailwindCSS 3 (dark mode, glassmorphism) |
| Icons | Lucide React |
| Voice | Web Speech API (native browser) |
| State | React hooks + localStorage |
| AI | Gemini 1.5 Flash / GPT-3.5-turbo / Ollama |
| Backend | Node.js + Express |
| Fonts | Inter (Google Fonts) |

---

## 📋 HR Questions

1. Tell me about yourself
2. Why should we hire you?
3. What are your greatest strengths and weaknesses?
4. Describe a challenge you faced and how you overcame it
5. Where do you see yourself in 5 years?

---

## 📜 License

MIT — free to use and modify.
