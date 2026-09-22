import { CaseDetailPanel } from '../components/CaseDetailPanel'
import { Panel1 } from '../components/Panel1'
import { Sidebar } from '../components/Sidebar'
import { TopBar } from '../components/TopBar'

export function MainPage() {
  return (
    <div className="flex h-screen flex-col overflow-hidden bg-[#F4F3F0] text-[#1B1B18]">
      <TopBar />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <Panel1 />
        <CaseDetailPanel />
      </div>
    </div>
  )
}
