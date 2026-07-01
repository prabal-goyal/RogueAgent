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
import {
  ChevronRight, Upload, Check, ArrowUp, CircleAlert,
  Loader2, X, Copy, RefreshCw,
} from "lucide-react";
import ReactMarkdown, { type Components } from "react-markdown";

// Hoisted outside the component so the object reference is stable across renders,
// preventing react-markdown from re-diffing the entire message tree on every keystroke.
const MARKDOWN_COMPONENTS: Components = {
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
  blockquote: ({ children }) => (
    <blockquote className="border-l-2 border-muted-foreground/30 pl-3 italic text-muted-foreground text-sm">
      {children}
    </blockquote>
  ),
};

function CopyButton({
  text,
  copyKey,
  copied,
  onCopy,
}: {
  text: string;
  copyKey: string;
  copied: string | null;
  onCopy: (text: string, key: string) => Promise<void>;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-7 px-2 text-xs text-muted-foreground"
      onClick={() => onCopy(text, copyKey)}
    >
      {copied === copyKey ? (
        <><Check className="size-3 text-emerald-600" /> Copied</>
      ) : copied === "error" ? (
        <><CircleAlert className="size-3 text-destructive" /> Failed</>
      ) : (
        <><Copy className="size-3" /> Copy</>
      )}
    </Button>
  );
}

export default function ChatInterface() {
  const { messages, sendMessage, status, error } = useChat();
  const [input, setInput] = useState("");

  const [resumeText, setResumeText] = useState<string | null>(null);
  const [resumeStatus, setResumeStatus] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [result, setResult] = useState<{
    companySummary: string;
    coverLetter: string;
    interviewQuestions: string[];
  } | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Only close if drawer is open — avoids needless calls while closed
      if (e.key === "Escape" && drawerOpen) setDrawerOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [drawerOpen]);

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

  async function handleGenerate() {
    setDrawerOpen(true);
    setGenerating(true);
    setResult(null);
    setGenerateError(null);

    // Date is computed on the client so the user's local timezone is used,
    // not the server's (which may be UTC and differ by ±1 day).
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, resumeText, today }),
      });
      const data = await res.json();

      if (!res.ok) {
        setGenerateError(data.error ?? "Generation failed. Please try again.");
      } else {
        setResult(data);
      }
    } catch {
      setGenerateError("Network error. Please check your connection and try again.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyToClipboard(text: string, key: string) {
    if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
    } catch {
      setCopied("error");
    }
    copyTimerRef.current = setTimeout(() => setCopied(null), 2000);
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

          {result && !generating && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDrawerOpen(true)}
            >
              View output
            </Button>
          )}

          <Button
            size="sm"
            onClick={handleGenerate}
            disabled={generating || messages.length === 0 || status !== "ready"}
          >
            {generating ? (
              <><Loader2 className="size-3 animate-spin" /> Generating…</>
            ) : result ? "Regenerate" : "Generate"}
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
                    <ReactMarkdown key={i} components={MARKDOWN_COMPONENTS}>
                      {part.text}
                    </ReactMarkdown>
                  );
                }

                if (part.type === "step-start") {
                  return i === 0 ? null : <Separator key={i} className="my-1" />;
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
                          <p className="break-all">input: {JSON.stringify(p.input)}</p>
                        )}
                        {p.state === "output-available" && (
                          <p className="break-all">
                            output: {JSON.stringify(p.output).slice(0, 400)}
                          </p>
                        )}
                        {p.state === "output-error" && (
                          <p className="break-all text-destructive">error: {p.errorText}</p>
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                }

                return null;
              })}
            </div>
          ))}

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

      {/* Slide-over backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/30 transition-opacity duration-300 ${
          drawerOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setDrawerOpen(false)}
      />

      {/* Slide-over drawer */}
      <div
        className={`fixed right-0 top-0 z-50 flex h-full w-full flex-col bg-background shadow-2xl border-l transition-transform duration-300 ease-in-out sm:w-[500px] ${
          drawerOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        {/* Drawer header */}
        <div className="flex items-center justify-between border-b px-4 py-3 shrink-0">
          <div>
            <h2 className="font-semibold text-sm">Generated Output</h2>
            {result && !generating && (
              <p className="font-mono text-xs text-muted-foreground mt-0.5">
                3 sections ready
              </p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {result && !generating && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleGenerate}
                className="text-muted-foreground"
              >
                <RefreshCw className="size-3" />
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() => setDrawerOpen(false)}>
              <X className="size-4" />
            </Button>
          </div>
        </div>

        {/* Drawer content */}
        <ScrollArea className="flex-1 min-h-0">
          {generating ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-muted-foreground">
              <Loader2 className="size-6 animate-spin" />
              <p className="text-sm">Generating your output…</p>
            </div>
          ) : generateError ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 px-6 text-center">
              <CircleAlert className="size-6 text-destructive" />
              <p className="text-sm text-destructive">{generateError}</p>
              <Button variant="outline" size="sm" onClick={handleGenerate}>
                Try again
              </Button>
            </div>
          ) : result ? (
            <div className="flex flex-col gap-0 p-4 sm:p-6">

              <div className="pb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-xs font-semibold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
                    Company Summary
                  </h3>
                  <CopyButton
                    text={result.companySummary}
                    copyKey="summary"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {result.companySummary}
                </p>
              </div>

              <Separator />

              <div className="py-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-xs font-semibold text-violet-600 dark:text-violet-400 uppercase tracking-wider">
                    Cover Letter
                  </h3>
                  <CopyButton
                    text={result.coverLetter}
                    copyKey="letter"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                </div>
                <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                  {result.coverLetter}
                </p>
              </div>

              <Separator />

              <div className="pt-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-mono text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    Interview Questions
                  </h3>
                  <CopyButton
                    text={result.interviewQuestions.join("\n\n")}
                    copyKey="questions"
                    copied={copied}
                    onCopy={copyToClipboard}
                  />
                </div>
                <ul className="list-disc pl-5 space-y-2 text-sm leading-relaxed">
                  {result.interviewQuestions.map((q, i) => (
                    <li key={i}>{q}</li>
                  ))}
                </ul>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-2 py-24 text-center px-6">
              <p className="text-sm text-muted-foreground">
                No output yet. Chat with the assistant first, then hit Generate.
              </p>
            </div>
          )}
        </ScrollArea>
      </div>
    </div>
  );
}
