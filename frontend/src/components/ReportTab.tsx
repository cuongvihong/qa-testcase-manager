import { useEffect, useState } from 'react'
import type { ReportScope } from '../api/types'
import { useTestExplorer } from '../store/testExplorer'

export function ReportTab() {
  const reports = useTestExplorer((s) => s.reports)
  const suites = useTestExplorer((s) => s.suites)
  const loadReports = useTestExplorer((s) => s.loadReports)
  const exportReport = useTestExplorer((s) => s.exportReport)

  const [scope, setScope] = useState<ReportScope>('Product')
  const [suiteId, setSuiteId] = useState<number | null>(null)
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    loadReports()
  }, [loadReports])

  async function handleExport() {
    setExporting(true)
    try {
      await exportReport(scope, scope === 'Suite' ? suiteId : null)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-col gap-2 rounded-[10px] border border-[#E4E1DA] bg-[#FAFAF8] p-3.5">
        <div className="text-[12px] font-semibold text-[#1B1B18]">Xuất báo cáo</div>
        <div className="flex items-center gap-2">
          <select
            value={scope}
            onChange={(e) => setScope(e.target.value as ReportScope)}
            className="rounded-lg border border-[#E4E1DA] bg-white px-2 py-1.5 text-[13px]"
          >
            <option value="Product">Toàn bộ Product</option>
            <option value="Suite">1 Test Suite</option>
          </select>
          {scope === 'Suite' && (
            <select
              value={suiteId ?? ''}
              onChange={(e) => setSuiteId(e.target.value ? Number(e.target.value) : null)}
              className="rounded-lg border border-[#E4E1DA] bg-white px-2 py-1.5 text-[13px]"
            >
              <option value="">Chọn Suite...</option>
              {suites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          )}
        </div>
        <button
          onClick={handleExport}
          disabled={exporting || (scope === 'Suite' && suiteId === null)}
          className="self-start rounded-lg bg-[#3B5BDB] px-3.5 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
        >
          {exporting ? 'Đang xuất...' : 'Xuất CSV'}
        </button>
      </div>

      <div className="text-[12px] font-semibold text-[#1B1B18]">Lịch sử báo cáo</div>
      {reports.length === 0 && <div className="text-[13px] text-[#84817A]">Chưa xuất báo cáo nào.</div>}
      {reports.map((report) => (
        <div key={report.id} className="flex items-center gap-2.5 rounded-[10px] border border-[#E4E1DA] bg-white p-3">
          <span className="flex-grow text-[13px] text-[#1B1B18]">
            {report.scope} · {report.format}
          </span>
          <span className="font-mono text-[11px] text-[#84817A]">
            {new Date(report.exported_at).toLocaleString('vi-VN')}
          </span>
          <a
            href={`/api/reports/${report.id}/download`}
            download
            className="rounded-lg border border-[#E4E1DA] px-2.5 py-1 text-[12px] font-semibold text-[#1B1B18]"
          >
            Tải
          </a>
        </div>
      ))}
    </div>
  )
}
