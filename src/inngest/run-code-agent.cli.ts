import { runCodeAgentWorkflow, type RunCodeAgentInput } from "./run-code-agent";

async function main() {
  const rawInput = process.argv[2];
  if (!rawInput) {
    throw new Error("Missing workflow input");
  }

  const input = JSON.parse(rawInput) as RunCodeAgentInput;
  const result = await runCodeAgentWorkflow(input);
  process.stdout.write(JSON.stringify(result));
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(message);
  process.exit(1);
});
