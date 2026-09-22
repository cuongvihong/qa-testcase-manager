import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Product, TestCase, TestSuite, TestType } from '../api/types'

const mockApi = {
  listProducts: vi.fn(),
  listTestTypes: vi.fn(),
  listSuites: vi.fn(),
  listCases: vi.fn(),
  getCase: vi.fn(),
  retryCase: vi.fn(),
  listEnvironments: vi.fn(),
  createEnvironment: vi.fn(),
  listCategories: vi.fn(),
  listRequirements: vi.fn(),
  createRequirement: vi.fn(),
  linkCase: vi.fn(),
  getTraceabilityMatrix: vi.fn(),
  getGraphData: vi.fn(),
  getTypeTimeline: vi.fn(),
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

describe('environments', () => {
  const env = { id: 1, product_id: 1, name: 'Staging', device_info: null }

  it('loadEnvironments fetches for the currently selected product', async () => {
    mockApi.listEnvironments.mockResolvedValue([env])
    useTestExplorer.setState({ selectedProductId: 1 })

    await useTestExplorer.getState().loadEnvironments()

    expect(mockApi.listEnvironments).toHaveBeenCalledWith(1)
    expect(useTestExplorer.getState().environments).toEqual([env])
  })

  it('loadEnvironments is a no-op when no product is selected yet', async () => {
    useTestExplorer.setState({ selectedProductId: null })

    await useTestExplorer.getState().loadEnvironments()

    expect(mockApi.listEnvironments).not.toHaveBeenCalled()
  })

  it('createEnvironment posts then refreshes the environment list', async () => {
    mockApi.createEnvironment.mockResolvedValue(env)
    mockApi.listEnvironments.mockResolvedValue([env])
    useTestExplorer.setState({ selectedProductId: 1 })

    await useTestExplorer.getState().createEnvironment('Staging', null)

    expect(mockApi.createEnvironment).toHaveBeenCalledWith(1, 'Staging', null)
    expect(mockApi.listEnvironments).toHaveBeenCalledWith(1)
    expect(useTestExplorer.getState().environments).toEqual([env])
  })
})

describe('categories', () => {
  const category = { module: 'Login', suiteIds: [10], caseCount: 3, passRate: 0.5 }

  it('loadCategories fetches for the currently selected product+testType', async () => {
    mockApi.listCategories.mockResolvedValue([category])
    useTestExplorer.setState({ selectedProductId: 1, selectedTestTypeId: 3 })

    await useTestExplorer.getState().loadCategories()

    expect(mockApi.listCategories).toHaveBeenCalledWith(1, 3)
    expect(useTestExplorer.getState().categories).toEqual([category])
  })

  it('selectCategory sets the active module filter and clears it again on null', () => {
    useTestExplorer.getState().selectCategory('Login')
    expect(useTestExplorer.getState().selectedCategoryModule).toBe('Login')

    useTestExplorer.getState().selectCategory(null)
    expect(useTestExplorer.getState().selectedCategoryModule).toBeNull()
  })
})

describe('requirements', () => {
  const req = { id: 1, product_id: 1, title: 'Dang nhap duoc', description: '', created_at: '' }
  const matrix = [{ requirementId: 1, title: 'Dang nhap duoc', caseIds: [], covered: false }]

  it('loadRequirements fetches both the requirement list and the traceability matrix for the selected product', async () => {
    mockApi.listRequirements.mockResolvedValue([req])
    mockApi.getTraceabilityMatrix.mockResolvedValue(matrix)
    useTestExplorer.setState({ selectedProductId: 1 })

    await useTestExplorer.getState().loadRequirements()

    expect(mockApi.listRequirements).toHaveBeenCalledWith(1)
    expect(mockApi.getTraceabilityMatrix).toHaveBeenCalledWith(1)
    expect(useTestExplorer.getState().requirements).toEqual([req])
    expect(useTestExplorer.getState().traceabilityMatrix).toEqual(matrix)
  })

  it('createRequirement posts then refreshes requirements + matrix', async () => {
    mockApi.createRequirement.mockResolvedValue(req)
    mockApi.listRequirements.mockResolvedValue([req])
    mockApi.getTraceabilityMatrix.mockResolvedValue(matrix)
    useTestExplorer.setState({ selectedProductId: 1 })

    await useTestExplorer.getState().createRequirement('Dang nhap duoc', '')

    expect(mockApi.createRequirement).toHaveBeenCalledWith(1, 'Dang nhap duoc', '')
    expect(useTestExplorer.getState().requirements).toEqual([req])
  })

  it('linkCaseToRequirement posts then refreshes the matrix so coverage updates', async () => {
    mockApi.linkCase.mockResolvedValue({})
    const coveredMatrix = [{ requirementId: 1, title: 'Dang nhap duoc', caseIds: [42], covered: true }]
    mockApi.getTraceabilityMatrix.mockResolvedValue(coveredMatrix)
    mockApi.listRequirements.mockResolvedValue([req])
    useTestExplorer.setState({ selectedProductId: 1 })

    await useTestExplorer.getState().linkCaseToRequirement(1, 42)

    expect(mockApi.linkCase).toHaveBeenCalledWith(1, 42)
    expect(useTestExplorer.getState().traceabilityMatrix).toEqual(coveredMatrix)
  })
})

describe('loadGraphData', () => {
  it('fetches graph data for the currently selected product+testType', async () => {
    const data = { statusCounts: { Pass: 1 }, trend: [], coveragePercent: null }
    mockApi.getGraphData.mockResolvedValue(data)
    useTestExplorer.setState({ selectedProductId: 1, selectedTestTypeId: 3 })

    await useTestExplorer.getState().loadGraphData()

    expect(mockApi.getGraphData).toHaveBeenCalledWith(1, 3)
    expect(useTestExplorer.getState().graphData).toEqual(data)
  })

  it('is a no-op when no product/testType selected', async () => {
    useTestExplorer.setState({ selectedProductId: null, selectedTestTypeId: null })

    await useTestExplorer.getState().loadGraphData()

    expect(mockApi.getGraphData).not.toHaveBeenCalled()
  })
})

describe('loadTypeTimeline', () => {
  it('fetches the TestType-scoped run timeline for the selected product+testType', async () => {
    const rows = [{ runId: 1, testCaseId: 5, testCaseTitle: 'C', result: 'Pass', buildVersion: 'v1', executedAt: '' }]
    mockApi.getTypeTimeline.mockResolvedValue(rows)
    useTestExplorer.setState({ selectedProductId: 1, selectedTestTypeId: 3 })

    await useTestExplorer.getState().loadTypeTimeline()

    expect(mockApi.getTypeTimeline).toHaveBeenCalledWith(1, 3)
    expect(useTestExplorer.getState().typeTimeline).toEqual(rows)
  })
})
