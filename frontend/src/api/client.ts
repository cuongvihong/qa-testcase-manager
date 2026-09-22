import type { CaseDetail, Product, TestCase, TestSuite, TestType } from './types'

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
}
