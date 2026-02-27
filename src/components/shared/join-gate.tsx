"use client";

import { useState } from "react";
import { PenLine } from "lucide-react";

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

    if (code.trim().toLowerCase() === JOIN_CODE?.trim().toLowerCase()) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-brand-950 via-brand-900 to-ink-950">
      {/* Background grid */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
        }}
      />

      <div
        className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4"
        style={{ animation: "scale-in 200ms ease" }}
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 mb-4 shadow-md">
            <PenLine className="h-6 w-6 text-white" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-ink-950">ScribeX</h1>
          <p className="mt-1.5 text-sm text-ink-400 text-center">
            Academic writing, intelligently assisted
          </p>
        </div>

        <p className="text-sm font-medium text-ink-600 text-center mb-4">
          Enter your access code to continue
        </p>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="join-code" className="sr-only">
              Access code
            </label>
            <input
              id="join-code"
              type="text"
              value={code}
              onChange={(event) => {
                setCode(event.target.value);
                setError(false);
              }}
              className={[
                "w-full border rounded-xl px-4 py-3 text-sm text-center tracking-widest font-mono bg-ink-50",
                "focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 focus:bg-white",
                "placeholder:text-ink-400 placeholder:tracking-normal placeholder:font-sans transition-colors",
                error ? "border-rose-300 bg-rose-50" : "border-ink-200",
              ].join(" ")}
              placeholder="XXXX-XXXX"
              autoFocus
              autoComplete="off"
            />

            {error ? (
              <p className="mt-2 text-xs text-rose-600 text-center">
                Code not recognized. Please try again.
              </p>
            ) : null}
          </div>

          <button
            type="submit"
            disabled={!code.trim()}
            className="w-full bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl py-3 font-medium text-sm transition-colors shadow-sm"
          >
            Continue →
          </button>
        </form>
      </div>
    </div>
  );
}
