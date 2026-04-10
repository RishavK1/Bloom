import { z } from "zod";
import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import type { RunCodeAgentResult } from "./run-code-agent";

const execFileAsync = promisify(execFile);

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code.agent/run" },
  async ({ event, step }) => {
    const workflowInput = z.object({
      projectId: z.string(),
      value: z.string(),
    }).parse(event.data);

    const workflowResult = await step.run("run-code-agent", async () => {
      const tsxBin = path.join(process.cwd(), "node_modules", ".bin", process.platform === "win32" ? "tsx.cmd" : "tsx");
      const cliPath = path.join(process.cwd(), "src", "inngest", "run-code-agent.cli.ts");

      const { stdout } = await execFileAsync(
        tsxBin,
        [cliPath, JSON.stringify(workflowInput)],
        {
          cwd: process.cwd(),
          env: process.env,
          maxBuffer: 10 * 1024 * 1024,
        }
      );

      return JSON.parse(stdout) as RunCodeAgentResult;
    });

    const isError =
      !workflowResult.summary
      || Object.keys(workflowResult.files || {}).length === 0;

    await step.run("save-result", async () => {
      if (isError) {
        return await prisma.message.create({
          data: {
            projectId: workflowInput.projectId,
            content: "Something went wrong , please try again.",
            role: "ASSISTANT",
            type: "ERROR",
          }
        })
      }
      return await prisma.message.create({
        data: {
          projectId: workflowInput.projectId,
          content: workflowResult.response,
          role: "ASSISTANT",
          type: "RESULT",
          fragments: {
            create: {
              sandboxUrl: workflowResult.sandboxUrl,
              title: workflowResult.title,
              files: workflowResult.files,
            }
          }
        }
      })
    })
    return {
      url: workflowResult.sandboxUrl,
      title: workflowResult.title,
      files: workflowResult.files,
      summary: workflowResult.summary,
    };
  },
);
