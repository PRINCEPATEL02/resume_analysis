import React, { useState, useEffect } from 'react';
import { Brain, Sun, Moon, Github, Zap } from 'lucide-react';
import InterviewFlowPage from './pages/InterviewFlowPage';
import { loadDarkMode, saveDarkMode } from './services/storage';
import { HAS_GEMINI_KEY, API_URL } from './config';

export default function App() {
  const [darkMode, setDarkMode] = useState(true);

  useEffect(() => {
    const saved = loadDarkMode();
    setDarkMode(saved);
    document.documentElement.classList.toggle('dark', saved);
  }, []);

  const toggleDark = () => {
    const next = !darkMode;
    setDarkMode(next);
    saveDarkMode(next);
    document.documentElement.classList.toggle('dark', next);
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>

      {/* ── Header ────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 border-b border-white/[0.06]
                         bg-slate-950/80 backdrop-blur-2xl">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">

          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600
                            flex items-center justify-center shadow-lg shadow-violet-900/50">
              <Brain className="w-[18px] h-[18px] text-white" />
            </div>
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-gradient">HireReady AI</span>
              <span className="text-[10px] text-slate-500 hidden sm:block">Interview Coach</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center gap-2">
            {/* AI status pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full
                            bg-white/[0.04] border border-white/[0.08] text-xs text-slate-500">
              <Zap className="w-3 h-3 text-violet-400" />
              {HAS_GEMINI_KEY
                ? <span className="text-emerald-400 font-medium">Gemini Active</span>
                : <span title={`API: ${API_URL}`}>Backend Mode</span>
              }
            </div>

            {/* Dark / Light toggle */}
            <button
              onClick={toggleDark}
              className="btn-icon"
              aria-label={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode
                ? <Sun className="w-4 h-4" />
                : <Moon className="w-4 h-4" />
              }
            </button>
          </div>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto">
        <InterviewFlowPage />
      </main>

      {/* ── Footer ────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.05] mt-16">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-col sm:flex-row items-center
                        justify-between gap-3 text-xs text-slate-600">
          <p>© {new Date().getFullYear()} HireReady AI · React 18 + Vite + TailwindCSS</p>
          <div className="flex items-center gap-4">
            <span>AI: Gemini · OpenAI · Ollama</span>
            <a
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-slate-400 transition-colors"
              aria-label="GitHub"
            >
              <Github className="w-4 h-4" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
