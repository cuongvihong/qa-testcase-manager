export interface TestType {
  id: number
  name: string
}

export interface Product {
  id: number
  name: string
  description: string
  owner_id: number | null
  created_at: string
}

export type SuitePriority = 'High' | 'Medium' | 'Low'
export type SuiteStatus = 'Active' | 'Deprecated' | 'Draft'

export interface TestSuite {
  id: number
  product_id: number
  test_type_id: number
  name: string
  description: string
  module: string
  owner_id: number | null
  priority: SuitePriority
  status: SuiteStatus
  created_at: string
  updated_at: string
}

export type CaseStatus = 'Not Run' | 'In Progress' | 'Pass' | 'Fail' | 'Blocked' | 'Skipped'

export interface TestCase {
  id: number
  suite_id: number
  title: string
  description: string
  current_status: CaseStatus
  is_auto_created: boolean
  created_at: string
  updated_at: string
}

export interface TestRun {
  id: number
  test_case_id: number
  executed_by: number | null
  result: 'Pass' | 'Fail' | 'Blocked' | 'Skipped'
  build_version: string
  environment_id: number | null
  error_note: string | null
  bug_ticket_link: string | null
  retry_of_run_id: number | null
  duration_ms: number | null
  executed_at: string
}

export interface CaseDetail {
  case: TestCase
  runs: TestRun[]
}

export interface Environment {
  id: number
  product_id: number
  name: string
  device_info: string | null
}

export interface Category {
  module: string
  suiteIds: number[]
  caseCount: number
  passRate: number
}

export interface Requirement {
  id: number
  product_id: number
  title: string
  description: string
  created_at: string
}

export interface TraceabilityRow {
  requirementId: number
  title: string
  caseIds: number[]
  covered: boolean
}

export interface TrendPoint {
  date: string
  passRate: number
}

export interface GraphData {
  statusCounts: Record<CaseStatus, number>
  trend: TrendPoint[]
  coveragePercent: number | null
}

export interface TypeTimelineRow {
  runId: number
  testCaseId: number
  testCaseTitle: string
  result: 'Pass' | 'Fail' | 'Blocked' | 'Skipped'
  buildVersion: string
  executedAt: string
}

export type ReportScope = 'Product' | 'Suite'

export interface ReportExport {
  id: number
  product_id: number
  scope: string
  format: 'PDF' | 'Excel' | 'CSV'
  exported_by: number | null
  exported_at: string
  file_path: string | null
}
