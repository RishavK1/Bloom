import { createAgent, gemini, openai } from "@inngest/agent-kit";
import type { StateData } from "@inngest/agent-kit";

type ModelName = string;
type ProviderModel = ReturnType<typeof gemini> | ReturnType<typeof openai>;

export function perplexity(model: ModelName) {
  return openai({
    apiKey: process.env.PERPLEXITY_API_KEY,
    baseUrl: "https://api.perplexity.ai",
    model,
  });
}

/**
 * Tries every Perplexity model first (the primary provider), then falls back
 * to Gemini models if Perplexity is unavailable (e.g. rate limited or out of credits)
 * or no PERPLEXITY_API_KEY is configured.
 */
export async function runAgentWithFallback<T>({
  buildAgent,
  input,
  perplexityModels,
  geminiModels,
}: {
  buildAgent: (model: ProviderModel) => ReturnType<typeof createAgent<T & StateData>>;
  input: string;
  perplexityModels: readonly ModelName[];
  geminiModels: readonly ModelName[];
}) {
  let lastError: unknown;

  if (process.env.PERPLEXITY_API_KEY) {
    for (const modelName of perplexityModels) {
      try {
        const agent = buildAgent(perplexity(modelName));
        const result = await agent.run(input);
        console.log(`[ai-provider] served by perplexity:${modelName}`);
        return result;
      } catch (error) {
        console.log(`[ai-provider] perplexity:${modelName} failed: ${error instanceof Error ? error.message : String(error)}`);
        lastError = error;
      }
    }
  }

  for (const modelName of geminiModels) {
    try {
      const agent = buildAgent(gemini({ model: modelName }));
      const result = await agent.run(input);
      console.log(`[ai-provider] served by gemini:${modelName}`);
      return result;
    } catch (error) {
      console.log(`[ai-provider] gemini:${modelName} failed: ${error instanceof Error ? error.message : String(error)}`);
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
