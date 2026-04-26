import { useState, useEffect } from 'react'
import { checkHealth } from '../services/api'

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '◈', label: 'Dashboard' },
  { id: 'upload',     icon: '↑', label: 'Import' },
  { id: 'editor',     icon: '✎', label: 'Editor' },
  { id: 'findings',   icon: '◉', label: 'Findings' },
  { id: 'preview',    icon: '⊙', label: 'Preview' },
]

export default function Navbar({ activePage, setPage, findingCount, meta, authUser }) {
  const [apiOk, setApiOk] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false))
  }, [])

  return (
    <aside className="app-sidebar">

      {/* Nav items */}
      {[...NAV_ITEMS, ...(authUser?.role === 'admin' ? [{ id: 'admin', icon: '⚙', label: 'Admin' }] : []), { id: 'reports', icon: '☁', label: 'Cloud Reports' }].map(item => {
        const isActive = activePage === item.id
        return (
          <button
            key={item.id}
            className={`nav-btn ${isActive ? 'active' : ''}`}
            onClick={() => setPage(item.id)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label" style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            {item.id === 'findings' && findingCount > 0 && (
              <span className="nav-badge">
                {findingCount}
              </span>
            )}
          </button>
        )
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* API Status */}
      <div className="sidebar-footer">
        {meta?.client_name && (
          <div className="sidebar-client">{meta.client_name}</div>
        )}
        <div className="api-status">
          <span className={`api-dot ${apiOk === null ? 'checking' : apiOk ? 'online' : 'offline'}`} />
          <span className="api-text">
            {apiOk === null ? 'Checking API...' : apiOk ? 'API Connected' : 'API Offline'}
          </span>
        </div>
      </div>
    </aside>
  )
}
