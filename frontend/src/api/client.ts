import type {
  CaseDetail,
  CaseSearchRow,
  Category,
  Environment,
  GraphData,
  Product,
  ReportExport,
  ReportFormat,
  ReportScope,
  Requirement,
  TestCase,
  TestRun,
  TestSuite,
  TestType,
  TraceabilityRow,
  TypeTimelineRow,
} from './types'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const resp = await fetch(`/api${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...init,
  })
  if (!resp.ok) {
    throw new Error(`${init?.method ?? 'GET'} ${path} failed: ${resp.status}`)
  }
  return resp.json() as Promise<T>
}

export const api = {
  listProducts: () => request<Product[]>('/products'),
  listTestTypes: () => request<TestType[]>('/test-types'),
  listSuites: (productId: number, testTypeId: number) =>
    request<TestSuite[]>(`/products/${productId}/test-types/${testTypeId}/suites`),
  listCases: (suiteId: number) => request<TestCase[]>(`/suites/${suiteId}/cases`),
  getCase: (caseId: number) => request<CaseDetail>(`/cases/${caseId}`),
  retryCase: (caseId: number) => request<TestRun>(`/cases/${caseId}/retry`, { method: 'POST' }),
  listEnvironments: (productId: number) => request<Environment[]>(`/products/${productId}/environments`),
  createEnvironment: (productId: number, name: string, deviceInfo: string | null) =>
    request<Environment>('/environments', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, name, device_info: deviceInfo }),
    }),
  listCategories: (productId: number, testTypeId: number) =>
    request<Category[]>(`/products/${productId}/test-types/${testTypeId}/categories`),
  searchCases: (
    productId: number,
    testTypeId: number,
    filters: { q?: string; priority?: string; module?: string },
  ) => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.priority) params.set('priority', filters.priority)
    if (filters.module) params.set('module', filters.module)
    const qs = params.toString()
    return request<CaseSearchRow[]>(
      `/products/${productId}/test-types/${testTypeId}/cases/search${qs ? `?${qs}` : ''}`,
    )
  },
  listRequirements: (productId: number) => request<Requirement[]>(`/products/${productId}/requirements`),
  createRequirement: (productId: number, title: string, description: string) =>
    request<Requirement>('/requirements', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, title, description }),
    }),
  linkCase: (requirementId: number, testCaseId: number) =>
    request(`/requirements/${requirementId}/link-case`, {
      method: 'POST',
      body: JSON.stringify({ test_case_id: testCaseId }),
    }),
  getTraceabilityMatrix: (productId: number) =>
    request<TraceabilityRow[]>(`/products/${productId}/traceability-matrix`),
  getGraphData: (productId: number, testTypeId: number) =>
    request<GraphData>(`/products/${productId}/test-types/${testTypeId}/graph-data`),
  getTypeTimeline: (productId: number, testTypeId: number) =>
    request<TypeTimelineRow[]>(`/products/${productId}/test-types/${testTypeId}/timeline`),
  listReports: (productId: number) => request<ReportExport[]>(`/products/${productId}/reports`),
  exportReport: (productId: number, scope: ReportScope, suiteId: number | null, format: ReportFormat) =>
    request<ReportExport>('/reports/export', {
      method: 'POST',
      body: JSON.stringify({ product_id: productId, scope, suite_id: suiteId, format }),
    }),
  downloadReportUrl: (reportId: number) => `/api/reports/${reportId}/download`,
}
