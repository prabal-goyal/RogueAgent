```
      _  ___  ____       _    ____ _____ _   _ _____
     | |/ _ \| __ )     / \  / ___| ____| \ | |_   _|
  _  | | | | |  _ \    / _ \| |  _|  _| |  \| | | |
 | |_| | |_| | |_) |  / ___ \ |_| | |___| |\  | | |
  \___/ \___/|____/  /_/   \_\____|_____|_| \_| |_|
```

Paste a job URL. It searches the company, reads the posting, drafts a cover
letter + interview questions. The LLM picks the tools — no fixed pipeline.

## Stack
Next.js · Vercel AI SDK · OpenAI `gpt-4o-mini` · Tavily · shadcn/ui

## Run
```bash
npm install
cp .env.local.example .env.local   # OPENAI_API_KEY + TAVILY_API_KEY
npm run dev
```

## Routes
- `/api/chat` — tool-calling loop (`searchWeb`, `fetchJobPage`), streamed live
- `/api/generate` — finished transcript → `generateObject` → `{ companySummary, coverLetter, interviewQuestions }`
- `/api/resume` — PDF → text, injected as context, not a tool

## Poke at the agent directly
```bash
npx tsx scripts/test-tool-call.ts "your prompt"
```
