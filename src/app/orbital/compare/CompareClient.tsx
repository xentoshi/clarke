"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { isSafeSlug } from "@/lib/slot-utils";
import { formatAsOfDate } from "@/lib/provenance";

interface CompareRow {
  slug: string;
  missing: boolean;
  label?: string;
  operator?: string;
  ituRecorded?: string;
  country?: string;
  status?: string;
  satCount?: number;
  purpose?: string | null;
  fccCount?: number;
  congestion?: { score: number; label: string };
  valuation?: {
    nonCommercial: boolean;
    confidence: string;
    formatted: { point: string; range: string };
    license: { biuLabel: string };
    coverage: { band: { label: string } };
    occupancyQuality: { meanYearsRemaining: number | null };
  };
  asOf?: string;
}

const STATUS: Record<string, string> = {
  active: "On station",
  filed: "Paper filing",
  squatted: "On station, unlicensed",
  inactive: "Inactive",
};

function blank(value: string | null | undefined): string {
  return value ? value : "n/a";
}

export default function CompareClient() {
  const params = useSearchParams();
  const slugKey = params.get("s") ?? "";
  const slugs = [...new Set(slugKey.split(",").map((x) => x.trim()).filter((x) => isSafeSlug(x)))].slice(0, 4);
  const [phase, setPhase] = useState<"loading" | "paywall" | "empty" | "ready" | "error">("loading");
  const [models, setModels] = useState<CompareRow[]>([]);

  useEffect(() => {
    let cancel = false;
    setPhase("loading");
    (async () => {
      const entRes = await fetch("/api/auth/entitlements", { credentials: "same-origin" });
      const ent = await entRes.json() as { features?: { compare?: boolean } };
      if (cancel) return;
      if (!ent.features?.compare) {
        setPhase("paywall");
        return;
      }
      if (slugs.length === 0) {
        setPhase("empty");
        return;
      }
      const res = await fetch(`/api/v1/terminal/compare?slugs=${encodeURIComponent(slugs.join(","))}`, {
        credentials: "same-origin",
      });
      if (cancel) return;
      if (!res.ok) {
        setPhase(res.status === 401 || res.status === 403 ? "paywall" : "error");
        return;
      }
      const json = await res.json() as { data?: CompareRow[] };
      const rows = (json.data ?? []).filter((row) => !row.missing && row.label);
      if (rows.length === 0) {
        setPhase("empty");
        return;
      }
      setModels(rows);
      setPhase("ready");
    })().catch(() => {
      if (!cancel) setPhase("error");
    });
    return () => {
      cancel = true;
    };
  }, [slugKey]);

  if (phase === "loading") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-muted text-sm">Loading compare</p>
      </div>
    );
  }

  if (phase === "paywall") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <p className="text-muted text-sm mb-2">Compare</p>
        <h1 className="text-2xl font-semibold text-ink mb-3">Compare sits on a paid seat</h1>
        <p className="text-muted text-sm mb-6 leading-relaxed">
          Side-by-side fair value, congestion, occupancy, and license signals for up to four GEO slots.
          Registry access is free.
          {slugs.length > 0 && <span className="block mt-2 font-mono text-ink">{slugs.join(" · ")}</span>}
        </p>
        <Link href="/pricing" className="inline-block bg-ink text-canvas rounded-sm px-5 py-2.5 text-sm font-semibold hover:bg-ink/85">
          Pricing
        </Link>
      </div>
    );
  }

  if (phase === "error") {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink mb-3">Compare did not load</h1>
        <Link href="/orbital" className="text-ink hover:text-muted text-sm">Registry</Link>
      </div>
    );
  }

  if (phase === "empty" || models.length === 0) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-semibold text-ink mb-3">Pick up to 4 slots</h1>
        <p className="text-muted text-sm mb-6">Use the compare checkboxes on the registry, or open a Slot Terminal and add it.</p>
        <Link href="/orbital" className="text-ink hover:text-muted text-sm">Registry</Link>
      </div>
    );
  }

  const rows: { key: string; label: string; get: (m: CompareRow) => string }[] = [
    { key: "op", label: "Operator", get: (m) => blank(m.operator) },
    { key: "itu", label: "ITU", get: (m) => (m.ituRecorded === "not_in_product" ? "not recorded in Clarke" : blank(m.ituRecorded)) },
    { key: "st", label: "Status", get: (m) => STATUS[m.status ?? ""] ?? blank(m.status) },
    { key: "sats", label: "Occupancy", get: (m) => String(m.satCount ?? 0) },
    { key: "cong", label: "Congestion", get: (m) => m.congestion ? `${m.congestion.score} · ${m.congestion.label}` : "n/a" },
    { key: "biu", label: "BIU / license", get: (m) => blank(m.valuation?.license.biuLabel) },
    { key: "fcc", label: "FCC rows", get: (m) => String(m.fccCount ?? 0) },
    { key: "asof", label: "As of", get: (m) => m.asOf ? formatAsOfDate(m.asOf) : "n/a" },
    { key: "co", label: "Country", get: (m) => blank(m.country) },
    { key: "pur", label: "Purpose", get: (m) => blank(m.purpose) },
    { key: "cov", label: "Coverage proxy", get: (m) => blank(m.valuation?.coverage.band.label) },
    { key: "life", label: "Remaining life", get: (m) => m.valuation?.occupancyQuality.meanYearsRemaining == null ? "n/a" : `${m.valuation.occupancyQuality.meanYearsRemaining}y` },
    { key: "fv", label: "Fair value (v0)", get: (m) => m.valuation?.nonCommercial ? "n/c" : blank(m.valuation?.formatted.point) },
    { key: "ci", label: "Confidence interval", get: (m) => blank(m.valuation?.formatted.range) },
    { key: "conf", label: "Confidence", get: (m) => blank(m.valuation?.confidence) },
  ];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 py-8">
      <div className="mb-6">
        <Link href="/orbital" className="text-muted text-sm hover:text-ink">Registry</Link>
        <h1 className="text-2xl font-semibold text-ink mt-3 tracking-tight">Compare</h1>
        <p className="text-muted text-sm mt-1">Terminal metrics, side by side. Valuation v0 is model-based, not a live print.</p>
      </div>
      <div className="overflow-x-auto border border-line bg-surface">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-line bg-canvas">
              <th className="text-left px-4 py-3 text-xs text-faint font-medium w-44">Metric</th>
              {models.map((m) => (
                <th key={m.slug} className="text-left px-4 py-3">
                  <Link href={`/orbital/${m.slug}`} className="text-ink font-mono text-sm hover:text-muted">{m.label}</Link>
                  <div className="text-faint text-xs font-mono mt-0.5">{m.slug}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b border-line last:border-0">
                <td className="px-4 py-2.5 text-muted text-sm">{r.label}</td>
                {models.map((m) => (
                  <td key={m.slug} className="px-4 py-2.5 text-ink text-sm font-mono">{r.get(m)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
