import { useState, useEffect } from 'react'
import { getReportsFromDB, loadReportFromDB, deleteReportFromDB, updateReportStatus, exportHTML } from '../services/api'

const STATUS_STYLE = {
  approved:         { badge: 'sev-low',    label: 'APPROVED' },
  needs_change:     { badge: 'sev-high',   label: 'NEEDS CHANGE' },
  pending_approval: { badge: 'sev-medium', label: 'PENDING APPROVAL' },
  draft:            { badge: '',           label: 'DRAFT' },
}

export default function ReportsManager({ onEditReport, toast, authUser }) {
  const [reports,    setReports]    = useState([])
  const [loading,    setLoading]    = useState(true)
  const [previewHtml, setPreviewHtml] = useState(null)
  const [previewTitle, setPreviewTitle] = useState('')
  const [previewLoading, setPreviewLoading] = useState(null) // report id being previewed

  const fetchReports = async () => {
    setLoading(true)
    try {
      const data = await getReportsFromDB()
      setReports(data)
    } catch {
      toast('Failed to load reports', 'error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchReports() }, [])

  const handleEdit = async (id) => {
    try {
      const data = await loadReportFromDB(id)
      onEditReport(id, data.meta, data.findings, data.status)
    } catch {
      toast('Failed to load report', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this report permanently?')) return
    try {
      await deleteReportFromDB(id)
      toast('Report deleted ✓')
      fetchReports()
    } catch {
      toast('Failed to delete report', 'error')
    }
  }

  const handleStatusUpdate = async (id, status) => {
    try {
      await updateReportStatus(id, status)
      toast('Status updated ✓')
      fetchReports()
    } catch {
      toast('Failed to update status', 'error')
    }
  }

  const handlePreview = async (r) => {
    setPreviewLoading(r.id)
    try {
      const data = await loadReportFromDB(r.id)
      const stats = computeStats(data.findings || [])
      const html = await exportHTML({ report: data.meta, findings: data.findings, finding_stats: stats })
      setPreviewTitle(`${r.client_name} — ${r.project_id}`)
      setPreviewHtml(html)
    } catch {
      toast('Failed to generate preview', 'error')
    } finally {
      setPreviewLoading(null)
    }
  }

  const isAdmin = authUser?.role === 'admin'

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center', color: 'var(--dim)' }}><span className="spinner" /> Loading reports...</div>
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-20">
        <div className="page-title" style={{ marginBottom: 0 }}>
          {isAdmin ? '☁ All Cloud Reports' : '☁ My Cloud Reports'}
        </div>
        <button className="btn btn-sm" onClick={fetchReports}>↻ Refresh</button>
      </div>

      {/* Report list */}
      {reports.length === 0 ? (
        <div className="card" style={{ color: 'var(--dim)', fontSize: 13, padding: 32, textAlign: 'center' }}>
          No reports saved yet.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {reports.map(r => {
            const st = STATUS_STYLE[r.status] || STATUS_STYLE.draft
            const isPending = r.status === 'pending_approval'
            return (
              <div key={r.id} className="card" style={{ padding: '14px 18px' }}>
                {/* Top row: info + status */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 12 }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 3 }}>
                      {r.client_name}
                    </div>
                    <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 11, color: 'var(--dim)' }}>
                      <span style={{ fontFamily: 'Share Tech Mono, monospace', color: 'var(--cyan)' }}>{r.project_id}</span>
                      {isAdmin && <span>👤 {r.username}</span>}
                      <span>🕒 {new Date(r.updated_at).toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={`sev-badge ${st.badge}`} style={{ fontSize: 9, flexShrink: 0 }}>
                    {st.label}
                  </span>
                </div>

                {/* Bottom row: action buttons — grouped cleanly */}
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', borderTop: '1px solid var(--border)', paddingTop: 10 }}>

                  {/* Admin-only: Approve / Needs Change — shown only for pending */}
                  {isAdmin && isPending && (
                    <>
                      <button
                        className="btn btn-sm"
                        style={{ color: 'var(--green)', borderColor: 'var(--green)', fontWeight: 600 }}
                        onClick={() => handleStatusUpdate(r.id, 'approved')}
                      >
                        ✓ Approve
                      </button>
                      <button
                        className="btn btn-sm"
                        style={{ color: 'var(--red)', borderColor: 'var(--red)', fontWeight: 600 }}
                        onClick={() => handleStatusUpdate(r.id, 'needs_change')}
                      >
                        ✕ Needs Change
                      </button>
                      <div style={{ width: 1, background: 'var(--border)', margin: '0 4px' }} />
                    </>
                  )}

                  {/* Admin-only: HTML Preview */}
                  {isAdmin && (
                    <button
                      className="btn btn-sm"
                      style={{ color: 'var(--cyan)', borderColor: 'var(--cyan)' }}
                      onClick={() => handlePreview(r)}
                      disabled={previewLoading === r.id}
                    >
                      {previewLoading === r.id ? <span className="spinner" /> : '⊙'} Preview
                    </button>
                  )}

                  {/* Edit (all roles) */}
                  <button className="btn btn-sm" onClick={() => handleEdit(r.id)}>
                    ✎ Edit
                  </button>

                  {/* Delete (all roles) */}
                  <button
                    className="btn btn-sm"
                    style={{ borderColor: '#ff444466', color: 'var(--red)' }}
                    onClick={() => handleDelete(r.id)}
                  >
                    ✕ Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* HTML Preview Modal */}
      {previewHtml && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000,
          background: 'rgba(0,0,0,0.75)',
          display: 'flex', flexDirection: 'column',
        }}>
          {/* Modal header */}
          <div style={{
            background: 'var(--bg2)', borderBottom: '1px solid var(--border)',
            padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0,
          }}>
            <div>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>⊙ Report Preview</span>
              <span style={{ fontSize: 11, color: 'var(--dim)', marginLeft: 12 }}>{previewTitle}</span>
            </div>
            <button
              className="btn btn-sm"
              style={{ borderColor: 'var(--red)', color: 'var(--red)' }}
              onClick={() => setPreviewHtml(null)}
            >
              ✕ Close
            </button>
          </div>

          {/* Modal iframe */}
          <iframe
            srcDoc={previewHtml}
            style={{ flex: 1, border: 'none', background: '#fff' }}
            title="Report HTML Preview"
            sandbox="allow-same-origin allow-scripts"
          />
        </div>
      )}
    </div>
  )
}

// Helper to compute stats for export payload
function computeStats(findings) {
  const active = findings.filter(f => !f.false_positive)
  return {
    count_critical: active.filter(f => f.cvss?.level === 'critical').length,
    count_high:     active.filter(f => f.cvss?.level === 'high').length,
    count_medium:   active.filter(f => f.cvss?.level === 'medium').length,
    count_low:      active.filter(f => f.cvss?.level === 'low').length,
    count_info:     active.filter(f => f.cvss?.level === 'info').length,
    total:          active.length,
  }
}
