import { useEffect } from 'react'
import { useTestExplorer } from '../store/testExplorer'
import { SuiteCard } from './SuiteCard'

export function CategoryTab() {
  const categories = useTestExplorer((s) => s.categories)
  const suites = useTestExplorer((s) => s.suites)
  const selectedCategoryModule = useTestExplorer((s) => s.selectedCategoryModule)
  const loadCategories = useTestExplorer((s) => s.loadCategories)
  const selectCategory = useTestExplorer((s) => s.selectCategory)

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

  const activeCategory = categories.find((c) => c.module === selectedCategoryModule)
  const filteredSuites = activeCategory ? suites.filter((s) => activeCategory.suiteIds.includes(s.id)) : []

  return (
    <div className="flex flex-1 flex-col gap-2.5 overflow-y-auto p-4">
      {categories.length === 0 && (
        <div className="p-4 text-[13px] text-[#84817A]">Chưa có Category nào cho loại test này.</div>
      )}

      {!selectedCategoryModule &&
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

      {selectedCategoryModule && (
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
