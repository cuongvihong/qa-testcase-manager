import { useTestExplorer } from '../store/testExplorer'
import { STATUS_BADGE } from './statusColors'

const DETAIL_TABS = ['Status', 'Timeline', 'Retry']

export function CaseDetailPanel() {
  const caseDetail = useTestExplorer((s) => s.caseDetail)
  const suites = useTestExplorer((s) => s.suites)
  const testTypes = useTestExplorer((s) => s.testTypes)
  const selectedTestTypeId = useTestExplorer((s) => s.selectedTestTypeId)

  if (!caseDetail) {
    return (
      <div className="flex flex-[3_1_0%] min-w-0 flex-col overflow-hidden bg-[#FAFAF8] p-5 text-[13px] text-[#84817A]">
        Chọn một Test Case bên trái để xem chi tiết.
      </div>
    )
  }

  const { case: testCase, runs } = caseDetail
  const suite = suites.find((s) => s.id === testCase.suite_id)
  const testType = testTypes.find((t) => t.id === selectedTestTypeId)
  const latestRun = runs[0]

  return (
    <div className="flex flex-[3_1_0%] min-w-0 flex-col overflow-hidden bg-[#FAFAF8]">
      <div className="shrink-0 px-5 pt-4">
        <div className="mb-1 text-[11.5px] text-[#84817A]">
          {testType?.name} / {suite?.name}
        </div>
        <div className="mb-3 text-[15px] font-bold leading-tight text-[#1B1B18]">{testCase.title}</div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 border-b border-[#E4E1DA] px-5">
        {DETAIL_TABS.map((tab, i) => (
          <button
            key={tab}
            className={`mr-4.5 py-2.5 text-[12.5px] ${
              i === 0
                ? 'border-b-2 border-[#3B5BDB] font-bold text-[#1B1B18]'
                : 'border-b-2 border-transparent text-[#84817A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {!latestRun && <div className="text-[13px] text-[#84817A]">Case này chưa từng chạy lần nào.</div>}

        {latestRun && (
          <>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className="rounded-full px-3 py-1 text-[12.5px] font-bold"
                style={{
                  background: STATUS_BADGE[testCase.current_status].bg,
                  color: STATUS_BADGE[testCase.current_status].fg,
                }}
              >
                {testCase.current_status}
              </span>
              {latestRun.duration_ms !== null && (
                <span className="text-[11.5px] text-[#84817A]">Tổng thời gian {(latestRun.duration_ms / 1000).toFixed(1)}s</span>
              )}
              {latestRun.build_version && (
                <>
                  <span className="text-[11.5px] text-[#84817A]">·</span>
                  <span className="font-mono text-[11.5px] text-[#84817A]">build {latestRun.build_version}</span>
                </>
              )}
            </div>

            {testCase.is_auto_created && (
              <div className="flex items-center gap-2 rounded-lg border border-[#E4E1DA] bg-white px-2.5 py-2">
                <span className="text-[10.5px] text-[#84817A]">Tự động tạo từ automation (Playwright/pytest)</span>
              </div>
            )}

            {latestRun.error_note && (
              <div className="rounded-md border border-[#FFC9C9] bg-white p-2.5 font-mono text-[11.5px] leading-relaxed text-[#C92A2A]">
                {latestRun.error_note}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
