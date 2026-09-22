import { useState } from 'react'
import { CategoryTab } from './CategoryTab'
import { EnvironmentTab } from './EnvironmentTab'
import { GraphTab } from './GraphTab'
import { ReportTab } from './ReportTab'
import { RequirementTab } from './RequirementTab'
import { TestSuiteTab } from './TestSuiteTab'
import { TypeTimelineTab } from './TypeTimelineTab'

type Panel1Tab = 'Test Suite' | 'Category' | 'Graph' | 'Timeline' | 'Requirement' | 'Report' | 'Environment' | 'Comments'
const PANEL_TABS: Panel1Tab[] = ['Test Suite', 'Category', 'Graph', 'Timeline', 'Requirement', 'Report', 'Environment', 'Comments']

// Comments là Phase 2 theo FSD mục 5.8, tạm chưa áp dụng ở giai đoạn đơn người dùng.
const NOT_YET_BUILT: Partial<Record<Panel1Tab, string>> = {
  Comments: 'Phase 2 theo FSD mục 5.8, tạm chưa áp dụng ở giai đoạn đơn người dùng.',
}

export function Panel1() {
  const [activeTab, setActiveTab] = useState<Panel1Tab>('Test Suite')

  return (
    <div className="flex flex-[4_1_0%] min-w-0 flex-col overflow-hidden border-x border-[#E4E1DA] bg-white">
      <div className="flex shrink-0 items-center gap-0.5 overflow-x-auto border-b border-[#E4E1DA] px-3">
        {PANEL_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`whitespace-nowrap px-2.5 py-3 text-[12.5px] ${
              tab === activeTab
                ? 'border-b-2 border-[#3B5BDB] font-bold text-[#1B1B18]'
                : 'border-b-2 border-transparent text-[#84817A]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'Test Suite' && <TestSuiteTab />}
      {activeTab === 'Category' && <CategoryTab />}
      {activeTab === 'Graph' && <GraphTab />}
      {activeTab === 'Timeline' && <TypeTimelineTab />}
      {activeTab === 'Environment' && <EnvironmentTab />}
      {activeTab === 'Requirement' && <RequirementTab />}
      {activeTab === 'Report' && <ReportTab />}
      {NOT_YET_BUILT[activeTab] && (
        <div className="p-4 text-[13px] text-[#84817A]">{NOT_YET_BUILT[activeTab]}</div>
      )}
    </div>
  )
}
