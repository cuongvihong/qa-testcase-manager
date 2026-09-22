import { create } from 'zustand'
import { api } from '../api/client'
import type { CaseDetail, Product, TestCase, TestSuite, TestType } from '../api/types'

interface TestExplorerState {
  products: Product[]
  testTypes: TestType[]
  suites: TestSuite[]
  cases: TestCase[]
  selectedProductId: number | null
  selectedTestTypeId: number | null
  selectedSuiteId: number | null
  selectedCaseId: number | null
  caseDetail: CaseDetail | null

  loadInitial: () => Promise<void>
  selectTestType: (testTypeId: number) => Promise<void>
  selectSuite: (suiteId: number) => Promise<void>
  selectCase: (caseId: number) => Promise<void>
  retryCase: (caseId: number) => Promise<void>
}

const initialState = {
  products: [],
  testTypes: [],
  suites: [],
  cases: [],
  selectedProductId: null,
  selectedTestTypeId: null,
  selectedSuiteId: null,
  selectedCaseId: null,
  caseDetail: null,
} satisfies Partial<TestExplorerState>

export const useTestExplorer = create<TestExplorerState>((set, get) => ({
  ...initialState,

  async loadInitial() {
    const [products, testTypes] = await Promise.all([api.listProducts(), api.listTestTypes()])
    set({ products, testTypes })

    const productId = products[0]?.id ?? null
    const testTypeId = testTypes[0]?.id ?? null
    set({ selectedProductId: productId, selectedTestTypeId: testTypeId })

    if (productId !== null && testTypeId !== null) {
      const suites = await api.listSuites(productId, testTypeId)
      set({ suites })
    }
  },

  async selectTestType(testTypeId) {
    const { selectedProductId } = get()
    set({ selectedTestTypeId: testTypeId, selectedSuiteId: null, selectedCaseId: null, caseDetail: null, cases: [] })
    if (selectedProductId === null) return
    const suites = await api.listSuites(selectedProductId, testTypeId)
    set({ suites })
  },

  async selectSuite(suiteId) {
    set({ selectedSuiteId: suiteId, selectedCaseId: null, caseDetail: null })
    const cases = await api.listCases(suiteId)
    set({ cases })
  },

  async selectCase(caseId) {
    set({ selectedCaseId: caseId })
    const caseDetail = await api.getCase(caseId)
    set({ caseDetail })
  },

  async retryCase(caseId) {
    await api.retryCase(caseId)
    const caseDetail = await api.getCase(caseId)
    set({ caseDetail })
  },
}))
