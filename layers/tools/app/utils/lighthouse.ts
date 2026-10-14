import type {
  CategoryScoreDisplay,
  LighthouseAudit,
  LighthouseCategory,
  LighthouseResult,
  ParsedLighthouseReport,
  PerformanceMetric,
} from '../types/lighthouse'

/** Why a Lighthouse JSON report could not be read. */
export type ParseLighthouseReason = 'invalid-json' | 'invalid-report'

/**
 * Outcome of reading a Lighthouse JSON report.
 *
 * A person uploads this file, so a malformed one is ordinary input, not a defect. The parser
 * returns the failure instead of throwing. Throwing is what sent every bad upload to Sentry: the
 * throw happened inside a `FileReader` callback, where no `catch` in the composable could see it.
 */
export type ParseLighthouseResult
  = | { _tag: 'Ok', report: ParsedLighthouseReport }
    | { _tag: 'Err', reason: ParseLighthouseReason, message: string }

const INVALID_JSON_MESSAGE = 'Invalid Lighthouse report. The file is not valid JSON.'
const INVALID_REPORT_MESSAGE = 'Invalid Lighthouse report. Expected a "lighthouseVersion" string and a "categories" object.'

const PERF_METRIC_IDS = [
  'first-contentful-paint',
  'speed-index',
  'largest-contentful-paint',
  'total-blocking-time',
  'cumulative-layout-shift',
  'interactive', // TTI
]

const CORE_WEB_VITALS = [
  'largest-contentful-paint',
  'cumulative-layout-shift',
]

const METRIC_SHORT_NAMES: Record<string, string> = {
  'first-contentful-paint': 'FCP',
  'speed-index': 'SI',
  'largest-contentful-paint': 'LCP',
  'total-blocking-time': 'TBT',
  'cumulative-layout-shift': 'CLS',
  'interactive': 'TTI',
}

function isRecord(value: unknown): value is Record<string, any> {
  return !!value && typeof value === 'object' && !Array.isArray(value)
}

function getDevice(settings: LighthouseResult['configSettings'] | undefined): 'mobile' | 'desktop' {
  if (settings?.formFactor === 'mobile' || settings?.formFactor === 'desktop')
    return settings.formFactor
  if (settings?.screenEmulation?.mobile)
    return 'mobile'
  return 'desktop'
}

function extractPerformanceMetrics(audits: Record<string, LighthouseAudit>): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = []

  for (const id of PERF_METRIC_IDS) {
    const audit = audits[id]
    if (!audit)
      continue

    metrics.push({
      id,
      name: METRIC_SHORT_NAMES[id] || audit.title,
      value: audit.numericValue ?? 0,
      displayValue: audit.displayValue ?? '',
      score: audit.score,
      unit: audit.numericUnit === 'unitless' ? 'unitless' : 'ms',
      isCoreWebVital: CORE_WEB_VITALS.includes(id),
    })
  }

  return metrics
}

function getAuditsByType(audits: Record<string, LighthouseAudit>, categories: Record<string, any>) {
  const opportunities: LighthouseAudit[] = []
  const diagnostics: LighthouseAudit[] = []
  const insights: LighthouseAudit[] = []
  const passedAudits: LighthouseAudit[] = []
  const notApplicableAudits: LighthouseAudit[] = []
  const manualAudits: LighthouseAudit[] = []
  const informativeAudits: LighthouseAudit[] = []
  const errorAudits: LighthouseAudit[] = []
  const refs = Object.values(categories).flatMap(category => Array.isArray(category?.auditRefs) ? category.auditRefs : [])
  const seen = new Set<string>()

  for (const ref of refs) {
    const audit = audits[ref?.id]
    if (!audit || seen.has(ref.id))
      continue
    seen.add(ref.id)

    // Metrics render in their own panel, so they never join the audit lists.
    if (ref.group === 'metrics' || ref.group === 'hidden')
      continue

    if (audit.scoreDisplayMode === 'error' || audit.errorMessage) {
      errorAudits.push(audit)
    }
    else if (audit.scoreDisplayMode === 'manual') {
      manualAudits.push(audit)
    }
    else if (audit.scoreDisplayMode === 'notApplicable') {
      notApplicableAudits.push(audit)
    }
    else if (audit.scoreDisplayMode === 'informative') {
      informativeAudits.push(audit)
    }
    else if (audit.scoreDisplayMode && !['numeric', 'binary', 'metricSavings'].includes(audit.scoreDisplayMode)) {
      informativeAudits.push(audit)
    }
    else if (audit.score !== null && audit.score >= 0.9) {
      passedAudits.push(audit)
    }
    else if (ref.group === 'insights' || audit.scoreDisplayMode === 'metricSavings' || audit.id?.endsWith('-insight')) {
      insights.push(audit)
    }
    else if (audit.details?.type === 'opportunity') {
      opportunities.push(audit)
    }
    else if (ref.group === 'diagnostics') {
      diagnostics.push(audit)
    }
    else if (audit.score !== null && audit.score < 1) {
      diagnostics.push(audit)
    }
  }

  opportunities.sort((a, b) => {
    const aSavings = a.details?.type === 'opportunity' ? (a.details.overallSavingsMs ?? 0) : 0
    const bSavings = b.details?.type === 'opportunity' ? (b.details.overallSavingsMs ?? 0) : 0
    return bSavings - aSavings
  })

  return { opportunities, diagnostics, insights, passedAudits, notApplicableAudits, manualAudits, informativeAudits, errorAudits }
}

function readCategory(categories: Record<string, any>, id: string): LighthouseCategory | null {
  const category = categories[id]
  return isRecord(category) ? category as LighthouseCategory : null
}

export function getCategoryScoreDisplay(category: LighthouseCategory, audits: Record<string, LighthouseAudit>, gatherMode?: string): CategoryScoreDisplay {
  if (category.categoryScoreDisplayMode !== 'fraction' && gatherMode !== 'snapshot' && gatherMode !== 'timespan')
    return { _tag: 'Score', score: category.score ?? null }
  let numPassed = 0
  let numPassableAudits = 0
  let totalWeight = 0
  for (const ref of Array.isArray(category.auditRefs) ? category.auditRefs : []) {
    const audit = audits[ref?.id]
    if (!audit || ref.group === 'hidden' || ['manual', 'notApplicable', 'informative'].includes(audit.scoreDisplayMode))
      continue
    numPassableAudits++
    totalWeight += ref.weight || 0
    const supportedMode = !audit.scoreDisplayMode || ['numeric', 'binary', 'metricSavings'].includes(audit.scoreDisplayMode)
    if (supportedMode && !audit.errorMessage && audit.score !== null && audit.score >= 0.9)
      numPassed++
  }
  return { _tag: 'Fraction', numPassed, numPassableAudits, score: totalWeight > 0 && numPassableAudits > 0 ? numPassed / numPassableAudits : null }
}

/**
 * Read a Lighthouse JSON report into a viewer model, or say why it could not be read.
 *
 * Chrome DevTools, the Lighthouse CLI, and the PageSpeed Insights API all produce this shape and
 * disagree about the optional keys, so every field beyond `lighthouseVersion` and `categories` is
 * read defensively rather than failing the whole upload.
 */
export function parseLighthouseReport(input: string | object): ParseLighthouseResult {
  let raw: unknown = input

  if (typeof input === 'string') {
    try {
      raw = JSON.parse(input)
    }
    catch {
      return { _tag: 'Err', reason: 'invalid-json', message: INVALID_JSON_MESSAGE }
    }
  }

  if (!isRecord(raw))
    return { _tag: 'Err', reason: 'invalid-report', message: INVALID_REPORT_MESSAGE }

  if (typeof raw.lighthouseVersion !== 'string' || !raw.lighthouseVersion || !isRecord(raw.categories))
    return { _tag: 'Err', reason: 'invalid-report', message: INVALID_REPORT_MESSAGE }

  const result = raw as unknown as LighthouseResult
  const categories = raw.categories as Record<string, any>
  const audits = isRecord(raw.audits) ? raw.audits as Record<string, LighthouseAudit> : {}
  const performance = readCategory(categories, 'performance')
  const groups = getAuditsByType(audits, categories)

  const parsedFetchTime = typeof raw.fetchTime === 'string' ? new Date(raw.fetchTime) : null
  const fetchTime = parsedFetchTime && !Number.isNaN(parsedFetchTime.getTime()) ? parsedFetchTime : null
  const screenshot = isRecord(raw.fullPageScreenshot) && isRecord(raw.fullPageScreenshot.screenshot)
    ? raw.fullPageScreenshot.screenshot as ParsedLighthouseReport['screenshot']
    : null

  return {
    _tag: 'Ok',
    report: {
      raw: result,
      url: (typeof raw.finalUrl === 'string' && raw.finalUrl) || (typeof raw.requestedUrl === 'string' ? raw.requestedUrl : ''),
      fetchTime,
      device: getDevice(isRecord(raw.configSettings) ? raw.configSettings as LighthouseResult['configSettings'] : undefined),
      version: raw.lighthouseVersion,
      categories: {
        performance,
        accessibility: readCategory(categories, 'accessibility'),
        bestPractices: readCategory(categories, 'best-practices'),
        seo: readCategory(categories, 'seo'),
        agenticBrowsing: readCategory(categories, 'agentic-browsing'),
        pwa: readCategory(categories, 'pwa'),
      },
      categoryScores: Object.fromEntries(Object.entries(categories)
        .filter(([, category]) => isRecord(category))
        .map(([id, category]) => [id, getCategoryScoreDisplay(category, audits, result.configSettings?.gatherMode)])),
      performanceMetrics: extractPerformanceMetrics(audits),
      ...groups,
      screenshot,
    },
  }
}

export interface AuditSaving {
  metric: string
  value: number
  unit: 'ms' | 'unitless' | 'bytes'
}

/** Provider estimates retain the metric's units; historical opportunity estimates retain their original units. */
export function getAuditSavings(audit: LighthouseAudit): AuditSaving[] {
  if (audit.metricSavings) {
    return Object.entries(audit.metricSavings)
      .filter(([, value]) => Number.isFinite(value) && value > 0)
      .map(([metric, value]) => ({ metric, value, unit: metric === 'CLS' ? 'unitless' : 'ms' }))
  }
  if (audit.details?.type !== 'opportunity')
    return []
  const savings: AuditSaving[] = []
  if (audit.details.overallSavingsMs)
    savings.push({ metric: 'Time', value: audit.details.overallSavingsMs, unit: 'ms' })
  if (audit.details.overallSavingsBytes)
    savings.push({ metric: 'Transfer size', value: audit.details.overallSavingsBytes, unit: 'bytes' })
  return savings
}
