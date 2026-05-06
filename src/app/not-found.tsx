import Link from "next/link";

export default function NotFound() {
  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-32 text-center">
      <p className="text-zinc-600 font-mono text-xs uppercase tracking-widest mb-4">404</p>
      <h1 className="text-4xl font-bold text-white mb-4">Page not found</h1>
      <p className="text-zinc-500 text-sm mb-10">
        This page doesn't exist or was removed.
      </p>
      <div className="flex items-center justify-center gap-4">
        <Link href="/" className="px-4 py-2 bg-white text-zinc-950 text-sm font-semibold rounded hover:bg-zinc-100 transition-colors">
          Go Home
        </Link>
        <Link href="/companies" className="px-4 py-2 border border-zinc-700 text-zinc-300 text-sm rounded hover:border-zinc-500 hover:text-white transition-colors">
          Browse Companies
        </Link>
      </div>
    </div>
  );
}
