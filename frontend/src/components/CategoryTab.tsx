import { useEffect, useState } from 'react'
import { useTestExplorer } from '../store/testExplorer'
import { SuiteCard } from './SuiteCard'
import { STATUS_DOT, PRIORITY_BADGE } from './statusColors'

export function CategoryTab() {
  const categories = useTestExplorer((s) => s.categories)
  const suites = useTestExplorer((s) => s.suites)
  const selectedCategoryModule = useTestExplorer((s) => s.selectedCategoryModule)
  const loadCategories = useTestExplorer((s) => s.loadCategories)
  const selectCategory = useTestExplorer((s) => s.selectCategory)
  const caseSearchResults = useTestExplorer((s) => s.caseSearchResults)
  const searchCases = useTestExplorer((s) => s.searchCases)
  const selectSuite = useTestExplorer((s) => s.selectSuite)
  const selectCase = useTestExplorer((s) => s.selectCase)
  const selectedTestTypeId = useTestExplorer((s) => s.selectedTestTypeId)

  const [q, setQ] = useState('')
  const [priority, setPriority] = useState('')

  // CategoryTab không remount khi đổi Loại Test (Panel1 chỉ toggle hiển thị, không key theo
  // testType) — phải tự reload khi selectedTestTypeId đổi, không chỉ lúc mount lần đầu.
  useEffect(() => {
    loadCategories()
  }, [loadCategories, selectedTestTypeId])

  const isFiltering = q.trim() !== '' || priority !== ''

  useEffect(() => {
    if (!isFiltering) return
    searchCases({ q: q.trim() || null, priority: priority || null, module: null })
  }, [q, priority, isFiltering, searchCases])

  async function openCase(row: { suite_id: number; id: number }) {
    await selectSuite(row.suite_id)
    await selectCase(row.id)
  }

  const activeCategory = categories.find((c) => c.module === selectedCategoryModule)
  const filteredSuites = activeCategory ? suites.filter((s) => activeCategory.suiteIds.includes(s.id)) : []

  return (
    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Tìm theo tên case..."
          className="flex-grow rounded-lg border border-[#E4E1DA] px-2.5 py-1.5 text-[13px]"
        />
        <select
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="rounded-lg border border-[#E4E1DA] px-2.5 py-1.5 text-[13px]"
        >
          <option value="">Mọi priority</option>
          <option value="High">High</option>
          <option value="Medium">Medium</option>
          <option value="Low">Low</option>
        </select>
      </div>

      {isFiltering && (
        <>
          {caseSearchResults.length === 0 && (
            <div className="p-4 text-[13px] text-[#84817A]">Không tìm thấy case nào khớp.</div>
          )}
          {caseSearchResults.map((row) => (
            <button
              key={row.id}
              onClick={() => openCase(row)}
              className="flex items-center gap-2.5 rounded-[10px] border border-[#E4E1DA] bg-white p-3.5 text-left"
            >
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: STATUS_DOT[row.current_status] }} />
              <span className="flex-grow text-[13px] text-[#1B1B18]">{row.title}</span>
              <span className="text-[11px] text-[#84817A]">{row.suite_name}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-bold"
                style={{ background: PRIORITY_BADGE[row.priority].bg, color: PRIORITY_BADGE[row.priority].fg }}
              >
                {row.priority}
              </span>
            </button>
          ))}
        </>
      )}

      {!isFiltering && categories.length === 0 && (
        <div className="p-4 text-[13px] text-[#84817A]">Chưa có Category nào cho loại test này.</div>
      )}

      {!isFiltering && !selectedCategoryModule &&
        categories.map((cat) => (
          <button
            key={cat.module}
            onClick={() => selectCategory(cat.module)}
            className="flex items-center gap-2.5 rounded-[10px] border border-[#E4E1DA] bg-white p-3.5 text-left"
          >
            <span className="flex-grow text-[13.5px] font-semibold text-[#1B1B18]">{cat.module}</span>
            <span className="text-[11.5px] text-[#84817A]">
              {cat.caseCount} case · {Math.round(cat.passRate * 100)}% pass
            </span>
          </button>
        ))}

      {!isFiltering && selectedCategoryModule && (
        <>
          <button onClick={() => selectCategory(null)} className="self-start text-[12px] font-semibold text-[#3B5BDB]">
            ← Tất cả Category
          </button>
          <div className="mb-1 text-[13px] font-bold text-[#1B1B18]">{selectedCategoryModule}</div>
          {filteredSuites.map((suite) => (
            <SuiteCard key={suite.id} suite={suite} />
          ))}
        </>
      )}
    </div>
  )
}
