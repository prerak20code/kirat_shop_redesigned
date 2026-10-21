// Pure helper functions that derive information from the shop data.
// Kept separate from components so they're easy to unit test later,
// and easy to reuse once similar aggregation happens on a backend.

export function variantLabel(state, variant) {
  const product = state.products.find((p) => p.id === variant.productId)
  const bits = [product ? product.name : '—', variant.brand, variant.vehicle].filter(Boolean)
  return bits.join(' · ')
}

export function lastPurchaseFor(state, variantId, supplierId) {
  const list = state.purchases.filter(
    (p) => p.variantId === variantId && (!supplierId || p.supplierId === supplierId)
  )
  if (!list.length) return null
  // The arrays are append-only in this UI, so for same-day entries the later
  // array position is the most recently recorded transaction.
  return list.map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date) || b.index - a.index)[0].entry
}

export function lastSaleFor(state, variantId, buyerId) {
  const list = state.sales.filter(
    (s) => s.variantId === variantId && (!buyerId || s.buyerId === buyerId)
  )
  if (!list.length) return null
  return list.map((entry, index) => ({ entry, index }))
    .sort((a, b) => b.entry.date.localeCompare(a.entry.date) || b.index - a.index)[0].entry
}

export function stockStatus(variant) {
  if (variant.stock <= 0) return 'danger'
  if (variant.stock <= variant.minStock) return 'warn'
  return 'good'
}

export function inventoryStats(state) {
  const total = state.variants.length
  const low = state.variants.filter((v) => v.stock > 0 && v.stock <= v.minStock).length
  const out = state.variants.filter((v) => v.stock <= 0).length
  return { total, low, out }
}

export function supplierAvgCost(state, supplierId) {
  const list = state.purchases.filter((p) => p.supplierId === supplierId && Number(p.qty) > 0)
  if (!list.length) return null
  const units = list.reduce((sum, p) => sum + Number(p.qty), 0)
  if (!units) return null
  return list.reduce((sum, p) => sum + (Number(p.cost) || 0) * Number(p.qty), 0) / units
}

export function buyerAvgPrice(state, buyerId) {
  const list = state.sales.filter((s) => s.buyerId === buyerId && Number(s.qty) > 0)
  if (!list.length) return null
  const units = list.reduce((sum, s) => sum + Number(s.qty), 0)
  if (!units) return null
  return list.reduce((sum, s) => sum + (Number(s.price) || 0) * Number(s.qty), 0) / units
}
