// Lighthouse JSON Report types (subset needed for viewer)
// https://github.com/GoogleChrome/lighthouse/blob/main/types/lhr.d.ts

export interface LighthouseResult {
  lighthouseVersion: string
  requestedUrl: string
  finalUrl: string
  fetchTime: string
  userAgent: string
  configSettings: {
    formFactor: 'mobile' | 'desktop'
    throttlingMethod: string
    screenEmulation?: { mobile: boolean }
  }
  categories: Record<string, LighthouseCategory>
  audits: Record<string, LighthouseAudit>
  categoryGroups?: Record<string, { title: string, description?: string }>
  timing?: { total: number }
  environment?: {
    networkUserAgent: string
    hostUserAgent: string
    benchmarkIndex: number
  }
  runWarnings?: string[]
  fullPageScreenshot?: {
    screenshot: { data: string, width: number, height: number }
  }
}

export interface LighthouseCategory {
  id: string
  title: string
  description?: string
  score: number | null
  auditRefs: Array<{
    id: string
    weight: number
    group?: string
    acronym?: string
  }>
}

export interface LighthouseAudit {
  id: string
  title: string
  description?: string
  score: number | null
  scoreDisplayMode: 'binary' | 'numeric' | 'informative' | 'notApplicable' | 'manual' | 'error'
  displayValue?: string
  numericValue?: number
  numericUnit?: 'millisecond' | 'unitless' | 'byte' | 'element'
  explanation?: string
  errorMessage?: string
  warnings?: string[]
  details?: AuditDetails
  metricSavings?: Record<string, number>
}

export type AuditDetails
  = | TableDetails
    | OpportunityDetails
    | DebugDataDetails
    | ScreenshotDetails
    | FilmstripDetails
    | CriticalRequestChainDetails
    | TreemapDetails

export interface TableDetails {
  type: 'table'
  headings: Array<{
    key: string
    itemType?: string
    text?: string
    label?: string
    granularity?: number
  }>
  items: Array<Record<string, unknown>>
  summary?: { wastedBytes?: number, wastedMs?: number }
}

export interface OpportunityDetails {
  type: 'opportunity'
  headings: Array<{
    key: string
    valueType?: string
    label?: string
  }>
  items: Array<Record<string, unknown>>
  overallSavingsBytes?: number
  overallSavingsMs?: number
}

export interface DebugDataDetails {
  type: 'debugdata'
  [key: string]: unknown
}

export interface ScreenshotDetails {
  type: 'screenshot'
  timestamp: number
  data: string
}

export interface FilmstripDetails {
  type: 'filmstrip'
  scale: number
  items: Array<{ timing: number, timestamp: number, data: string }>
}

export interface CriticalRequestChainDetails {
  type: 'criticalrequestchain'
  chains: Record<string, CriticalRequestChainNode>
  longestChain: { duration: number, length: number, transferSize: number }
}

export interface CriticalRequestChainNode {
  request: {
    url: string
    startTime: number
    endTime: number
    transferSize: number
  }
  children?: Record<string, CriticalRequestChainNode>
}

export interface TreemapDetails {
  type: 'treemap-data'
  nodes: Array<{
    name: string
    resourceBytes?: number
    unusedBytes?: number
  }>
}

// Category IDs
export type CategoryId = 'performance' | 'accessibility' | 'best-practices' | 'seo' | 'pwa'

// Performance metrics
export interface PerformanceMetric {
  id: string
  name: string
  value: number
  displayValue: string
  score: number | null
  unit: 'ms' | 'unitless'
  isCoreWebVital?: boolean
}

// Parsed report with convenience accessors
export interface ParsedLighthouseReport {
  raw: LighthouseResult
  url: string
  fetchTime: Date
  device: 'mobile' | 'desktop'
  version: string
  categories: {
    performance: LighthouseCategory | null
    accessibility: LighthouseCategory | null
    bestPractices: LighthouseCategory | null
    seo: LighthouseCategory | null
    pwa: LighthouseCategory | null
  }
  performanceMetrics: PerformanceMetric[]
  opportunities: LighthouseAudit[]
  diagnostics: LighthouseAudit[]
  passedAudits: LighthouseAudit[]
  screenshot: { data: string, width: number, height: number } | null
}
