export default function HeroDiagram() {
  return (
    <svg width="220" height="100" viewBox="0 0 220 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        className="draw-path"
        pathLength="1"
        style={{ animationDelay: '.05s' }}
        d="M18 68 Q18 46 40 44 L62 44 Q74 30 92 30 L138 30 Q154 30 164 44 L188 44 Q206 46 206 64 L206 68"
        stroke="#D4F36B"
        strokeWidth="1.6"
        fill="none"
      />
      <path
        className="draw-path"
        pathLength="1"
        style={{ animationDelay: '.15s' }}
        d="M18 68 L206 68"
        stroke="#D4F36B"
        strokeWidth="1.6"
      />
      <circle className="draw-path" pathLength="1" style={{ animationDelay: '.3s' }} cx="52" cy="70" r="13" stroke="#C7D0C1" strokeWidth="1.6" fill="#253027" />
      <circle className="draw-path" pathLength="1" style={{ animationDelay: '.35s' }} cx="52" cy="70" r="4" stroke="#D4F36B" strokeWidth="1.2" fill="none" />
      <circle className="draw-path" pathLength="1" style={{ animationDelay: '.3s' }} cx="172" cy="70" r="13" stroke="#C7D0C1" strokeWidth="1.6" fill="#253027" />
      <circle className="draw-path" pathLength="1" style={{ animationDelay: '.35s' }} cx="172" cy="70" r="4" stroke="#D4F36B" strokeWidth="1.2" fill="none" />

      <line className="draw-path" pathLength="1" style={{ animationDelay: '.5s' }} x1="66" y1="42" x2="66" y2="14" stroke="#E6A66A" strokeWidth="1" strokeDasharray="2 2" />
      <circle className="draw-path" pathLength="1" style={{ animationDelay: '.55s' }} cx="66" cy="42" r="2" fill="#E6A66A" />
      <text x="66" y="10" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="7" fill="#E6A66A" letterSpacing="0.5">AIR FILTER</text>

      <line className="draw-path" pathLength="1" style={{ animationDelay: '.6s' }} x1="112" y1="30" x2="112" y2="10" stroke="#E6A66A" strokeWidth="1" strokeDasharray="2 2" />
      <circle className="draw-path" pathLength="1" style={{ animationDelay: '.65s' }} cx="112" cy="30" r="2" fill="#E6A66A" />
      <text x="112" y="7" textAnchor="middle" fontFamily="ui-monospace,monospace" fontSize="7" fill="#E6A66A" letterSpacing="0.5">HEADLAMP</text>

      <line className="draw-path" pathLength="1" style={{ animationDelay: '.7s' }} x1="172" y1="57" x2="188" y2="20" stroke="#E6A66A" strokeWidth="1" strokeDasharray="2 2" />
      <circle className="draw-path" pathLength="1" style={{ animationDelay: '.75s' }} cx="172" cy="57" r="2" fill="#E6A66A" />
      <text x="192" y="18" textAnchor="start" fontFamily="ui-monospace,monospace" fontSize="7" fill="#E6A66A" letterSpacing="0.5">BRAKE PAD</text>
    </svg>
  )
}
