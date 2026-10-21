import { useMemo, useState } from 'react'
import { RegMark } from '../components/Bits'
import { lastPurchaseFor, variantLabel } from '../lib/calculations'
import { money, todayStr } from '../lib/format'

export default function StockInPage({ data, actions }) {
  const [supplierId, setSupplierId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [cost, setCost] = useState('')
  const [qty, setQty] = useState('1')
  const [date, setDate] = useState(todayStr())
  const selectedVariant = data.variants.find((v) => v.id === variantId)

  const hint = useMemo(() => {
    if (!variantId || !supplierId) return null
    const last = lastPurchaseFor(data, variantId, supplierId)
    if (last) {
      return { tone: 'accent', text: <>Last bought from this supplier at <b>{money(last.cost)}</b> on {last.date}.</> }
    }
    const lastAny = lastPurchaseFor(data, variantId)
    if (lastAny) {
      const s = data.suppliers.find((x) => x.id === lastAny.supplierId)
      return { tone: 'muted', text: <>No history with this supplier. Most recently purchased from <b>{s ? s.name : 'ANOTHER SUPPLIER'}</b> at <b>{money(lastAny.cost)}</b></> }
    }
    return { tone: 'muted', text: 'No purchase history yet for this part.' }
  }, [data, variantId, supplierId])

  function submit(e) {
    e.preventDefault()
    const sId = supplierId
    const vId = variantId
    if (!sId || !vId) {
      alert('Select a supplier and a part. Add them first if they are missing.')
      return
    }
    const costNum = parseFloat(cost)
    const qtyNum = parseInt(qty)
    if (!(costNum >= 0) || !(qtyNum > 0)) {
      alert('Enter a valid cost and quantity.')
      return
    }
    actions.recordPurchase({ supplierId: sId, variantId: vId, cost: costNum, qty: qtyNum, date })
    setCost('')
    setQty('1')
  }

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Stock In</h2>
          <div className="desc">Log incoming parts, keep supplier price history and update stock in one step.</div>
        </div>
        <div className="sheet-tag">INBOUND / {data.purchases.length} RECORDS</div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-inner">
            <h2>Record a purchase</h2>
            <form onSubmit={submit}>
              <label htmlFor="inSupplier">Supplier</label>
              <select id="inSupplier" value={supplierId} onChange={(e) => setSupplierId(e.target.value)} required>
                <option value="">{data.suppliers.length ? 'Select a supplier' : 'Add a supplier first'}</option>
                {data.suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              <label htmlFor="inVariant">Part</label>
              <select id="inVariant" value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
                <option value="">{data.variants.length ? 'Select a part' : 'Add a variant first'}</option>
                {data.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {variantLabel(data, v)}{v.partNo ? ` (${v.partNo})` : ''} — stock {v.stock}
                  </option>
                ))}
              </select>
              {hint && <div className={`hint ${hint.tone === 'muted' ? 'muted' : ''}`}>{hint.text}</div>}
              <div className="row3">
                <div>
                  <label htmlFor="inCost">Cost / piece (₹)</label>
                  <input id="inCost" type="number" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor="inQty">Quantity</label>
                  <input id="inQty" type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="inDate">Date</label>
                  <input id="inDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>
              <div className="transaction-preview">
                <div className="transaction-preview-copy">
                  <span className="preview-label">Purchase total</span>
                  <span className="preview-note">{Math.max(0, Number.parseInt(qty, 10) || 0)} units × {money(Math.max(0, Number.parseFloat(cost) || 0))} each</span>
                  {selectedVariant && <span className="preview-stock">On hand: {selectedVariant.stock} → {selectedVariant.stock + Math.max(0, Number.parseInt(qty, 10) || 0)} units</span>}
                </div>
                <strong>{money((Math.max(0, Number.parseFloat(cost) || 0)) * (Math.max(0, Number.parseInt(qty, 10) || 0)))}</strong>
              </div>
              <button className="primary" type="submit">Add to stock <span aria-hidden="true">↗</span></button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <h2>Purchase history <span className="count">({data.purchases.length})</span></h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Part</th><th>Supplier</th><th className="num">Cost</th><th className="num">Qty</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {data.purchases.length === 0 && (
                    <tr><td colSpan={6}><div className="empty">No purchases recorded yet.</div></td></tr>
                  )}
                  {data.purchases.slice().reverse().slice(0, 50).map((p) => {
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
                            className="ghost"
                            onClick={() => confirm('Undo this purchase? Stock will be reduced back.') && actions.undoPurchase(p.id)}
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
    </div>
  )
}
