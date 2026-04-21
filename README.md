# VAPT Report Automation System

Production-grade full-stack application for penetration testing report generation.
Integrates with the IARM SysReptor-compatible HTML template.

```
vapt-report-system/
├── backend/
│   ├── api/             → FastAPI routes (13 endpoints)
│   ├── parsers/         → CSV (Nessus/OpenVAS/Burp) + PDF parsers
│   ├── mappers/         → JSON field normaliser
│   ├── templates/       → Jinja2 HTML report templates
│   ├── services/        → Report generator + validation
│   ├── config/          → Settings + scanner field mappings
│   ├── models/          → Pydantic schemas
│   ├── main.py
│   └── requirements.txt
└── frontend/
    ├── index.html       → Vite entry point (project root)
    ├── public/
    └── src/
        ├── components/  → Dashboard, FileUpload, DataEditor,
        │                   VulnerabilityTable, ReportPreview, Navbar
        ├── pages/       → Home.jsx (routing)
        ├── services/    → api.js (axios calls)
        ├── App.jsx      → Root with global state
        └── App.css      → Global dark cyberpunk theme
```

---

## Requirements

| Tool | Version | Notes |
|------|---------|-------|
| Python | 3.10 – 3.13 | [python.org](https://python.org) |
| Node.js | 18 LTS or higher | [nodejs.org](https://nodejs.org) — installs `npm` |
| pip | latest | bundled with Python |

> **Windows users:** Install Node.js via `winget install OpenJS.NodeJS.LTS`

---

## Quick Start (Windows — PowerShell)

> Run **backend** and **frontend** in **two separate terminals** at the same time.

---

### Terminal 1 — Backend

```powershell
cd d:\vapt-report-system\vapt-report-system\backend

# First-time only: create virtual environment
python -m venv venv

# Activate virtual environment (Windows PowerShell)
.\venv\Scripts\Activate.ps1

# First-time only: install dependencies
pip install -r requirements.txt

# Start the API server
uvicorn main:app --reload --port 8000
```

| Service | URL |
|---------|-----|
| API Root | http://localhost:8000 |
| Swagger Docs | http://localhost:8000/docs |
| Health Check | http://localhost:8000/api/health |

---

### Terminal 2 — Frontend

```powershell
cd d:\vapt-report-system\vapt-report-system\frontend

# First-time only: install npm packages
npm install

# Start the Vite dev server
npm run dev
```

| Service | URL |
|---------|-----|
| App | http://localhost:5173 |

> The Vite config proxies `/api/*` → `http://localhost:8000`, so both
> backend and frontend must run concurrently.

---

## Troubleshooting (Windows)

| Problem | Fix |
|---------|-----|
| `source: not recognized` | Use `.\venv\Scripts\Activate.ps1` instead of `source venv/bin/activate` |
| `npm: not recognized` | Node.js not installed — run `winget install OpenJS.NodeJS.LTS` then open a new terminal |
| `PyMuPDF` build fails | No Visual Studio compiler — `requirements.txt` uses `PyMuPDF==1.25.5` which has pre-built wheels for Python 3.13 |
| Frontend shows 404 | Make sure `index.html` exists at `frontend/index.html` (not just in `public/`) |
| Multiple Vite processes conflict | Run `Get-Process -Name node | Stop-Process -Force` then restart `npm run dev` |

---

## API Reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET    | `/api/health`               | Health check |
| POST   | `/api/import/csv`           | Upload Nessus/OpenVAS/Burp/Generic CSV |
| POST   | `/api/import/json`          | Upload JSON findings file |
| POST   | `/api/import/pdf`           | Upload PDF — heuristic extraction |
| POST   | `/api/import/pdf/text`      | Raw PDF text extraction |
| POST   | `/api/findings/validate`    | Validate findings array |
| POST   | `/api/findings/stats`       | Compute severity counts |
| POST   | `/api/findings/deduplicate` | Remove duplicate findings |
| POST   | `/api/export/json`          | Template-compatible JSON |
| POST   | `/api/export/html`          | Rendered HTML report |
| POST   | `/api/export/preview`       | Quick HTML preview |
| GET    | `/api/sample/findings`      | Sample findings for testing |
| GET    | `/api/templates`            | List available templates |

---

## CSV Formats Supported

### Nessus CSV (auto-detected by `Plugin ID` / `Synopsis` columns)
```
Risk, Name, Synopsis, Description, Solution, CVSS v2 Base Score,
Plugin Output, Host, See Also, CVSSv3 Vector
```

### OpenVAS CSV (auto-detected by `NVT OID` / `Specific Result` columns)
```
Severity, NVT Name, Description, Specific Result, Solution, CVSS Base Score, Host
```

### Burp Suite CSV (auto-detected by `Issue name` / `Remediation background`)
```
Issue name, Severity, Issue detail, Remediation background, URL, References
```

### Generic CSV (fallback)
```
title/name/vulnerability, severity/risk, description, recommendation/solution,
cvss_score, host/url, cwe, references
```

---

## JSON Schema

The exported JSON is strictly compatible with the SysReptor template:

```json
{
  "report": {
    "client_name": "ACME Corp",
    "application_name": "Customer Portal",
    "application_version": "2.1",
    "application_approach": "Gray Box",
    "application_url": ["https://portal.acme.com"],
    "tester_name": "Your Name",
    "validator_name": "Vignesh",
    "project_id": "IARM-2025-042",
    "assessment_startdate": "2025-04-01",
    "assessment_enddate": "2025-04-07",
    "report_delivery_date": "2025-04-10",
    "basic_document_date": "2025-04-01",
    "draft_document_date": "2025-04-08",
    "peer_review_date": "2025-04-09",
    "reassessment": "30 days",
    "outofscope": []
  },
  "findings": [
    {
      "id": "f001",
      "title": "SQL Injection — Login Form",
      "summary": "Authentication bypass via username parameter",
      "description": "...",
      "impact": "...",
      "recommendation": "...",
      "cvss": {
        "score": 9.8,
        "vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
        "level": "critical"
      },
      "ease": "Trivial",
      "cwe": "CWE-89",
      "affected_components": ["/api/auth/login"],
      "payload": ["' OR 1=1--"],
      "poc": "...",
      "references": ["https://owasp.org/..."],
      "validated": true,
      "false_positive": false,
      "source": "manual"
    }
  ],
  "finding_stats": {
    "count_critical": 1,
    "count_high": 2,
    "count_medium": 3,
    "count_low": 1,
    "count_info": 0,
    "total": 7
  }
}
```

---

## Templates

| Template | Description |
|----------|-------------|
| `default_report` | IARM corporate style — white background, Garamond serif, blue (#1f86d0) headings |
| `modern_report`  | Dark cyberpunk — Orbitron headers, Share Tech Mono code, cyan (#00d4ff) accents |

Select via query param: `/api/export/html?template=modern_report`

---

## PDF Export

The HTML export is print-ready. For server-side PDF:

```bash
# WeasyPrint (Python)
pip install weasyprint
weasyprint report.html report.pdf

# Puppeteer (Node.js)
npx puppeteer-pdf report.html --output report.pdf --format A4 \
  --margin-top 20mm --margin-bottom 20mm
```

---

## Security

- Markdown rendered server-side via `markdown2` + `bleach` (XSS-safe)
- All user input HTML-escaped in Jinja2 templates (`autoescape=True`)
- File uploads validated by extension
- CORS restricted to localhost origins (update `config/settings.py` for production)
