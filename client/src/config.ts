/**
 * config.ts — Single source of truth for all environment-driven config.
 *
 * LOCAL  (npm run dev):   VITE_API_URL = http://localhost:5000
 * PROD   (npm run build): VITE_API_URL = https://resume-analysis-fo8d.onrender.com
 *
 * Vite automatically picks the right .env file based on the mode.
 * NEVER import process.env in Vite — always use import.meta.env.
 */

// Backend base URL — resolves automatically per environment
export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

// Optional direct AI keys (not required if backend proxy is running)
export const GEMINI_KEY   = import.meta.env.VITE_GEMINI_API_KEY ?? '';
export const OPENAI_KEY   = import.meta.env.VITE_OPENAI_API_KEY ?? '';

// Convenience: is a direct Gemini key available?
export const HAS_GEMINI_KEY = Boolean(GEMINI_KEY);

// App metadata
export const APP_NAME     = 'HireReady AI';
export const APP_VERSION  = '1.0.0';
