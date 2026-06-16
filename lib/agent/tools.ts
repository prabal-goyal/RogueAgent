import { tool } from "ai";
import { z } from "zod";
import { searchWeb } from "@/lib/tools/search-web";
import { fetchJobPage } from "@/lib/tools/fetch-job-page";

/**
 * Shared tool definitions for the agent — used by both the test script
 * and the real API route, so the model sees the exact same tools either
 * way.
 */
export const agentTools = {
  searchWeb: tool({
    description:
      "Search the web for current, up-to-date information. Use this when " +
      "you need facts you can't be confident about from memory alone, " +
      "such as recent news or specific company details.",
    inputSchema: z.object({
      query: z.string().describe("The search query to send"),
    }),
    execute: async ({ query }: { query: string }) => searchWeb(query),
  }),
  fetchJobPage: tool({
    description:
      "Fetch and read the text content of a job posting page, given its URL. " +
      "Use this whenever a job posting URL is mentioned and you need to know " +
      "what the role actually involves.",
    inputSchema: z.object({
      url: z.string().describe("The URL of the job posting to read"),
    }),
    execute: async ({ url }: { url: string }) => fetchJobPage(url),
  }),
};
