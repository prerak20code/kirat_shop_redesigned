import { BrandMark } from './Bits'
import { todayStr } from '../lib/format'

const TABS = [
  { key: 'inventory', no: '01', label: 'Overview', group: 'WORKSPACE', icon: 'grid' },
  { key: 'catalog', no: '02', label: 'Parts catalogue', group: 'WORKSPACE', icon: 'package' },
  { key: 'suppliers', no: '03', label: 'Suppliers', group: 'CONTACTS', icon: 'truck' },
  { key: 'buyers', no: '04', label: 'Buyers', group: 'CONTACTS', icon: 'users' },
  { key: 'stockin', no: '05', label: 'Stock in', group: 'MOVEMENTS', icon: 'arrowDown' },
  { key: 'stockout', no: '06', label: 'Stock out', group: 'MOVEMENTS', icon: 'arrowUp' },
]

const ICONS = {
  grid: <><rect x="3.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="3.5" width="7" height="7" rx="1.5"/><rect x="3.5" y="13.5" width="7" height="7" rx="1.5"/><rect x="13.5" y="13.5" width="7" height="7" rx="1.5"/></>,
  package: <><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z"/><path d="m4.5 7.8 7.5 4.4 7.5-4.4M12 12.2V21M8 5.2l8 4.5"/></>,
  truck: <><path d="M3 6h11v11H3z"/><path d="M14 10h4l3 3v4h-7z"/><circle cx="7.5" cy="18" r="2"/><circle cx="17.5" cy="18" r="2"/></>,
  users: <><circle cx="9" cy="8" r="3"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.5a3 3 0 0 1 0 5.8M17 14a4.4 4.4 0 0 1 3.5 4.3"/></>,
  arrowDown: <><path d="M12 3v13"/><path d="m7 11 5 5 5-5"/><path d="M4 21h16"/></>,
  arrowUp: <><path d="M12 21V8"/><path d="m7 13 5-5 5 5"/><path d="M4 3h16"/></>,
}

function NavIcon({ name }) {
  return <svg className="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICONS[name]}</svg>
}

export default function Sidebar({ activeTab, onChangeTab, saveStatus }) {
  const groups = [...new Set(TABS.map((t) => t.group))]
  const statusLabel = saveStatus === 'saving' ? 'Saving changes' : saveStatus === 'err' ? 'Could not save' : saveStatus === 'loading' ? 'Loading data' : saveStatus === 'ready' ? 'Workspace ready' : 'Changes saved'

  return (
    <aside className="rail">
      <div className="rail-head">
        <div className="brand">
          <div className="brand-icon-wrap"><BrandMark /></div>
          <div className="brand-copy">
            <span className="brand-kicker">AUTO PARTS OPERATIONS</span>
            <h1>Parts<span>Ledger</span></h1>
          </div>
        </div>
      </div>

      <div className="workspace-card">
        <div className="workspace-orb"><span /></div>
        <div className="workspace-copy">
          <span className="workspace-label">CURRENT WORKSPACE</span>
          <strong>Shop floor</strong>
          <span className="workspace-meta">Local inventory register</span>
        </div>
        <span className="workspace-menu" aria-hidden="true">•••</span>
      </div>

      <nav className="tabs" aria-label="Main navigation">
        {groups.map((group) => (
          <div className="nav-group" key={group}>
            <div className="nav-group-label">{group}</div>
            {TABS.filter((t) => t.group === group).map((t) => (
              <button
                type="button"
                key={t.key}
                className={t.key === activeTab ? 'active' : ''}
                onClick={() => onChangeTab(t.key)}
                aria-current={t.key === activeTab ? 'page' : undefined}
              >
                <span className="nav-icon-wrap"><NavIcon name={t.icon} /></span>
                <span className="nav-label">{t.label}</span>
                <span className="sheetno">{t.no}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="rail-spacer" />
      <div className="rail-note">
        <div className="rail-note-mark">PL<span>·</span></div>
        <div><strong>Small parts. Clear books.</strong><span>Inventory made accountable.</span></div>
      </div>
      <div className="rail-foot">
        <div className={`rail-save-dot ${saveStatus === 'saving' ? 'is-saving' : saveStatus === 'err' ? 'is-error' : ''}`} />
        <span>{statusLabel}</span>
        <span className="rail-foot-date">{todayStr()}</span>
      </div>
    </aside>
  )
}
