import { useState } from 'react'
import { RegMark, DimLine } from '../components/Bits'

export default function CatalogPage({ data, actions }) {
  const [pName, setPName] = useState('')
  const [pCategory, setPCategory] = useState('')

  const [vProduct, setVProduct] = useState('')
  const [vBrand, setVBrand] = useState('')
  const [vVehicle, setVVehicle] = useState('')
  const [vPartNo, setVPartNo] = useState('')
  const [vStock, setVStock] = useState('0')
  const [vMin, setVMin] = useState('5')

  function submitProduct(e) {
    e.preventDefault()
    if (!pName.trim()) return
    actions.addProduct(pName, pCategory)
    setPName('')
    setPCategory('')
  }

  function submitVariant(e) {
    e.preventDefault()
    const productId = vProduct || data.products[0]?.id
    if (!productId) {
      alert('Add a product first.')
      return
    }
    actions.addVariant(productId, { brand: vBrand, vehicle: vVehicle, partNo: vPartNo, stock: vStock, minStock: vMin })
    setVBrand('')
    setVVehicle('')
    setVPartNo('')
    setVStock('0')
    setVMin('5')
  }

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Products &amp; Variants</h2>
          <div className="desc">Manage product families and the exact part configurations you keep on the shelf.</div>
        </div>
        <div className="sheet-tag">CATALOGUE / {data.variants.length} VARIANTS</div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-inner">
            <h2>Create a product</h2>
            <form onSubmit={submitProduct}>
              <label htmlFor="pName">Product name</label>
              <input id="pName" value={pName} onChange={(e) => setPName(e.target.value)} placeholder="e.g. Air Filter" />
              <label htmlFor="pCategory">Category</label>
              <input id="pCategory" value={pCategory} onChange={(e) => setPCategory(e.target.value)} placeholder="e.g. Filtration, Braking, Electrical" />
              <button className="primary" type="submit">Add product</button>
            </form>

            <DimLine label="Variant Entry" />

            <h2>
              Add a variant <span className="count">to a product</span>
            </h2>
            <form onSubmit={submitVariant}>
              <label htmlFor="vProduct">Product</label>
              <select id="vProduct" value={vProduct} onChange={(e) => setVProduct(e.target.value)} required>
                <option value="">{data.products.length === 0 ? 'Add a product first' : 'Choose a product'}</option>
                {data.products.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <label htmlFor="vBrand">Brand / Make of part</label>
              <input id="vBrand" value={vBrand} onChange={(e) => setVBrand(e.target.value)} placeholder="e.g. Bosch" />
              <label htmlFor="vVehicle">Compatible vehicle</label>
              <input id="vVehicle" value={vVehicle} onChange={(e) => setVVehicle(e.target.value)} placeholder="e.g. Suzuki Swift 2020–2022" />
              <label htmlFor="vPartNo">Part number</label>
              <input id="vPartNo" value={vPartNo} onChange={(e) => setVPartNo(e.target.value)} placeholder="e.g. BOS-AF-2201" />
              <div className="row">
                <div>
                  <label htmlFor="vStock">Opening stock</label>
                  <input id="vStock" type="number" min="0" value={vStock} onChange={(e) => setVStock(e.target.value)} />
                </div>
                <div>
                  <label htmlFor="vMin">Low stock below</label>
                  <input id="vMin" type="number" min="0" value={vMin} onChange={(e) => setVMin(e.target.value)} />
                </div>
              </div>
              <button className="primary" type="submit">Add variant</button>
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
                    <th>Product</th><th>Brand</th><th>Vehicle Fit</th><th>Part No.</th><th className="num">Stock</th><th></th>
                  </tr>
                </thead>
                <tbody>
                  {data.variants.length === 0 && (
                    <tr><td colSpan={6}><div className="empty">No variants yet.</div></td></tr>
                  )}
                  {data.variants.slice().reverse().map((v) => {
                    const product = data.products.find((p) => p.id === v.productId)
                    return (
                      <tr key={v.id}>
                        <td className="tname">{product ? product.name : '—'}</td>
                        <td>{v.brand || '—'}</td>
                        <td>{v.vehicle || '—'}</td>
                        <td className="mono">{v.partNo || '—'}</td>
                        <td className="num">{v.stock}</td>
                        <td>
                          <button
                            className="ghost"
                            onClick={() => {
                              if (confirm('Remove this variant? Purchase/sale history for it will remain but it will disappear from lists.')) {
                                actions.removeVariant(v.id)
                              }
                            }}
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
      </div>
    </div>
  )
}
