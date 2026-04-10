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
