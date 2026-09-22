import type { TestSuite } from '../api/types'
import { useTestExplorer } from '../store/testExplorer'
import { STATUS_DOT } from './statusColors'

/** 1 khối Suite (header + case list khi mở) — dùng chung cho tab Test Suite và Category. */
export function SuiteCard({ suite }: { suite: TestSuite }) {
  const cases = useTestExplorer((s) => s.cases)
  const selectedSuiteId = useTestExplorer((s) => s.selectedSuiteId)
  const selectedCaseId = useTestExplorer((s) => s.selectedCaseId)
  const selectSuite = useTestExplorer((s) => s.selectSuite)
  const selectCase = useTestExplorer((s) => s.selectCase)

  const expanded = suite.id === selectedSuiteId

  return (
    <div className="overflow-hidden rounded-[10px] border border-[#E4E1DA]">
      <button
        onClick={() => selectSuite(suite.id)}
        className="flex w-full items-center gap-2.5 bg-[#FAFAF8] px-3.5 py-3 text-left"
      >
        <span className="flex-grow text-[13.5px] font-semibold">{suite.name}</span>
        <span
          className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
          style={
            suite.status === 'Active' ? { background: '#EBFBEE', color: '#2B8A3E' } : { background: '#F1F3F5', color: '#495057' }
          }
        >
          {suite.status}
        </span>
      </button>

      {expanded && (
        <div>
          {cases.length === 0 && (
            <div className="border-t border-[#F0EEE9] px-3.5 py-3 text-[13px] text-[#84817A]">Chưa có Test Case nào.</div>
          )}
          {cases.map((c) => (
            <button
              key={c.id}
              onClick={() => selectCase(c.id)}
              className={`flex w-full items-center gap-2.5 border-t border-[#F0EEE9] px-3.5 py-2.5 pl-8.5 text-left ${
                c.id === selectedCaseId ? 'bg-[#FDEEEE]' : 'bg-white'
              }`}
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_DOT[c.current_status] }} />
              <span className="flex-grow text-[13px] text-[#3A382F]">{c.title}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
