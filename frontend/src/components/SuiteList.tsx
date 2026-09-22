import { useTestExplorer } from '../store/testExplorer'
import { STATUS_DOT } from './statusColors'

const PANEL_TABS = ['Test Suite', 'Category', 'Graph', 'Timeline', 'Requirement', 'Report', 'Environment', 'Comments']

export function SuiteList() {
  const suites = useTestExplorer((s) => s.suites)
  const cases = useTestExplorer((s) => s.cases)
  const selectedSuiteId = useTestExplorer((s) => s.selectedSuiteId)
  const selectedCaseId = useTestExplorer((s) => s.selectedCaseId)
  const selectSuite = useTestExplorer((s) => s.selectSuite)
  const selectCase = useTestExplorer((s) => s.selectCase)

  return (
    <div className="flex flex-[4_1_0%] min-w-0 flex-col overflow-hidden border-x border-[#E4E1DA] bg-white">
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-[#E4E1DA] px-3">
        {PANEL_TABS.map((tab, i) => (
          <button
            key={tab}
            className={`whitespace-nowrap px-2.5 py-3 text-[12.5px] ${
              i === 0
                ? 'border-b-2 border-[#3B5BDB] font-bold text-[#1B1B18]'
                : 'border-b-2 border-transparent text-[#84817A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
        {suites.length === 0 && (
          <div className="p-4 text-[13px] text-[#84817A]">Chưa có Test Suite nào cho loại test này.</div>
        )}

        {suites.map((suite) => {
          const expanded = suite.id === selectedSuiteId
          return (
            <div key={suite.id} className="overflow-hidden rounded-[10px] border border-[#E4E1DA]">
              <button
                onClick={() => selectSuite(suite.id)}
                className="flex w-full items-center gap-2.5 bg-[#FAFAF8] px-3.5 py-3 text-left"
              >
                <span className="flex-grow text-[13.5px] font-semibold">{suite.name}</span>
                <span
                  className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                  style={
                    suite.status === 'Active'
                      ? { background: '#EBFBEE', color: '#2B8A3E' }
                      : { background: '#F1F3F5', color: '#495057' }
                  }
                >
                  {suite.status}
                </span>
              </button>

              {expanded && (
                <div>
                  {cases.length === 0 && (
                    <div className="border-t border-[#F0EEE9] px-3.5 py-3 text-[13px] text-[#84817A]">
                      Chưa có Test Case nào.
                    </div>
                  )}
                  {cases.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => selectCase(c.id)}
                      className={`flex w-full items-center gap-2.5 border-t border-[#F0EEE9] px-3.5 py-2.5 pl-8.5 text-left ${
                        c.id === selectedCaseId ? 'bg-[#FDEEEE]' : 'bg-white'
                      }`}
                    >
                      <span
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ background: STATUS_DOT[c.current_status] }}
                      />
                      <span className="flex-grow text-[13px] text-[#3A382F]">{c.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
