import Link from "next/link";

export const dynamic = "force-dynamic";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-brand-950 px-4 text-center">
      <h1 className="font-serif text-8xl font-bold text-white">404</h1>
      <p className="mt-4 text-lg text-brand-300">
        The page you&apos;re looking for doesn&apos;t exist.
      </p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="rounded-lg bg-white px-6 py-3 text-sm font-semibold text-brand-950 transition-colors hover:bg-brand-100"
        >
          Back to Home
        </Link>
        <Link
          href="/dashboard"
          className="rounded-lg border border-brand-700 px-6 py-3 text-sm font-semibold text-brand-200 transition-colors hover:bg-brand-900"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
