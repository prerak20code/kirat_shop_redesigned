import { useState } from 'react'
import Sidebar from './components/Sidebar'
import InventoryPage from './pages/InventoryPage'
import CatalogPage from './pages/CatalogPage'
import SuppliersPage from './pages/SuppliersPage'
import BuyersPage from './pages/BuyersPage'
import StockInPage from './pages/StockInPage'
import StockOutPage from './pages/StockOutPage'
import { useShopData } from './hooks/useShopData'
import { todayStr } from './lib/format'

const PAGE_META = {
  inventory: { label: 'Inventory', group: 'Overview', number: '01' },
  catalog: { label: 'Products & variants', group: 'Catalogue', number: '02' },
  suppliers: { label: 'Suppliers', group: 'People', number: '03' },
  buyers: { label: 'Buyers', group: 'People', number: '04' },
  stockin: { label: 'Stock in', group: 'Transactions', number: '05' },
  stockout: { label: 'Stock out', group: 'Transactions', number: '06' },
}

function SaveIndicator({ status }) {
  const labels = {
    loading: 'Loading workspace',
    ready: 'Workspace ready',
    saving: 'Saving changes',
    saved: 'Saved locally',
    err: 'Save failed',
  }
  return (
    <div className={`save-indicator status-${status}`} role="status" aria-live="polite">
      <span className="save-indicator-dot" />
      <span>{labels[status] || 'Workspace ready'}</span>
    </div>
  )
}

export default function App() {
  const [activeTab, setActiveTab] = useState('inventory')
  const { data, saveStatus, actions } = useShopData()
  const meta = PAGE_META[activeTab] || PAGE_META.inventory

  return (
    <div className="shell">
      <Sidebar activeTab={activeTab} onChangeTab={setActiveTab} saveStatus={saveStatus} />
      <main className="app">
        <header className="topbar">
          <div className="topbar-context">
            <div className="breadcrumb"><span>WORKSPACE</span><span className="breadcrumb-slash">/</span><strong>{meta.group}</strong></div>
            <div className="topbar-page"><span className="page-index">{meta.number}</span>{meta.label}</div>
          </div>
          <div className="topbar-actions">
            <div className="topbar-date"><span className="calendar-icon" aria-hidden="true">▦</span><span>{new Date(`${todayStr()}T12:00:00`).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span></div>
            <div className="topbar-divider" />
            <SaveIndicator status={saveStatus} />
            <div className="topbar-divider topbar-divider-actions" />
            <button type="button" className="quick-action quick-action-secondary" onClick={() => setActiveTab('stockin')}>
              <span className="quick-action-symbol">↓</span><span>Receive stock</span>
            </button>
            <button type="button" className="quick-action quick-action-primary" onClick={() => setActiveTab('stockout')}>
              <span className="quick-action-symbol">↗</span><span>Record sale</span>
            </button>
          </div>
        </header>
        <div className="page-stage" key={activeTab}>
          {activeTab === 'inventory' && <InventoryPage data={data} />}
          {activeTab === 'catalog' && <CatalogPage data={data} actions={actions} />}
          {activeTab === 'suppliers' && <SuppliersPage data={data} actions={actions} />}
          {activeTab === 'buyers' && <BuyersPage data={data} actions={actions} />}
          {activeTab === 'stockin' && <StockInPage data={data} actions={actions} />}
          {activeTab === 'stockout' && <StockOutPage data={data} actions={actions} />}
        </div>
        <footer className="app-footer">
          <span><span className="footer-mark" /> PARTS LEDGER <span className="footer-muted">/ OPERATIONS WORKSPACE</span></span>
          <span>LOCAL DATA · {todayStr()}</span>
        </footer>
      </main>
    </div>
  )
}
