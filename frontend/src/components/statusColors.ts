import type { CaseStatus, SuitePriority } from '../api/types'

export const STATUS_DOT: Record<CaseStatus, string> = {
  Pass: '#2F9E44',
  Fail: '#E03131',
  'Not Run': '#868E96',
  'In Progress': '#3B5BDB',
  Blocked: '#F08C00',
  Skipped: '#868E96',
}

export const STATUS_BADGE: Record<CaseStatus, { bg: string; fg: string }> = {
  Pass: { bg: '#EBFBEE', fg: '#2B8A3E' },
  Fail: { bg: '#FFF5F5', fg: '#C92A2A' },
  'Not Run': { bg: '#F1F3F5', fg: '#495057' },
  'In Progress': { bg: '#E7F5FF', fg: '#1971C2' },
  Blocked: { bg: '#FFF4E6', fg: '#E8590C' },
  Skipped: { bg: '#F1F3F5', fg: '#495057' },
}

export const PRIORITY_BADGE: Record<SuitePriority, { bg: string; fg: string }> = {
  High: { bg: '#FFF5F5', fg: '#C92A2A' },
  Medium: { bg: '#FFF9DB', fg: '#8A4B00' },
  Low: { bg: '#F1F3F5', fg: '#495057' },
}
