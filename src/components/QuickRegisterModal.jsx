import { useState } from 'react'
import { variantLabel } from '../lib/calculations'

export default function QuickRegisterModal({
  open,
  scannedCode,
  data,
  actions,
  allowOpeningStock = false,
  onRegistered,
  onClose,
}) {
  const [mode, setMode] = useState('new') // 'new' | 'link'
  const [productId, setProductId] = useState(data.products[0]?.id || '__new__')
  const [newProductName, setNewProductName] = useState('')
  const [newProductCategory, setNewProductCategory] = useState('')
  const [brand, setBrand] = useState('')
  const [vehicle, setVehicle] = useState('')
  const [partNo, setPartNo] = useState('')
  const [stock, setStock] = useState('0')
  const [minStock, setMinStock] = useState('5')
  const [linkVariantId, setLinkVariantId] = useState(
    data.variants.find((v) => !v.barcode)?.id || data.variants[0]?.id || ''
  )
  const [error, setError] = useState('')

  if (!open) return null

  function handleCreate(e) {
    e.preventDefault()
    setError('')
    const creatingNewProduct = !productId || productId === '__new__'
    if (creatingNewProduct && !newProductName.trim()) {
      setError('Enter a product name (e.g. Stabilizer Shaft Rubber).')
      return
    }
    if (!brand.trim() && !vehicle.trim() && !partNo.trim()) {
      setError('Enter at least a brand, supported vehicle, or part number.')
      return
    }

    const result = actions.addProductWithVariant({
      productId: creatingNewProduct ? null : productId,
      newProductName,
      newProductCategory,
      brand,
      vehicle,
      partNo,
      barcode: scannedCode,
      stock: allowOpeningStock ? stock : '0',
      minStock,
    })
    onRegistered(result.variantId, scannedCode)
  }

  function handleLink(e) {
    e.preventDefault()
    setError('')
    if (!linkVariantId) {
      setError('Select an existing part variant to link.')
      return
    }
    actions.updateVariantBarcode(linkVariantId, scannedCode)
    onRegistered(linkVariantId, scannedCode)
  }

  return (
    <div
      className="modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-reg-title"
    >
      <div className="modal-card quick-reg-modal">
        <div className="modal-head">
          <div>
            <span className="modal-kicker">FIRST-TIME PART REGISTRATION</span>
            <h3 id="quick-reg-title">New code scanned — save part once</h3>
            <p>
              This code is not in your catalogue yet. Save the part and supported vehicle models
              once; future scans will fill everything automatically.
            </p>
          </div>
          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close registration"
          >
            ✕
          </button>
        </div>

        <div className="scanned-code-banner">
          <span>SCANNED CODE</span>
          <strong className="mono">{scannedCode}</strong>
        </div>

        <div className="segmented-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'new'}
            className={mode === 'new' ? 'active' : ''}
            onClick={() => {
              setMode('new')
              setError('')
            }}
          >
            Register new part
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'link'}
            className={mode === 'link' ? 'active' : ''}
            onClick={() => {
              setMode('link')
              setError('')
            }}
            disabled={data.variants.length === 0}
          >
            Link to existing part ({data.variants.length})
          </button>
        </div>

        {error && <div className="hint danger-hint">{error}</div>}

        {mode === 'new' ? (
          <form onSubmit={handleCreate}>
            <label htmlFor="qrProduct">Product family</label>
            <select
              id="qrProduct"
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
            >
              <option value="__new__">+ Create new product family</option>
              {data.products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                  {p.category ? ` (${p.category})` : ''}
                </option>
              ))}
            </select>

            {(!productId || productId === '__new__') && (
              <div className="row">
                <div>
                  <label htmlFor="qrNewPName">New product name</label>
                  <input
                    id="qrNewPName"
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="e.g. Stabilizer Shaft Rubber"
                  />
                </div>
                <div>
                  <label htmlFor="qrNewPCat">Category</label>
                  <input
                    id="qrNewPCat"
                    value={newProductCategory}
                    onChange={(e) => setNewProductCategory(e.target.value)}
                    placeholder="e.g. Suspension / Rubber"
                  />
                </div>
              </div>
            )}

            <div className="row">
              <div>
                <label htmlFor="qrBrand">Brand / Make</label>
                <input
                  id="qrBrand"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. RB1"
                />
              </div>
              <div>
                <label htmlFor="qrPartNo">Part number</label>
                <input
                  id="qrPartNo"
                  value={partNo}
                  onChange={(e) => setPartNo(e.target.value)}
                  placeholder="e.g. HNS-3309 C"
                />
              </div>
            </div>

            <label htmlFor="qrVehicle">Supported vehicle models</label>
            <input
              id="qrVehicle"
              value={vehicle}
              onChange={(e) => setVehicle(e.target.value)}
              placeholder="e.g. Honda City VII (CTY VII)"
            />

            <div className="row">
              {allowOpeningStock && (
                <div>
                  <label htmlFor="qrStock">Opening stock</label>
                  <input
                    id="qrStock"
                    type="number"
                    min="0"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                  />
                </div>
              )}
              <div>
                <label htmlFor="qrMinStock">Low stock alert below</label>
                <input
                  id="qrMinStock"
                  type="number"
                  min="0"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value)}
                />
              </div>
            </div>

            <div className="modal-foot">
              <button
                type="button"
                className="quick-action quick-action-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="quick-action quick-action-primary">
                Save &amp; use this part
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleLink}>
            <label htmlFor="qrLinkVariant">Choose existing part variant</label>
            <select
              id="qrLinkVariant"
              value={linkVariantId}
              onChange={(e) => setLinkVariantId(e.target.value)}
            >
              <option value="">Select a variant</option>
              {data.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {variantLabel(data, v)}
                  {v.partNo ? ` (${v.partNo})` : ''}
                  {v.barcode ? ` [Code: ${v.barcode}]` : ' [No code yet]'}
                </option>
              ))}
            </select>
            <div className="hint muted">
              Linking attaches <b>{scannedCode}</b> to the chosen variant so future scans pull it
              up immediately.
            </div>
            <div className="modal-foot">
              <button
                type="button"
                className="quick-action quick-action-secondary"
                onClick={onClose}
              >
                Cancel
              </button>
              <button type="submit" className="quick-action quick-action-primary">
                Link code &amp; continue
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
