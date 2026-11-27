import { useState } from 'react'
import { RegMark, DimLine } from '../components/Bits'
import ScannerModal from '../components/ScannerModal'
import QuickRegisterModal from '../components/QuickRegisterModal'
import QRLabelModal from '../components/QRLabelModal'
import { findVariantByCode, variantLabel } from '../lib/calculations'
import { generateShopBarcode } from '../lib/ids'

export default function CatalogPage({ data, actions }) {
  const [pName, setPName] = useState('')
  const [pCategory, setPCategory] = useState('')

  const [vProduct, setVProduct] = useState('')
  const [vBrand, setVBrand] = useState('')
  const [vVehicle, setVVehicle] = useState('')
  const [vPartNo, setVPartNo] = useState('')
  const [vBarcode, setVBarcode] = useState('')
  const [vStock, setVStock] = useState('0')
  const [vMin, setVMin] = useState('5')
  const [formError, setFormError] = useState('')
  const [scanBanner, setScanBanner] = useState(null)

  const [scannerMode, setScannerMode] = useState(null) // 'field' | 'register' | null
  const [quickRegCode, setQuickRegCode] = useState('')
  const [labelModalOpen, setLabelModalOpen] = useState(false)
  const [labelVariantIds, setLabelVariantIds] = useState([])

  function submitProduct(e) {
    e.preventDefault()
    if (!pName.trim()) return
    const createdId = actions.addProduct(pName, pCategory)
    if (createdId) setVProduct(createdId)
    setPName('')
    setPCategory('')
  }

  function submitVariant(e) {
    e.preventDefault()
    setFormError('')
    const productId = vProduct || data.products[0]?.id
    if (!productId) {
      setFormError('Add a product family first before adding a variant.')
      return
    }
    if (vBarcode.trim()) {
      const conflict = findVariantByCode(data, vBarcode)
      if (conflict && conflict.barcode?.toLowerCase() === vBarcode.trim().toLowerCase()) {
        setFormError(
          `Code "${vBarcode.trim()}" is already assigned to ${variantLabel(data, conflict)}.`
        )
        return
      }
    }
    actions.addVariant(productId, {
      brand: vBrand,
      vehicle: vVehicle,
      partNo: vPartNo,
      barcode: vBarcode,
      stock: vStock,
      minStock: vMin,
    })
    setVBrand('')
    setVVehicle('')
    setVPartNo('')
    setVBarcode('')
    setVStock('0')
    setVMin('5')
  }

  function handleScanResult({ code }) {
    if (scannerMode === 'field') {
      setVBarcode(code)
      setScanBanner({ tone: 'ok', text: `Captured code ${code} into variant form.` })
      return 'ok'
    }
    const existing = findVariantByCode(data, code)
    if (existing) {
      setScanBanner({
        tone: 'ok',
        text: `Code ${code} is already registered: ${variantLabel(data, existing)} (${existing.stock} in stock).`,
      })
      return 'ok'
    }
    setQuickRegCode(code)
    return 'unknown'
  }

  function openLabelsFor(ids = []) {
    setLabelVariantIds(ids)
    setLabelModalOpen(true)
  }

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Products &amp; Variants</h2>
          <div className="desc">
            Register part families, vehicle compatibility, and unique QR or 1D barcodes once.
          </div>
        </div>
        <div className="page-head-actions">
          <button
            type="button"
            className="quick-action quick-action-secondary"
            onClick={() => openLabelsFor([])}
          >
            Print QR labels
          </button>
          <button
            type="button"
            className="quick-action quick-action-primary"
            onClick={() => {
              setScanBanner(null)
              setScannerMode('register')
            }}
          >
            Scan new box
          </button>
          <div className="sheet-tag">CATALOGUE / {data.variants.length} VARIANTS</div>
        </div>
      </div>

      {scanBanner && (
        <div className={`hint ${scanBanner.tone === 'warn' ? 'danger-hint' : ''}`}>
          {scanBanner.text}
        </div>
      )}

      <div className="grid2">
        <div className="card">
          <div className="card-inner">
            <h2>Create a product</h2>
            <form onSubmit={submitProduct}>
              <label htmlFor="pName">Product name</label>
              <input
                id="pName"
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="e.g. Stabilizer Shaft Rubber"
              />
              <label htmlFor="pCategory">Category</label>
              <input
                id="pCategory"
                value={pCategory}
                onChange={(e) => setPCategory(e.target.value)}
                placeholder="e.g. Suspension, Filtration, Braking"
              />
              <button className="primary" type="submit">
                Add product
              </button>
            </form>

            <DimLine label="Variant Entry" />

            <h2>
              Add a variant <span className="count">to a product</span>
            </h2>
            {formError && <div className="hint danger-hint">{formError}</div>}
            <form onSubmit={submitVariant}>
              <label htmlFor="vProduct">Product</label>
              <select
                id="vProduct"
                value={vProduct}
                onChange={(e) => setVProduct(e.target.value)}
                required
              >
                <option value="">
                  {data.products.length === 0 ? 'Add a product first' : 'Choose a product'}
                </option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
              <label htmlFor="vBrand">Brand / Make of part</label>
              <input
                id="vBrand"
                value={vBrand}
                onChange={(e) => setVBrand(e.target.value)}
                placeholder="e.g. RB1"
              />
              <label htmlFor="vVehicle">Compatible vehicle models</label>
              <input
                id="vVehicle"
                value={vVehicle}
                onChange={(e) => setVVehicle(e.target.value)}
                placeholder="e.g. Honda City VII (CTY VII)"
              />
              <label htmlFor="vPartNo">Part number</label>
              <input
                id="vPartNo"
                value={vPartNo}
                onChange={(e) => setVPartNo(e.target.value)}
                placeholder="e.g. HNS-3309 C"
              />
              <label htmlFor="vBarcode">Unique QR / 1D barcode</label>
              <div className="input-with-actions">
                <input
                  id="vBarcode"
                  value={vBarcode}
                  onChange={(e) => setVBarcode(e.target.value)}
                  placeholder="Scan box code or generate shop QR"
                />
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setScannerMode('field')}
                >
                  Scan
                </button>
                <button
                  type="button"
                  className="ghost"
                  onClick={() => setVBarcode(generateShopBarcode(data.variants))}
                >
                  Generate
                </button>
              </div>
              <div className="row">
                <div>
                  <label htmlFor="vStock">Opening stock</label>
                  <input
                    id="vStock"
                    type="number"
                    min="0"
                    value={vStock}
                    onChange={(e) => setVStock(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="vMin">Low stock below</label>
                  <input
                    id="vMin"
                    type="number"
                    min="0"
                    value={vMin}
                    onChange={(e) => setVMin(e.target.value)}
                  />
                </div>
              </div>
              <button className="primary" type="submit">
                Add variant
              </button>
            </form>
          </div>
        </div>

        <div className="card">
          <div className="card-inner">
            <h2>
              Parts register <span className="count">({data.variants.length})</span>
            </h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Brand</th>
                    <th>Vehicle Fit</th>
                    <th>Part No.</th>
                    <th>QR / Barcode</th>
                    <th className="num">Stock</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.variants.length === 0 && (
                    <tr>
                      <td colSpan={7}>
                        <div className="empty">
                          No variants yet. Click <b>Scan new box</b> or fill out the form on the
                          left.
                        </div>
                      </td>
                    </tr>
                  )}
                  {data.variants
                    .slice()
                    .reverse()
                    .map((v) => {
                      const product = data.products.find((p) => p.id === v.productId)
                      return (
                        <tr key={v.id}>
                          <td className="tname">{product ? product.name : '—'}</td>
                          <td>{v.brand || '—'}</td>
                          <td>{v.vehicle || '—'}</td>
                          <td className="mono">{v.partNo || '—'}</td>
                          <td>
                            {v.barcode ? (
                              <span className="code-pill mono">{v.barcode}</span>
                            ) : (
                              <button
                                type="button"
                                className="ghost"
                                onClick={() =>
                                  actions.updateVariantBarcode(
                                    v.id,
                                    generateShopBarcode(data.variants)
                                  )
                                }
                              >
                                + Shop QR
                              </button>
                            )}
                          </td>
                          <td className="num">{v.stock}</td>
                          <td>
                            <div className="row-actions">
                              <button
                                type="button"
                                className="ghost"
                                onClick={() => openLabelsFor([v.id])}
                              >
                                QR Label
                              </button>
                              <button
                                type="button"
                                className="ghost"
                                onClick={() => {
                                  if (
                                    confirm(
                                      'Remove this variant? Purchase/sale history for it will remain but it will disappear from lists.'
                                    )
                                  ) {
                                    actions.removeVariant(v.id)
                                  }
                                }}
                              >
                                Remove
                              </button>
                            </div>
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
        open={Boolean(scannerMode)}
        mode="single"
        title={
          scannerMode === 'field'
            ? 'Capture Part QR or Barcode'
            : 'Scan Part Box to Register'
        }
        subtitle="Scan the unique QR code or 1D barcode on the box."
        onScan={handleScanResult}
        onClose={() => setScannerMode(null)}
      />

      <QuickRegisterModal
        open={Boolean(quickRegCode)}
        scannedCode={quickRegCode}
        data={data}
        actions={actions}
        allowOpeningStock
        onRegistered={(variantId, code) => {
          setQuickRegCode('')
          setScanBanner({
            tone: 'ok',
            text: `Saved part under code ${code}. You can now print its QR label or scan it in Stock In / Out.`,
          })
          return variantId
        }}
        onClose={() => setQuickRegCode('')}
      />

      <QRLabelModal
        open={labelModalOpen}
        data={data}
        actions={actions}
        initialVariantIds={labelVariantIds}
        onClose={() => setLabelModalOpen(false)}
      />
    </div>
  )
}
