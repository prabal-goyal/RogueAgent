// Must be imported before PDFParse — registers the worker pdf-parse needs
// at runtime (see next.config.ts for the related bundler config).
import "pdf-parse/worker";
import { PDFParse } from "pdf-parse";

/**
 * Standalone upload endpoint: receives a PDF, returns its plain text.
 * Deliberately separate from /api/chat — uploading a resume and sending a
 * chat message are independent actions.
 */
export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json(
      { error: "Expected multipart/form-data with a 'resume' file" },
      { status: 400 }
    );
  }

  const file = formData.get("resume");

  if (!(file instanceof File)) {
    return Response.json(
      { error: "No PDF file provided under the 'resume' field" },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  try {
    const parser = new PDFParse({ data: buffer });
    const result = await parser.getText();
    return Response.json({ text: result.text });
  } catch (err) {
    return Response.json(
      {
        error: `Could not read PDF: ${err instanceof Error ? err.message : err}`,
      },
      { status: 422 }
    );
  }
}
