import { create } from 'zustand'
import { api } from '../api/client'
import type {
  CaseDetail,
  Category,
  Environment,
  GraphData,
  Product,
  Requirement,
  TestCase,
  TestSuite,
  TestType,
  TraceabilityRow,
  TypeTimelineRow,
} from '../api/types'

interface TestExplorerState {
  products: Product[]
  testTypes: TestType[]
  suites: TestSuite[]
  cases: TestCase[]
  environments: Environment[]
  categories: Category[]
  requirements: Requirement[]
  traceabilityMatrix: TraceabilityRow[]
  graphData: GraphData | null
  typeTimeline: TypeTimelineRow[]
  selectedProductId: number | null
  selectedTestTypeId: number | null
  selectedSuiteId: number | null
  selectedCaseId: number | null
  selectedCategoryModule: string | null
  caseDetail: CaseDetail | null

  loadInitial: () => Promise<void>
  selectTestType: (testTypeId: number) => Promise<void>
  selectSuite: (suiteId: number) => Promise<void>
  selectCase: (caseId: number) => Promise<void>
  retryCase: (caseId: number) => Promise<void>
  loadEnvironments: () => Promise<void>
  createEnvironment: (name: string, deviceInfo: string | null) => Promise<void>
  loadCategories: () => Promise<void>
  selectCategory: (module: string | null) => void
  loadRequirements: () => Promise<void>
  createRequirement: (title: string, description: string) => Promise<void>
  linkCaseToRequirement: (requirementId: number, testCaseId: number) => Promise<void>
  loadGraphData: () => Promise<void>
  loadTypeTimeline: () => Promise<void>
}

const initialState = {
  products: [],
  testTypes: [],
  suites: [],
  cases: [],
  environments: [],
  categories: [],
  requirements: [],
  traceabilityMatrix: [],
  graphData: null,
  typeTimeline: [],
  selectedProductId: null,
  selectedTestTypeId: null,
  selectedSuiteId: null,
  selectedCaseId: null,
  selectedCategoryModule: null,
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
    set({
      selectedTestTypeId: testTypeId,
      selectedSuiteId: null,
      selectedCaseId: null,
      caseDetail: null,
      cases: [],
      categories: [],
      selectedCategoryModule: null,
    })
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

  async loadEnvironments() {
    const { selectedProductId } = get()
    if (selectedProductId === null) return
    const environments = await api.listEnvironments(selectedProductId)
    set({ environments })
  },

  async createEnvironment(name, deviceInfo) {
    const { selectedProductId } = get()
    if (selectedProductId === null) return
    await api.createEnvironment(selectedProductId, name, deviceInfo)
    const environments = await api.listEnvironments(selectedProductId)
    set({ environments })
  },

  async loadCategories() {
    const { selectedProductId, selectedTestTypeId } = get()
    if (selectedProductId === null || selectedTestTypeId === null) return
    const categories = await api.listCategories(selectedProductId, selectedTestTypeId)
    set({ categories })
  },

  selectCategory(module) {
    set({ selectedCategoryModule: module })
  },

  async loadRequirements() {
    const { selectedProductId } = get()
    if (selectedProductId === null) return
    const [requirements, traceabilityMatrix] = await Promise.all([
      api.listRequirements(selectedProductId),
      api.getTraceabilityMatrix(selectedProductId),
    ])
    set({ requirements, traceabilityMatrix })
  },

  async createRequirement(title, description) {
    const { selectedProductId } = get()
    if (selectedProductId === null) return
    await api.createRequirement(selectedProductId, title, description)
    const [requirements, traceabilityMatrix] = await Promise.all([
      api.listRequirements(selectedProductId),
      api.getTraceabilityMatrix(selectedProductId),
    ])
    set({ requirements, traceabilityMatrix })
  },

  async linkCaseToRequirement(requirementId, testCaseId) {
    const { selectedProductId } = get()
    await api.linkCase(requirementId, testCaseId)
    if (selectedProductId === null) return
    const traceabilityMatrix = await api.getTraceabilityMatrix(selectedProductId)
    set({ traceabilityMatrix })
  },

  async loadGraphData() {
    const { selectedProductId, selectedTestTypeId } = get()
    if (selectedProductId === null || selectedTestTypeId === null) return
    const graphData = await api.getGraphData(selectedProductId, selectedTestTypeId)
    set({ graphData })
  },

  async loadTypeTimeline() {
    const { selectedProductId, selectedTestTypeId } = get()
    if (selectedProductId === null || selectedTestTypeId === null) return
    const typeTimeline = await api.getTypeTimeline(selectedProductId, selectedTestTypeId)
    set({ typeTimeline })
  },
}))
