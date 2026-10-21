const COLORS = { danger: '#B85046', warn: '#B87A27', good: '#3B8258' }

export default function Gauge({ stock, minStock, status }) {
  const size = 42
  const cx = size / 2
  const cy = size / 2 + 2
  const r = 15
  const startA = -210
  const endA = 30 // 240 degree sweep
  const ceiling = Math.max(minStock * 3, 1)
  const pct = Math.max(0, Math.min(1, stock / ceiling))
  const angle = startA + pct * (endA - startA)
  const rad = (deg) => (deg * Math.PI) / 180
  const needleLen = r - 3
  const nx = cx + needleLen * Math.cos(rad(angle))
  const ny = cy + needleLen * Math.sin(rad(angle))
  const color = COLORS[status] || COLORS.good

  const ticks = []
  for (let i = 0; i <= 8; i++) {
    const a = startA + (i / 8) * (endA - startA)
    const x1 = cx + (r + 1) * Math.cos(rad(a))
    const y1 = cy + (r + 1) * Math.sin(rad(a))
    const x2 = cx + (r - 2) * Math.cos(rad(a))
    const y2 = cy + (r - 2) * Math.sin(rad(a))
    ticks.push(
      <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#D1D8CD" strokeWidth="1" />
    )
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke="#E1E6DE" strokeWidth="1" />
      {ticks}
      <line x1={cx} y1={cy} x2={nx} y2={ny} stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx={cx} cy={cy} r="2.2" fill={color} />
    </svg>
  )
}
