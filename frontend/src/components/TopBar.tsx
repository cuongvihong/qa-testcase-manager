import { useTestExplorer } from '../store/testExplorer'

export function TopBar() {
  const products = useTestExplorer((s) => s.products)
  const selectedProductId = useTestExplorer((s) => s.selectedProductId)
  const product = products.find((p) => p.id === selectedProductId)

  return (
    <div className="flex h-14 shrink-0 items-center gap-4 border-b border-[#E4E1DA] bg-white px-5">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#3B5BDB] text-xs font-bold text-white">
        QA
      </div>
      <div className="text-sm font-semibold text-[#1B1B18]">Test Case Manager</div>
      <div className="h-5 w-px bg-[#E4E1DA]" />
      <div className="flex items-center gap-2 rounded-lg border border-[#E4E1DA] bg-[#FAFAF8] px-2.5 py-1.5 text-[13px] text-[#1B1B18]">
        <span className="text-xs text-[#78766F]">Product</span>
        <span className="font-semibold">{product?.name ?? '...'}</span>
      </div>
    </div>
  )
}
