import { useMemo, useState } from 'react'
import { RegMark } from '../components/Bits'
import ScannerModal from '../components/ScannerModal'
import QuickRegisterModal from '../components/QuickRegisterModal'
import BillReceiptModal from '../components/BillReceiptModal'
import {
  findVariantByCode,
  lastSaleFor,
  nextInvoiceNo,
  variantLabel,
} from '../lib/calculations'
import { money, todayStr } from '../lib/format'
import { normalizeManualScan } from '../services/scannerAdapter'

function resolveBuyerPricing(data, variantId, buyerId) {
  const buyerLast = buyerId ? lastSaleFor(data, variantId, buyerId) : null
  if (buyerLast) {
    return {
      assumedPrice: String(buyerLast.price),
      buyerLastPrice: buyerLast.price,
      buyerLastDate: buyerLast.date,
      anyLastPrice: buyerLast.price,
      anyLastDate: buyerLast.date,
    }
  }
  const anyLast = lastSaleFor(data, variantId)
  return {
    assumedPrice: '',
    buyerLastPrice: null,
    buyerLastDate: null,
    anyLastPrice: anyLast ? anyLast.price : null,
    anyLastDate: anyLast ? anyLast.date : null,
  }
}

export default function StockOutPage({ data, actions }) {
  const [buyerId, setBuyerId] = useState('')
  const [date, setDate] = useState(todayStr())
  const [cart, setCart] = useState([]) // [{ variantId, qty, price, priceEdited }]

  const [scanInput, setScanInput] = useState('')
  const [manualVariantId, setManualVariantId] = useState('')
  const [scannerOpen, setScannerOpen] = useState(false)
  const [scannerFeedback, setScannerFeedback] = useState(null)
  const [quickRegCode, setQuickRegCode] = useState('')

  const [checkoutError, setCheckoutError] = useState('')
  const [confirmNegative, setConfirmNegative] = useState(false)
  const [activeReceipt, setActiveReceipt] = useState(null)
  const [historyView, setHistoryView] = useState('bills') // 'bills' | 'items'

  // Recalculate unedited cart prices when buyer changes
  function handleBuyerChange(nextBuyerId) {
    setBuyerId(nextBuyerId)
    setCheckoutError('')
    setCart((prev) =>
      prev.map((item) => {
        if (item.priceEdited) return item
        const pricing = resolveBuyerPricing(data, item.variantId, nextBuyerId)
        return { ...item, price: pricing.assumedPrice }
      })
    )
  }

  function addVariantToCart(variant, qtyToAdd = 1) {
    if (!variant) return
    setCheckoutError('')
    setConfirmNegative(false)

    setCart((prev) => {
      const existing = prev.find((x) => x.variantId === variant.id)
      if (existing) {
        return prev.map((x) =>
          x.variantId === variant.id ? { ...x, qty: x.qty + qtyToAdd } : x
        )
      }
      const pricing = resolveBuyerPricing(data, variant.id, buyerId)
      return [
        ...prev,
        {
          variantId: variant.id,
          qty: qtyToAdd,
          price: pricing.assumedPrice,
          priceEdited: false,
        },
      ]
    })
  }

  function handleCodeScanned({ code }) {
    const matched = findVariantByCode(data, code)
    if (matched) {
      const currentInCart = cart.find((x) => x.variantId === matched.id)?.qty || 0
      addVariantToCart(matched, 1)
      setScannerFeedback({
        tone: 'ok',
        text: `Added ${variantLabel(data, matched)} (Qty in bill: ${currentInCart + 1})`,
      })
      return 'ok'
    }

    setScannerFeedback({
      tone: 'warn',
      text: `Unknown code "${code}" — register it once to continue.`,
    })
    setScannerOpen(false)
    setQuickRegCode(code)
    return 'unknown'
  }

  function submitScanInput(e) {
    e.preventDefault()
    const payload = normalizeManualScan(scanInput, 'manual')
    if (!payload) return
    handleCodeScanned(payload)
    setScanInput('')
  }

  function addSelectedManualVariant() {
    const v = data.variants.find((x) => x.id === manualVariantId)
    if (!v) return
    addVariantToCart(v, 1)
    setManualVariantId('')
  }

  function updateItemQty(variantId, nextQty) {
    const qty = Math.max(1, parseInt(nextQty, 10) || 1)
    setConfirmNegative(false)
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId ? { ...item, qty } : item
      )
    )
  }

  function updateItemPrice(variantId, nextPrice) {
    setCheckoutError('')
    setCart((prev) =>
      prev.map((item) =>
        item.variantId === variantId
          ? { ...item, price: nextPrice, priceEdited: true }
          : item
      )
    )
  }

  function removeItem(variantId) {
    setConfirmNegative(false)
    setCart((prev) => prev.filter((item) => item.variantId !== variantId))
  }

  const cartSummary = useMemo(() => {
    let totalUnits = 0
    let totalAmount = 0
    let invalidPrices = 0
    const overStockItems = []

    for (const item of cart) {
      const v = data.variants.find((x) => x.id === item.variantId)
      const q = Math.max(1, parseInt(item.qty, 10) || 0)
      const p = parseFloat(item.price)
      totalUnits += q
      if (item.price === '' || Number.isNaN(p) || p < 0) {
        invalidPrices += 1
      } else {
        totalAmount += q * p
      }
      if (v && q > v.stock) {
        overStockItems.push({
          name: variantLabel(data, v),
          stock: v.stock,
          qty: q,
        })
      }
    }

    return { totalUnits, totalAmount, invalidPrices, overStockItems }
  }, [cart, data])

  function completeBill() {
    setCheckoutError('')
    if (!buyerId) {
      setCheckoutError('Select a buyer before completing the bill.')
      return
    }
    if (cart.length === 0) {
      setCheckoutError('Scan or add at least one part to the bill.')
      return
    }
    if (cartSummary.invalidPrices > 0) {
      setCheckoutError(
        'Enter a valid unit price (₹) for every part in the bill.'
      )
      return
    }
    if (cartSummary.overStockItems.length > 0 && !confirmNegative) {
      setConfirmNegative(true)
      return
    }

    const invoiceNo = nextInvoiceNo(data)
    const bill = actions.recordBill({
      buyerId,
      date,
      invoiceNo,
      items: cart.map((item) => ({
        variantId: item.variantId,
        qty: Math.max(1, parseInt(item.qty, 10) || 1),
        price: parseFloat(item.price) || 0,
      })),
    })

    if (bill) {
      setCart([])
      setConfirmNegative(false)
      setScannerFeedback(null)
      setActiveReceipt(bill)
    }
  }

  const bills = Array.isArray(data.bills) ? data.bills : []
  const invoicePreviewNo = nextInvoiceNo(data)

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Stock Out — Scan &amp; Bill</h2>
          <div className="desc">
            Scan parts into a live checkout cart, adjust units like a supermarket counter, recall
            and update buyer prices, and print a bill.
          </div>
        </div>
        <div className="sheet-tag">
          POS BILLING / {bills.length} BILLS · {data.sales.length} ITEMS
        </div>
      </div>

      <div className="checkout-layout">
        <div className="card">
          <div className="card-inner">
            <div className="checkout-top-row">
              <div>
                <label htmlFor="outBuyer">Buyer / Garage</label>
                <select
                  id="outBuyer"
                  value={buyerId}
                  onChange={(e) => handleBuyerChange(e.target.value)}
                >
                  <option value="">
                    {data.buyers.length ? 'Select a buyer' : 'Add a buyer first'}
                  </option>
                  {data.buyers.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="outDate">Bill Date</label>
                <input
                  id="outDate"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
              <div className="invoice-badge-box">
                <span>NEXT BILL</span>
                <strong className="mono">{invoicePreviewNo}</strong>
              </div>
            </div>

            <div className="scan-strip checkout-scan-strip">
              <div className="scan-strip-head">
                <span className="scan-strip-label">
                  SUPERMARKET SCANNER — REPEATED SCANS ADD +1 UNIT
                </span>
                <button
                  type="button"
                  className="quick-action quick-action-primary"
                  onClick={() => {
                    setScannerFeedback(null)
                    setScannerOpen(true)
                  }}
                >
                  Scan to Bill (Camera)
                </button>
              </div>

              <div className="checkout-input-grid">
                <form className="scan-strip-form" onSubmit={submitScanInput}>
                  <input
                    type="text"
                    value={scanInput}
                    onChange={(e) => setScanInput(e.target.value)}
                    placeholder="Scan with USB gun or type code + Enter"
                    aria-label="Scan code to add to bill"
                  />
                  <button type="submit" className="quick-action quick-action-secondary">
                    Scan / Add
                  </button>
                </form>

                <div className="manual-pick-row">
                  <select
                    value={manualVariantId}
                    onChange={(e) => setManualVariantId(e.target.value)}
                    aria-label="Pick part manually"
                  >
                    <option value="">
                      {data.variants.length
                        ? 'Or pick part from catalogue…'
                        : 'No parts in catalogue yet'}
                    </option>
                    {data.variants.map((v) => (
                      <option key={v.id} value={v.id}>
                        {variantLabel(data, v)}
                        {v.partNo ? ` (${v.partNo})` : ''} — stock {v.stock}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="quick-action quick-action-secondary"
                    disabled={!manualVariantId}
                    onClick={addSelectedManualVariant}
                  >
                    + Add
                  </button>
                </div>
              </div>
            </div>

            {scannerFeedback && (
              <div
                className={`hint ${scannerFeedback.tone === 'warn' ? 'danger-hint' : ''}`}
              >
                {scannerFeedback.text}
              </div>
            )}

            <h2>
              Bill Cart <span className="count">({cart.length} items)</span>
            </h2>

            <div className="table-wrap">
              <table className="cart-table">
                <thead>
                  <tr>
                    <th>Part &amp; Vehicle Fit</th>
                    <th>Unit Price (₹)</th>
                    <th>Units</th>
                    <th className="num">Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.length === 0 && (
                    <tr>
                      <td colSpan={5}>
                        <div className="empty">
                          Cart is empty. Click <b>Scan to Bill (Camera)</b> or enter a code above to
                          start building the bill.
                        </div>
                      </td>
                    </tr>
                  )}
                  {cart.map((item) => {
                    const v = data.variants.find((x) => x.id === item.variantId)
                    if (!v) return null
                    const pricing = resolveBuyerPricing(data, v.id, buyerId)
                    const unitPriceNum = parseFloat(item.price)
                    const lineTotal =
                      !Number.isNaN(unitPriceNum) && unitPriceNum >= 0
                        ? unitPriceNum * item.qty
                        : 0
                    const overStock = item.qty > v.stock
                    const priceChangedFromHistory =
                      pricing.buyerLastPrice !== null &&
                      !Number.isNaN(unitPriceNum) &&
                      unitPriceNum !== pricing.buyerLastPrice

                    return (
                      <tr key={v.id}>
                        <td>
                          <div className="tname">{variantLabel(data, v)}</div>
                          <div className="tsub mono">
                            {v.partNo ? `${v.partNo} · ` : ''}
                            {v.barcode ? `Code ${v.barcode} · ` : ''}
                            <span
                              className={
                                overStock
                                  ? 'stock-inline-warn'
                                  : v.stock <= v.minStock
                                    ? 'stock-inline-low'
                                    : ''
                              }
                            >
                              In stock: {v.stock}
                            </span>
                          </div>
                          {overStock && (
                            <div className="cart-stock-warn">
                              Exceeds stock by {item.qty - v.stock} unit(s)
                            </div>
                          )}
                        </td>

                        <td className="cart-price-cell">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) => updateItemPrice(v.id, e.target.value)}
                            placeholder="0.00"
                            aria-label={`Unit price for ${variantLabel(data, v)}`}
                          />
                          {pricing.buyerLastPrice !== null ? (
                            <div className="price-memory-note is-buyer">
                              Last sold to buyer: <b>{money(pricing.buyerLastPrice)}</b> (
                              {pricing.buyerLastDate})
                              {priceChangedFromHistory && (
                                <span className="price-updated-tag">
                                  {' '}
                                  · Updated price will be saved
                                </span>
                              )}
                            </div>
                          ) : pricing.anyLastPrice !== null ? (
                            <div className="price-memory-note">
                              Last sold (other buyer): <b>{money(pricing.anyLastPrice)}</b>{' '}
                              <button
                                type="button"
                                className="inline-link-btn"
                                onClick={() =>
                                  updateItemPrice(v.id, String(pricing.anyLastPrice))
                                }
                              >
                                Use
                              </button>
                            </div>
                          ) : (
                            <div className="price-memory-note">
                              No prior sale price for this part
                            </div>
                          )}
                        </td>

                        <td>
                          <div className="stepper">
                            <button
                              type="button"
                              onClick={() => updateItemQty(v.id, item.qty - 1)}
                              aria-label="Decrease units"
                            >
                              −
                            </button>
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.qty}
                              onChange={(e) => updateItemQty(v.id, e.target.value)}
                              aria-label="Units"
                            />
                            <button
                              type="button"
                              onClick={() => updateItemQty(v.id, item.qty + 1)}
                              aria-label="Increase units"
                            >
                              +
                            </button>
                          </div>
                        </td>

                        <td className="num">
                          <strong>{money(lineTotal)}</strong>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="ghost"
                            onClick={() => removeItem(v.id)}
                          >
                            Remove
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

        <div className="card checkout-summary-card">
          <div className="card-inner">
            <h2>Bill Summary</h2>

            <div className="summary-rows">
              <div className="summary-row">
                <span>Buyer</span>
                <strong>
                  {buyerId
                    ? data.buyers.find((b) => b.id === buyerId)?.name || 'Selected'
                    : 'Not selected'}
                </strong>
              </div>
              <div className="summary-row">
                <span>Distinct parts</span>
                <strong className="mono">{cart.length}</strong>
              </div>
              <div className="summary-row">
                <span>Total units</span>
                <strong className="mono">{cartSummary.totalUnits}</strong>
              </div>
            </div>

            <div className="transaction-preview">
              <div className="transaction-preview-copy">
                <span className="preview-label">Grand bill total</span>
                <span className="preview-note">
                  {cartSummary.totalUnits} unit(s) across {cart.length} line(s)
                </span>
              </div>
              <strong>{money(cartSummary.totalAmount)}</strong>
            </div>

            {checkoutError && <div className="hint danger-hint">{checkoutError}</div>}

            {confirmNegative && cartSummary.overStockItems.length > 0 && (
              <div className="hint danger-hint">
                <b>Low stock warning:</b>{' '}
                {cartSummary.overStockItems
                  .map((x) => `${x.name} (have ${x.stock}, billing ${x.qty})`)
                  .join('; ')}
                . Click below again to confirm negative stock.
              </div>
            )}

            <button
              type="button"
              className="primary"
              disabled={cart.length === 0}
              onClick={completeBill}
            >
              {confirmNegative
                ? 'Confirm Negative Stock & Complete Bill'
                : 'Complete Bill & Deduct Stock'}
            </button>

            {cart.length > 0 && (
              <button
                type="button"
                className="quick-action quick-action-secondary"
                style={{ width: '100%', marginTop: 10 }}
                onClick={() => {
                  setCart([])
                  setConfirmNegative(false)
                  setCheckoutError('')
                }}
              >
                Clear cart
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 19 }}>
        <div className="card-inner">
          <div className="history-head">
            <h2 style={{ borderBottom: 'none', margin: 0, padding: 0 }}>
              Billing &amp; Sales History
            </h2>
            <div className="segmented-tabs compact-tabs">
              <button
                type="button"
                className={historyView === 'bills' ? 'active' : ''}
                onClick={() => setHistoryView('bills')}
              >
                Completed Bills ({bills.length})
              </button>
              <button
                type="button"
                className={historyView === 'items' ? 'active' : ''}
                onClick={() => setHistoryView('items')}
              >
                Item Ledger ({data.sales.length})
              </button>
            </div>
          </div>

          <div className="table-wrap" style={{ marginTop: 14 }}>
            {historyView === 'bills' ? (
              <table>
                <thead>
                  <tr>
                    <th>Bill No.</th>
                    <th>Buyer</th>
                    <th className="num">Items</th>
                    <th className="num">Units</th>
                    <th className="num">Total</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {bills.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty">No completed bills yet.</div>
                      </td>
                    </tr>
                  )}
                  {bills
                    .slice()
                    .reverse()
                    .slice(0, 40)
                    .map((bill) => {
                      const buyer = data.buyers.find((b) => b.id === bill.buyerId)
                      return (
                        <tr key={bill.id}>
                          <td className="mono tname">{bill.invoiceNo}</td>
                          <td>{buyer ? buyer.name : '—'}</td>
                          <td className="num">{bill.items?.length || 0}</td>
                          <td className="num">{bill.totalUnits || 0}</td>
                          <td className="num">
                            <strong>{money(bill.totalAmount)}</strong>
                          </td>
                          <td className="mono">{bill.date}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="ghost"
                                onClick={() => setActiveReceipt(bill)}
                              >
                                Receipt
                              </button>
                              <button
                                type="button"
                                className="ghost"
                                onClick={() =>
                                  confirm(
                                    `Undo bill ${bill.invoiceNo}? Stock for all items will be restored.`
                                  ) && actions.undoBill(bill.id)
                                }
                              >
                                Undo
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                </tbody>
              </table>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Part</th>
                    <th>Buyer</th>
                    <th>Bill</th>
                    <th className="num">Price</th>
                    <th className="num">Qty</th>
                    <th>Date</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.sales.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty">No sales recorded yet.</div>
                      </td>
                    </tr>
                  )}
                  {data.sales
                    .slice()
                    .reverse()
                    .slice(0, 50)
                    .map((s) => {
                      const v = data.variants.find((x) => x.id === s.variantId)
                      const b = data.buyers.find((x) => x.id === s.buyerId)
                      return (
                        <tr key={s.id}>
                          <td>{v ? variantLabel(data, v) : '—'}</td>
                          <td>{b ? b.name : '—'}</td>
                          <td className="mono">{s.invoiceNo || '—'}</td>
                          <td className="num">{money(s.price)}</td>
                          <td className="num">{s.qty}</td>
                          <td className="mono">{s.date}</td>
                          <td>
                            <button
                              type="button"
                              className="ghost"
                              onClick={() =>
                                confirm(
                                  'Undo this sale line? Stock will be added back.'
                                ) && actions.undoSale(s.id)
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
            )}
          </div>
        </div>
      </div>

      <ScannerModal
        open={scannerOpen}
        mode="continuous"
        title="Scan Parts Into Bill"
        subtitle="Hold each part box up to the camera. Repeated scans automatically increase units (+1)."
        lastFeedback={scannerFeedback}
        onScan={handleCodeScanned}
        onClose={() => setScannerOpen(false)}
      />

      <QuickRegisterModal
        open={Boolean(quickRegCode)}
        scannedCode={quickRegCode}
        data={data}
        actions={actions}
        allowOpeningStock
        onRegistered={(variantId, code) => {
          setQuickRegCode('')
          const pricing = resolveBuyerPricing(data, variantId, buyerId)
          setCart((prev) => [
            ...prev,
            {
              variantId,
              qty: 1,
              price: pricing.assumedPrice,
              priceEdited: false,
            },
          ])
          setScannerFeedback({
            tone: 'ok',
            text: `Registered code ${code} and added 1 unit to the current bill.`,
          })
        }}
        onClose={() => setQuickRegCode('')}
      />

      <BillReceiptModal
        open={Boolean(activeReceipt)}
        bill={activeReceipt}
        data={data}
        onClose={() => setActiveReceipt(null)}
      />
    </div>
  )
}
