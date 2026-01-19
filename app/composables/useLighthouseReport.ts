import type {
  LighthouseAudit,
  LighthouseCategory,
  LighthouseResult,
  ParsedLighthouseReport,
  PerformanceMetric,
} from '~/types/lighthouse'

// Performance metric definitions
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

function getDevice(report: LighthouseResult): 'mobile' | 'desktop' {
  if (report.configSettings.formFactor)
    return report.configSettings.formFactor
  if (report.configSettings.screenEmulation?.mobile)
    return 'mobile'
  return 'desktop'
}

function extractPerformanceMetrics(report: LighthouseResult): PerformanceMetric[] {
  const metrics: PerformanceMetric[] = []

  for (const id of PERF_METRIC_IDS) {
    const audit = report.audits[id]
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

function getAuditsByType(report: LighthouseResult, category: LighthouseCategory | undefined) {
  if (!category)
    return { opportunities: [], diagnostics: [], passed: [] }

  const opportunities: LighthouseAudit[] = []
  const diagnostics: LighthouseAudit[] = []
  const passed: LighthouseAudit[] = []

  for (const ref of category.auditRefs) {
    const audit = report.audits[ref.id]
    if (!audit)
      continue

    // Skip metrics, they're handled separately
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

  // Sort opportunities by savings
  opportunities.sort((a, b) => {
    const aSavings = a.details?.type === 'opportunity'
      ? (a.details.overallSavingsMs ?? 0)
      : 0
    const bSavings = b.details?.type === 'opportunity'
      ? (b.details.overallSavingsMs ?? 0)
      : 0
    return bSavings - aSavings
  })

  return { opportunities, diagnostics, passed }
}

function parseReport(input: string | object): ParsedLighthouseReport {
  const raw: LighthouseResult = typeof input === 'string' ? JSON.parse(input) : input

  // Validate it's a Lighthouse report
  if (!raw.lighthouseVersion || !raw.categories) {
    throw new Error('Invalid Lighthouse report format. Expected lighthouseVersion and categories.')
  }

  const perfCategory = raw.categories.performance
  const { opportunities, diagnostics, passed } = getAuditsByType(raw, perfCategory)

  return {
    raw,
    url: raw.finalUrl || raw.requestedUrl,
    fetchTime: new Date(raw.fetchTime),
    device: getDevice(raw),
    version: raw.lighthouseVersion,
    categories: {
      performance: raw.categories.performance ?? null,
      accessibility: raw.categories.accessibility ?? null,
      bestPractices: raw.categories['best-practices'] ?? null,
      seo: raw.categories.seo ?? null,
      pwa: raw.categories.pwa ?? null,
    },
    performanceMetrics: extractPerformanceMetrics(raw),
    opportunities,
    diagnostics,
    passedAudits: passed,
    screenshot: raw.fullPageScreenshot?.screenshot ?? null,
  }
}

export function useLighthouseReport() {
  const report = ref<ParsedLighthouseReport | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function loadReport(input: string | object) {
    error.value = null
    report.value = parseReport(input)
  }

  function loadFromFile(file: File): Promise<void> {
    loading.value = true
    error.value = null

    return new Promise<void>((resolve) => {
      const reader = new FileReader()

      reader.onload = (e) => {
        const content = e.target?.result as string
        report.value = parseReport(content)
        loading.value = false
        resolve()
      }

      reader.onerror = () => {
        error.value = 'Failed to read file'
        loading.value = false
        resolve()
      }

      reader.readAsText(file)
    }).catch((err: Error) => {
      error.value = err.message || 'Failed to parse JSON'
      loading.value = false
    })
  }

  function loadFromText(text: string) {
    loading.value = true
    error.value = null

    Promise.resolve()
      .then(() => {
        report.value = parseReport(text)
        loading.value = false
      })
      .catch((err) => {
        error.value = err.message || 'Failed to parse JSON'
        loading.value = false
      })
  }

  function clear() {
    report.value = null
    error.value = null
  }

  // Computed helpers
  const hasPerformance = computed(() => !!report.value?.categories.performance)
  const hasAccessibility = computed(() => !!report.value?.categories.accessibility)
  const hasBestPractices = computed(() => !!report.value?.categories.bestPractices)
  const hasSeo = computed(() => !!report.value?.categories.seo)
  const hasPwa = computed(() => !!report.value?.categories.pwa)

  const allCategories = computed(() => {
    if (!report.value)
      return []

    return [
      { id: 'performance', label: 'Performance', category: report.value.categories.performance },
      { id: 'accessibility', label: 'Accessibility', category: report.value.categories.accessibility },
      { id: 'best-practices', label: 'Best Practices', category: report.value.categories.bestPractices },
      { id: 'seo', label: 'SEO', category: report.value.categories.seo },
      { id: 'pwa', label: 'PWA', category: report.value.categories.pwa },
    ].filter(c => c.category !== null)
  })

  return {
    report,
    error,
    loading,
    loadReport,
    loadFromFile,
    loadFromText,
    clear,
    hasPerformance,
    hasAccessibility,
    hasBestPractices,
    hasSeo,
    hasPwa,
    allCategories,
  }
}

// Formatting helpers
export function formatBytes(bytes: number): string {
  if (bytes === 0)
    return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${Number.parseFloat((bytes / k ** i).toFixed(1))} ${sizes[i]}`
}

export function formatMs(ms: number): string {
  if (ms >= 1000)
    return `${(ms / 1000).toFixed(1)} s`
  return `${Math.round(ms)} ms`
}

export function getScoreRating(score: number | null): 'pass' | 'average' | 'fail' | 'unknown' {
  if (score === null)
    return 'unknown'
  if (score >= 0.9)
    return 'pass'
  if (score >= 0.5)
    return 'average'
  return 'fail'
}

export function getScoreColorClass(score: number | null): string {
  const rating = getScoreRating(score)
  switch (rating) {
    case 'pass':
      return 'text-green-600 dark:text-green-400'
    case 'average':
      return 'text-orange-600 dark:text-orange-400'
    case 'fail':
      return 'text-red-600 dark:text-red-400'
    default:
      return 'text-gray-500'
  }
}

export function getScoreBgClass(score: number | null): string {
  const rating = getScoreRating(score)
  switch (rating) {
    case 'pass':
      return 'bg-green-500'
    case 'average':
      return 'bg-orange-500'
    case 'fail':
      return 'bg-red-500'
    default:
      return 'bg-gray-400'
  }
}
