// Simple client-side unique id generator.
// Fine for local/localStorage use; once a backend exists, swap callers
// to use IDs returned by the API instead of calling this.
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

export function generateShopBarcode(existingVariants = []) {
  const taken = new Set(
    existingVariants
      .map((v) => String(v.barcode || '').trim().toUpperCase())
      .filter(Boolean)
  )
  let seq = 1001 + existingVariants.length
  while (taken.has(`PL-${seq}`)) {
    seq += 1
  }
  return `PL-${seq}`
}
