import { useEffect, useState } from 'react'
import { useTestExplorer } from '../store/testExplorer'

export function EnvironmentTab() {
  const environments = useTestExplorer((s) => s.environments)
  const loadEnvironments = useTestExplorer((s) => s.loadEnvironments)
  const createEnvironment = useTestExplorer((s) => s.createEnvironment)
  const [name, setName] = useState('')
  const [deviceInfo, setDeviceInfo] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadEnvironments()
  }, [loadEnvironments])

  async function handleCreate() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await createEnvironment(name.trim(), deviceInfo.trim() || null)
      setName('')
      setDeviceInfo('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
      <div className="flex flex-col gap-2 rounded-[10px] border border-[#E4E1DA] bg-[#FAFAF8] p-3.5">
        <div className="text-[12px] font-semibold text-[#1B1B18]">Thêm môi trường mới</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Tên môi trường, ví dụ Staging"
          className="rounded-lg border border-[#E4E1DA] bg-white px-2.5 py-1.5 text-[13px]"
        />
        <input
          value={deviceInfo}
          onChange={(e) => setDeviceInfo(e.target.value)}
          placeholder="Thiết bị / trình duyệt (tùy chọn, dùng cho UI Test và Compatibility Test)"
          className="rounded-lg border border-[#E4E1DA] bg-white px-2.5 py-1.5 text-[13px]"
        />
        <button
          onClick={handleCreate}
          disabled={!name.trim() || saving}
          className="self-start rounded-lg bg-[#3B5BDB] px-3.5 py-1.5 text-[12.5px] font-semibold text-white disabled:opacity-50"
        >
          {saving ? 'Đang lưu...' : 'Thêm'}
        </button>
      </div>

      {environments.length === 0 && (
        <div className="text-[13px] text-[#84817A]">Chưa có môi trường nào cho Product này.</div>
      )}

      {environments.map((env) => (
        <div key={env.id} className="flex items-center gap-2.5 rounded-[10px] border border-[#E4E1DA] bg-white p-3.5">
          <span className="flex-grow text-[13.5px] font-semibold text-[#1B1B18]">{env.name}</span>
          {env.device_info && <span className="text-[11.5px] text-[#84817A]">{env.device_info}</span>}
        </div>
      ))}
    </div>
  )
}
