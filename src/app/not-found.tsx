import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32 text-center">
      <p className="text-faint text-sm mb-4">404</p>
      <h1 className="text-4xl font-semibold text-ink tracking-tight mb-4">Page not found</h1>
      <p className="text-muted text-base mb-10">
        This page doesn&apos;t exist or was removed.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link href="/" className="px-4 py-2 bg-ink text-canvas text-sm font-semibold rounded-sm hover:bg-ink/85 transition-colors">
          Go Home
        </Link>
        <Link href="/orbital" className="px-4 py-2 border border-line text-ink text-sm rounded-sm hover:border-line-strong transition-colors">
          View Orbital Slots
        </Link>
      </div>
    </div>
  );
}
