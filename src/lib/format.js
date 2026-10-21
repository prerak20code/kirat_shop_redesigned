export function money(n) {
  const num = Number(n) || 0
  return '₹' + (Math.round(num * 100) / 100).toLocaleString('en-IN', { maximumFractionDigits: 2 })
}

// Use the user's local calendar date rather than converting to UTC first.
// This avoids showing yesterday near midnight in time zones ahead of UTC.
export function todayStr() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
