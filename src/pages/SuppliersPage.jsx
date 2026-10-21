import { useState } from 'react'
import { RegMark } from '../components/Bits'
import { supplierAvgCost } from '../lib/calculations'
import { money } from '../lib/format'

export default function SuppliersPage({ data, actions }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    actions.addSupplier(name, contact)
    setName('')
    setContact('')
  }

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Suppliers</h2>
          <div className="desc">Manage supplier contacts and review purchase activity at a glance.</div>
        </div>
        <div className="sheet-tag">DIRECTORY / {data.suppliers.length} SUPPLIERS</div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-inner">
            <h2>Add a supplier</h2>
            <form onSubmit={submit}>
              <label htmlFor="sName">Name</label>
              <input id="sName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Ludhiana Auto Traders" />
              <label htmlFor="sContact">Contact</label>
              <input id="sContact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone / address (optional)" />
              <button className="primary" type="submit">Add supplier</button>
            </form>
          </div>
        </div>
        <div className="card">
          <div className="card-inner">
            <h2>Supplier directory <span className="count">({data.suppliers.length})</span></h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Contact</th><th className="num">Supplied</th><th className="num">Weighted avg. cost</th><th></th></tr>
                </thead>
                <tbody>
                  {data.suppliers.length === 0 && (
                    <tr><td colSpan={5}><div className="empty">No suppliers yet.</div></td></tr>
                  )}
                  {data.suppliers.slice().reverse().map((s) => {
                    const list = data.purchases.filter((p) => p.supplierId === s.id)
                    const avg = supplierAvgCost(data, s.id)
                    return (
                      <tr key={s.id}>
                        <td className="tname">{s.name}</td>
                        <td>{s.contact || '—'}</td>
                        <td className="num">{list.length}</td>
                        <td className="num">{avg !== null ? money(avg) : '—'}</td>
                        <td>
                          <button
                            className="ghost"
                            onClick={() => confirm('Remove this supplier?') && actions.removeSupplier(s.id)}
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
