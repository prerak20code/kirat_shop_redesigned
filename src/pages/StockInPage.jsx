import { useMemo, useState } from 'react'
import { RegMark } from '../components/Bits'
import ScannerModal from '../components/ScannerModal'
import QuickRegisterModal from '../components/QuickRegisterModal'
import {
  findVariantByCode,
  lastPurchaseFor,
  variantLabel,
} from '../lib/calculations'
import { money, todayStr } from '../lib/format'
import { normalizeManualScan } from '../services/scannerAdapter'

export default function StockInPage({ data, actions }) {
  const [supplierId, setSupplierId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [cost, setCost] = useState('')
  const [qty, setQty] = useState('1')
  const [date, setDate] = useState(todayStr())

  const [scanInput, setScanInput] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [quickRegCode, setQuickRegCode] = useState('')
  const [scanFeedback, setScanFeedback] = useState(null)
  const [formError, setFormError] = useState('')

  const selectedVariant = data.variants.find((v) => v.id === variantId)

  const hint = useMemo(() => {
    if (!variantId || !supplierId) return null
    const last = lastPurchaseFor(data, variantId, supplierId)
    if (last) {
      return {
        tone: 'accent',
        text: (
          <>
            Last bought from this supplier at <b>{money(last.cost)}</b> on {last.date}.
          </>
        ),
      }
    }
    const lastAny = lastPurchaseFor(data, variantId)
    if (lastAny) {
      const s = data.suppliers.find((x) => x.id === lastAny.supplierId)
      return {
        tone: 'muted',
        text: (
          <>
            No history with this supplier. Most recently purchased from{' '}
            <b>{s ? s.name : 'ANOTHER SUPPLIER'}</b> at <b>{money(lastAny.cost)}</b>
          </>
        ),
      }
    }
    return { tone: 'muted', text: 'No purchase history yet for this part.' }
  }, [data, variantId, supplierId])

  function applyVariantSelection(v, sourceCode) {
    setVariantId(v.id)
    setFormError('')
    const lastForSupplier = supplierId
      ? lastPurchaseFor(data, v.id, supplierId)
      : null
    const lastAny = lastForSupplier || lastPurchaseFor(data, v.id)
    if (lastAny && cost === '') {
      setCost(String(lastAny.cost))
    }
    setScanFeedback({
      tone: 'ok',
      text: `Matched ${variantLabel(data, v)}${v.partNo ? ` (${v.partNo})` : ''} via code ${sourceCode || v.barcode || v.partNo}.`,
    })
  }

  function handleCodeDetected({ code }) {
    const matched = findVariantByCode(data, code)
    if (matched) {
      applyVariantSelection(matched, code)
      return 'ok'
    }
    setScanFeedback({
      tone: 'warn',
      text: `Code "${code}" is not registered yet — save part details once below.`,
    })
    setQuickRegCode(code)
    return 'unknown'
  }

  function submitScanBar(e) {
    e.preventDefault()
    const payload = normalizeManualScan(scanInput, 'manual')
    if (!payload) return
    handleCodeDetected(payload)
    setScanInput('')
  }

  function submit(e) {
    e.preventDefault()
    setFormError('')
    if (!supplierId || !variantId) {
      setFormError('Select a supplier and scan or select a part first.')
      return
    }
    const costNum = parseFloat(cost)
    const qtyNum = parseInt(qty, 10)
    if (!(costNum >= 0) || !(qtyNum > 0)) {
      setFormError('Enter a valid cost per piece and quantity.')
      return
    }
    actions.recordPurchase({
      supplierId,
      variantId,
      cost: costNum,
      qty: qtyNum,
      date,
    })
    setScanFeedback({
      tone: 'ok',
      text: `Added ${qtyNum} unit(s) of ${selectedVariant ? variantLabel(data, selectedVariant) : 'part'} to stock.`,
    })
    setCost('')
    setQty('1')
    setVariantId('')
  }

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Stock In</h2>
          <div className="desc">
            Scan incoming boxes to pull saved part &amp; vehicle details automatically and update
            stock.
          </div>
        </div>
        <div className="sheet-tag">INBOUND / {data.purchases.length} RECORDS</div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-inner">
            <h2>Scan or record incoming stock</h2>

            <div className="scan-strip">
              <div className="scan-strip-head">
                <span className="scan-strip-label">FAST PART LOOKUP</span>
                <button
                  type="button"
                  className="quick-action quick-action-primary"
                  onClick={() => setScannerOpen(true)}
                >
                  Scan QR / Barcode
                </button>
              </div>
              <form className="scan-strip-form" onSubmit={submitScanBar}>
                <input
                  type="text"
                  value={scanInput}
                  onChange={(e) => setScanInput(e.target.value)}
                  placeholder="Or scan with USB gun / type code & press Enter"
                  aria-label="Scan or enter barcode"
                />
                <button type="submit" className="quick-action quick-action-secondary">
                  Find
                </button>
              </form>
            </div>

            {scanFeedback && (
              <div
                className={`hint ${scanFeedback.tone === 'warn' ? 'danger-hint' : ''}`}
              >
                {scanFeedback.text}
              </div>
            )}
            {formError && <div className="hint danger-hint">{formError}</div>}

            <form onSubmit={submit}>
              <label htmlFor="inSupplier">Supplier</label>
              <select
                id="inSupplier"
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                required
              >
                <option value="">
                  {data.suppliers.length ? 'Select a supplier' : 'Add a supplier first'}
                </option>
                {data.suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>

              <label htmlFor="inVariant">Part (auto-filled when scanned)</label>
              <select
                id="inVariant"
                value={variantId}
                onChange={(e) => {
                  setVariantId(e.target.value)
                  setFormError('')
                }}
                required
              >
                <option value="">
                  {data.variants.length ? 'Scan a box or choose a part' : 'Scan a box to register first part'}
                </option>
                {data.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {variantLabel(data, v)}
                    {v.partNo ? ` (${v.partNo})` : ''} — stock {v.stock}
                  </option>
                ))}
              </select>

              {selectedVariant && (
                <div className="selected-part-card">
                  <div>
                    <strong>{variantLabel(data, selectedVariant)}</strong>
                    <span>
                      {selectedVariant.partNo ? `Part No: ${selectedVariant.partNo}` : ''}
                      {selectedVariant.barcode ? ` · Code: ${selectedVariant.barcode}` : ''}
                    </span>
                  </div>
                  <span className="code-pill mono">Stock: {selectedVariant.stock}</span>
                </div>
              )}

              {hint && (
                <div className={`hint ${hint.tone === 'muted' ? 'muted' : ''}`}>
                  {hint.text}
                </div>
              )}

              <div className="row3">
                <div>
                  <label htmlFor="inCost">Cost / piece (₹)</label>
                  <input
                    id="inCost"
                    type="number"
                    min="0"
                    step="0.01"
                    value={cost}
                    onChange={(e) => setCost(e.target.value)}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div>
                  <label htmlFor="inQty">Quantity</label>
                  <div className="stepper">
                    <button
                      type="button"
                      onClick={() =>
                        setQty(String(Math.max(1, (parseInt(qty, 10) || 1) - 1)))
                      }
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      id="inQty"
                      type="number"
                      min="1"
                      step="1"
                      value={qty}
                      onChange={(e) => setQty(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setQty(String((parseInt(qty, 10) || 0) + 1))
                      }
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="inDate">Date</label>
                  <input
                    id="inDate"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="transaction-preview">
                <div className="transaction-preview-copy">
                  <span className="preview-label">Purchase total</span>
                  <span className="preview-note">
                    {Math.max(0, Number.parseInt(qty, 10) || 0)} units ×{' '}
                    {money(Math.max(0, Number.parseFloat(cost) || 0))} each
                  </span>
                  {selectedVariant && (
                    <span className="preview-stock">
                      On hand: {selectedVariant.stock} →{' '}
                      {selectedVariant.stock +
                        Math.max(0, Number.parseInt(qty, 10) || 0)}{' '}
                      units
                    </span>
                  )}
                </div>
                <strong>
                  {money(
                    Math.max(0, Number.parseFloat(cost) || 0) *
                      Math.max(0, Number.parseInt(qty, 10) || 0)
                  )}
                </strong>
              </div>

              <button className="primary" type="submit">
                Add to stock <span aria-hidden="true">↗</span>
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <h2>
              Purchase history <span className="count">({data.purchases.length})</span>
            </h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Supplier</th>
                    <th className="num">Cost</th>
                    <th className="num">Qty</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.purchases.length === 0 && (
                    <tr>
                      <td colSpan={6}>
                        <div className="empty">No purchases recorded yet.</div>
                      </td>
                    </tr>
                  )}
                  {data.purchases
                    .slice()
                    .reverse()
                    .slice(0, 50)
                    .map((p) => {
                      const v = data.variants.find((x) => x.id === p.variantId)
                      const s = data.suppliers.find((x) => x.id === p.supplierId)
                      return (
                        <tr key={p.id}>
                          <td>{v ? variantLabel(data, v) : '—'}</td>
                          <td>{s ? s.name : '—'}</td>
                          <td className="num">{money(p.cost)}</td>
                          <td className="num">{p.qty}</td>
                          <td className="mono">{p.date}</td>
                          <td>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() =>
                                confirm(
                                  'Undo this purchase? Stock will be reduced back.'
                                ) && actions.undoPurchase(p.id)
                              }
                            >
                              Undo
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <ScannerModal
        open={scannerOpen}
        mode="single"
        title="Scan Incoming Part Box"
        subtitle="Scan the box QR code or 1D barcode to load part details or register a new part."
        onScan={handleCodeDetected}
        onClose={() => setScannerOpen(false)}
      />

      <QuickRegisterModal
        open={Boolean(quickRegCode)}
        scannedCode={quickRegCode}
        data={data}
        actions={actions}
        allowOpeningStock={false}
        onRegistered={(newVariantId, code) => {
          setQuickRegCode('')
          setVariantId(newVariantId)
          setScanFeedback({
            tone: 'ok',
            text: `Registered new part under code ${code}. Enter cost & quantity to add stock.`,
          })
        }}
        onClose={() => setQuickRegCode('')}
      />
    </div>
  )
}
