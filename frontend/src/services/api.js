import axios from 'axios'

const BASE = '/api'

const api = axios.create({
  baseURL: BASE,
  timeout: 30000,
})

// ─── Import ───────────────────────────────────────────────────────────────────

export async function importCSV(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/import/csv', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function importJSON(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/import/json', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function importPDF(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/import/pdf', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

export async function extractPDFText(file) {
  const form = new FormData()
  form.append('file', file)
  const { data } = await api.post('/import/pdf/text', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
  })
  return data
}

// ─── Findings ──────────────────────────────────────────────────────────────

export async function validateFindings(findings) {
  const { data } = await api.post('/findings/validate', findings)
  return data
}

export async function getStats(findings) {
  const { data } = await api.post('/findings/stats', findings)
  return data
}

export async function deduplicateFindings(findings) {
  const { data } = await api.post('/findings/deduplicate', findings)
  return data
}

// ─── Export ───────────────────────────────────────────────────────────────────

export async function exportJSON(payload) {
  const { data } = await api.post('/export/json', payload)
  return data
}

export async function exportHTML(payload, template = 'default_report') {
  const { data } = await api.post(`/export/html?template=${template}`, payload, {
    responseType: 'text',
  })
  return data
}

export async function previewHTML(payload) {
  const { data } = await api.post('/export/preview', payload, {
    responseType: 'text',
  })
  return data
}

// ─── Misc ─────────────────────────────────────────────────────────────────────

export async function getSampleFindings() {
  const { data } = await api.get('/sample/findings')
  return data
}

export async function getTemplates() {
  const { data } = await api.get('/templates')
  return data
}

export async function checkHealth() {
  const { data } = await api.get('/health')
  return data
}

// ─── Download helpers ─────────────────────────────────────────────────────────

export function downloadBlob(content, filename, mimeType = 'text/plain') {
  const blob = new Blob([typeof content === 'string' ? content : JSON.stringify(content, null, 2)], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export function todayStr() {
  return new Date().toISOString().split('T')[0]
}
