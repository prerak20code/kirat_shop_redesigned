import { useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import { generateShopBarcode } from '../lib/ids'

export default function QRLabelModal({
  open,
  data,
  actions,
  initialVariantIds = [],
  onClose,
}) {
  const [counts, setCounts] = useState({})
  const [qrUrls, setQrUrls] = useState({})

  // Initialize label quantities only when the modal opens
  useEffect(() => {
    if (!open) return
    const next = {}
    if (initialVariantIds.length > 0) {
      for (const id of initialVariantIds) {
        const v = data.variants.find((x) => x.id === id)
        next[id] = v ? Math.max(1, Math.min(20, Number(v.stock) || 1)) : 1
      }
    } else {
      for (const v of data.variants) {
        if (v.barcode) next[v.id] = 1
      }
    }
    setCounts(next)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, initialVariantIds])

  const selectedVariants = useMemo(
    () => data.variants.filter((v) => (counts[v.id] || 0) > 0),
    [data.variants, counts]
  )

  // Generate QR data URLs locally for all variants that have a barcode
  useEffect(() => {
    if (!open) return
    let cancelled = false

    async function renderQrs() {
      const nextUrls = {}
      for (const v of data.variants) {
        const code = String(v.barcode || '').trim()
        if (!code) continue
        try {
          nextUrls[v.id] = await QRCode.toDataURL(code, {
            width: 240,
            margin: 1,
            errorCorrectionLevel: 'M',
            color: { dark: '#101612', light: '#ffffff' },
          })
        } catch {
          // Skip invalid code
        }
      }
      if (!cancelled) setQrUrls(nextUrls)
    }

    renderQrs()
    return () => {
      cancelled = true
    }
  }, [open, data.variants])

  if (!open) return null

  const stickers = []
  for (const v of selectedVariants) {
    if (!v.barcode) continue
    const qty = Math.max(0, Math.min(100, Number(counts[v.id]) || 0))
    const product = data.products.find((p) => p.id === v.productId)
    for (let i = 0; i < qty; i += 1) {
      stickers.push({
        key: `${v.id}-${i}`,
        variant: v,
        productName: product ? product.name : 'Auto Part',
        qrUrl: qrUrls[v.id] || '',
      })
    }
  }

  function setQty(variantId, nextVal) {
    const num = Math.max(0, Math.min(100, parseInt(nextVal, 10) || 0))
    setCounts((prev) => ({ ...prev, [variantId]: num }))
  }

  function assignAllMissingCodes() {
    const working = [...data.variants]
    for (const v of data.variants) {
      if (!v.barcode && (counts[v.id] || 0) > 0) {
        const code = generateShopBarcode(working)
        working.push({ ...v, barcode: code })
        actions.updateVariantBarcode(v.id, code)
      }
    }
  }

  function assignCodeForVariant(variantId) {
    const code = generateShopBarcode(data.variants)
    actions.updateVariantBarcode(variantId, code)
  }

  const missingCodeCount = selectedVariants.filter((v) => !v.barcode).length

  return (
    <div
      className="modal-backdrop print-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="qr-label-title"
    >
      <div className="modal-card label-modal">
        <div className="modal-head no-print">
          <div>
            <span className="modal-kicker">PRINTABLE SHOP QR STICKERS</span>
            <h3 id="qr-label-title">QR Label Sheet</h3>
            <p>
              Print scannable QR stickers for parts without factory codes or with unreadable box
              labels.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close label sheet"
          >
            ✕
          </button>
        </div>

        <div className="label-builder no-print">
          <div className="label-builder-head">
            <span>Select parts &amp; sticker count</span>
            <div className="label-quick-btns">
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  const next = {}
                  data.variants.forEach((v) => {
                    next[v.id] = 1
                  })
                  setCounts(next)
                }}
              >
                1 per part
              </button>
              <button
                type="button"
                className="ghost"
                onClick={() => {
                  const next = {}
                  data.variants.forEach((v) => {
                    next[v.id] = Math.max(0, Number(v.stock) || 0)
                  })
                  setCounts(next)
                }}
              >
                Match stock
              </button>
              <button type="button" className="ghost" onClick={() => setCounts({})}>
                Clear
              </button>
            </div>
          </div>

          <div className="label-picker-list">
            {data.variants.length === 0 && (
              <div className="empty">No parts in catalogue yet.</div>
            )}
            {data.variants.map((v) => {
              const product = data.products.find((p) => p.id === v.productId)
              const qty = counts[v.id] || 0
              return (
                <div key={v.id} className="label-picker-row">
                  <div className="label-picker-info">
                    <strong>
                      {product ? product.name : 'Unknown product'}
                      {v.brand ? ` · ${v.brand}` : ''}
                    </strong>
                    <span>
                      {v.vehicle || 'Any model'}
                      {v.partNo ? ` · ${v.partNo}` : ''}
                      {v.barcode ? ` · Code: ${v.barcode}` : ' · No QR/barcode yet'}
                    </span>
                  </div>
                  <div className="label-picker-controls">
                    {!v.barcode && (
                      <button
                        type="button"
                        className="ghost"
                        onClick={() => assignCodeForVariant(v.id)}
                      >
                        Generate code
                      </button>
                    )}
                    <div className="stepper compact">
                      <button
                        type="button"
                        onClick={() => setQty(v.id, qty - 1)}
                        aria-label="Decrease label count"
                      >
                        −
                      </button>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={qty}
                        onChange={(e) => setQty(v.id, e.target.value)}
                        aria-label="Label copies"
                      />
                      <button
                        type="button"
                        onClick={() => setQty(v.id, qty + 1)}
                        aria-label="Increase label count"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {missingCodeCount > 0 && (
            <div className="hint" style={{ marginTop: 12, marginBottom: 0 }}>
              {missingCodeCount} selected part(s) do not have a code assigned yet.{' '}
              <button
                type="button"
                className="inline-link-btn"
                onClick={assignAllMissingCodes}
              >
                Auto-generate shop QR codes now
              </button>
            </div>
          )}
        </div>

        <div className="print-sheet-preview">
          <div className="print-sheet-meta no-print">
            <span>STICKER PREVIEW ({stickers.length} LABELS)</span>
          </div>
          {stickers.length === 0 ? (
            <div className="empty no-print">
              Increase sticker count on any part with a code to preview and print labels.
            </div>
          ) : (
            <div className="qr-sticker-grid print-only-surface">
              {stickers.map((s) => (
                <div className="qr-sticker" key={s.key}>
                  <div className="qr-sticker-copy">
                    <div className="qr-sticker-brand">
                      {s.variant.brand || 'PARTS LEDGER'}
                    </div>
                    <div className="qr-sticker-title">{s.productName}</div>
                    {s.variant.vehicle && (
                      <div className="qr-sticker-vehicle">{s.variant.vehicle}</div>
                    )}
                    {s.variant.partNo && (
                      <div className="qr-sticker-partno mono">{s.variant.partNo}</div>
                    )}
                    <div className="qr-sticker-code mono">{s.variant.barcode}</div>
                  </div>
                  {s.qrUrl && (
                    <img
                      className="qr-sticker-img"
                      src={s.qrUrl}
                      alt={`QR ${s.variant.barcode}`}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="modal-foot no-print">
          <button
            type="button"
            className="quick-action quick-action-secondary"
            onClick={onClose}
          >
            Close
          </button>
          <button
            type="button"
            className="quick-action quick-action-primary"
            disabled={stickers.length === 0}
            onClick={() => window.print()}
          >
            Print {stickers.length} label{stickers.length === 1 ? '' : 's'}
          </button>
        </div>
      </div>
    </div>
  )
}
