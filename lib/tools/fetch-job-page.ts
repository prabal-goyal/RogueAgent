import * as cheerio from "cheerio";

const MAX_TEXT_LENGTH = 8000;
const TIMEOUT_MS = 10_000;

export interface FetchJobPageResult {
  title: string;
  text: string;
}

export async function fetchJobPage(url: string): Promise<FetchJobPageResult> {
  let res: Response;
  try {
    res = await fetch(url, {
      headers: {
        // Some sites reject requests with no/unusual User-Agent.
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      // Without this, a slow/hanging site would stall this entire agent
      // step indefinitely.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(`Fetching ${url} timed out after ${TIMEOUT_MS}ms`);
    }
    throw new Error(
      `Could not reach ${url}: ${err instanceof Error ? err.message : err}`
    );
  }

  if (!res.ok) {
    throw new Error(`Fetching ${url} failed with status ${res.status}`);
  }

  const html = await res.text();
  const $ = cheerio.load(html);

  // Strip elements that are reliably non-content noise.
  $("script, style, nav, footer, header, svg, noscript").remove();

  const title = $("title").first().text().trim();
  const text = $("body")
    .text()
    .replace(/\s+/g, " ") // collapse all whitespace/newlines
    .trim()
    .slice(0, MAX_TEXT_LENGTH);

  if (!text) {
    throw new Error(`No readable text found on ${url}`);
  }

  return { title, text };
}
