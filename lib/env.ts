/**
 * Single place that reads required API keys from process.env.
 *
 * Next.js automatically loads `.env.local` into process.env at startup,
 * so nothing needs to import dotenv manually. The point of this file is
 * just to fail loudly and immediately if a key is missing, instead of
 * every tool silently reading process.env.X and erroring confusingly
 * deep inside a request later.
 */

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get OPENAI_API_KEY() {
    return requireEnv("OPENAI_API_KEY");
  },
  get TAVILY_API_KEY() {
    return requireEnv("TAVILY_API_KEY");
  },
};
