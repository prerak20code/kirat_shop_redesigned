import { useMemo, useState } from 'react'
import { RegMark } from '../components/Bits'
import { lastSaleFor, variantLabel } from '../lib/calculations'
import { money, todayStr } from '../lib/format'

export default function StockOutPage({ data, actions }) {
  const [buyerId, setBuyerId] = useState('')
  const [variantId, setVariantId] = useState('')
  const [price, setPrice] = useState('')
  const [qty, setQty] = useState('1')
  const [date, setDate] = useState(todayStr())

  const variant = data.variants.find((v) => v.id === variantId)

  const hintLines = useMemo(() => {
    if (!variantId || !buyerId) return []
    const lines = []
    const last = lastSaleFor(data, variantId, buyerId)
    if (last) {
      lines.push({ tone: '', text: <>This buyer last paid <b>{money(last.price)}</b> for this part on {last.date}</> })
    } else {
      const lastAny = lastSaleFor(data, variantId)
      if (lastAny) {
        lines.push({ tone: 'muted', text: <>No history with this buyer. Most recently sold to another buyer at <b>{money(lastAny.price)}</b></> })
      } else {
        lines.push({ tone: 'muted', text: 'No sale history yet for this part.' })
      }
    }
    if (variant && variant.stock <= 0) {
      lines.push({ tone: 'danger', text: 'This part is out of stock.' })
    } else if (variant && variant.stock <= variant.minStock) {
      lines.push({ tone: '', text: `Only ${variant.stock} left in stock.` })
    }
    return lines
  }, [data, variantId, buyerId, variant])

  function submit(e) {
    e.preventDefault()
    const bId = buyerId
    const vId = variantId
    if (!bId || !vId) {
      alert('Select a buyer and a part. Add them first if they are missing.')
      return
    }
    const priceNum = parseFloat(price)
    const qtyNum = parseInt(qty)
    if (!(priceNum >= 0) || !(qtyNum > 0)) {
      alert('Enter a valid price and quantity.')
      return
    }
    const v = data.variants.find((x) => x.id === vId)
    if (v && qtyNum > v.stock) {
      if (!confirm(`Only ${v.stock} in stock. Record this sale anyway (stock will go negative)?`)) return
    }
    actions.recordSale({ buyerId: bId, variantId: vId, price: priceNum, qty: qtyNum, date })
    setPrice('')
    setQty('1')
  }

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Stock Out</h2>
          <div className="desc">Record outgoing parts with buyer-specific price history and a live stock check.</div>
        </div>
        <div className="sheet-tag">OUTBOUND / {data.sales.length} RECORDS</div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-inner">
            <h2>Record a sale</h2>
            <form onSubmit={submit}>
              <label htmlFor="outBuyer">Buyer</label>
              <select id="outBuyer" value={buyerId} onChange={(e) => setBuyerId(e.target.value)} required>
                <option value="">{data.buyers.length ? 'Select a buyer' : 'Add a buyer first'}</option>
                {data.buyers.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
              <label htmlFor="outVariant">Part</label>
              <select id="outVariant" value={variantId} onChange={(e) => setVariantId(e.target.value)} required>
                <option value="">{data.variants.length ? 'Select a part' : 'Add a variant first'}</option>
                {data.variants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {variantLabel(data, v)}{v.partNo ? ` (${v.partNo})` : ''} — stock {v.stock}
                  </option>
                ))}
              </select>
              {hintLines.map((h, i) => (
                <div
                  key={i}
                  className={`hint ${h.tone === 'muted' ? 'muted' : ''} ${h.tone === 'danger' ? 'danger-hint' : ''}`}
                >
                  {h.text}
                </div>
              ))}
              <div className="row3">
                <div>
                  <label htmlFor="outPrice">Sell price / piece (₹)</label>
                  <input id="outPrice" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required placeholder="0.00" />
                </div>
                <div>
                  <label htmlFor="outQty">Quantity</label>
                  <input id="outQty" type="number" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
                </div>
                <div>
                  <label htmlFor="outDate">Date</label>
                  <input id="outDate" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
                </div>
              </div>
              <div className="transaction-preview">
                <div className="transaction-preview-copy">
                  <span className="preview-label">Sale total</span>
                  <span className="preview-note">{Math.max(0, Number.parseInt(qty, 10) || 0)} units × {money(Math.max(0, Number.parseFloat(price) || 0))} each</span>
                  {variant && <span className={`preview-stock ${variant.stock - (Number.parseInt(qty, 10) || 0) < 0 ? 'preview-stock-warning' : ''}`}>After sale: {variant.stock} → {variant.stock - Math.max(0, Number.parseInt(qty, 10) || 0)} units</span>}
                </div>
                <strong>{money((Math.max(0, Number.parseFloat(price) || 0)) * (Math.max(0, Number.parseInt(qty, 10) || 0)))}</strong>
              </div>
              <button className="primary" type="submit">Record sale <span aria-hidden="true">↗</span></button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <h2>Sales history <span className="count">({data.sales.length})</span></h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Part</th><th>Buyer</th><th className="num">Price</th><th className="num">Qty</th><th>Date</th><th></th></tr>
                </thead>
                <tbody>
                  {data.sales.length === 0 && (
                    <tr><td colSpan={6}><div className="empty">No sales recorded yet.</div></td></tr>
                  )}
                  {data.sales.slice().reverse().slice(0, 50).map((s) => {
                    const v = data.variants.find((x) => x.id === s.variantId)
                    const b = data.buyers.find((x) => x.id === s.buyerId)
                    return (
                      <tr key={s.id}>
                        <td>{v ? variantLabel(data, v) : '—'}</td>
                        <td>{b ? b.name : '—'}</td>
                        <td className="num">{money(s.price)}</td>
                        <td className="num">{s.qty}</td>
                        <td className="mono">{s.date}</td>
                        <td>
                          <button
                            className="ghost"
                            onClick={() => confirm('Undo this sale? Stock will be added back.') && actions.undoSale(s.id)}
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
