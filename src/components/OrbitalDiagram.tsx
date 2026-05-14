export default function OrbitalDiagram() {
  const cx = 200;
  const cy = 200;

  const orbits = [
    { id: "leo", label: "LEO", alt: "200–2,000 km", r: 58, dur: "5s", color: "#34d399" },
    { id: "meo", label: "MEO", alt: "2,000–36,000 km", r: 108, dur: "13s", color: "#60a5fa" },
    { id: "geo", label: "GEO", alt: "35,786 km", r: 158, dur: "30s", color: "#f59e0b" },
  ];

  return (
    <div className="w-full my-10 select-none">
      <svg viewBox="0 0 400 400" className="w-full max-w-xs mx-auto block" aria-hidden="true">

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

        {/* Earth */}
        <circle cx={cx} cy={cy} r={16} fill="#0c0c12" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
        <text x={cx} y={cy + 4} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="6.5" fontFamily="monospace" letterSpacing="1.5">EARTH</text>

        {/* Satellites */}
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

        {/* Labels — right side */}
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
