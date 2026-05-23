"use client";

import { useRef, useCallback, useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import * as THREE from "three";
import type { GlobeInstance } from "react-globe.gl";
import type { OrbitalSlot } from "@/data/orbital-slots";
import type { TleEntry } from "@/app/api/tle/route";
import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  degreesLat,
  degreesLong,
} from "satellite.js";

const Globe = dynamic(() => import("react-globe.gl"), { ssr: false });

const GEO_ALT = 35786 / 6371;
const GEO_RING_RADIUS = 100 * (1 + GEO_ALT);

interface GlobePoint {
  lat: number;
  lng: number;
  alt: number;
  name: string;
  noradId: string;
  slot: OrbitalSlot | null;
}

function propagateAll(tles: TleEntry[], slots: OrbitalSlot[]): GlobePoint[] {
  const now = new Date();
  const gmst = gstime(now);
  const points: GlobePoint[] = [];

  for (const tle of tles) {
    try {
      const satrec = twoline2satrec(tle.tle1, tle.tle2);
      const pv = propagate(satrec, now);
      if (!pv || !pv.position || typeof pv.position === "boolean") continue;

      const pos = pv.position as { x: number; y: number; z: number };
      const geo = eciToGeodetic(pos, gmst);
      const lat = degreesLat(geo.latitude);
      const lng = degreesLong(geo.longitude);
      const alt = geo.height / 6371;

      const slot = slots.find((s) => Math.abs(s.longitude - lng) <= 0.4) ?? null;
      const noradId = tle.tle1.slice(2, 7).trim();

      // Use small fixed altitude so points render as dots, not tall bars.
      // The torus ring visually marks true GEO altitude.
      void alt;
      points.push({ lat, lng, alt: 0.02, name: tle.name ?? noradId, noradId, slot });
    } catch {
      // skip malformed TLEs
    }
  }

  return points;
}

interface Props {
  slots: OrbitalSlot[];
  height?: number;
  selectedSlotId?: string | null;
  onSlotSelect?: (slot: OrbitalSlot | null) => void;
}

export default function OrbitalGlobe({ slots, height = 600, selectedSlotId = null, onSlotSelect }: Props) {
  const globeRef = useRef<GlobeInstance | null>(null);
  const tlesRef = useRef<TleEntry[]>([]);
  const [points, setPoints] = useState<GlobePoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    async function load() {
      try {
        const res = await fetch("/api/tle");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error((body as { error?: string }).error ?? "Failed to load TLE data");
        }
        const tles: TleEntry[] = await res.json();
        tlesRef.current = tles;
        setPoints(propagateAll(tles, slots));
        setLoading(false);

        interval = setInterval(() => {
          setPoints(propagateAll(tlesRef.current, slots));
        }, 30_000);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        setError(msg);
        setLoading(false);
      }
    }

    load();
    return () => clearInterval(interval);
  }, [slots]);

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const geometry = new THREE.TorusGeometry(GEO_RING_RADIUS, 0.6, 8, 256);
    const material = new THREE.MeshBasicMaterial({
      color: 0x6699ff,
      transparent: true,
      opacity: 0.08,
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.rotation.x = Math.PI / 2;
    globe.scene().add(ring);

    globe.pointOfView({ lat: 20, lng: 20, altitude: 4.5 }, 0);

    const controls = globe.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.4;
  }, []);

  const pointColor = useCallback(
    (p: object) => {
      const pt = p as GlobePoint;
      if (pt.slot && pt.slot.id === selectedSlotId) return "#ffffff";
      if (pt.slot?.tokenization?.status === "listed") return "#34d399";
      if (pt.slot?.source === "curated") return "#ffd700";
      return "rgba(100,160,255,0.6)";
    },
    [selectedSlotId]
  );

  const pointRadius = useCallback(
    (p: object) => {
      const pt = p as GlobePoint;
      if (pt.slot && pt.slot.id === selectedSlotId) return 0.85;
      if (pt.slot?.tokenization?.status === "listed") return 0.6;
      if (pt.slot?.source === "curated") return 0.55;
      return 0.3;
    },
    [selectedSlotId]
  );

  const pointLabel = useCallback((p: object) => {
    const pt = p as GlobePoint;
    const lonStr =
      pt.lng >= 0
        ? `${pt.lng.toFixed(1)}°E`
        : `${Math.abs(pt.lng).toFixed(1)}°W`;
    const accent = pt.slot?.tokenization?.status === "listed" ? "#34d399" : "#ffd700";
    return [
      `<div style="background:#080810;border:1px solid #2a2a3a;padding:6px 10px;`,
      `border-radius:6px;font-family:monospace;font-size:11px;`,
      `color:#e4e4e7;white-space:nowrap;line-height:1.7;">`,
      `<div style="font-weight:bold;color:#fff;">${pt.name}</div>`,
      pt.slot ? `<div style="color:${accent};">${pt.slot.operator}</div>` : "",
      `<div style="color:#6b7280;">${lonStr} · NORAD ${pt.noradId}</div>`,
      `</div>`,
    ].join("");
  }, []);

  const handlePointClick = useCallback(
    (p: object) => {
      const pt = p as GlobePoint;
      const nextSlot = pt.slot && pt.slot.id === selectedSlotId ? null : pt.slot;
      onSlotSelect?.(nextSlot);
      globeRef.current?.pointOfView({ lat: pt.lat, lng: pt.lng, altitude: 2.5 }, 800);
      const controls = globeRef.current?.controls();
      if (controls) controls.autoRotate = false;
    },
    [onSlotSelect, selectedSlotId]
  );

  const selectedPoint = useMemo(() => {
    if (!selectedSlotId) return null;
    return points.find((pt) => pt.slot?.id === selectedSlotId) ?? null;
  }, [points, selectedSlotId]);

  useEffect(() => {
    if (!selectedPoint || !globeRef.current) return;
    globeRef.current.pointOfView(
      { lat: selectedPoint.lat, lng: selectedPoint.lng, altitude: 2.5 },
      800
    );
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = false;
  }, [selectedPoint]);

  return (
    <div className="relative w-full rounded-xl overflow-hidden bg-black" style={{ height }}>
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <span className="text-zinc-500 text-xs font-mono">Fetching satellite positions…</span>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center z-10 px-8 text-center">
          <span className="text-red-400 text-xs font-mono">{error}</span>
        </div>
      )}

      <Globe
        ref={globeRef}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/textures/earth-day.jpg"
        atmosphereColor="rgba(80,160,255,0.3)"
        atmosphereAltitude={0.15}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="alt"
        pointColor={pointColor}
        pointRadius={pointRadius}
        pointLabel={pointLabel}
        onPointClick={handlePointClick}
        onGlobeReady={handleGlobeReady}
        animateIn={false}
        enablePointerInteraction={true}
      />

      {!loading && !error && (
        <div className="absolute top-4 left-4 flex items-center gap-1.5 z-10">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-zinc-500 text-[10px] font-mono">{points.length} GEO · live</span>
        </div>
      )}

      {!loading && !error && (
        <div className="absolute bottom-4 left-4 flex flex-col gap-1.5 z-10">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="text-zinc-500 text-[10px] font-mono">Listed on-chain</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-yellow-400" />
            <span className="text-zinc-500 text-[10px] font-mono">Curated slot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-400 opacity-60" />
            <span className="text-zinc-500 text-[10px] font-mono">GEO satellite</span>
          </div>
        </div>
      )}
    </div>
  );
}
