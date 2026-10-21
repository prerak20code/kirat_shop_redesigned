// Data access layer.
//
// Right now this reads/writes the browser's localStorage, which is enough
// to run the app standalone (e.g. on GitHub Pages) with no server.
//
// When the backend exists, this file is the ONLY place that should need to
// change: swap the bodies of loadState/saveState below for real HTTP calls
// (e.g. fetch('/api/shop-data')). Every component and hook in this app
// calls through this module rather than touching localStorage directly,
// so the rest of the codebase won't need to change.

const STORAGE_KEY = 'parts-ledger-data'

export const emptyState = {
  products: [],
  variants: [],
  suppliers: [],
  buyers: [],
  purchases: [],
  sales: [],
}

// Returns a Promise so callers already treat this as async — this keeps
// the calling code identical once it's backed by a real network request.
export async function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...emptyState }
    const parsed = JSON.parse(raw)
    return { ...emptyState, ...parsed }
  } catch (err) {
    console.error('dataService.loadState failed', err)
    return { ...emptyState }
  }
}

export async function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    return true
  } catch (err) {
    console.error('dataService.saveState failed', err)
    return false
  }
}
