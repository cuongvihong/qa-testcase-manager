import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, TestCase, TestSuite, TestType } from '../api/types'

const mockApi = {
  listProducts: vi.fn(),
  listTestTypes: vi.fn(),
  listSuites: vi.fn(),
  listCases: vi.fn(),
  getCase: vi.fn(),
  retryCase: vi.fn(),
}

vi.mock('../api/client', () => ({ api: mockApi }))

const { useTestExplorer } = await import('./testExplorer')

const product: Product = { id: 1, name: 'Website Ban Hang', description: '', owner_id: null, created_at: '' }
const testType: TestType = { id: 3, name: 'UI Test' }
const suite: TestSuite = {
  id: 10,
  product_id: 1,
  test_type_id: 3,
  name: 'Bo test dang nhap',
  description: '',
  module: '',
  owner_id: null,
  priority: 'Medium',
  status: 'Active',
  created_at: '',
  updated_at: '',
}
const testCase: TestCase = {
  id: 100,
  suite_id: 10,
  title: 'Dang nhap hop le',
  description: '',
  current_status: 'Pass',
  is_auto_created: false,
  created_at: '',
  updated_at: '',
}

beforeEach(() => {
  vi.clearAllMocks()
  useTestExplorer.setState(useTestExplorer.getInitialState())
})

describe('loadInitial', () => {
  it('fetches products+testTypes and auto-selects the first of each', async () => {
    mockApi.listProducts.mockResolvedValue([product])
    mockApi.listTestTypes.mockResolvedValue([testType])
    mockApi.listSuites.mockResolvedValue([])

    await useTestExplorer.getState().loadInitial()

    const state = useTestExplorer.getState()
    expect(state.products).toEqual([product])
    expect(state.testTypes).toEqual([testType])
    expect(state.selectedProductId).toBe(1)
    expect(state.selectedTestTypeId).toBe(3)
  })

  it('does not crash and leaves selection empty when there is no product yet', async () => {
    mockApi.listProducts.mockResolvedValue([])
    mockApi.listTestTypes.mockResolvedValue([])

    await useTestExplorer.getState().loadInitial()

    const state = useTestExplorer.getState()
    expect(state.selectedProductId).toBeNull()
    expect(state.selectedTestTypeId).toBeNull()
    expect(state.suites).toEqual([])
  })
})

describe('selectTestType', () => {
  it('fetches suites for the newly selected test type and clears case selection', async () => {
    mockApi.listSuites.mockResolvedValue([suite])
    useTestExplorer.setState({ selectedProductId: 1, selectedCaseId: 999, caseDetail: null })

    await useTestExplorer.getState().selectTestType(3)

    expect(mockApi.listSuites).toHaveBeenCalledWith(1, 3)
    const state = useTestExplorer.getState()
    expect(state.selectedTestTypeId).toBe(3)
    expect(state.suites).toEqual([suite])
    expect(state.selectedSuiteId).toBeNull()
    expect(state.selectedCaseId).toBeNull()
  })
})

describe('selectSuite', () => {
  it('fetches cases for the suite and clears case selection', async () => {
    mockApi.listCases.mockResolvedValue([testCase])
    useTestExplorer.setState({ selectedCaseId: 999 })

    await useTestExplorer.getState().selectSuite(10)

    expect(mockApi.listCases).toHaveBeenCalledWith(10)
    const state = useTestExplorer.getState()
    expect(state.selectedSuiteId).toBe(10)
    expect(state.cases).toEqual([testCase])
    expect(state.selectedCaseId).toBeNull()
  })
})

describe('selectCase', () => {
  it('fetches full case detail (with runs) and stores it', async () => {
    const detail = { case: testCase, runs: [] }
    mockApi.getCase.mockResolvedValue(detail)

    await useTestExplorer.getState().selectCase(100)

    expect(mockApi.getCase).toHaveBeenCalledWith(100)
    const state = useTestExplorer.getState()
    expect(state.selectedCaseId).toBe(100)
    expect(state.caseDetail).toEqual(detail)
  })
})

describe('retryCase', () => {
  it('posts the retry and refreshes the case detail so the new run appears', async () => {
    const newRun = { id: 200, test_case_id: 100, result: 'Pass', retry_of_run_id: 1 }
    const refreshedDetail = { case: testCase, runs: [newRun] }
    mockApi.retryCase.mockResolvedValue(newRun)
    mockApi.getCase.mockResolvedValue(refreshedDetail)
    useTestExplorer.setState({ selectedCaseId: 100 })

    await useTestExplorer.getState().retryCase(100)

    expect(mockApi.retryCase).toHaveBeenCalledWith(100)
    expect(mockApi.getCase).toHaveBeenCalledWith(100)
    expect(useTestExplorer.getState().caseDetail).toEqual(refreshedDetail)
  })
})
