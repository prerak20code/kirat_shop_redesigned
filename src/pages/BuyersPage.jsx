import { useState } from 'react'
import { RegMark } from '../components/Bits'
import { buyerAvgPrice } from '../lib/calculations'
import { money } from '../lib/format'

export default function BuyersPage({ data, actions }) {
  const [name, setName] = useState('')
  const [contact, setContact] = useState('')

  function submit(e) {
    e.preventDefault()
    if (!name.trim()) return
    actions.addBuyer(name, contact)
    setName('')
    setContact('')
  }

  return (
    <div className="sheet">
      <RegMark corner="tl" />
      <RegMark corner="tr" />
      <div className="page-head">
        <div>
          <h2 className="title">Buyers</h2>
          <div className="desc">Keep customer details and a quick reference to sale history in one place.</div>
        </div>
        <div className="sheet-tag">DIRECTORY / {data.buyers.length} BUYERS</div>
      </div>

      <div className="grid2">
        <div className="card">
          <div className="card-inner">
            <h2>Add a buyer</h2>
            <form onSubmit={submit}>
              <label htmlFor="bName">Name</label>
              <input id="bName" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sharma Motors" />
              <label htmlFor="bContact">Contact</label>
              <input id="bContact" value={contact} onChange={(e) => setContact(e.target.value)} placeholder="Phone / address (optional)" />
              <button className="primary" type="submit">Add buyer</button>
            </form>
          </div>
        </div>
        <div className="card">
          <div className="card-inner">
            <h2>Buyer directory <span className="count">({data.buyers.length})</span></h2>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Contact</th><th className="num">Bought</th><th className="num">Weighted avg. price</th><th></th></tr>
                </thead>
                <tbody>
                  {data.buyers.length === 0 && (
                    <tr><td colSpan={5}><div className="empty">No buyers yet.</div></td></tr>
                  )}
                  {data.buyers.slice().reverse().map((b) => {
                    const list = data.sales.filter((s) => s.buyerId === b.id)
                    const avg = buyerAvgPrice(data, b.id)
                    return (
                      <tr key={b.id}>
                        <td className="tname">{b.name}</td>
                        <td>{b.contact || '—'}</td>
                        <td className="num">{list.length}</td>
                        <td className="num">{avg !== null ? money(avg) : '—'}</td>
                        <td>
                          <button
                            className="ghost"
                            onClick={() => confirm('Remove this buyer?') && actions.removeBuyer(b.id)}
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
