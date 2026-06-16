/**
 * A plain async function that calls the Tavily Search API.
 *
 * Deliberately NOT wrapped in the AI SDK's `tool()` helper yet — at this
 * stage we just want to see the raw shape of the request/response. The
 * "agentic" wrapping (giving this to an LLM to call on its own) comes later.
 */

import { env } from "@/lib/env";

const TAVILY_ENDPOINT = "https://api.tavily.com/search";
const TIMEOUT_MS = 10_000;

export interface SearchResult {
  title: string;
  url: string;
  content: string;
  score: number;
}

export interface SearchWebResponse {
  answer?: string;
  results: SearchResult[];
}

export async function searchWeb(query: string): Promise<SearchWebResponse> {
  let res: Response;
  try {
    res = await fetch(TAVILY_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.TAVILY_API_KEY}`,
      },
      body: JSON.stringify({
        query,
        search_depth: "basic",
        max_results: 5,
        include_answer: true,
      }),
      // Without this, a hung Tavily request would stall this entire agent
      // step indefinitely. Aborting after a fixed timeout turns an
      // unbounded hang into a clear, recoverable error the model can see.
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    if (err instanceof Error && err.name === "TimeoutError") {
      throw new Error(`Tavily search timed out after ${TIMEOUT_MS}ms`);
    }
    throw new Error(
      `Tavily request failed: ${err instanceof Error ? err.message : err}`
    );
  }

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Tavily request failed (${res.status}): ${body}`);
  }

  const data = await res.json();

  return {
    answer: data.answer,
    results: (data.results ?? []).map((r: SearchResult) => ({
      title: r.title,
      url: r.url,
      content: r.content,
      score: r.score,
    })),
  };
}
