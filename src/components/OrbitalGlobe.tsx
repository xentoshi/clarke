"use client";

import { useRef, useCallback } from "react";
import Globe from "react-globe.gl";
import type { GlobeInstance } from "react-globe.gl";
import * as THREE from "three";
import type { OrbitalSlot } from "@/data/orbital-slots";

// GEO altitude relative to Earth radius: 35,786 km / 6,371 km ≈ 5.615
const GEO_ALT = 5.615;

const STATUS_COLORS: Record<string, string> = {
  active: "#34d399",
  filed: "#60a5fa",
  squatted: "#fbbf24",
  inactive: "#52525b",
};

interface GlobePoint {
  lat: number;
  lng: number;
  alt: number;
  slot: OrbitalSlot;
}

interface OrbitalGlobeProps {
  slots: OrbitalSlot[];
  selectedId: string | null;
  onSelect: (slot: OrbitalSlot | null) => void;
  height?: number;
}

export default function OrbitalGlobe({
  slots,
  selectedId,
  onSelect,
  height = 560,
}: OrbitalGlobeProps) {
  const globeRef = useRef<GlobeInstance | null>(null);

  const points: GlobePoint[] = slots.map((slot) => ({
    lat: 0,
    lng: slot.longitude,
    alt: GEO_ALT,
    slot,
  }));

  const handleGlobeReady = useCallback(() => {
    const globe = globeRef.current;
    if (!globe) return;

    const scene = globe.scene();

    // Add GEO belt ring: globe default radius is 100 units.
    // Ring lives at altitude GEO_ALT above the surface, so radius = 100 * (1 + GEO_ALT).
    const geoRadius = 100 * (1 + GEO_ALT);
    const geometry = new THREE.TorusGeometry(geoRadius, 0.5, 8, 128);
    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.12,
    });
    const ring = new THREE.Mesh(geometry, material);
    // THREE Torus lies in the XY plane; rotate to align with the equatorial (XZ) plane.
    ring.rotation.x = Math.PI / 2;
    scene.add(ring);

    // Initial camera: slightly elevated, centered over Africa/Europe to show populated slots
    globe.pointOfView({ lat: 15, lng: 20, altitude: 3.5 }, 0);
  }, []);

  return (
    <div className="w-full" style={{ height }}>
      <Globe
        // @ts-expect-error ref typing mismatch between react-globe.gl and React 19
        ref={globeRef}
        height={height}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl="/textures/earth-day.jpg"
        atmosphereColor="rgba(100,190,255,0.25)"
        atmosphereAltitude={0.12}
        pointsData={points}
        pointLat="lat"
        pointLng="lng"
        pointAltitude="alt"
        pointColor={(p) => {
          const pt = p as GlobePoint;
          return selectedId === pt.slot.id
            ? "#ffffff"
            : (STATUS_COLORS[pt.slot.status] ?? "#52525b");
        }}
        pointRadius={(p) => {
          const pt = p as GlobePoint;
          return selectedId === pt.slot.id ? 0.7 : 0.45;
        }}
        pointLabel={(p) => {
          const pt = p as GlobePoint;
          return [
            `<div style="background:#0a0a0a;border:1px solid #3f3f46;padding:6px 10px;`,
            `border-radius:6px;font-family:monospace;font-size:11px;`,
            `color:#e4e4e7;white-space:nowrap;line-height:1.6;">`,
            `<div style="font-weight:bold;">${pt.slot.label}</div>`,
            `<div style="color:#a1a1aa;">${pt.slot.operator}</div>`,
            `<div style="color:#71717a;">${pt.slot.valueEstimate}</div>`,
            `</div>`,
          ].join("");
        }}
        onPointClick={(p) => {
          const pt = p as GlobePoint;
          onSelect(selectedId === pt.slot.id ? null : pt.slot);
        }}
        onGlobeReady={handleGlobeReady}
        animateIn={false}
        enablePointerInteraction={true}
      />
    </div>
  );
}
