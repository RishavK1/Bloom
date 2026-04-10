import { z } from "zod";

import { inngest } from "./client";
import { prisma } from "@/lib/db";
import { runCodeAgentWorkflow } from "./run-code-agent";

export const codeAgentFunction = inngest.createFunction(
  { id: "code-agent" },
  { event: "code.agent/run" },
  async ({ event, step }) => {
    const workflowInput = z.object({
      projectId: z.string(),
      value: z.string(),
    }).parse(event.data);

    const workflowResult = await step.run("run-code-agent", async () => {
      return runCodeAgentWorkflow(workflowInput);
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
