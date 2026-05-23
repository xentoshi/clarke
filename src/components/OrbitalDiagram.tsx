interface Props {
  satellites?: number[]; // GEO satellite longitudes from DB
  curatedLons?: number[]; // curated slot longitudes
}

export default function OrbitalDiagram({ satellites = [], curatedLons = [] }: Props) {
  const cx = 200;
  const cy = 200;

  const orbits = [
    { id: "leo", label: "LEO", alt: "200–2,000 km", r: 58, dur: "5s", color: "#34d399" },
    { id: "meo", label: "MEO", alt: "2,000–36,000 km", r: 108, dur: "13s", color: "#60a5fa" },
    { id: "geo", label: "GEO", alt: "35,786 km", r: 158, dur: "30s", color: "#f59e0b" },
  ];

  const GEO_R = 158;

  // Convert longitude to SVG x,y on the GEO ring
  // 0°E = top, increases clockwise (like a compass)
  function lonToXY(lon: number) {
    const angle = ((lon - 90) * Math.PI) / 180;
    return {
      x: cx + GEO_R * Math.cos(angle),
      y: cy + GEO_R * Math.sin(angle),
    };
  }

  // Curated set for fast lookup
  const curatedSet = new Set(curatedLons.map((l) => Math.round(l * 10)));

  const isCurated = (lon: number) =>
    curatedLons.some((c) => Math.abs(c - lon) <= 0.4);

  return (
    <div className="w-full my-10 select-none">
      <svg viewBox="0 0 400 400" className="w-full max-w-xs mx-auto block" aria-hidden="true">

        {/* Subtle pulse animation for a handful of dots */}
        <defs>
          <animate id="pulse" attributeName="opacity" values="0.9;0.3;0.9" dur="2s" repeatCount="indefinite" />
        </defs>

        {/* Orbit rings */}
        {orbits.map(({ id, r }) => (
          <circle
            key={`ring-${id}`}
            cx={cx} cy={cy} r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="1"
            strokeDasharray="3 6"
          />
        ))}

        {/* GEO satellite dots -- all 588 from DB */}
        {satellites.map((lon, i) => {
          const { x, y } = lonToXY(lon);
          const curated = isCurated(lon);
          const shouldPulse = !curated && i % 47 === 0; // ~12 random pulsing dots
          return (
            <circle
              key={`sat-${i}`}
              cx={x} cy={y}
              r={curated ? 2 : 1}
              fill={curated ? "#ffd700" : "rgba(255,255,255,0.35)"}
              opacity={curated ? 0.95 : 0.4}
            >
              {shouldPulse && (
                <animate attributeName="opacity" values="0.4;0.9;0.4" dur={`${2 + (i % 3)}s`} repeatCount="indefinite" />
              )}
            </circle>
          );
        })}

        {/* Earth */}
        <circle cx={cx} cy={cy} r={16} fill="#0c0c12" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6.5" fontFamily="monospace" letterSpacing="1.5">EARTH</text>

        {/* Animated single satellites for LEO / MEO / GEO */}
        {orbits.map(({ id, r, dur, color }) => (
          <g key={`sat-${id}`} transform={`translate(${cx}, ${cy})`}>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0"
              to="360"
              dur={dur}
              repeatCount="indefinite"
              additive="sum"
            />
            <circle cx={r} cy={0} r={4} fill={color} opacity={0.9} />
            <circle cx={r} cy={0} r={7} fill={color} opacity={0.15} />
          </g>
        ))}

        {/* Labels */}
        {orbits.map(({ id, label, alt, r, color }) => (
          <g key={`label-${id}`}>
            <line
              x1={cx + r} y1={cy}
              x2={cx + r + 10} y2={cy}
              stroke="rgba(255,255,255,0.08)" strokeWidth="1"
            />
            <text x={cx + r + 14} y={cy - 4} fill={color} fontSize="9" fontFamily="monospace" fontWeight="600" opacity={0.8}>{label}</text>
            <text x={cx + r + 14} y={cy + 8} fill="rgba(255,255,255,0.2)" fontSize="7.5" fontFamily="monospace">{alt}</text>
          </g>
        ))}

      </svg>
    </div>
  );
}
