import { useEffect, useState } from 'react'
import { downloadCsv } from '../lib/csv'
import { useTestExplorer } from '../store/testExplorer'

export function RequirementTab() {
  const requirements = useTestExplorer((s) => s.requirements)
  const traceabilityMatrix = useTestExplorer((s) => s.traceabilityMatrix)
  const loadRequirements = useTestExplorer((s) => s.loadRequirements)
  const createRequirement = useTestExplorer((s) => s.createRequirement)
  const linkCaseToRequirement = useTestExplorer((s) => s.linkCaseToRequirement)

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [linkCaseIdByReq, setLinkCaseIdByReq] = useState<Record<number, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRequirements()
  }, [loadRequirements])

  async function handleCreate() {
    if (!title.trim()) return
    setSaving(true)
    try {
      await createRequirement(title.trim(), description.trim())
      setTitle('')
      setDescription('')
    } finally {
      setSaving(false)
    }
  }

  async function handleLinkCase(requirementId: number) {
    const raw = linkCaseIdByReq[requirementId]
    const caseId = Number(raw)
    if (!raw || Number.isNaN(caseId)) return
    await linkCaseToRequirement(requirementId, caseId)
    setLinkCaseIdByReq((prev) => ({ ...prev, [requirementId]: '' }))
  }

  function handleExportCsv() {
    downloadCsv(
      'traceability-matrix.csv',
      ['Requirement', 'Case IDs', 'Covered'],
      traceabilityMatrix.map((row) => [row.title, row.caseIds.join(' | '), row.covered ? 'Yes' : 'No']),
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
      <div className="flex flex-col gap-2 rounded-[10px] border border-[#E4E1DA] bg-[#FAFAF8] p-3.5">
        <div className="text-[12px] font-semibold text-[#1B1B18]">Thêm yêu cầu / user story mới</div>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Tiêu đề yêu cầu"
          className="rounded-lg border border-[#E4E1DA] bg-white px-2.5 py-1.5 text-[13px]"
        />
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Mô tả (tùy chọn)"
          className="rounded-lg border border-[#E4E1DA] bg-white px-2.5 py-1.5 text-[13px]"
        />
        <button
          onClick={handleCreate}
          disabled={!title.trim() || saving}
          className="self-start rounded-lg bg-[#3B5BDB] px-3.5 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Thêm'}
        </button>
      </div>

      <button
        onClick={handleExportCsv}
        disabled={traceabilityMatrix.length === 0}
        className="self-start rounded-lg border border-[#E4E1DA] bg-white px-3.5 py-1.5 text-[12.5px] font-semibold text-[#1B1B18] disabled:opacity-50"
      >
        Xuất Traceability Matrix (CSV)
      </button>

      {requirements.length === 0 && (
        <div className="text-[13px] text-[#84817A]">Chưa có yêu cầu nào cho Product này.</div>
      )}

      {requirements.map((req) => {
        const traceRow = traceabilityMatrix.find((r) => r.requirementId === req.id)
        const covered = traceRow?.covered ?? false
        return (
          <div key={req.id} className="flex flex-col gap-2 rounded-[10px] border border-[#E4E1DA] bg-white p-3.5">
            <div className="flex items-center gap-2.5">
              <span className="flex-grow text-[13.5px] font-semibold text-[#1B1B18]">{req.title}</span>
              <span
                className="rounded-full px-2 py-0.5 text-[10.5px] font-semibold"
                style={covered ? { background: '#EBFBEE', color: '#2B8A3E' } : { background: '#FFF5F5', color: '#C92A2A' }}
              >
                {covered ? `${traceRow!.caseIds.length} case cover` : 'Chưa có Test Case nào cover'}
              </span>
            </div>
            {req.description && <div className="text-[12px] text-[#84817A]">{req.description}</div>}
            <div className="flex items-center gap-2">
              <input
                value={linkCaseIdByReq[req.id] ?? ''}
                onChange={(e) => setLinkCaseIdByReq((prev) => ({ ...prev, [req.id]: e.target.value }))}
                placeholder="ID Test Case"
                className="w-28 rounded-lg border border-[#E4E1DA] px-2 py-1 text-[12px]"
              />
              <button
                onClick={() => handleLinkCase(req.id)}
                className="rounded-lg border border-[#E4E1DA] px-2.5 py-1 text-[12px] font-semibold text-[#1B1B18]"
              >
                Gắn Test Case
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}
