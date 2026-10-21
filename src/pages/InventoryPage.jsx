import { useState } from 'react'
import { RegMark, Badge } from '../components/Bits'
import Gauge from '../components/Gauge'
import HeroDiagram from '../components/HeroDiagram'
import { lastPurchaseFor, lastSaleFor, stockStatus, inventoryStats } from '../lib/calculations'
import { money } from '../lib/format'

const STATUS_LABEL = { danger: 'Out of stock', warn: 'Low stock', good: 'In stock' }

export default function InventoryPage({ data }) {
  const [search, setSearch] = useState('')
  const { total, low, out } = inventoryStats(data)
  const units = data.variants.reduce((sum, variant) => sum + Math.max(0, Number(variant.stock) || 0), 0)

  const q = search.trim().toLowerCase()
  const rows = data.variants.filter((v) => {
    if (!q) return true
    const product = data.products.find((p) => p.id === v.productId)
    const hay = [product ? product.name : '', v.brand, v.vehicle, v.partNo].join(' ').toLowerCase()
    return hay.includes(q)
  })

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />

      <div className="page-head">
        <div>
          <h2 className="title">Inventory overview</h2>
          <div className="desc">A clear view of every tracked part, its stock position and latest pricing.</div>
        </div>
        <div className="sheet-tag">STOCK REGISTER / LIVE VIEW</div>
      </div>

      <section className="hero-card" aria-label="Inventory overview introduction">
        <div className="hero-flex">
          <div className="hero-copy">
            <div className="eyebrow">YOUR STOCKROOM, AT A GLANCE</div>
            <h3>Know what's on the shelf.</h3>
            <p>Each variant is tracked as its own SKU. See available units, spot replenishment needs and compare the latest purchase and sale prices without hunting through records.</p>
          </div>
          <div className="hero-svg-wrap" aria-hidden="true"><HeroDiagram /></div>
        </div>
      </section>

      <div className="pillrow" aria-label="Inventory metrics">
        <div className="stat st-accent">
          <div className="v">{total.toLocaleString('en-IN')}</div>
          <div className="l">Tracked variants</div>
          <div className="stat-note">Distinct part configurations</div>
        </div>
        <div className="stat">
          <div className="v">{units.toLocaleString('en-IN')}</div>
          <div className="l">Units on hand</div>
          <div className="stat-note">Across positive stock balances</div>
        </div>
        <div className="stat st-amber">
          <div className="v">{low.toLocaleString('en-IN')}</div>
          <div className="l">Low stock</div>
          <div className="stat-note">At or below the set threshold</div>
        </div>
        <div className="stat st-danger">
          <div className="v">{out.toLocaleString('en-IN')}</div>
          <div className="l">Out of stock</div>
          <div className="stat-note">Needs replenishment</div>
        </div>
      </div>

      <div className="card inventory-table-card">
        <div className="card-inner">
          <div className="table-section-head">
            <div>
              <h2 className="table-title">Parts register <span className="count">{rows.length} of {data.variants.length}</span></h2>
              <p>Stock health and most recent transaction prices by variant.</p>
            </div>
            <span className="table-caption">SKU LEVEL DETAIL</span>
          </div>
          <div className="searchbar">
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search inventory"
              placeholder="Search by part, brand, vehicle or part number"
            />
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Part / variant</th>
                  <th>Vehicle fit</th>
                  <th>Part number</th>
                  <th>Stock level</th>
                  <th>Status</th>
                  <th className="num">Last cost</th>
                  <th className="num">Last sold</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <div className="empty">
                        {total === 0 ? (
                          <>Your register is ready. Add a product and its first variant in <b>Parts catalogue</b> to get started.</>
                        ) : (
                          'No parts match this search. Try a different term.'
                        )}
                      </div>
                    </td>
                  </tr>
                )}
                {rows.map((v) => {
                  const product = data.products.find((p) => p.id === v.productId)
                  const status = stockStatus(v)
                  const lastP = lastPurchaseFor(data, v.id)
                  const lastS = lastSaleFor(data, v.id)
                  return (
                    <tr key={v.id}>
                      <td>
                        <div className="tname">
                          {product ? product.name : 'Unknown product'}
                          {v.brand && <span className="variant-brand">{v.brand}</span>}
                        </div>
                        {v.partNo && <div className="tsub mono">{v.partNo}</div>}
                      </td>
                      <td>{v.vehicle || <span className="muted-cell">Not specified</span>}</td>
                      <td className="mono">{v.partNo || '—'}</td>
                      <td>
                        <div className="gaugewrap">
                          <Gauge stock={v.stock} minStock={v.minStock} status={status} />
                          <div>
                            <div className="gauge-num">{v.stock}</div>
                            <div className="gauge-unit">UNITS</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge status={status}>{STATUS_LABEL[status]}</Badge></td>
                      <td className="num">{lastP ? money(lastP.cost) : '—'}</td>
                      <td className="num">{lastS ? money(lastS.price) : '—'}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
