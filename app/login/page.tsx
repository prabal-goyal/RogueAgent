"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSent(true);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm px-6">
        {sent ? (
          <div className="text-center">
            <p className="font-mono text-2xl mb-4">✉</p>
            <h1 className="text-lg font-semibold tracking-tight mb-2">
              Check your email
            </h1>
            <p className="font-mono text-sm text-muted-foreground">
              Magic link sent to{" "}
              <span className="text-foreground">{email}</span>.
              <br />
              Click it to sign in — no password needed.
            </p>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              className="mt-8 font-mono text-xs text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wide"
            >
              Use a different email
            </button>
          </div>
        ) : (
          <>
            <div className="mb-8">
              <h1 className="font-mono text-sm text-muted-foreground mb-1">
                job-application-assistant
              </h1>
              <p className="text-2xl font-semibold tracking-tight">Sign in</p>
              <p className="font-mono text-sm text-muted-foreground mt-1">
                Enter your email to receive a magic link
              </p>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoFocus
                required
                className="bg-background border border-border px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:border-foreground transition-colors rounded-md"
              />
              {error && (
                <p className="font-mono text-xs text-destructive bg-destructive/10 border border-destructive/20 px-3 py-2 rounded-md">
                  {error}
                </p>
              )}
              <Button type="submit" disabled={loading || !email}>
                {loading ? "Sending…" : "Send magic link"}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
