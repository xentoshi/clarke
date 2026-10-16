"use client";

import { useEffect, useState } from "react";
import { freeEntitlements, type Entitlements } from "@/lib/entitlements";

let inflight: Promise<Entitlements> | null = null;

function normalize(body: unknown): Entitlements {
  if (!body || typeof body !== "object") return freeEntitlements();
  const row = body as Entitlements;
  if (typeof row.pro !== "boolean" || !row.features) return freeEntitlements();
  return row;
}

function loadEntitlements(): Promise<Entitlements> {
  if (typeof window === "undefined") return Promise.resolve(freeEntitlements());
  if (!inflight) {
    inflight = fetch("/api/auth/entitlements", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : freeEntitlements()))
      .then((body) => normalize(body))
      .catch(() => freeEntitlements())
      .finally(() => {
        inflight = null;
      });
  }
  return inflight;
}

/** Starts as the free seat (static HTML). Upgrades after mount without a cookie read during render. */
export function useLiveEntitlements(): Entitlements {
  const [value, setValue] = useState<Entitlements>(freeEntitlements);
  useEffect(() => {
    let cancelled = false;
    loadEntitlements().then((next) => {
      if (!cancelled) setValue(next);
    });
    return () => {
      cancelled = true;
    };
  }, []);
  return value;
}
