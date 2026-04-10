import { inngest } from "@/inngest/client";
import { GEMINI_FAST_MODELS } from "@/lib/ai-models";
import { prisma } from "@/lib/db";
import { runAgentWithGeminiFallback } from "@/lib/gemini";
import {  createTRPCRouter, protectedProcedure } from "@/trpc/init";
import z from "zod";
import { TRPCError } from "@trpc/server";
import { consumeCredits } from "@/lib/usage";
import { createAgent } from "@inngest/agent-kit";

const PROJECT_NAME_STOP_WORDS = new Set([
    "a",
    "an",
    "app",
    "application",
    "build",
    "create",
    "for",
    "make",
    "simple",
    "site",
    "the",
    "using",
    "web",
    "website",
    "with",
]);

function deriveProjectNameFromPrompt(userPrompt: string) {
    const tokens = userPrompt
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, " ")
        .split(/[\s-]+/)
        .filter(Boolean)
        .filter((token) => !PROJECT_NAME_STOP_WORDS.has(token))
        .slice(0, 3);

    if (tokens.length === 0) {
        return "untitled-app";
    }

    const slug = tokens.join("-");
    if (tokens.length === 1 && !/(app|blog|dashboard|manager|platform|portfolio|site|store|tool|tracker|website)$/.test(slug)) {
        return `${slug}-app`;
    }

    return slug;
}

async function generateProjectName(userPrompt: string): Promise<string> {
    const promptBasedName = deriveProjectNameFromPrompt(userPrompt);

    try {
        const result = await runAgentWithGeminiFallback({
            input: userPrompt,
            models: GEMINI_FAST_MODELS,
            buildAgent: (model) => createAgent({
                name: "project-name-generator",
                description: "Generates smart project names based on user prompts",
                system: `You are a project name generator. Generate a short, descriptive project name based on what the user wants to build.

Rules:
- Max 3 words, preferably 2
- Use kebab-case (e.g., "calculator-app", "todo-list", "weather-dashboard")
- Be specific and descriptive
- No generic names like "my-app" or "new-project"
- Return ONLY the name, nothing else
- No quotes or punctuation

Examples:
User: "build a calculator" → "calculator-app"
User: "create a todo list with categories" → "todo-manager"
User: "weather app that shows forecast" → "weather-dashboard"
User: "Netflix clone" → "netflix-clone"`,
                model,
            }),
        });
        
        // Extract text from the output
        let projectName = promptBasedName;
        if (result.output && result.output.length > 0) {
            const firstOutput = result.output[0];
            if (firstOutput.type === "text") {
                if (typeof firstOutput.content === "string") {
                    projectName = firstOutput.content.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
                } else if (Array.isArray(firstOutput.content)) {
                    const text = firstOutput.content.map(c => typeof c === "string" ? c : "").join("");
                    projectName = text.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
                }
            }
        }

        if (!projectName || projectName.replace(/-/g, "").length < 3) {
            return promptBasedName;
        }

        return projectName.replace(/-+/g, "-").replace(/^-|-$/g, "");
    } catch (error) {
        console.error("Project name generation error:", error);
        return promptBasedName;
    }
}

export const projectsRouter = createTRPCRouter({
getOne : protectedProcedure
    .input(
        z.object({
            id: z.string().min(1, "Id is required"),
        })
    )
    .query(async ({input, ctx})=>{
        const existingProject = await prisma.project.findUnique({
            where:{
                id: input.id,
                userId : ctx.auth.userId,
            }
            
        })
        if(!existingProject){
            throw new TRPCError({
                code: "NOT_FOUND",
                message: "Project not found",
            })
        }
        return existingProject;
    }),
    getMany : protectedProcedure
    .query(async ({ctx})=>{
        const projects = await prisma.project.findMany({
            where:{
                userId : ctx.auth.userId,
            },
            orderBy:{
                updatedAt:"desc" 
            },
            
        })
        return projects;
    }),
    create: protectedProcedure
        .input(
            z.object({
                value: z.string()
                .min(1, "Value is required")
                .max(10000, "Value is too long"),

            })
        )
        .mutation(async ({ input, ctx }) => {

            try {
                await consumeCredits();

            } catch (error) {
                if (error instanceof Error) {
                    throw new TRPCError({
                        code: "BAD_REQUEST",
                        message: error.message,
                    });
                }else{
                    throw new TRPCError({
                        code: "TOO_MANY_REQUESTS",
                        message: "You have reached the maximum number of requests. Please upgrade to a paid plan.",
                    })
                }
            }

            // Generate smart project name based on user's prompt
            const projectName = await generateProjectName(input.value);

            const createdProject = await prisma.project.create({
                data :{
                    userId : ctx.auth.userId,
                    name : projectName,
                    messages :{
                        create:{
                            content : input.value,
                            role : "USER",
                            type : "RESULT",
                        }
                    }
                }
            })
            
            await inngest.send({
                name: 'code.agent/run',
                data: {
                    value: input.value,
                    projectId : createdProject.id,
                }
            })
            return createdProject;
        }),
    delete: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, "Id is required"),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const existingProject = await prisma.project.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.auth.userId,
                }
            });

            if (!existingProject) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Project not found",
                });
            }

            await prisma.project.delete({
                where: {
                    id: input.id,
                }
            });

            return { success: true };
        }),
    rename: protectedProcedure
        .input(
            z.object({
                id: z.string().min(1, "Id is required"),
                name: z.string().min(1, "Name is required").max(100, "Name is too long"),
            })
        )
        .mutation(async ({ input, ctx }) => {
            const existingProject = await prisma.project.findUnique({
                where: {
                    id: input.id,
                    userId: ctx.auth.userId,
                }
            });

            if (!existingProject) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Project not found",
                });
            }

            const updatedProject = await prisma.project.update({
                where: {
                    id: input.id,
                },
                data: {
                    name: input.name,
                }
            });

            return updatedProject;
        })
})
