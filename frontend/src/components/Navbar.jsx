import { useState, useEffect } from 'react'
import { checkHealth } from '../services/api'

const NAV_ITEMS = [
  { id: 'dashboard',  icon: '◈', label: 'Dashboard' },
  { id: 'upload',     icon: '↑', label: 'Import' },
  { id: 'editor',     icon: '✎', label: 'Editor' },
  { id: 'findings',   icon: '◉', label: 'Findings' },
  { id: 'preview',    icon: '⊙', label: 'Preview' },
]

export default function Navbar({ activePage, setPage, findingCount, meta }) {
  const [apiOk, setApiOk] = useState(null)

  useEffect(() => {
    checkHealth()
      .then(() => setApiOk(true))
      .catch(() => setApiOk(false))
  }, [])

  return (
    <aside style={{
      width: 200,
      background: 'var(--bg2)',
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      flexShrink: 0,
      padding: '14px 0',
    }}>
      {/* Logo */}
      <div style={{ padding: '8px 18px 20px', borderBottom: '1px solid var(--border)', marginBottom: 10 }}>
        <div style={{ fontFamily: 'Orbitron, sans-serif', fontSize: 12, fontWeight: 700, color: 'var(--cyan)', letterSpacing: 1 }}>
          ⬡ VAPT SYSTEM
        </div>
        <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 3 }}>Report Automation v2.0</div>
      </div>

      {/* Nav items */}
      {NAV_ITEMS.map(item => {
        const isActive = activePage === item.id
        return (
          <button
            key={item.id}
            onClick={() => setPage(item.id)}
            style={{
              background: isActive ? '#00d4ff0d' : 'transparent',
              border: 'none',
              borderLeft: `2px solid ${isActive ? 'var(--cyan)' : 'transparent'}`,
              color: isActive ? 'var(--cyan)' : 'var(--dim)',
              padding: '10px 18px',
              textAlign: 'left',
              cursor: 'pointer',
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 12,
              letterSpacing: 0.3,
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              transition: 'all 0.12s',
            }}
          >
            <span style={{ fontSize: 14, width: 16, textAlign: 'center' }}>{item.icon}</span>
            <span style={{ fontWeight: isActive ? 600 : 400 }}>{item.label}</span>
            {item.id === 'findings' && findingCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: 'var(--cyan-dim)',
                color: 'var(--cyan)',
                padding: '1px 7px',
                borderRadius: 10,
                fontSize: 10,
                fontWeight: 700,
              }}>
                {findingCount}
              </span>
            )}
          </button>
        )
      })}

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* API Status */}
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)' }}>
        {meta?.client_name && (
          <div style={{ fontSize: 10, color: 'var(--text)', marginBottom: 8, fontWeight: 600 }}>
            {meta.client_name}
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10 }}>
          <span style={{
            width: 7,
            height: 7,
            borderRadius: '50%',
            background: apiOk === null ? 'var(--dim)' : apiOk ? 'var(--green)' : 'var(--red)',
            display: 'inline-block',
            flexShrink: 0,
          }} />
          <span style={{ color: 'var(--dim)' }}>
            {apiOk === null ? 'Checking API...' : apiOk ? 'API Connected' : 'API Offline'}
          </span>
        </div>
        <div style={{ fontSize: 9, color: 'var(--muted)', marginTop: 6 }}>localhost:8000</div>
      </div>
    </aside>
  )
}
