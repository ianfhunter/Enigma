// Custom hex tile icon for Cirkitz game
export default function CirkitzIcon({ className, size = 56 }) {
  const cx = size / 2;
  const cy = size / 2;
  const hexSize = size * 0.45;

  // Calculate hex vertices
  const getHexVertex = (vertexIndex) => {
    const angle = (Math.PI / 3) * vertexIndex - Math.PI / 2;
    return [cx + hexSize * Math.cos(angle), cy + hexSize * Math.sin(angle)];
  };

  // Create wedge path from center to edge
  const wedgePath = (edgeIndex) => {
    const v1 = getHexVertex(edgeIndex);
    const v2 = getHexVertex((edgeIndex + 1) % 6);
    return `M${cx},${cy} L${v1[0]},${v1[1]} L${v2[0]},${v2[1]} Z`;
  };

  // Hex outline
  const hexPath = () => {
    const points = [];
    for (let i = 0; i < 6; i++) {
      const [x, y] = getHexVertex(i);
      points.push(`${x},${y}`);
    }
    return `M${points.join('L')}Z`;
  };

  // Lightning bolt path
  const boltPath = () => {
    const s = hexSize * 0.35;
    return `
      M${cx - s * 0.15},${cy - s * 0.7}
      L${cx + s * 0.35},${cy - s * 0.7}
      L${cx + s * 0.08},${cy - s * 0.05}
      L${cx + s * 0.45},${cy - s * 0.05}
      L${cx - s * 0.25},${cy + s * 0.8}
      L${cx},${cy + s * 0.1}
      L${cx - s * 0.35},${cy + s * 0.1}
      Z
    `;
  };

  // Wedge colors matching the game (Magenta, Sky, Amber pattern)
  const wedgeColors = ['#f472b6', '#38bdf8', '#fbbf24', '#f472b6', '#38bdf8', '#fbbf24'];

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
      style={{ display: 'block' }}
    >
      <defs>
        <filter id="iconGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="glow"/>
          <feMerge>
            <feMergeNode in="glow"/>
            <feMergeNode in="SourceGraphic"/>
          </feMerge>
        </filter>
        <radialGradient id="iconBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(40, 40, 60, 0.95)"/>
          <stop offset="100%" stopColor="rgba(20, 20, 35, 0.98)"/>
        </radialGradient>
      </defs>

      {/* Hex background */}
      <path
        d={hexPath()}
        fill="url(#iconBg)"
        stroke="rgba(255, 255, 255, 0.2)"
        strokeWidth={1}
      />

      {/* Colored wedges */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <path
          key={i}
          d={wedgePath(i)}
          fill={wedgeColors[i]}
          fillOpacity={0.85}
          filter="url(#iconGlow)"
        />
      ))}

      {/* Divider lines */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const [vx, vy] = getHexVertex(i);
        return (
          <line
            key={`div-${i}`}
            x1={cx} y1={cy}
            x2={vx} y2={vy}
            stroke="rgba(0, 0, 0, 0.4)"
            strokeWidth={1}
          />
        );
      })}

      {/* Center circle */}
      <circle
        cx={cx}
        cy={cy}
        r={hexSize * 0.25}
        fill="rgba(20, 20, 35, 0.95)"
        stroke="rgba(255, 215, 0, 0.6)"
        strokeWidth={1.5}
      />

      {/* Lightning bolt */}
      <path
        d={boltPath()}
        fill="#ffd700"
        stroke="#ffaa00"
        strokeWidth={0.3}
        filter="url(#iconGlow)"
      />
    </svg>
  );
}
