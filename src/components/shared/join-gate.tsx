"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const JOIN_CODE = process.env.NEXT_PUBLIC_JOIN_CODE;
const STORAGE_KEY = "scribex-joined";

export function JoinGate({ children }: { children: React.ReactNode }) {
  const [manuallyJoined, setManuallyJoined] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const isClient = typeof window !== "undefined";
  const isJoinedFromStorage =
    isClient && (!JOIN_CODE || localStorage.getItem(STORAGE_KEY) === "true");
  const joined = manuallyJoined || isJoinedFromStorage;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();

    if (code.trim().toLowerCase() === JOIN_CODE?.toLowerCase()) {
      localStorage.setItem(STORAGE_KEY, "true");
      setManuallyJoined(true);
      setError(false);
      return;
    }

    setError(true);
  };

  if (!isClient) return null;
  if (joined) return <>{children}</>;

  return (
    <div className="flex min-h-screen items-center justify-center overflow-hidden bg-ink-950 px-4">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(78,115,244,0.24),transparent_34%),radial-gradient(circle_at_88%_20%,rgba(34,190,154,0.2),transparent_38%)]" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="relative w-full max-w-md"
      >
        <div className="rounded-3xl border border-white/15 bg-ink-950/85 p-7 shadow-2xl backdrop-blur-xl">
          <div className="text-center">
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-mercury-300/30 bg-mercury-500/20">
              <Sparkles className="h-7 w-7 text-mercury-300" />
            </div>
            <h1 className="mt-4 font-serif text-3xl font-semibold tracking-tight text-white">ScribeX</h1>
            <p className="mt-2 text-sm text-ink-300">Mercury-powered academic writing workspace</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label htmlFor="join-code" className="mb-2 inline-flex items-center gap-2 text-sm font-semibold text-ink-200">
                <Lock className="h-3.5 w-3.5" />
                Join code
              </label>
              <Input
                id="join-code"
                type="text"
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setError(false);
                }}
                className={
                  error
                    ? "h-11 border-error bg-ink-900 text-white placeholder:text-ink-500"
                    : "h-11 border-ink-600 bg-ink-900 text-white placeholder:text-ink-500"
                }
                placeholder="Enter access code"
                autoFocus
                autoComplete="off"
              />

              {error ? (
                <p className="mt-2 text-xs text-red-300">Code not recognized. Please try again.</p>
              ) : null}
            </div>

            <Button type="submit" className="h-11 w-full gap-2" variant="mercury" disabled={!code.trim()}>
              <Sparkles className="h-4 w-4" />
              Enter ScribeX
            </Button>
          </form>

          <p className="mt-5 text-center text-xs text-ink-500">
            Built with <span className="font-semibold text-mercury-300">Mercury dLLM</span> by TUEL AI
          </p>
        </div>
      </motion.div>
    </div>
  );
}
