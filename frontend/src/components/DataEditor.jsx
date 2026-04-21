import { useState, useCallback } from 'react'

const EMPTY_FINDING = {
  id: '', title: '', summary: '', description: '', impact: '', recommendation: '',
  cvss: { score: 0, vector: '', level: 'medium' },
  ease: 'Moderate', cwe: '',
  affected_components: [], payload: [],
  poc: 'Step 1: Navigate to the affected page\nStep 2: Inject the payload\nStep 3: Observe the successful execution/access',
  references: [],
  validated: false, false_positive: false, source: 'manual',
  evidence_images: [],
}

const SEV_COLORS = { critical: '#e60000', high: '#ff7a00', medium: '#ffcc00', low: '#6b1c4f', info: '#6e6e6e' }

function genId() {
  return 'f' + Math.random().toString(36).slice(2, 9)
}

// ─── Report Metadata Form ────────────────────────────────────────────────────
function MetaForm({ meta, setMeta, toast }) {
  const [local, setLocal] = useState({ ...meta })
  const set = useCallback((k, v) => setLocal(p => ({ ...p, [k]: v })), [])
  const save = () => { setMeta({ ...local }); toast('Configuration saved ✓') }

  const Field = ({ label, fkey, type = 'text', placeholder = '' }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        type={type}
        value={local[fkey] || ''}
        onChange={e => set(fkey, e.target.value)}
        className="form-input"
        placeholder={placeholder}
      />
    </div>
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-20">
        <div className="page-title" style={{ marginBottom: 0 }}>⚙ Report Configuration</div>
        <div className="flex gap-8">
          <button className="btn btn-primary" onClick={save}>✓ Save</button>
          <button className="btn" onClick={() => setLocal({ ...meta })}>Reset</button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        <div>
          <div className="card mb-16">
            <div className="section-label">Client Information</div>
            <Field label="Client Name" fkey="client_name" placeholder="ACME Corporation" />
            <Field label="Application Name" fkey="application_name" placeholder="Customer Portal" />
            <Field label="Application Version" fkey="application_version" placeholder="2.1.0" />
            <div className="form-group">
              <label className="form-label">Testing Approach</label>
              <select value={local.application_approach || 'Gray Box'} onChange={e => set('application_approach', e.target.value)} className="form-select">
                {['Black Box', 'Gray Box', 'White Box'].map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Application URL(s) — one per line</label>
              <textarea
                value={(local.application_url || []).join('\n')}
                onChange={e => set('application_url', e.target.value.split('\n').map(s => s.trim()).filter(Boolean))}
                className="form-textarea"
                placeholder="https://app.target.com"
              />
            </div>
          </div>
          <div className="card">
            <div className="section-label">Out of Scope (one per line)</div>
            <textarea
              value={(local.outofscope || []).join('\n')}
              onChange={e => set('outofscope', e.target.value.split('\n').filter(Boolean))}
              className="form-textarea"
              style={{ minHeight: 100 }}
              placeholder="Enter custom exclusions..."
            />
            <div className="form-group" style={{ marginTop: 14 }}>
              <label className="form-label">Reassessment Period</label>
              <input value={local.reassessment || '30 days'} onChange={e => set('reassessment', e.target.value)} className="form-input" placeholder="30 days" />
            </div>
          </div>
        </div>
        <div>
          <div className="card mb-16">
            <div className="section-label">Team & Timeline</div>
            <Field label="Tester Name" fkey="tester_name" placeholder="Your Name" />
            <Field label="Validator / Reviewer" fkey="validator_name" placeholder="Validator Name" />
            <Field label="Project ID" fkey="project_id" placeholder={`IARM-${new Date().getFullYear()}-001`} />
            <Field label="Assessment Start Date" fkey="assessment_startdate" type="date" />
            <Field label="Assessment End Date"   fkey="assessment_enddate"   type="date" />
            <Field label="Report Delivery Date"  fkey="report_delivery_date" type="date" />
          </div>
          <div className="card">
            <div className="section-label">Document Dates</div>
            <Field label="Basic Document Date" fkey="basic_document_date" type="date" />
            <Field label="Draft Document Date"  fkey="draft_document_date"  type="date" />
            <Field label="Peer Review Date"     fkey="peer_review_date"     type="date" />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Finding Form ─────────────────────────────────────────────────────────────
function FindingForm({ initial, onSave, onCancel, toast }) {
  const isNew = !initial?.id
  const [f, setF] = useState(isNew ? { ...EMPTY_FINDING, id: genId() } : {
    ...initial,
    cvss: { ...initial.cvss },
    affected_components: [...(initial.affected_components || [])],
    payload: [...(initial.payload || [])],
    references: [...(initial.references || [])],
    evidence_images: [...(initial.evidence_images || [])],
  })
  const set = (k, v) => setF(p => ({ ...p, [k]: v }))
  const setCvss = (k, v) => setF(p => ({ ...p, cvss: { ...p.cvss, [k]: v } }))

  const save = () => {
    if (!f.title?.trim())           { toast('Title is required', 'error'); return }
    if (!f.description?.trim())     { toast('Description is required', 'error'); return }
    if (!f.recommendation?.trim())  { toast('Recommendation is required', 'error'); return }
    onSave({ ...f })
    toast(isNew ? 'Finding added ✓' : 'Finding updated ✓')
  }

  const TA = ({ label, fkey, rows = 5, mono = false, placeholder = '' }) => (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <textarea
        value={f[fkey] || ''}
        onChange={e => set(fkey, e.target.value)}
        className="form-textarea"
        rows={rows}
        placeholder={placeholder}
        style={mono ? { fontFamily: 'Share Tech Mono, monospace', fontSize: 11 } : {}}
      />
    </div>
  )

  const sevColor = SEV_COLORS[f.cvss?.level] || '#6e6e6e'

  return (
    <div>
      <div className="flex items-center justify-between mb-20">
        <div className="page-title" style={{ marginBottom: 0 }}>
          {isNew ? '+ Add Finding' : '✎ Edit Finding'}
          {!isNew && <span style={{ fontSize: 12, color: 'var(--dim)', marginLeft: 14, fontFamily: 'Exo 2, sans-serif' }}>{f.title}</span>}
        </div>
        <div className="flex gap-8">
          <button className="btn btn-primary" onClick={save}>{isNew ? '+ Add' : '✓ Save'}</button>
          <button className="btn" onClick={onCancel}>Cancel</button>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="section-label">Basic Information</div>
            <div className="form-group">
              <label className="form-label">Title *</label>
              <input value={f.title || ''} onChange={e => set('title', e.target.value)} className="form-input" placeholder="e.g. SQL Injection — Login Form" />
            </div>
            <div className="form-group">
              <label className="form-label">One-line Summary</label>
              <input value={f.summary || ''} onChange={e => set('summary', e.target.value)} className="form-input" placeholder="Brief description for the findings table" />
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">Severity *</label>
                <select value={f.cvss?.level || 'medium'} onChange={e => setCvss('level', e.target.value)} className="form-select">
                  {['critical', 'high', 'medium', 'low', 'info'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label">Ease of Exploit</label>
                <select value={f.ease || 'Moderate'} onChange={e => set('ease', e.target.value)} className="form-select">
                  {['Trivial', 'Moderate', 'Difficult'].map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">CVSS Score (0–10)</label>
                <input type="number" min="0" max="10" step="0.1" value={f.cvss?.score || ''} onChange={e => setCvss('score', parseFloat(e.target.value) || 0)} className="form-input" placeholder="9.8" />
              </div>
              <div className="form-group">
                <label className="form-label">CWE</label>
                <input value={f.cwe || ''} onChange={e => set('cwe', e.target.value)} className="form-input" placeholder="CWE-89" />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">CVSS Vector</label>
              <input value={f.cvss?.vector || ''} onChange={e => setCvss('vector', e.target.value)} className="form-input" placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H" style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11 }} />
            </div>
          </div>

          {/* Preview chip */}
          <div className="card" style={{ borderColor: `${sevColor}33`, background: `${sevColor}08` }}>
            <div className="section-label">Preview</div>
            <div className="flex items-center gap-8" style={{ marginBottom: 8 }}>
              <span className={`sev-badge sev-${f.cvss?.level || 'info'}`}>{f.cvss?.level || 'info'}</span>
              {f.cvss?.score > 0 && <span style={{ fontSize: 11, color: 'var(--dim)' }}>CVSS {f.cvss.score}</span>}
              {f.ease && <span style={{ fontSize: 11, color: 'var(--dim)' }}>· {f.ease}</span>}
              {f.cwe && <span style={{ fontSize: 11, color: 'var(--dim)' }}>· {f.cwe}</span>}
            </div>
            <div style={{ fontWeight: 700, color: 'var(--text)', fontSize: 13 }}>
              {f.title || <span style={{ color: 'var(--muted)' }}>Title not set</span>}
            </div>
            {f.summary && <div style={{ fontSize: 11, color: 'var(--dim)', marginTop: 4 }}>{f.summary}</div>}
          </div>

          <div className="card">
            <div className="section-label">Flags</div>
            <div className="flex gap-20">
              {[['validated', 'Validated ✓', 'var(--green)'], ['false_positive', 'False Positive ✕', 'var(--red)']].map(([k, l, c]) => (
                <label key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: f[k] ? c : 'var(--dim)' }}>
                  <input type="checkbox" checked={f[k] || false} onChange={e => set(k, e.target.checked)} style={{ accentColor: c, width: 14, height: 14 }} />
                  {l}
                </label>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="section-label">Affected Components — one per line</div>
            <textarea
              value={(f.affected_components || []).join('\n')}
              onChange={e => set('affected_components', e.target.value.split('\n').filter(Boolean))}
              className="form-textarea"
              rows={4}
              placeholder="/api/auth/login&#10;/admin/users/{id}"
              style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11 }}
            />
          </div>

          <div className="card">
            <div className="section-label">Payloads — one per line</div>
            <textarea
              value={(f.payload || []).join('\n')}
              onChange={e => set('payload', e.target.value.split('\n').filter(Boolean))}
              className="form-textarea"
              rows={4}
              placeholder="' OR 1=1--&#10;<script>alert(1)</script>"
              style={{ fontFamily: 'Share Tech Mono, monospace', fontSize: 11 }}
            />
          </div>

          <div className="card">
            <div className="section-label">References — one per line</div>
            <textarea
              value={(f.references || []).join('\n')}
              onChange={e => set('references', e.target.value.split('\n').filter(Boolean))}
              className="form-textarea"
              rows={3}
              placeholder="https://owasp.org/..."
            />
          </div>

          <div className="card">
            <div className="section-label">Screenshots / Evidence</div>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => {
                const files = Array.from(e.target.files)
                files.forEach(file => {
                  const reader = new FileReader()
                  reader.onload = ev => {
                    setF(p => ({ ...p, evidence_images: [...(p.evidence_images || []), ev.target.result] }))
                  }
                  reader.readAsDataURL(file)
                })
                e.target.value = '' // reset input
              }}
              style={{ fontSize: 11, color: 'var(--dim)', marginBottom: 12 }}
            />
            {f.evidence_images?.length > 0 && (
               <div className="flex gap-8 flex-wrap">
                 {f.evidence_images.map((img, i) => (
                   <div key={i} style={{ position: 'relative' }}>
                     <img src={img} style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4, border: '1px solid var(--border)' }} alt="evidence" />
                     <button
                       onClick={() => setF(p => ({ ...p, evidence_images: p.evidence_images.filter((_, idx) => idx !== i) }))}
                       style={{ position: 'absolute', top: -5, right: -5, background: 'var(--red)', color: '#fff', border: 'none', borderRadius: '50%', width: 18, height: 18, fontSize: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                     >✕</button>
                   </div>
                 ))}
               </div>
            )}
            <div style={{ fontSize: 10, color: 'var(--dim)', marginTop: 8 }}>
              Images are embedded directly into the report. Keep them small to avoid massive PDFs.
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="section-label">Finding Details</div>
            <TA label="Description * — explain the vulnerability" fkey="description" rows={7} placeholder="Describe the vulnerability, root cause, and affected code/endpoint..." />
            <TA label="Business Impact — what can an attacker do?" fkey="impact" rows={5} placeholder="Data exfiltration, authentication bypass, RCE..." />
            <TA label="Proof of Concept — steps to reproduce" fkey="poc" rows={7} mono placeholder="Step 1: Navigate to /endpoint&#10;Step 2: Inject payload: ' OR 1=1--&#10;Step 3: Observe 200 OK response..." />
            <TA label="Recommendation * — how to fix" fkey="recommendation" rows={6} placeholder="Use parameterized queries. Implement input validation..." />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── DataEditor wrapper — toggles meta config vs finding form ─────────────────
export default function DataEditor({ meta, setMeta, findings, setFindings, editTarget, setEditTarget, toast }) {
  const [activeTab, setActiveTab] = useState(editTarget ? 'finding' : 'meta')

  const handleSave = (f) => {
    if (editTarget?.id) {
      setFindings(prev => prev.map(x => x.id === f.id ? f : x))
    } else {
      setFindings(prev => [...prev, f])
    }
    setEditTarget(null)
    setActiveTab('meta')
  }

  const handleCancel = () => {
    setEditTarget(null)
    setActiveTab('meta')
  }

  const startNew = () => {
    setEditTarget(null)
    setActiveTab('finding')
  }

  return (
    <div>
      {/* Tab bar */}
      <div className="flex gap-4 mb-20" style={{ borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {[
          { id: 'meta', label: '⚙ Report Config' },
          { id: 'finding', label: editTarget ? '✎ Edit Finding' : '+ Add Finding' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => { if (t.id !== 'finding') setEditTarget(null); setActiveTab(t.id) }}
            style={{
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${activeTab === t.id ? 'var(--cyan)' : 'transparent'}`,
              color: activeTab === t.id ? 'var(--cyan)' : 'var(--dim)',
              padding: '8px 16px',
              cursor: 'pointer',
              fontFamily: "'Exo 2', sans-serif",
              fontSize: 12,
              fontWeight: activeTab === t.id ? 600 : 400,
              marginBottom: -1,
              transition: 'all 0.12s',
            }}
          >
            {t.label}
          </button>
        ))}
        <button className="btn btn-success btn-sm" style={{ marginLeft: 'auto' }} onClick={startNew}>
          + New Finding
        </button>
      </div>

      {activeTab === 'meta'
        ? <MetaForm meta={meta} setMeta={setMeta} toast={toast} />
        : <FindingForm initial={editTarget} onSave={handleSave} onCancel={handleCancel} toast={toast} />
      }
    </div>
  )
}
