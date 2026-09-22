import { useState } from 'react'
import { EnvironmentTab } from './EnvironmentTab'
import { TestSuiteTab } from './TestSuiteTab'

type Panel1Tab = 'Test Suite' | 'Category' | 'Graph' | 'Timeline' | 'Requirement' | 'Report' | 'Environment' | 'Comments'
const PANEL_TABS: Panel1Tab[] = ['Test Suite', 'Category', 'Graph', 'Timeline', 'Requirement', 'Report', 'Environment', 'Comments']

// Chưa có nội dung riêng ở Increment 2 (sẽ làm ở sub-phase sau, hoặc mãi mãi ngoài scope
// như Comments, Phase 2 theo FSD mục 5.8) — hiện placeholder trung thực thay vì trống trơn.
const NOT_YET_BUILT: Partial<Record<Panel1Tab, string>> = {
  Category: 'Đang xây ở sub-phase 2c.',
  Graph: 'Đang xây ở sub-phase 2e.',
  Timeline: 'Đang xây ở sub-phase 2e (theo TestType, khác Timeline của từng Case).',
  Requirement: 'Đang xây ở sub-phase 2d.',
  Report: 'Đang xây ở sub-phase 2f.',
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
      {activeTab === 'Environment' && <EnvironmentTab />}
      {NOT_YET_BUILT[activeTab] && (
        <div className="p-4 text-[13px] text-[#84817A]">{NOT_YET_BUILT[activeTab]}</div>
      )}
    </div>
  )
}
