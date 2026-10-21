# Parts Ledger

A considered, responsive inventory workspace for an auto-parts shop: product variants, stock movements, supplier and buyer records, and transaction price history.

## Run it locally

```bash
npm install
npm run dev
```

Opens at `http://localhost:5173`. Data is saved to your browser's `localStorage`
for now, so it persists across refreshes on the same device/browser.

## Build for production

```bash
npm run build
```

Outputs a static site to `dist/`. `npm run preview` serves that build locally
if you want to sanity-check it before deploying.

## Deploying to GitHub Pages

A workflow at `.github/workflows/deploy.yml` is already set up. Once this repo
is pushed to GitHub:

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. Push to `main` (or re-run the workflow from the **Actions** tab).

The site will build and deploy automatically — no manual file uploads needed.

## Project structure

```
src/
  main.jsx              entry point
  App.jsx                top-level layout: sidebar + active page
  index.css              global design system (graphite, warm neutral and acid-lime theme)
  components/            small reusable UI pieces (Sidebar, Gauge, HeroDiagram, Bits)
  pages/                 one file per screen (Inventory, Catalog, Suppliers, Buyers, Stock In/Out)
  hooks/
    useShopData.js        the single source of truth — owns state + every mutation
  services/
    dataService.js        the ONLY file that talks to storage
  lib/
    calculations.js       pure helpers (stock status, last price paid, etc.)
    format.js              money/date formatting
    ids.js                  id generation
```

## Current data model and limitations

The app stores its six collections (`products`, `variants`, `suppliers`, `buyers`, `purchases`, and `sales`) as one JSON object in `localStorage`. It is suitable for a single-browser prototype, not shared or audited multi-user operations. The UI validates required selections and inputs, but browser-only storage is not a substitute for server-side validation, database transactions, authentication, or backups.

The inventory page shows tracked variants, positive units on hand, low-stock variants, and stockouts. Supplier and buyer price summaries use quantity-weighted average unit prices. The stock movement forms preview transaction totals and projected quantities before submission.

## Where the backend plugs in

Everything reads and writes data by calling functions from `useShopData()`
(in `src/hooks/useShopData.js`). That hook, in turn, only ever talks to
`src/services/dataService.js` — nothing else in the app touches storage
directly.

So when the backend exists, the plan is:

1. Replace the two functions in `dataService.js` (`loadState` / `saveState`)
   with real HTTP calls to your API, e.g.:
   ```js
   export async function loadState() {
     const res = await fetch('/api/shop-data')
     return res.json()
   }
   export async function saveState(state) {
     await fetch('/api/shop-data', { method: 'PUT', body: JSON.stringify(state) })
     return true
   }
   ```
2. Once there's real per-entity endpoints (e.g. `POST /api/purchases`), the
   individual actions in `useShopData.js` (`recordPurchase`, `recordSale`, etc.)
   are the natural place to call them instead of just updating local state.

No component or page should need to change — they only know about `data` and
`actions`, not about where the data actually lives.

## Known limitations (by design, for now)

- **localStorage is per-browser, per-device.** It won't sync between your
  friend's phone and laptop, and clearing browser data wipes it. Fine for
  trying the app out; not fine for running the real shop day-to-day.
- No khata/credit tracking, billing, or profit dashboards yet — those come
  next, once the inventory flow itself feels right.
