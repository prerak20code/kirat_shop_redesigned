import { money } from '../lib/format'
import { variantLabel } from '../lib/calculations'

export default function BillReceiptModal({ open, bill, data, onClose }) {
  if (!open || !bill) return null

  const buyer = data.buyers.find((b) => b.id === bill.buyerId)
  const items = bill.items || []
  const totalUnits =
    bill.totalUnits ?? items.reduce((sum, item) => sum + (Number(item.qty) || 0), 0)
  const totalAmount =
    bill.totalAmount ??
    items.reduce(
      (sum, item) => sum + (Number(item.qty) || 0) * (Number(item.price) || 0),
      0
    )

  return (
    <div
      className="modal-backdrop print-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="bill-receipt-title"
    >
      <div className="modal-card receipt-modal">
        <div className="modal-head no-print">
          <div>
            <span className="modal-kicker">CUSTOMER BILL / RECEIPT</span>
            <h3 id="bill-receipt-title">Invoice {bill.invoiceNo}</h3>
            <p>Stock has been deducted and buyer pricing has been updated.</p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close receipt"
          >
            ✕
          </button>
        </div>

        <div className="receipt-paper print-only-surface">
          <div className="receipt-header">
            <div>
              <div className="receipt-shop-name">PARTS LEDGER</div>
              <div className="receipt-shop-sub">Auto Parts Operations · Counter Bill</div>
            </div>
            <div className="receipt-meta">
              <div className="mono">
                <strong>{bill.invoiceNo}</strong>
              </div>
              <div className="mono">{bill.date}</div>
            </div>
          </div>

          <div className="receipt-buyer-box">
            <div>
              <span className="receipt-field-label">BILLED TO</span>
              <strong>{buyer ? buyer.name : 'Customer'}</strong>
            </div>
            {buyer?.contact && (
              <div className="receipt-buyer-contact">{buyer.contact}</div>
            )}
          </div>

          <table className="receipt-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Part &amp; Vehicle Fit</th>
                <th>Part No.</th>
                <th className="num">Rate</th>
                <th className="num">Qty</th>
                <th className="num">Amount</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, idx) => {
                const v = data.variants.find((x) => x.id === item.variantId)
                const lineTotal = (Number(item.qty) || 0) * (Number(item.price) || 0)
                return (
                  <tr key={`${item.variantId}-${idx}`}>
                    <td className="mono">{idx + 1}</td>
                    <td>
                      <div className="tname">{v ? variantLabel(data, v) : 'Part'}</div>
                      {v?.barcode && <div className="tsub mono">{v.barcode}</div>}
                    </td>
                    <td className="mono">{v?.partNo || '—'}</td>
                    <td className="num">{money(item.price)}</td>
                    <td className="num">{item.qty}</td>
                    <td className="num">
                      <strong>{money(lineTotal)}</strong>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>

          <div className="receipt-totals">
            <div>
              <span>Total items</span>
              <strong>{items.length}</strong>
            </div>
            <div>
              <span>Total units</span>
              <strong>{totalUnits}</strong>
            </div>
            <div className="receipt-grand">
              <span>Grand Total</span>
              <strong>{money(totalAmount)}</strong>
            </div>
          </div>
        </div>

        <div className="modal-foot no-print">
          <button
            type="button"
            className="quick-action quick-action-secondary"
            onClick={onClose}
          >
            Start next bill
          </button>
          <button
            type="button"
            className="quick-action quick-action-primary"
            onClick={() => window.print()}
          >
            Print / Save PDF
          </button>
        </div>
      </div>
    </div>
  )
}
