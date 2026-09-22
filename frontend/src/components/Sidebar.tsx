import { useTestExplorer } from '../store/testExplorer'

export function Sidebar() {
  const testTypes = useTestExplorer((s) => s.testTypes)
  const selectedTestTypeId = useTestExplorer((s) => s.selectedTestTypeId)
  const selectTestType = useTestExplorer((s) => s.selectTestType)

  return (
    <div className="flex flex-[3_1_0%] min-w-0 flex-col overflow-y-auto bg-[#1B1B18] text-[#EAE8E2]">
      <div className="px-5 pb-2 pt-4.5 text-[11px] uppercase tracking-wide text-[#8A877E]">Loai Test</div>

      {testTypes.map((type) => {
        const active = type.id === selectedTestTypeId
        return (
          <button
            key={type.id}
            onClick={() => selectTestType(type.id)}
            className={`flex items-center gap-2.5 border-l-[3px] px-5 py-2.5 text-left text-[13.5px] ${
              active
                ? 'border-[#6C8CFF] bg-[#6C8CFF]/16 font-semibold text-white'
                : 'border-transparent text-[#C9C6BC]'
            }`}
          >
            <span
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: active ? '#6C8CFF' : '#8A877E' }}
            />
            {type.name}
          </button>
        )
      })}
    </div>
  )
}
