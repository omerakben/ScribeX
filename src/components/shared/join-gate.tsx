"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Sparkles, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const JOIN_CODE = process.env.NEXT_PUBLIC_JOIN_CODE;
const STORAGE_KEY = "scribex-joined";

export function JoinGate({ children }: { children: React.ReactNode }) {
  const [joined, setJoined] = useState(false);
  const [code, setCode] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    // Check if already joined
    if (!JOIN_CODE || localStorage.getItem(STORAGE_KEY) === "true") {
      setJoined(true);
    }
    setChecking(false);
  }, []);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (code.trim().toLowerCase() === JOIN_CODE?.toLowerCase()) {
      localStorage.setItem(STORAGE_KEY, "true");
      setJoined(true);
      setError(false);
    } else {
      setError(true);
    }
  }

  if (checking) {
    return null;
  }

  if (joined) {
    return <>{children}</>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-ink-950 to-brand-900 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md"
      >
        <div className="rounded-2xl border border-ink-800 bg-ink-950/80 p-8 shadow-2xl backdrop-blur-sm">
          {/* Logo */}
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-mercury-600/20 ring-1 ring-mercury-500/30">
              <Sparkles className="h-7 w-7 text-mercury-400" />
            </div>
            <h1 className="font-serif text-2xl font-bold tracking-tight text-white">
              ScribeX
            </h1>
            <p className="mt-2 text-sm text-ink-400">
              Mercury-Powered Academic Writing
            </p>
          </div>

          {/* Join form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="join-code"
                className="mb-2 flex items-center gap-2 text-sm font-medium text-ink-300"
              >
                <Lock className="h-3.5 w-3.5" />
                Enter join code to access the demo
              </label>
              <Input
                id="join-code"
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value);
                  setError(false);
                }}
                placeholder="Enter code..."
                className={`bg-ink-900 border-ink-700 text-white placeholder:text-ink-500 focus:border-mercury-500 focus:ring-mercury-500/30 ${
                  error ? "border-error ring-1 ring-error/30" : ""
                }`}
                autoFocus
                autoComplete="off"
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 text-xs text-error"
                >
                  Invalid code. Please try again.
                </motion.p>
              )}
            </div>

            <Button
              type="submit"
              variant="mercury"
              className="w-full"
              disabled={!code.trim()}
            >
              <Sparkles className="h-4 w-4" />
              Enter ScribeX
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-ink-500">
            Built with Mercury dLLM by{" "}
            <span className="font-medium text-mercury-400">TUEL AI</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
