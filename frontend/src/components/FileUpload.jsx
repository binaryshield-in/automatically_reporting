import { useState, useRef, useCallback } from 'react'
import { importCSV, importJSON, importPDF } from '../services/api'

const SEV_ORDER = { critical: 0, high: 1, medium: 2, low: 3, info: 4 }

const FORMAT_DOCS = [
  {
    label: 'Nessus CSV',
    color: 'var(--orange)',
    fields: 'Risk · Name · Synopsis · Description · Solution · CVSS v2 Base Score · Plugin Output · Host · See Also',
  },
  {
    label: 'OpenVAS CSV',
    color: 'var(--green)',
    fields: 'Severity · NVT Name · Specific Result · Solution · CVSS Base Score · Host',
  },
  {
    label: 'Burp Suite CSV',
    color: 'var(--purple)',
    fields: 'Issue name · Severity · Issue detail · Remediation background · URL · References',
  },
  {
    label: 'Generic JSON',
    color: 'var(--cyan)',
    fields: 'Array or {findings:[]} with: title, severity, description, recommendation, cvss.score',
  },
  {
    label: 'PDF Report',
    color: 'var(--red)',
    fields: 'Heuristic extraction — works best on structured reports with numbered findings',
  },
]

export default function FileUpload({ onImport, toast }) {
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)   // { name, count, findings, warnings }
  const fileRef = useRef()

  const process = useCallback(async (file) => {
    const ext = file.name.split('.').pop().toLowerCase()
    setLoading(true)
    setPreview(null)
    try {
      let result
      if (ext === 'csv') result = await importCSV(file)
      else if (ext === 'json') result = await importJSON(file)
      else if (ext === 'pdf') result = await importPDF(file)
      else {
        toast('Unsupported format — use .csv, .json, or .pdf', 'error')
        return
      }
      if (!result.count) {
        toast(`No findings extracted from ${file.name}. ${result.warnings?.[0] || ''}`, 'warn')
        return
      }
      setPreview({ name: file.name, count: result.count, findings: result.findings, warnings: result.warnings || [] })
      toast(`Extracted ${result.count} findings from ${file.name}`)
    } catch (err) {
      toast(err?.response?.data?.detail || 'Upload failed — is the backend running?', 'error')
    } finally {
      setLoading(false)
    }
  }, [toast])

  const onDrop = useCallback(e => {
    e.preventDefault()
    setDrag(false)
    const file = e.dataTransfer.files[0]
    if (file) process(file)
  }, [process])

  const confirm = (mode) => {
    onImport(preview.findings, mode)
    const verb = mode === 'replace' ? 'Replaced all with' : 'Merged'
    toast(`${verb} ${preview.findings.length} findings`)
    setPreview(null)
  }

  return (
    <div>
      <div className="page-title">↑ Import Vulnerability Data</div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setDrag(true) }}
        onDragLeave={() => setDrag(false)}
        onDrop={onDrop}
        onClick={() => fileRef.current?.click()}
        className="card"
        style={{
          textAlign: 'center',
          cursor: 'pointer',
          padding: '52px 24px',
          marginBottom: 20,
          border: `2px dashed ${drag ? 'var(--cyan)' : 'var(--border)'}`,
          transition: 'border-color 0.15s, background 0.15s',
          background: drag ? '#00d4ff06' : 'var(--bg2)',
        }}
      >
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div className="spinner" style={{ width: 28, height: 28 }} />
            <div style={{ color: 'var(--dim)', fontSize: 12 }}>Parsing file...</div>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 40, color: drag ? 'var(--cyan)' : 'var(--muted)', marginBottom: 14 }}>⬆</div>
            <div style={{ color: 'var(--cyan)', fontWeight: 600, fontSize: 13, marginBottom: 6 }}>
              Drop file here or click to browse
            </div>
            <div style={{ fontSize: 11, color: 'var(--dim)' }}>
              Supports: Nessus CSV · OpenVAS CSV · Burp CSV · JSON · PDF
            </div>
          </>
        )}
        <input
          ref={fileRef}
          type="file"
          accept=".csv,.json,.pdf"
          style={{ display: 'none' }}
          onChange={e => e.target.files[0] && process(e.target.files[0])}
        />
      </div>

      {/* Preview panel */}
      {preview && (
        <div className="card mb-20">
          <div className="flex items-center justify-between mb-16">
            <div>
              <span style={{ color: 'var(--cyan)', fontWeight: 700, fontSize: 13 }}>{preview.name}</span>
              <span style={{ color: 'var(--dim)', fontSize: 11, marginLeft: 14 }}>
                {preview.count} findings extracted
              </span>
            </div>
            <div className="flex gap-8">
              <button className="btn btn-primary btn-sm" onClick={() => confirm('replace')}>
                ↑ Replace All
              </button>
              <button className="btn btn-success btn-sm" onClick={() => confirm('merge')}>
                + Merge
              </button>
              <button className="btn btn-sm" onClick={() => setPreview(null)}>✕</button>
            </div>
          </div>

          {preview.warnings.map((w, i) => (
            <div key={i} className="warn-banner mb-12">{w}</div>
          ))}

          <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--border)', borderRadius: 6 }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th style={{ width: 36 }}>#</th>
                  <th>Title</th>
                  <th style={{ width: 90 }}>Severity</th>
                  <th style={{ width: 80 }}>CVSS</th>
                  <th style={{ width: 80 }}>CWE</th>
                  <th style={{ width: 80 }}>Source</th>
                </tr>
              </thead>
              <tbody>
                {preview.findings.map((f, i) => (
                  <tr key={f.id}>
                    <td style={{ color: 'var(--dim)', fontFamily: 'Share Tech Mono, monospace', fontSize: 11 }}>{i + 1}</td>
                    <td className="truncate" style={{ maxWidth: 300 }}>{f.title}</td>
                    <td><span className={`sev-badge sev-${f.cvss?.level}`}>{f.cvss?.level}</span></td>
                    <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: 'var(--dim)' }}>{f.cvss?.score || '—'}</td>
                    <td style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11, color: 'var(--dim)' }}>{f.cwe || '—'}</td>
                    <td style={{ fontSize: 10, color: 'var(--dim)' }}>{f.source}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Format reference */}
      <div className="card">
        <div className="section-label" style={{ marginBottom: 14 }}>Supported Formats</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {FORMAT_DOCS.map(f => (
            <div key={f.label} style={{ borderLeft: `3px solid ${f.color}55`, paddingLeft: 12 }}>
              <div style={{ color: f.color, fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{f.label}</div>
              <div style={{ fontSize: 11, color: 'var(--dim)', lineHeight: 1.7 }}>{f.fields}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
