// Primary provider: Perplexity (Sonar models)
export const PERPLEXITY_PRIMARY_MODELS = [
  "sonar-pro",
  "sonar-reasoning-pro",
  "sonar",
] as const;

export const PERPLEXITY_FAST_MODELS = [
  "sonar",
  "sonar-pro",
] as const;

export const PERPLEXITY_PRIMARY_MODEL = PERPLEXITY_PRIMARY_MODELS[0];
export const PERPLEXITY_FAST_MODEL = PERPLEXITY_FAST_MODELS[0];

// Fallback provider: Gemini, used only when Perplexity is unavailable (e.g. credits exhausted)
export const GEMINI_PRIMARY_MODELS = [
  "gemini-flash-latest",
  "gemini-2.5-flash",
  "gemini-3-flash-preview",
] as const;

export const GEMINI_FAST_MODELS = [
  "gemini-2.5-flash-lite",
  "gemini-3.1-flash-lite-preview",
  "gemini-flash-latest",
  "gemini-2.5-flash",
] as const;

export const GEMINI_PRIMARY_MODEL = GEMINI_PRIMARY_MODELS[0];
export const GEMINI_FAST_MODEL = GEMINI_FAST_MODELS[0];
