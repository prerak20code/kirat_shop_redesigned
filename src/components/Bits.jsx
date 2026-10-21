export function RegMark({ corner }) {
  return (
    <div className={`regmark ${corner}`} aria-hidden="true">
      <svg viewBox="0 0 14 14">
        <line x1="7" y1="0" x2="7" y2="14" stroke="currentColor" strokeWidth="1" />
        <line x1="0" y1="7" x2="14" y2="7" stroke="currentColor" strokeWidth="1" />
      </svg>
    </div>
  )
}

export function DimLine({ label }) {
  return (
    <div className="dimline" aria-hidden="true">
      <div className="seg" />
      <span className="label">{label}</span>
      <div className="seg" />
    </div>
  )
}

export function Badge({ status, children }) {
  return <span className={`badge ${status}`}>{children}</span>
}

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M6 10.5 16 5l10 5.5v11L16 27 6 21.5v-11Z" stroke="#182017" strokeWidth="1.7" strokeLinejoin="round" />
      <path d="m6.5 11 9.5 5.4 9.5-5.4M16 16.4V26" stroke="#182017" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11 8l10 5.7" stroke="#718c2b" strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="16" cy="16.5" r="2.1" fill="#182017" />
    </svg>
  )
}
