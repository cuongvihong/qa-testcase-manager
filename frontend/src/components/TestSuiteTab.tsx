import { useTestExplorer } from '../store/testExplorer'
import { SuiteCard } from './SuiteCard'

export function TestSuiteTab() {
  const suites = useTestExplorer((s) => s.suites)

  return (
    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
      {suites.length === 0 && (
        <div className="p-4 text-[13px] text-[#84817A]">Chưa có Test Suite nào cho loại test này.</div>
      )}
      {suites.map((suite) => (
        <SuiteCard key={suite.id} suite={suite} />
      ))}
    </div>
  )
}
