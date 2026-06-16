/**
 * Standalone script (not part of the Next.js app) to observe, in isolation,
 * an LLM deciding whether to call a tool.
 *
 * Run with: npx tsx scripts/test-tool-call.ts "your prompt here"
 */

process.loadEnvFile(".env.local");

import { generateText, stepCountIs } from "ai";
import { openai } from "@ai-sdk/openai";
import { agentTools } from "../lib/agent/tools";

async function main() {
  const prompt =
    process.argv[2] ??
    "What does the company Tavily do, and what API do they offer?";

  console.log(`Prompt: "${prompt}"\n`);

  const result = await generateText({
    model: openai("gpt-4o-mini"),
    stopWhen: stepCountIs(5),
    tools: agentTools,
    prompt,
  });

  console.log("\n=== Steps taken ===");
  result.steps.forEach((step, i) => {
    console.log(`\nStep ${i + 1}:`);
    for (const call of step.toolCalls) {
      console.log(`  tool call -> ${call.toolName}(${JSON.stringify(call.input)})`);
    }
    if (step.text) {
      console.log(`  text -> ${step.text}`);
    }
  });

  console.log("\n=== Final answer ===");
  console.log(result.text);
}

main().catch((err) => {
  console.error("Script failed:", err);
  process.exit(1);
});
