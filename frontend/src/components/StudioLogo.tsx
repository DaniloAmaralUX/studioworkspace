/** Logo do Studio: tile escuro + domo de vidro (gradiente frio→quente).
 *  Mesmo desenho de public/logo.svg (favicon) — manter os dois em sincronia. */
export function StudioLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="sl-tile" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#2b2b31" />
          <stop offset="1" stopColor="#141417" />
        </linearGradient>
        <linearGradient id="sl-dome" x1="0.1" y1="0.2" x2="0.95" y2="0.8">
          <stop offset="0" stopColor="#9db9de" />
          <stop offset="0.45" stopColor="#d3cdc9" />
          <stop offset="0.75" stopColor="#e8b184" />
          <stop offset="1" stopColor="#d98e63" />
        </linearGradient>
        <radialGradient id="sl-glow" cx="0.42" cy="0.22" r="0.75">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.85" />
          <stop offset="0.45" stopColor="#ffffff" stopOpacity="0.18" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sl-shade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stopColor="#000000" stopOpacity="0" />
          <stop offset="1" stopColor="#3a2c22" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="96" height="96" rx="24" fill="url(#sl-tile)" />
      <rect
        x="2.6"
        y="2.6"
        width="94.8"
        height="94.8"
        rx="23.4"
        fill="none"
        stroke="#ffffff"
        strokeOpacity="0.07"
        strokeWidth="1.2"
      />
      <path d="M 19 57 A 31 31 0 1 1 81 57 Q 50 76 19 57 Z" fill="url(#sl-dome)" />
      <path d="M 19 57 A 31 31 0 1 1 81 57 Q 50 76 19 57 Z" fill="url(#sl-glow)" />
      <path d="M 19 57 A 31 31 0 1 1 81 57 Q 50 76 19 57 Z" fill="url(#sl-shade)" />
    </svg>
  )
}
