"use client";

import { useChat } from "@ai-sdk/react";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Separator } from "@/components/ui/separator";
import { ChevronRight, Upload, Check, ArrowUp, CircleAlert, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";

export default function Home() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");

  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeStatus, setResumeStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleResumeUpload(file: File) {
    setResumeStatus("uploading");
    const formData = new FormData();
    formData.append("resume", file);

    const res = await fetch("/api/resume", { method: "POST", body: formData });
    const data = await res.json();

    if (!res.ok) {
      console.error(data.error);
      setResumeStatus("error");
      return;
    }

    setResumeText(data.text);
    setResumeStatus("done");
  }

  const [result, setResult] = useState<{
    companySummary: string;
    coverLetter: string;
    interviewQuestions: string[];
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  async function handleGenerate() {
    setGenerating(true);
    setResult(null);
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages, resumeText }),
    });
    const data = await res.json();
    setGenerating(false);
    if (res.ok) setResult(data);
  }

  function submit() {
    if (!input.trim()) return;
    sendMessage({ text: input }, { body: { resumeText } });
    setInput("");
  }

  return (
    <div className="flex h-screen flex-col bg-background text-foreground">
      {/* Header */}
      <header className="flex items-center justify-between border-b px-4 py-2.5 gap-2">
        <span className="hidden sm:block font-mono text-sm text-muted-foreground truncate">
          job-application-assistant
        </span>

        <div className="flex items-center gap-2 ml-auto">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleResumeUpload(file);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            {resumeStatus === "done" ? (
              <Check className="text-emerald-600" />
            ) : (
              <Upload />
            )}
            <span className="hidden sm:inline">
              {resumeStatus === "idle" && "Upload resume"}
              {resumeStatus === "uploading" && "Reading PDF..."}
              {resumeStatus === "done" && "Resume loaded"}
              {resumeStatus === "error" && "Upload failed"}
            </span>
          </Button>
          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating || messages.length === 0}
          >
            {generating ? "Generating..." : "Generate"}
          </Button>
        </div>
      </header>

      {/* Conversation */}
      <ScrollArea className="flex-1 min-h-0">
        <div className="mx-auto flex w-full max-w-2xl flex-col gap-5 p-3 sm:p-6">
          {messages.length === 0 && (
            <p className="mt-12 text-center font-mono text-sm text-muted-foreground">
              Paste a job posting URL to get started.
            </p>
          )}

          {messages.map((message) => (
            <div
              key={message.id}
              className={
                message.role === "user"
                  ? "ml-auto max-w-[80%] rounded-2xl bg-violet-100 dark:bg-violet-900/40 text-foreground px-4 py-2.5 border border-violet-200 dark:border-violet-700/40"
                  : "flex flex-col gap-2 border-l-2 border-sky-400 dark:border-sky-500 pl-3"
              }
            >
              {message.parts.map((part, i) => {
                if (part.type === "text") {
                  if (message.role === "user") {
                    return (
                      <p key={i} className="text-sm leading-relaxed break-words">
                        {part.text}
                      </p>
                    );
                  }
                  return (
                    <ReactMarkdown
                      key={i}
                      components={{
                        h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1 break-words">{children}</h1>,
                        h2: ({ children }) => <h2 className="text-base font-bold mt-3 mb-1 break-words">{children}</h2>,
                        h3: ({ children }) => <h3 className="text-sm font-bold mt-2 mb-0.5 break-words">{children}</h3>,
                        h4: ({ children }) => <h4 className="text-sm font-semibold mt-2 mb-0.5 break-words">{children}</h4>,
                        p: ({ children }) => <p className="text-sm leading-relaxed break-words">{children}</p>,
                        strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
                        em: ({ children }) => <em className="italic">{children}</em>,
                        ul: ({ children }) => <ul className="list-disc pl-4 space-y-0.5 text-sm">{children}</ul>,
                        ol: ({ children }) => <ol className="list-decimal pl-4 space-y-0.5 text-sm">{children}</ol>,
                        li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                        code: ({ children }) => <code className="bg-muted px-1 py-0.5 rounded text-xs font-mono">{children}</code>,
                        blockquote: ({ children }) => <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground text-sm">{children}</blockquote>,
                      }}
                    >
                      {part.text}
                    </ReactMarkdown>
                  );
                }

                if (part.type === "step-start") {
                  return i === 0 ? null : (
                    <Separator key={i} className="my-1" />
                  );
                }

                if (part.type.startsWith("tool-")) {
                  const toolName = part.type.slice("tool-".length);
                  const p = part as {
                    state: string;
                    input?: unknown;
                    output?: unknown;
                    errorText?: string;
                  };

                  const stateColor =
                    p.state === "output-available"
                      ? "text-emerald-600 dark:text-emerald-400"
                      : p.state === "output-error"
                      ? "text-destructive"
                      : "text-amber-600 dark:text-amber-400";

                  return (
                    <Collapsible key={i}>
                      <CollapsibleTrigger className="group flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                        <ChevronRight className="size-3 transition-transform group-data-[panel-open]:rotate-90" />
                        <Badge variant="secondary" className="font-mono bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-300 border-sky-200 dark:border-sky-700/40">
                          {toolName}
                        </Badge>
                        <span className={`font-mono ${stateColor}`}>{p.state}</span>
                        {p.state === "output-error" && (
                          <CircleAlert className="size-3 text-destructive" />
                        )}
                        {p.state === "input-available" && (
                          <Loader2 className="size-3 animate-spin text-amber-500" />
                        )}
                      </CollapsibleTrigger>
                      <CollapsibleContent className="ml-[18px] mt-1 space-y-1 rounded-md border bg-muted/50 p-2 font-mono text-xs text-muted-foreground">
                        {p.input !== undefined && (
                          <p className="break-all">
                            input: {JSON.stringify(p.input)}
                          </p>
                        )}
                        {p.state === "output-available" && (
                          <p className="break-all">
                            output: {JSON.stringify(p.output).slice(0, 400)}
                          </p>
                        )}
                        {p.state === "output-error" && (
                          <p className="break-all text-destructive">
                            error: {p.errorText}
                          </p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                return null;
              })}
            </div>
          ))}

          {result && (
            <div className="flex flex-col gap-4 rounded-lg border p-4">
              <div>
                <h2 className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                  company summary
                </h2>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {result.companySummary}
                </p>
              </div>
              <Separator />
              <div>
                <h2 className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                  cover letter
                </h2>
                <p className="mt-1 whitespace-pre-wrap text-sm leading-relaxed">
                  {result.coverLetter}
                </p>
              </div>
              <Separator />
              <div>
                <h2 className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                  interview prep questions
                </h2>
                <ul className="mt-1 list-disc space-y-1 pl-5 text-sm leading-relaxed">
                  {result.interviewQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {error && (
            <p className="flex items-center gap-1.5 rounded-md bg-destructive/10 p-2 text-sm text-destructive">
              <CircleAlert className="size-4" /> {error.message}
            </p>
          )}

          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      {/* Input bar */}
      <div className="border-t p-3 sm:p-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            submit();
          }}
          className="mx-auto flex max-w-2xl items-end gap-2"
        >
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submit();
              }
            }}
            placeholder="Ask something, or paste a job posting URL..."
            rows={1}
            className="resize-none"
          />
          <Button type="submit" size="icon" disabled={status !== "ready"}>
            <ArrowUp />
          </Button>
        </form>
        <p className="mx-auto mt-1.5 max-w-2xl font-mono text-xs text-muted-foreground">
          {status}
        </p>
      </div>
    </div>
  );
}
