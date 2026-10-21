# Parts Ledger — Code and Frontend Review

## What changed in this redesign

- Replaced the conflicting glossy-blue visual treatments with a cohesive graphite, warm-neutral, and restrained lime design system.
- Rebuilt the sidebar into three labelled navigation groups and added a persistent utility bar with date, save state, and direct links to stock-in/stock-out workflows.
- Reworked the inventory introduction, metric cards, search state, table hierarchy, and status labels.
- Refined forms, inputs, transaction tables, badges, buttons, focus states, reduced-motion behavior, and mobile layouts.
- Added live transaction totals and projected stock quantities to purchase and sale forms.
- Required explicit supplier/buyer and part selections rather than silently selecting the first available record.
- Corrected the local date formatter and made same-day transaction history resolve to the most recently appended entry.
- Changed supplier/buyer average price summaries to quantity-weighted unit averages and reflected this in the column labels.
- Added document metadata and a small SVG favicon.

## File-by-file notes

### Application entry and shared layout

- `src/main.jsx` — React entry point and global stylesheet import. Strict Mode is enabled, which is useful for surfacing unsafe effects during development.
- `src/App.jsx` — Holds the active page, receives shared data/actions from `useShopData`, and renders the shared top bar and page switch. Page selection is local state rather than URL routing, so refresh returns to Inventory and browser back/forward does not change pages. That is acceptable for the current six-page tool.
- `src/components/Sidebar.jsx` — Navigation, branding, workspace descriptor and persistence indicator. Navigation is now grouped by workspace, contacts and transactions. On narrow screens it becomes a horizontally scrollable bar.
- `src/components/Bits.jsx` — Small shared building blocks: brand mark, dimensional divider, status badge, and a retained registration-mark component (hidden by the new design system).
- `src/components/HeroDiagram.jsx` — Decorative inline SVG illustration. It does not represent actual inventory values; it is an atmosphere/brand element only.
- `src/components/Gauge.jsx` — Small SVG stock-level indicator whose needle maps stock to a display ceiling of roughly three times the minimum stock. It is a qualitative visual cue, not a calibrated gauge or a substitute for the numeric stock field.
- `src/index.css` — Central visual system, responsive layouts and component styling. Previously the file contained a base theme followed by a second block of conflicting gradient, shine and motion overrides. It is now consolidated and includes reduced-motion and visible-focus support.

### Screens

- `src/pages/InventoryPage.jsx` — Searches variants by product, brand, vehicle and part number; shows variant count, positive units on hand, low-stock variants, out-of-stock variants, latest recorded unit cost and sale price. Search is client-side. Negative inventory, if allowed by a sale, is excluded from the positive-units-on-hand metric but remains visible in the row's stock value/status.
- `src/pages/CatalogPage.jsx` — Creates product families and individual variants; lists and removes variants. It does not currently provide edit flows or product deletion. Removing a variant does not remove its historical purchases/sales, so those rows can lose the variant's display name.
- `src/pages/SuppliersPage.jsx` — Creates and removes supplier records and summarizes purchase count and weighted average unit cost. The “supplied” count is transaction count, not total quantity purchased. Supplier removal does not cascade into purchase history.
- `src/pages/BuyersPage.jsx` — Creates and removes buyer records and summarizes sale count and weighted average unit price. The “bought” count is transaction count, not units purchased. Buyer removal does not cascade into sale history.
- `src/pages/StockInPage.jsx` — Records purchases, increments stock and shows supplier-specific historical pricing. The form now shows an estimated purchase total and projected stock balance. History shows up to 50 appended records, reversed to put the latest appended entries first; it is not sorted by a timestamp.
- `src/pages/StockOutPage.jsx` — Records sales, decrements stock and shows buyer-specific price history. The form now shows an estimated sale total and projected stock balance. The current business policy still allows overselling after explicit confirmation, which can leave stock negative; decide whether that policy is appropriate for the shop.

### Data, persistence and calculations

- `src/hooks/useShopData.js` — Single client-side state source and mutation API. Writes are debounced. Load/save error feedback was made more defensive. Because the mutation layer is client-side and browser storage is the persistence layer, it is not a security or transaction boundary; stricter validation, atomic writes and concurrency handling belong in a backend before multiple users share an inventory.
- `src/services/dataService.js` — Reads/writes one JSON value in browser `localStorage`. Data remains local to that browser/device and can be lost if browser data is cleared. A malformed stored payload falls back to an empty shape; take an export/backup before experimenting with important data.
- `src/lib/calculations.js` — Pure stock/status and price-history helpers. Latest-date ties now prefer the later appended transaction. Supplier and buyer average prices use quantity-weighted unit averages; this better represents unit price than averaging transaction records equally.
- `src/lib/format.js` — Formats Indian rupee values and local calendar dates. Date formatting now uses local date parts instead of slicing a UTC ISO timestamp, which avoids a previous-day date around local midnight in India.
- `src/lib/ids.js` — Generates client-side IDs from time and randomness. Adequate for this single-user prototype; a backend should own IDs once the database is introduced.

### Build, deployment and project metadata

- `index.html` — Application mount point, mobile viewport, metadata, theme color, title and favicon link.
- `public/parts-ledger-mark.svg` — Inline vector favicon matching the new brand palette.
- `package.json` — Small React/Vite dependency set and development/build/preview scripts. No automated test or lint script is configured yet.
- `package-lock.json` — Locks the npm dependency tree for reproducible installs.
- `vite.config.js` — React plugin and relative base path so static assets work under a GitHub Pages repository subpath.
- `.github/workflows/deploy.yml` — Builds the app and deploys `dist` to GitHub Pages using GitHub Actions. It does not currently run unit, visual, or accessibility tests.
- `.gitignore` — Excludes `node_modules`, `dist`, local files, and environment files.
- `README.md` — Local setup, deployment, storage limitations and backend integration notes.

## Remaining risks before real shop use

1. **Storage is browser-local.** There is no API, shared database, login, role control, backup schedule or central audit log.
2. **Mutation-level validation remains incomplete.** The forms constrain the normal path, but `useShopData` actions can still be called with malformed values by other code. Add backend validation before production.
3. **Undo is destructive rather than an auditable reversal.** It removes the original transaction and adjusts stock. Prefer a reversal record and enforce non-duplicated reversal rules in a transactional backend.
4. **Deleting contacts/variants can orphan history.** Archive/deactivate records or snapshot labels into the transaction at the time it is recorded.
5. **No automated regression suite exists.** Add tests for stock arithmetic, undo sequences, invalid inputs, corrupted storage, same-day ordering and weighted-average calculations.
6. **Financial context is limited.** Recorded purchase/sale prices are per-unit prices; the app currently does not calculate taxes, freight, returns, discounts, credit/khaata balances, or gross profit.

## Verification

- `npm run build` completed successfully after the redesign.
- This was a static review plus production compilation, not a full browser-based or security audit.
