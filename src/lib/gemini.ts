import { createAgent, gemini } from "@inngest/agent-kit";
import type { StateData } from "@inngest/agent-kit";

type ModelName = string;

function shouldRetryGeminiError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("high demand") ||
    message.includes("429") ||
    message.includes("503") ||
    message.includes("RESOURCE_EXHAUSTED") ||
    message.includes("UNAVAILABLE")
  );
}

export async function runAgentWithGeminiFallback<T>({
  buildAgent,
  input,
  models,
}: {
  buildAgent: (model: ReturnType<typeof gemini>) => ReturnType<typeof createAgent<T & StateData>>;
  input: string;
  models: readonly ModelName[];
}) {
  let lastError: unknown;

  for (const modelName of models) {
    try {
      const agent = buildAgent(gemini({ model: modelName }));
      return await agent.run(input);
    } catch (error) {
      lastError = error;
      if (!shouldRetryGeminiError(error)) {
        throw error;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}
