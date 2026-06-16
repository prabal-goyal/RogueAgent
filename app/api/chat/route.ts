import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { agentTools } from "@/lib/agent/tools";

/**
 * The route the frontend's useChat hook posts to by default ("/api/chat").
 *
 * Unlike scripts/test-tool-call.ts (which used generateText and waited for
 * the whole run to finish), this uses streamText and returns the stream
 * directly as the HTTP response — the browser starts receiving events
 * (text chunks, tool-call notifications, tool results) as soon as they
 * happen, instead of waiting for the entire agent loop to complete.
 */
export async function POST(request: Request) {
  let body: { messages: UIMessage[]; resumeText?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, resumeText } = body;
  if (!Array.isArray(messages)) {
    return Response.json({ error: "'messages' must be an array" }, { status: 400 });
  }

  const result = streamText({
    model: openai("gpt-4o-mini"),
    stopWhen: stepCountIs(5),
    tools: agentTools,
    // The resume isn't a tool call — it's context we already have, so it
    // goes in directly as a system message rather than something the
    // model has to decide to fetch.
    system: resumeText
      ? `Here is the user's resume:\n\n${resumeText}`
      : undefined,
    // The client sends UIMessage[] (with a `parts` array per message);
    // streamText needs the plainer ModelMessage[] shape instead.
    messages: await convertToModelMessages(messages),
  });

  // Packages the stream into a Response with the correct SSE headers, in
  // the wire format the useChat hook on the frontend expects.
  return result.toUIMessageStreamResponse({
    // By default the AI SDK replaces every error (tool failures, provider
    // failures, anything) with a generic "An error occurred." — a
    // deliberate safety default so a stray exception can't leak server
    // internals (stack traces, file paths, etc.) to an end user.
    //
    // We override it here ONLY because every error our own tools throw
    // (lib/tools/search-web.ts, lib/tools/fetch-job-page.ts) is a message
    // we wrote ourselves and know doesn't contain secrets. Errors from
    // elsewhere (e.g. a malformed provider response) still fall back to a
    // safe generic string.
    onError: (error) => {
      console.error("Agent run failed:", error);
      if (error instanceof Error) return error.message;
      return "An unexpected error occurred.";
    },
  });
}
