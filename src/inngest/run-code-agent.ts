import { Sandbox } from "@e2b/code-interpreter";
import {
  createAgent,
  createNetwork,
  createState,
  createTool,
  gemini,
  type Message,
  type Tool,
} from "@inngest/agent-kit";
import { z } from "zod";

import { GEMINI_FAST_MODELS, GEMINI_PRIMARY_MODELS } from "../lib/ai-models";
import { prisma } from "../lib/db";
import { runAgentWithGeminiFallback } from "../lib/gemini";
import { FRAGMENT_TITLE_PROMPT, PROMPT, RESPONSE_PROMPT } from "../prompt";
import { getSandbox, lastAssistantTextMessageContent } from "./utils";

interface AgentState {
  summary: string;
  files: { [path: string]: string };
}

export interface RunCodeAgentInput {
  projectId: string;
  value: string;
}

export interface RunCodeAgentResult {
  files: Record<string, string>;
  response: string;
  sandboxUrl: string;
  summary: string;
  title: string;
}

const SHOULD_USE_TOOL_AGENT = process.env.VERCEL !== "1";

const FILE_GENERATION_RESPONSE_SCHEMA = z.object({
  files: z.array(
    z.object({
      content: z.string(),
      path: z.string(),
    })
  ),
  response: z.string(),
  summary: z.string(),
  title: z.string(),
});

function getGeminiResponseText(payload: unknown) {
  const text = (payload as {
    candidates?: Array<{
      content?: {
        parts?: Array<{ text?: string }>;
      };
    }>;
  })?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned an empty response");
  }

  return text;
}

function getGeminiErrorMessage(payload: unknown) {
  const message = (payload as { error?: { message?: string } })?.error?.message;
  return message || "Gemini request failed";
}

function sanitizeGeneratedFile(path: string, content: string) {
  if (!/\.tsx?$/.test(path)) {
    return content;
  }

  const lines = content.split("\n");
  const filteredLines: string[] = [];
  let hasUseClient = false;

  for (const line of lines) {
    const normalized = line.trim().replace(/;$/, "");
    if (normalized === '"use client"' || normalized === "'use client'") {
      if (hasUseClient) {
        continue;
      }
      hasUseClient = true;
      filteredLines.push(`'use client'`);
      continue;
    }
    filteredLines.push(line);
  }

  return filteredLines.join("\n");
}

async function generateFilesWithoutTools({
  projectId,
  sandboxId,
  value,
}: {
  projectId: string;
  sandboxId: string;
  value: string;
}) {
  const previousMessages = await prisma.message.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "asc",
    },
    take: 10,
  });

  const latestFragment = await prisma.fragment.findFirst({
    where: {
      message: {
        projectId,
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const existingFiles = latestFragment?.files
    ? JSON.stringify(latestFragment.files, null, 2)
    : "{}";

  const conversation = previousMessages
    .map((message) => `${message.role}: ${message.content}`)
    .join("\n");

  const prompt = `You are generating files for a Next.js 15 app router project.

Return only valid JSON matching this shape:
{
  "summary": "<task_summary>short technical summary</task_summary>",
  "title": "Short Title",
  "response": "Short user-facing response",
  "files": [
    { "path": "app/page.tsx", "content": "file contents" }
  ]
}

Rules:
- All file paths must be relative.
- Must include app/page.tsx.
- Use only TypeScript/TSX files.
- Use Tailwind CSS classes only.
- Do not use package installation or external image URLs.
- Keep the app small but polished and functional.
- If using React hooks or event handlers, app/page.tsx must start with 'use client' on the first line.
- You may add 1 to 4 files total.
- Reuse and update the existing files when it makes sense.

Conversation:
${conversation || "No previous messages."}

Existing files from the latest fragment:
${existingFiles}

Latest user request:
${value}`;

  const models = [...new Set([...GEMINI_PRIMARY_MODELS, ...GEMINI_FAST_MODELS])];
  let lastError: unknown;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
            generationConfig: {
              responseMimeType: "application/json",
            },
          }),
        }
      );

      const payload = await response.json();
      if (!response.ok) {
        throw new Error(getGeminiErrorMessage(payload));
      }

      const parsed = FILE_GENERATION_RESPONSE_SCHEMA.parse(
        JSON.parse(getGeminiResponseText(payload))
      );

      const activeSandbox = await getSandbox(sandboxId);
      const fileMap: Record<string, string> = {};
      for (const file of parsed.files) {
        const sanitizedContent = sanitizeGeneratedFile(file.path, file.content);
        await activeSandbox.files.write(file.path, sanitizedContent);
        fileMap[file.path] = sanitizedContent;
      }

      return {
        files: fileMap,
        response: parsed.response,
        summary: parsed.summary,
        title: parsed.title,
      };
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error(String(lastError));
}

async function runCodeGenerationAttempt({
  modelName,
  projectId,
  sandboxId,
  value,
}: {
  modelName: string;
  projectId: string;
  sandboxId: string;
  value: string;
}) {
  const previousMessages = await prisma.message.findMany({
    where: {
      projectId,
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 7,
  });

  const formattedMessages: Message[] = previousMessages
    .map((message) => ({
      type: "text" as const,
      role: message.role === "ASSISTANT" ? "assistant" as const : "user" as const,
      content: message.content,
    }))
    .reverse();

  const state = createState<AgentState>(
    {
      summary: "",
      files: {},
    },
    {
      messages: formattedMessages,
    }
  );

  const codeAgent = createAgent<AgentState>({
    name: "code-agent",
    description: "An expert coding agent",
    system: PROMPT,
    model: gemini({ model: modelName }),
    tools: [
      createTool({
        name: "terminal",
        description: "Use the terminal to run commands",
        parameters: z.object({
          command: z.string(),
        }),
        handler: async ({ command }) => {
          const buffers = { stderr: "", stdout: "" };
          try {
            const activeSandbox = await getSandbox(sandboxId);
            const result = await activeSandbox.commands.run(command, {
              onStderr: (data: string) => {
                buffers.stderr += data;
              },
              onStdout: (data: string) => {
                buffers.stdout += data;
              },
            });

            return result.stdout;
          } catch (error) {
            return `Failed to run command: ${String(error)}\nstdout: ${buffers.stdout}\nstderr: ${buffers.stderr}`;
          }
        },
      }),
      createTool({
        name: "CreateOrUpdateFiles",
        description: "Create or update files in the sandbox",
        parameters: z.object({
          files: z.array(
            z.object({
              content: z.string(),
              path: z.string(),
            })
          ),
        }),
        handler: async ({ files }, { network }: Tool.Options<AgentState>) => {
          const activeSandbox = await getSandbox(sandboxId);
          if (!network) {
            throw new Error("Network state unavailable");
          }

          const updateFiles = network.state.data.files || {};

          for (const file of files) {
            await activeSandbox.files.write(file.path, file.content);
            updateFiles[file.path] = file.content;
          }

          network.state.data.files = updateFiles;
        },
      }),
      createTool({
        name: "read_files",
        description: "Read files from the sandbox",
        parameters: z.object({
          files: z.array(z.string()),
        }),
        handler: async ({ files }) => {
          const activeSandbox = await getSandbox(sandboxId);
          const contents = [];

          for (const file of files) {
            const content = await activeSandbox.files.read(file);
            contents.push({ content, path: file });
          }

          return JSON.stringify(contents);
        },
      }),
    ],
    lifecycle: {
      onResponse: async ({ network, result }) => {
        const lastAssistantMessageText = lastAssistantTextMessageContent(result);
        if (network && lastAssistantMessageText?.includes("<task_summary>")) {
          network.state.data.summary = lastAssistantMessageText;
        }

        return result;
      },
    },
  });

  const network = createNetwork<AgentState>({
    name: "coding-agent-network",
    agents: [codeAgent],
    maxIter: 15,
    defaultState: state,
    router: async ({ network }) => {
      if (network.state.data.summary) {
        return;
      }

      return codeAgent;
    },
  });

  return network.run(value, { state });
}

function getTextOutputContent(output: Awaited<ReturnType<ReturnType<typeof createAgent>["run"]>>["output"], fallback: string) {
  const firstOutput = output[0];
  if (!firstOutput || firstOutput.type !== "text") {
    return fallback;
  }

  if (typeof firstOutput.content === "string") {
    return firstOutput.content;
  }

  return firstOutput.content.map((part) => part.text).join("");
}

export async function runCodeAgentWorkflow({
  projectId,
  value,
}: RunCodeAgentInput): Promise<RunCodeAgentResult> {
  const sandbox = await Sandbox.create("vibe-test-rishav2");
  await sandbox.setTimeout(1 * 60 * 60 * 1000);
  const sandboxId = sandbox.sandboxId;

  let result: Awaited<ReturnType<typeof runCodeGenerationAttempt>> | null = null;

  if (SHOULD_USE_TOOL_AGENT) {
    for (const modelName of GEMINI_PRIMARY_MODELS) {
      try {
        result = await runCodeGenerationAttempt({
          modelName,
          projectId,
          sandboxId,
          value,
        });
        break;
      } catch {
      }
    }
  }

  const sandboxUrl = `https://${sandbox.getHost(3000)}`;

  if (!result) {
    const fallback = await generateFilesWithoutTools({
      projectId,
      sandboxId,
      value,
    });

    return {
      files: fallback.files,
      response: fallback.response.trim(),
      sandboxUrl,
      summary: fallback.summary.trim(),
      title: fallback.title.trim(),
    };
  }

  const summary = result.state.data.summary;
  const files = result.state.data.files || {};

  if (!summary || Object.keys(files).length === 0) {
    const fallback = await generateFilesWithoutTools({
      projectId,
      sandboxId,
      value,
    });

    return {
      files: fallback.files,
      response: fallback.response.trim(),
      sandboxUrl,
      summary: fallback.summary.trim(),
      title: fallback.title.trim(),
    };
  }

  const [fragmentTitleResult, responseResult] = await Promise.all([
    runAgentWithGeminiFallback({
      input: summary,
      models: GEMINI_FAST_MODELS,
      buildAgent: (model) => createAgent({
        name: "fragment-title-generator",
        description: "A Fragment Title Generator Agent",
        system: FRAGMENT_TITLE_PROMPT,
        model,
      }),
    }),
    runAgentWithGeminiFallback({
      input: summary,
      models: GEMINI_FAST_MODELS,
      buildAgent: (model) => createAgent({
        name: "response-generator",
        description: "A Response Generator Agent",
        system: RESPONSE_PROMPT,
        model,
      }),
    }),
  ]);

  return {
    files,
    response: getTextOutputContent(responseResult.output, "Here you go").trim(),
    sandboxUrl,
    summary,
    title: getTextOutputContent(fragmentTitleResult.output, "Fragment").trim(),
  };
}
