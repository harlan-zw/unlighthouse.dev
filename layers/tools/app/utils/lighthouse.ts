import type {
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
  'total-blocking-time', // Proxy for INP in lab
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

function getAuditsByType(audits: Record<string, LighthouseAudit>, category: LighthouseCategory | undefined) {
  const opportunities: LighthouseAudit[] = []
  const diagnostics: LighthouseAudit[] = []
  const passed: LighthouseAudit[] = []

  const refs = Array.isArray(category?.auditRefs) ? category.auditRefs : []

  for (const ref of refs) {
    const audit = audits[ref?.id]
    if (!audit)
      continue

    // Metrics render in their own panel, so they never join the audit lists.
    if (ref.group === 'metrics')
      continue

    if (audit.score === 1 || audit.scoreDisplayMode === 'notApplicable') {
      passed.push(audit)
    }
    else if (audit.details?.type === 'opportunity') {
      opportunities.push(audit)
    }
    else if (ref.group === 'diagnostics' || audit.scoreDisplayMode === 'informative') {
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

  return { opportunities, diagnostics, passed }
}

function readCategory(categories: Record<string, any>, id: string): LighthouseCategory | null {
  const category = categories[id]
  return isRecord(category) ? category as LighthouseCategory : null
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
  const { opportunities, diagnostics, passed } = getAuditsByType(audits, performance ?? undefined)

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
        pwa: readCategory(categories, 'pwa'),
      },
      performanceMetrics: extractPerformanceMetrics(audits),
      opportunities,
      diagnostics,
      passedAudits: passed,
      screenshot,
    },
  }
}
