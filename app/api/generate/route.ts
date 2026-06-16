import { generateObject, convertToModelMessages, type UIMessage } from "ai";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

/**
 * The "finalize" step: takes the existing chat transcript (which, by this
 * point, already contains the company research and job description as
 * tool-call results from the conversational phase) plus the resume, and
 * asks for ONE structured object back — no tools involved, since nothing
 * new needs to be fetched at this stage.
 *
 * generateObject (vs. generateText/streamText) constrains the model's
 * reply to match a Zod schema, so the response is guaranteed to have this
 * exact shape — the frontend can render fields directly instead of
 * parsing free-form prose.
 */
const outputSchema = z.object({
  companySummary: z
    .string()
    .describe("A 2-3 sentence summary of the company, based on research so far"),
  coverLetter: z
    .string()
    .describe("A complete, tailored cover letter for this role"),
  interviewQuestions: z
    .array(z.string())
    .describe("5 likely interview questions for this specific role, with a short note on why each might be asked"),
});

export async function POST(request: Request) {
  let body: { messages: UIMessage[]; resumeText?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, resumeText } = body;
  if (!Array.isArray(messages) || messages.length === 0) {
    return Response.json(
      { error: "'messages' must be a non-empty array" },
      { status: 400 }
    );
  }

  try {
    const { object } = await generateObject({
      model: openai("gpt-4o-mini"),
      schema: outputSchema,
      system:
        "You are finalizing a job application. Use the company research and " +
        "job description already gathered earlier in this conversation, " +
        "plus the resume below, to produce the cover letter and interview prep.\n\n" +
        (resumeText ? `Resume:\n${resumeText}` : "No resume was provided."),
      messages: await convertToModelMessages(messages),
    });

    return Response.json(object);
  } catch (err) {
    // Unlike the chat route, this isn't a stream — there's no onError hook
    // to plug into, so we handle it the ordinary way: catch, log the real
    // error server-side, return a safe summary to the client.
    console.error("generateObject failed:", err);
    return Response.json(
      { error: "Failed to generate the cover letter. Please try again." },
      { status: 500 }
    );
  }
}
