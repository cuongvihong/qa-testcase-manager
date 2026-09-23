import { useEffect, useState } from 'react'
import type { TestRun } from '../api/types'
import { useTestExplorer } from '../store/testExplorer'
import { PRIORITY_BADGE, STATUS_BADGE, STATUS_DOT } from './statusColors'

type DetailTab = 'Status' | 'Timeline' | 'Retry'
const DETAIL_TABS: DetailTab[] = ['Status', 'Timeline', 'Retry']

export function CaseDetailPanel() {
  const caseDetail = useTestExplorer((s) => s.caseDetail)
  const suites = useTestExplorer((s) => s.suites)
  const testTypes = useTestExplorer((s) => s.testTypes)
  const selectedTestTypeId = useTestExplorer((s) => s.selectedTestTypeId)
  const [activeTab, setActiveTab] = useState<DetailTab>('Status')

  // Đổi case khác thì luôn quay lại tab Status, không giữ tab của case trước.
  useEffect(() => {
    setActiveTab('Status')
  }, [caseDetail?.case.id])

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

  return (
    <div className="flex flex-[3_1_0%] min-w-0 flex-col overflow-hidden bg-[#FAFAF8]">
      <div className="shrink-0 px-5 pt-4">
        <div className="mb-1 text-[11.5px] text-[#84817A]">
          {testType?.name} / {suite?.name}
        </div>
        <div className="mb-3 text-[15px] font-bold leading-tight text-[#1B1B18]">{testCase.title}</div>
      </div>

      <div className="flex shrink-0 items-center gap-0.5 border-b border-[#E4E1DA] px-5">
        {DETAIL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`mr-4.5 py-2.5 text-[12.5px] ${
              tab === activeTab
                ? 'border-b-2 border-[#3B5BDB] font-bold text-[#1B1B18]'
                : 'border-b-2 border-transparent text-[#84817A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-5">
        {activeTab === 'Status' && <StatusTabContent testCase={testCase} latestRun={runs[0]} />}
        {activeTab === 'Timeline' && <TimelineTabContent runs={runs} />}
        {activeTab === 'Retry' && <RetryTabContent caseId={testCase.id} runs={runs} />}
      </div>
    </div>
  )
}

function StatusTabContent({
  testCase,
  latestRun,
}: {
  testCase: NonNullable<ReturnType<typeof useTestExplorer.getState>['caseDetail']>['case']
  latestRun: TestRun | undefined
}) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2.5">
        <span
          className="rounded-full px-3 py-1 text-[12.5px] font-bold"
          style={{ background: STATUS_BADGE[testCase.current_status].bg, color: STATUS_BADGE[testCase.current_status].fg }}
        >
          {testCase.current_status}
        </span>
        <span
          className="rounded-full px-2.5 py-1 text-[11px] font-bold"
          style={{ background: PRIORITY_BADGE[testCase.priority].bg, color: PRIORITY_BADGE[testCase.priority].fg }}
        >
          {testCase.priority}
        </span>
        <span className="rounded-full border border-[#E4E1DA] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#495057]">
          {testCase.execution_type}
        </span>
        {latestRun?.duration_ms !== null && latestRun?.duration_ms !== undefined && (
          <span className="text-[11.5px] text-[#84817A]">Tổng thời gian {(latestRun.duration_ms / 1000).toFixed(1)}s</span>
        )}
        {latestRun?.build_version && (
          <>
            <span className="text-[11.5px] text-[#84817A]">·</span>
            <span className="font-mono text-[11.5px] text-[#84817A]">build {latestRun.build_version}</span>
          </>
        )}
      </div>

      {testCase.script_path && (
        <div className="rounded-md border border-[#E4E1DA] bg-white px-2.5 py-2 font-mono text-[11.5px] text-[#3A382F]">
          {testCase.script_path}
        </div>
      )}

      {testCase.is_auto_created && (
        <div className="flex items-center gap-2 rounded-lg border border-[#E4E1DA] bg-white px-2.5 py-2">
          <span className="text-[10.5px] text-[#84817A]">Tự động tạo từ automation (Playwright/pytest)</span>
        </div>
      )}

      {!latestRun && <div className="text-[13px] text-[#84817A]">Case này chưa từng chạy lần nào.</div>}

      {latestRun?.environment_name && (
        <div className="text-[11.5px] text-[#84817A]">Environment: {latestRun.environment_name}</div>
      )}

      {latestRun?.bug_ticket_link && (
        <a
          href={latestRun.bug_ticket_link}
          target="_blank"
          rel="noreferrer"
          className="text-[11.5px] font-semibold text-[#3B5BDB] underline"
        >
          Bug ticket: {latestRun.bug_ticket_link}
        </a>
      )}

      {latestRun?.error_note && (
        <div className="rounded-md border border-[#FFC9C9] bg-white p-2.5 font-mono text-[11.5px] leading-relaxed text-[#C92A2A]">
          {latestRun.error_note}
        </div>
      )}
    </>
  )
}

function TimelineTabContent({ runs }: { runs: TestRun[] }) {
  if (runs.length === 0) {
    return <div className="text-[13px] text-[#84817A]">Chưa có lịch sử chạy nào.</div>
  }

  return (
    <div>
      <div className="mb-3 text-[11px] uppercase tracking-wide text-[#84817A]">Lịch sử cập nhật của Case này</div>
      <div className="flex flex-col">
        {runs.map((run, i) => (
          <div key={run.id} className="flex gap-3 pb-4">
            <div className="flex flex-col items-center">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: STATUS_DOT[run.result] }} />
              {i < runs.length - 1 && <span className="mt-1 w-px flex-grow bg-[#E4E1DA]" />}
            </div>
            <div className="flex-grow">
              <div className="text-[12.5px] font-semibold text-[#1B1B18]">Kết quả chạy: {run.result}</div>
              {run.error_note && <div className="mt-0.5 text-[11px] text-[#84817A]">{run.error_note.split('\n')[0]}</div>}
              <div className="mt-1 font-mono text-[11px] text-[#84817A]">
                {new Date(run.executed_at).toLocaleString('vi-VN')}
                {run.build_version && ` · build ${run.build_version}`}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function RetryTabContent({ caseId, runs }: { caseId: number; runs: TestRun[] }) {
  const retryCase = useTestExplorer((s) => s.retryCase)
  const [retrying, setRetrying] = useState(false)

  const latestRun = runs[0]
  const chain = buildRetryChain(runs)
  const isFlaky = isFlakyChain(chain)

  async function handleRetry() {
    setRetrying(true)
    try {
      await retryCase(caseId)
    } finally {
      setRetrying(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={handleRetry}
        disabled={!latestRun || retrying}
        className="flex items-center justify-center gap-2 rounded-lg bg-[#3B5BDB] px-4 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
      >
        {retrying ? 'Đang chạy lại...' : 'Chạy lại ngay (Retry)'}
      </button>

      {!latestRun && <div className="text-[13px] text-[#84817A]">Case chưa từng chạy lần nào, chưa thể retry.</div>}

      {isFlaky && (
        <div className="flex gap-2.5 rounded-lg border border-[#FFE8A3] bg-[#FFF9DB] p-2.5">
          <div className="text-[11.5px] leading-relaxed text-[#8A4B00]">
            Cảnh báo Flaky Test: case này cho kết quả không ổn định trong các lần retry gần nhất.
          </div>
        </div>
      )}

      {chain.length > 1 && (
        <div>
          <div className="mb-2 text-[11px] uppercase tracking-wide text-[#84817A]">Đã retry {chain.length - 1} lần</div>
          <div className="flex flex-col overflow-hidden rounded-[10px] border border-[#E4E1DA] bg-white">
            {chain.map((run, i) => (
              <div
                key={run.id}
                className={`flex items-center gap-2.5 p-2.5 ${i > 0 ? 'border-t border-[#F0EEE9]' : ''}`}
              >
                <span className="w-14 shrink-0 text-[11px] text-[#84817A]">{i === 0 ? 'Gốc' : `Retry ${i}`}</span>
                <span
                  className="shrink-0 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                  style={{ background: STATUS_BADGE[run.result].bg, color: STATUS_BADGE[run.result].fg }}
                >
                  {run.result}
                </span>
                <span className="font-mono text-[11.5px] text-[#84817A]">
                  {new Date(run.executed_at).toLocaleString('vi-VN')}
                  {run.duration_ms !== null && ` · ${(run.duration_ms / 1000).toFixed(1)}s`}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

/** Đi ngược từ TestRun mới nhất qua retry_of_run_id để dựng chuỗi retry, trả về thứ tự Gốc → Retry N. */
function buildRetryChain(runs: TestRun[]): TestRun[] {
  if (runs.length === 0) return []
  const byId = new Map(runs.map((r) => [r.id, r]))
  const chain: TestRun[] = []
  let current: TestRun | undefined = runs[0]
  while (current) {
    chain.unshift(current)
    current = current.retry_of_run_id !== null ? byId.get(current.retry_of_run_id) : undefined
  }
  return chain
}

function isFlakyChain(chain: TestRun[]): boolean {
  if (chain.length < 3) return false
  const results = new Set(chain.map((r) => r.result))
  return results.has('Pass') && results.has('Fail')
}

