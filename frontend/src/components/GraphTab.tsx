import { useEffect } from 'react'
import type { CaseStatus } from '../api/types'
import { useTestExplorer } from '../store/testExplorer'
import { STATUS_DOT } from './statusColors'

const STATUS_ORDER: CaseStatus[] = ['Pass', 'Fail', 'Blocked', 'Not Run', 'In Progress', 'Skipped']

export function GraphTab() {
  const graphData = useTestExplorer((s) => s.graphData)
  const loadGraphData = useTestExplorer((s) => s.loadGraphData)

  useEffect(() => {
    loadGraphData()
  }, [loadGraphData])

  if (!graphData) {
    return <div className="p-4 text-[13px] text-[#84817A]">Đang tải...</div>
  }

  const maxCount = Math.max(1, ...STATUS_ORDER.map((s) => graphData.statusCounts[s] ?? 0))

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto p-4">
      <div>
        <div className="mb-2 text-[12px] font-semibold text-[#1B1B18]">Pass / Fail / Blocked / Not Run</div>
        <div className="flex flex-col gap-1.5 rounded-[10px] border border-[#E4E1DA] bg-white p-3.5">
          {STATUS_ORDER.map((status) => {
            const count = graphData.statusCounts[status] ?? 0
            return (
              <div key={status} className="flex items-center gap-2">
                <span className="w-20 shrink-0 text-[11.5px] text-[#84817A]">{status}</span>
                <div className="h-4 flex-grow overflow-hidden rounded bg-[#F1F3F5]">
                  <div
                    className="h-4 rounded"
                    style={{ width: `${(count / maxCount) * 100}%`, background: STATUS_DOT[status] }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[11.5px] text-[#84817A]">{count}</span>
              </div>
            )
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-semibold text-[#1B1B18]">Xu hướng tỷ lệ Pass theo ngày</div>
        <div className="rounded-[10px] border border-[#E4E1DA] bg-white p-3.5">
          {graphData.trend.length === 0 ? (
            <div className="text-[12px] text-[#84817A]">Chưa có dữ liệu chạy test nào.</div>
          ) : (
            <TrendChart trend={graphData.trend} />
          )}
        </div>
      </div>

      <div>
        <div className="mb-2 text-[12px] font-semibold text-[#1B1B18]">Test Coverage</div>
        <div className="rounded-[10px] border border-[#E4E1DA] bg-white p-3.5 text-[13px]">
          {graphData.coveragePercent === null ? (
            <span className="text-[#84817A]">Chưa có Requirement nào để tính coverage.</span>
          ) : (
            <span className="font-semibold text-[#1B1B18]">{graphData.coveragePercent}% yêu cầu đã có Test Case cover</span>
          )}
        </div>
      </div>
    </div>
  )
}

function TrendChart({ trend }: { trend: { date: string; passRate: number }[] }) {
  const width = 560
  const height = 120
  const padding = 24

  const points = trend.map((point, i) => {
    const x = trend.length === 1 ? padding : padding + (i / (trend.length - 1)) * (width - padding * 2)
    const y = padding + (1 - point.passRate) * (height - padding * 2)
    return { x, y, point }
  })

  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ')

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="max-w-full">
      <line x1={padding} y1={padding} x2={padding} y2={height - padding} stroke="#E4E1DA" />
      <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E4E1DA" />
      <path d={path} fill="none" stroke="#3B5BDB" strokeWidth={2} />
      {points.map((p) => (
        <circle key={p.point.date} cx={p.x} cy={p.y} r={3} fill="#3B5BDB" />
      ))}
      <text x={padding} y={padding - 8} fontSize={10} fill="#84817A">
        100%
      </text>
      <text x={padding} y={height - padding + 14} fontSize={10} fill="#84817A">
        0%
      </text>
    </svg>
  )
}
