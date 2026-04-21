import Dashboard         from '../components/Dashboard'
import FileUpload        from '../components/FileUpload'
import DataEditor        from '../components/DataEditor'
import VulnerabilityTable from '../components/VulnerabilityTable'
import ReportPreview     from '../components/ReportPreview'

export default function Home({
  page, setPage,
  findings, setFindings,
  meta, setMeta,
  editTarget, setEditTarget,
  toast,
  onLoadSample,
}) {
  const handleEdit = (finding) => {
    setEditTarget(finding)
    setPage('editor')
  }

  const handleImport = (newFindings, mode) => {
    if (mode === 'replace') setFindings(newFindings)
    else setFindings(prev => [...prev, ...newFindings])
  }

  return (
    <>
      {page === 'dashboard' && (
        <Dashboard
          findings={findings}
          meta={meta}
          setPage={setPage}
          onLoadSample={onLoadSample}
        />
      )}

      {page === 'upload' && (
        <FileUpload
          onImport={handleImport}
          toast={toast}
        />
      )}

      {page === 'editor' && (
        <DataEditor
          meta={meta}
          setMeta={setMeta}
          findings={findings}
          setFindings={setFindings}
          editTarget={editTarget}
          setEditTarget={setEditTarget}
          toast={toast}
        />
      )}

      {page === 'findings' && (
        <VulnerabilityTable
          findings={findings}
          setFindings={setFindings}
          onEdit={handleEdit}
          toast={toast}
        />
      )}

      {page === 'preview' && (
        <ReportPreview
          findings={findings}
          meta={meta}
          toast={toast}
        />
      )}
    </>
  )
}
