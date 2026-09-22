"use client";

import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from "react";
import Link from "next/link";
import { TrustMark } from "@/components/terminal/TrustMark";
import {
  BELT_LON_MAX,
  BELT_LON_MIN,
  beltCaption,
  beltReaderModel,
  beltTicks,
  formatBeltEpoch,
  formatBeltLongitude,
  formatTickLabel,
  selectTickLabels,
  panLongitudeWindow,
  placeBeltMarks,
  projectLongitude,
  stepBeltSelection,
  unprojectLongitude,
  windowAround,
  zoomLongitudeWindow,
  type BeltMark,
} from "@/lib/geo-belt";

/**
 * SVG paint from the dark registry tokens in globals.css.
 */
const PAINT = {
  tick: "var(--foreground)",
  dispute: "var(--stale)",
  axis: "var(--line-strong)",
  grid: "var(--line)",
  label: "var(--faint)",
  rule: "var(--muted)",
};

const PAD_X = 18;
const LANE_PITCH = 8;
const MARK_H = 6;
const MAX_LANES = 8;
const MIN_GAP = 3.5;
const AXIS_H = 22;

export function GeoBeltMap({
  marks,
  variant,
  epochFallback,
  mapHref,
  initialMarkId = null,
  initialWindow = null,
}: {
  marks: BeltMark[];
  variant: "strip" | "full";
  /** Epoch label for the unfiltered belt, used when this view has no marks. */
  epochFallback: string;
  mapHref?: string;
  initialMarkId?: string | null;
  initialWindow?: { min: number; max: number } | null;
}) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [frameWidth, setFrameWidth] = useState(960);
  const pointerType = useRef("mouse");
  const drag = useRef<{ x: number; view: { min: number; max: number } } | null>(null);

  const seed = marks.find((m) => m.id === initialMarkId) ?? null;
  const [view, setView] = useState(() => {
    if (initialWindow) return initialWindow;
    if (variant === "full" && seed) return windowAround(seed.longitude, 10);
    return { min: BELT_LON_MIN, max: BELT_LON_MAX };
  });
  const [activeId, setActiveId] = useState<string | null>(seed?.id ?? null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  useEffect(() => {
    const el = frameRef.current;
    if (!el) return;
    const apply = () => {
      const w = el.clientWidth;
      if (w > 0) setFrameWidth(w);
    };
    apply();
    const observer = new ResizeObserver(apply);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const plotWidth = variant === "strip" ? Math.max(frameWidth, 1040) : Math.max(frameWidth, 280);
  const svgH = variant === "strip" ? 96 : 228;
  const baseline = svgH - AXIS_H;
  const inner = Math.max(1, plotWidth - PAD_X * 2);
  const span = view.max - view.min;

  const placed = useMemo(
    () => placeBeltMarks(marks, { width: inner, lonMin: view.min, lonMax: view.max, minGapPx: MIN_GAP, maxLanes: MAX_LANES }),
    [marks, inner, view.min, view.max],
  );
  const placedById = useMemo(() => new Map(placed.map((p) => [p.id, p])), [placed]);
  const order = useMemo(() => placed.map((p) => p.id), [placed]);

  const active = marks.find((m) => m.id === activeId) ?? null;
  const hovered = marks.find((m) => m.id === hoverId) ?? null;
  const activePlaced = active ? placedById.get(active.id) : undefined;
  const epoch = formatBeltEpoch(marks.map((m) => m.epoch)) ?? epochFallback;
  const disputed = marks.filter((m) => m.dispute === "disputed").length;
  const ticks = beltTicks(view.min, view.max);
  const tickLabelLons = selectTickLabels(
    ticks.filter((tick) => {
      const x = PAD_X + projectLongitude(tick.lon, inner, view.min, view.max);
      return labelFits(x, inner);
    }),
    (lon) => PAD_X + projectLongitude(lon, inner, view.min, view.max),
    48,
    span <= 40,
  );
  const labelMarks = span <= 18;

  useEffect(() => {
    const el = frameRef.current;
    if (!el || variant !== "full") return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = el.getBoundingClientRect();
      const x = event.clientX - rect.left - PAD_X;
      const anchor = unprojectLongitude(x, inner, view.min, view.max);
      const factor = event.deltaY > 0 ? 1.22 : 1 / 1.22;
      setView((current) => zoomLongitudeWindow(current, anchor, factor));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [variant, inner, view.min, view.max]);

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      setActiveId((current) => stepBeltSelection(order, current, event.key === "ArrowRight" ? 1 : -1));
      return;
    }
    if (event.key === "Enter" && active) {
      event.preventDefault();
      window.location.assign(`/orbital/${active.slug}`);
      return;
    }
    if (variant !== "full") return;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      setView((current) => zoomLongitudeWindow(current, (current.min + current.max) / 2, 1 / 1.35));
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      setView((current) => zoomLongitudeWindow(current, (current.min + current.max) / 2, 1.35));
    } else if (event.key === "0") {
      event.preventDefault();
      setView({ min: BELT_LON_MIN, max: BELT_LON_MAX });
    }
  };

  const onMarkClick = (event: MouseEvent<HTMLAnchorElement>, mark: BeltMark) => {
    if (pointerType.current !== "touch") return;
    const zoomed = variant === "full" && span <= 16;
    if (!zoomed && activeId !== mark.id) {
      event.preventDefault();
      setActiveId(mark.id);
      if (variant === "full") setView(windowAround(mark.longitude, 12));
    }
  };

  return (
    <div data-geo-belt={variant}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <p className="font-mono text-[11px] text-faint">
          {marks.length.toLocaleString()} TLE {marks.length === 1 ? "position" : "positions"}
          {disputed > 0 ? ` · ${disputed.toLocaleString()} with UCS disagreement` : ""}
        </p>
        <div className="flex items-center gap-1.5">
          {variant === "full" && (
            <>
              <span className="mr-1 hidden font-mono text-[11px] text-faint sm:inline">
                {formatBeltLongitude(view.min)} to {formatBeltLongitude(view.max)}
              </span>
              <BeltButton onClick={() => setView((v) => zoomLongitudeWindow(v, (v.min + v.max) / 2, 1.35))} label="Zoom out" text="-" />
              <BeltButton onClick={() => setView((v) => zoomLongitudeWindow(v, (v.min + v.max) / 2, 1 / 1.35))} label="Zoom in" text="+" />
              <BeltButton onClick={() => setView({ min: BELT_LON_MIN, max: BELT_LON_MAX })} label="Full belt" text="Full belt" />
            </>
          )}
          {variant === "strip" && mapHref && (
            <Link href={mapHref} className="font-mono text-[11px] text-muted transition-colors hover:text-ink">
              Full belt
            </Link>
          )}
        </div>
      </div>

      <div
        ref={frameRef}
        tabIndex={0}
        onKeyDown={onKeyDown}
        aria-label="GEO belt. Arrow keys move between marks. Enter opens the registry slot."
        className="border border-line bg-canvas outline-none focus-visible:border-line-strong"
      >
        <div
          className={variant === "strip" ? "overflow-x-auto" : "touch-none"}
          onPointerDown={(event) => {
            pointerType.current = event.pointerType;
            if (variant !== "full") return;
            if ((event.target as Element).closest?.("[data-belt-mark]")) return;
            drag.current = { x: event.clientX, view };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
          onPointerMove={(event) => {
            if (!drag.current) return;
            const degPerPx = (drag.current.view.max - drag.current.view.min) / inner;
            const delta = -(event.clientX - drag.current.x) * degPerPx;
            setView(panLongitudeWindow(drag.current.view, delta));
          }}
          onPointerUp={() => {
            drag.current = null;
          }}
          onPointerCancel={() => {
            drag.current = null;
          }}
        >
          <svg
            width={plotWidth}
            height={svgH}
            viewBox={`0 0 ${plotWidth} ${svgH}`}
            role="group"
            aria-label="Flat equatorial belt. West is left."
            className="block select-none"
            onMouseLeave={() => setHoverId(null)}
          >
            <line x1={PAD_X} x2={plotWidth - PAD_X} y1={baseline} y2={baseline} stroke={PAINT.axis} strokeWidth={1} />
            {view.min < -170 && span > 200 && (
              <text x={PAD_X} y={baseline + 15} fill={PAINT.label} fontSize={9} fontFamily="var(--font-ibm-mono), ui-monospace, monospace">
                180°W
              </text>
            )}
            {view.max > 170 && span > 200 && (
              <text x={plotWidth - PAD_X} y={baseline + 15} textAnchor="end" fill={PAINT.label} fontSize={9} fontFamily="var(--font-ibm-mono), ui-monospace, monospace">
                180°E
              </text>
            )}
            {ticks.map((tick) => {
              const x = PAD_X + projectLongitude(tick.lon, inner, view.min, view.max);
              const showLabel = tickLabelLons.has(tick.lon);
              return (
                <g key={tick.lon}>
                  {tick.major && (
                    <line x1={x} x2={x} y1={8} y2={baseline} stroke={PAINT.grid} strokeWidth={1} />
                  )}
                  <line
                    x1={x}
                    x2={x}
                    y1={baseline}
                    y2={baseline + (tick.major ? 5 : 3)}
                    stroke={PAINT.axis}
                    strokeWidth={1}
                  />
                  {showLabel && (
                    <text
                      x={x}
                      y={baseline + 15}
                      textAnchor="middle"
                      fill={PAINT.label}
                      fontSize={9}
                      fontFamily="var(--font-ibm-mono), ui-monospace, monospace"
                    >
                      {formatTickLabel(tick.lon)}
                    </text>
                  )}
                </g>
              );
            })}
            {activePlaced && (
              <line
                x1={PAD_X + activePlaced.x}
                x2={PAD_X + activePlaced.x}
                y1={6}
                y2={baseline}
                stroke={PAINT.rule}
                strokeWidth={1}
              />
            )}
            {placed.map((p) => {
              const mark = marks.find((m) => m.id === p.id);
              if (!mark) return null;
              const x = PAD_X + p.x;
              const y = baseline - 3 - p.lane * LANE_PITCH;
              const dim = markOpacity(mark, hovered);
              const hitW = span <= 16 ? 12 : 7;
              const labelY = y - MARK_H - 4;
              const isolated = labelMarks && labelY > 12 && placed.every((o) => o.id === p.id || Math.abs(o.x - p.x) >= 46);
              return (
                <a
                  key={mark.id}
                  href={`/orbital/${mark.slug}`}
                  data-belt-mark={mark.id}
                  data-dispute={mark.dispute}
                  data-longitude={mark.longitude}
                  aria-label={markAria(mark)}
                  onPointerDown={(event) => {
                    pointerType.current = event.pointerType;
                  }}
                  onMouseEnter={() => {
                    setActiveId(mark.id);
                    setHoverId(mark.id);
                  }}
                  onFocus={() => setActiveId(mark.id)}
                  onClick={(event) => onMarkClick(event, mark)}
                >
                  <rect x={x - hitW / 2} y={y - MARK_H - 2} width={hitW} height={MARK_H + 6} fill="transparent" />
                  <MarkGlyph x={x} y={y} dispute={mark.dispute === "disputed"} opacity={dim} active={mark.id === activeId} />
                  {isolated && (
                    <text
                      x={x}
                      y={labelY}
                      textAnchor="middle"
                      fill={PAINT.label}
                      fontSize={9}
                      fontFamily="var(--font-ibm-mono), ui-monospace, monospace"
                    >
                      {shortName(mark.name)}
                    </text>
                  )}
                </a>
              );
            })}
            {placed.length === 0 && (
              <text x={plotWidth / 2} y={baseline - 16} textAnchor="middle" fill={PAINT.label} fontSize={11} fontFamily="var(--font-ibm-mono), ui-monospace, monospace">
                No TLE positions in this view.
              </text>
            )}
          </svg>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1" data-belt-reader>
        <BeltReader mark={active} />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
        <Legend />
      </div>
      <p className="mt-2 text-[13px] leading-relaxed text-muted" data-belt-caption>
        <TrustMark cls="V" className="mr-1.5 align-middle" />
        {beltCaption(epoch)}
      </p>
    </div>
  );
}

function markOpacity(mark: BeltMark, active: BeltMark | null): number {
  if (!active?.operator) return 1;
  if (mark.operator && mark.operator === active.operator) return 1;
  return 0.32;
}

function markAria(mark: BeltMark): string {
  const reader = beltReaderModel(mark);
  const op = reader.operator ?? "operator unlisted";
  const kind = reader.dispute === "disputed" ? "UCS disagrees" : "TLE occupancy";
  return `${reader.name}, ${reader.longitude}, ${op}, ${kind}, slot ${reader.slotLabel}`;
}

function shortName(name: string): string {
  return name.length > 22 ? `${name.slice(0, 20)}...` : name;
}

function labelFits(x: number, inner: number): boolean {
  return x > PAD_X + 28 && x < PAD_X + inner - 28;
}

function MarkGlyph({
  x, y, dispute, opacity, active,
}: {
  x: number;
  y: number;
  dispute: boolean;
  opacity: number;
  active: boolean;
}) {
  if (dispute) {
    return (
      <rect
        x={x - 1.4}
        y={y - MARK_H}
        width={2.8}
        height={MARK_H}
        fill="none"
        stroke={active ? PAINT.tick : PAINT.dispute}
        strokeWidth={0.8}
        opacity={opacity}
      />
    );
  }
  return (
    <rect
      x={x - 0.55}
      y={y - MARK_H}
      width={1.1}
      height={MARK_H}
      fill={active ? "var(--foreground)" : PAINT.tick}
      opacity={opacity}
    />
  );
}

function BeltReader({ mark }: { mark: BeltMark | null }) {
  if (!mark) {
    return (
      <p className="font-mono text-[12px] text-faint">
        Select a mark for longitude, catalog operator, and epoch.
      </p>
    );
  }
  const reader = beltReaderModel(mark);
  return (
    <>
      <span className="font-mono text-[13px] text-ink">{reader.longitude}</span>
      <span className="text-[13px] text-ink">{reader.name}</span>
      {reader.operator && <span className="font-mono text-[12px] text-muted">{reader.operator}</span>}
      {reader.epoch && <span className="font-mono text-[12px] text-faint">epoch {reader.epoch}</span>}
      <Link href={reader.slotHref} className="font-mono text-[12px] text-muted transition-colors hover:text-ink">
        slot {reader.slotLabel}
      </Link>
      {reader.dispute === "disputed" && (
        <span className="rounded-full border border-stale/40 px-2 py-0.5 font-mono text-[11px] text-stale">
          UCS disagrees
        </span>
      )}
      {reader.disputeDetail && <span className="font-mono text-[12px] text-faint">{reader.disputeDetail}</span>}
    </>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-4 font-mono text-[11px] text-faint">
      <span className="inline-flex items-center gap-1.5">
        <svg width="8" height="10" aria-hidden="true">
          <rect x="3.2" y="1" width="1.2" height="8" fill={PAINT.tick} />
        </svg>
        TLE occupancy
      </span>
      <span className="inline-flex items-center gap-1.5">
        <svg width="8" height="10" aria-hidden="true">
          <rect x="2" y="1" width="4" height="8" fill="none" stroke={PAINT.dispute} strokeWidth="0.8" />
        </svg>
        UCS disagrees &gt;2°
      </span>
    </div>
  );
}

function BeltButton({ onClick, label, text }: { onClick: () => void; label: string; text: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="min-h-9 border border-line px-2 font-mono text-[11px] text-muted transition-colors hover:border-line-strong hover:text-ink"
    >
      {text}
    </button>
  );
}
