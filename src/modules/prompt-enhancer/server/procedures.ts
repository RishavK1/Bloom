import { createTRPCRouter, protectedProcedure } from "@/trpc/init";
import { GEMINI_FAST_MODELS } from "@/lib/ai-models";
import { runAgentWithGeminiFallback } from "@/lib/gemini";
import { z } from "zod";
import { createAgent } from "@inngest/agent-kit";

function normalizeText(value: string) {
    return value.toLowerCase().replace(/\s+/g, " ").trim();
}

function buildEnhancedPromptFallback(prompt: string) {
    const cleanPrompt = prompt.trim().replace(/\.+$/, "");
    return `${cleanPrompt}. Create a polished, responsive experience with clear layout structure, thoughtful spacing, strong visual hierarchy, and accessible interactions. Include realistic sections, useful empty or sample states where relevant, and production-ready styling with clean, maintainable code.`;
}

export const promptEnhancerRouter = createTRPCRouter({
    enhance: protectedProcedure
        .input(
            z.object({
                prompt: z.string().min(1, "Prompt is required").max(5000),
            })
        )
        .mutation(async ({ input }) => {
            try {
                const result = await runAgentWithGeminiFallback({
                    input: input.prompt,
                    models: GEMINI_FAST_MODELS,
                    buildAgent: (model) => createAgent({
                        name: "prompt-enhancer",
                        description: "Enhances user prompts for better code generation",
                        system: `You are a prompt enhancement assistant for a code generation AI. 
Your job is to take a user's brief idea and expand it into a clear, detailed prompt that will help generate better code.

Rules:
- Rewrite the prompt so it is noticeably more detailed than the input.
- Keep it concise but substantive, usually 2-4 sentences.
- Add concrete product, UI, UX, layout, and behavior details when relevant.
- Preserve the user's core intent.
- Do not ask questions.
- Do not add pleasantries or explanations.
- Return ONLY the rewritten prompt text.

Examples:
Input: "build a portfolio website"
Output: "Build a modern personal portfolio website with a strong landing section, about section, featured projects grid, skills area, and contact section. Use a polished responsive layout, clear typography, smooth spacing, and subtle interactive states so it feels professional on desktop and mobile."

Input: "make a todo app"
Output: "Create a responsive todo app with task creation, completion toggles, deletion, and simple filtering for active and completed tasks. Use a clean dashboard-style layout, clear empty states, and polished interactions so it feels production ready."`,
                        model,
                    }),
                });
                
                // Extract text from the output
                let enhancedText = input.prompt;
                if (result.output && result.output.length > 0) {
                    const firstOutput = result.output[0];
                    if (firstOutput.type === "text") {
                        if (typeof firstOutput.content === "string") {
                            enhancedText = firstOutput.content;
                        } else if (Array.isArray(firstOutput.content)) {
                            enhancedText = firstOutput.content.map(c => typeof c === "string" ? c : "").join("");
                        }
                    }
                }

                const normalizedInput = normalizeText(input.prompt);
                const normalizedEnhanced = normalizeText(enhancedText);
                if (
                    normalizedEnhanced === normalizedInput ||
                    normalizedEnhanced.length <= normalizedInput.length + 12
                ) {
                    enhancedText = buildEnhancedPromptFallback(input.prompt);
                }

                return { enhanced: enhancedText.trim() };
            } catch (error) {
                console.error("Prompt enhancement error:", error);
                return { enhanced: buildEnhancedPromptFallback(input.prompt) };
            }
        }),
});
