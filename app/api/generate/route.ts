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
    .describe(
      "A complete, tailored cover letter for this role. " +
      "You MUST use the candidate's actual name, job titles, company names, skills, and specific achievements " +
      "from the resume — never use placeholders like [Your Name] or [Your Experience]. " +
      "Every claim in the cover letter must be grounded in information from either the resume or the job description."
    ),
  interviewQuestions: z
    .array(z.string())
    .describe("5 likely interview questions for this specific role, with a short note on why each might be asked"),
});

export async function POST(request: Request) {
  let body: { messages: UIMessage[]; resumeText?: string; today?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { messages, resumeText, today } = body;
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
        `You are finalizing a job application. Today's date is ${today}.\n\n` +
        "COVER LETTER RULES — follow these strictly:\n" +
        "- Use the candidate's real full name from the resume as the signatory.\n" +
        "- Reference specific past roles, company names, and dates from the resume.\n" +
        "- Cite concrete achievements or skills from the resume that directly match the job requirements.\n" +
        "- Never use placeholder text like [Your Name], [Company], or [Skill].\n" +
        "- The letter must read as if written by this specific candidate, not a generic applicant.\n\n" +
        "Use the job description and company research already in the conversation to tailor the letter to this role.\n\n" +
        (resumeText
          ? `CANDIDATE RESUME:\n${resumeText}`
          : "No resume was provided — write the cover letter without candidate-specific details."),
      messages: await convertToModelMessages(messages),
    });

    return Response.json(object);
  } catch (err) {
    console.error("generateObject failed:", err);
    return Response.json(
      { error: "Failed to generate the cover letter. Please try again." },
      { status: 500 }
    );
  }
}
