/// <reference types="vite/client" />

// ─── Declare all VITE_ env variables used in this project ────────────────────
interface ImportMetaEnv {
  // Backend API URL — set per environment via .env / .env.production
  readonly VITE_API_URL: string;

  // Optional: direct AI keys (not needed if backend proxy is running)
  readonly VITE_GEMINI_API_KEY: string;
  readonly VITE_OPENAI_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
