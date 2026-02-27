"use client";

export const dynamic = "force-dynamic";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          fontFamily: "system-ui, sans-serif",
          backgroundColor: "#0f172a",
          color: "#e2e8f0",
        }}
      >
        <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "0.5rem" }}>
          Oops
        </h1>
        <p style={{ fontSize: "1.125rem", color: "#94a3b8", marginBottom: "2rem" }}>
          Something went wrong. Please try again.
        </p>
        <button
          onClick={() => reset()}
          type="button"
          style={{
            padding: "0.75rem 2rem",
            borderRadius: "8px",
            border: "none",
            backgroundColor: "#fff",
            color: "#0f172a",
            fontSize: "1rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
