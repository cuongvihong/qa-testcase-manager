import { useEffect } from 'react'
import { useTestExplorer } from '../store/testExplorer'
import { STATUS_DOT } from './statusColors'

export function TypeTimelineTab() {
  const typeTimeline = useTestExplorer((s) => s.typeTimeline)
  const loadTypeTimeline = useTestExplorer((s) => s.loadTypeTimeline)

  useEffect(() => {
    loadTypeTimeline()
  }, [loadTypeTimeline])

  return (
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto p-4">
      {typeTimeline.length === 0 && (
        <div className="text-[13px] text-[#84817A]">Chưa có lịch sử chạy test nào cho loại test này.</div>
      )}
      {typeTimeline.map((row) => (
        <div key={row.runId} className="flex items-center gap-2.5 rounded-[10px] border border-[#E4E1DA] bg-white p-3">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_DOT[row.result] }} />
          <span className="flex-grow text-[13px] text-[#1B1B18]">{row.testCaseTitle}</span>
          <span className="text-[11px] text-[#84817A]">{row.result}</span>
          {row.buildVersion && <span className="font-mono text-[11px] text-[#84817A]">build {row.buildVersion}</span>}
          <span className="font-mono text-[11px] text-[#84817A]">{new Date(row.executedAt).toLocaleString('vi-VN')}</span>
        </div>
      ))}
    </div>
  )
}
