import type { ParsedLighthouseReport } from '../types/lighthouse'
import { computed, ref } from 'vue'
import { parseLighthouseReport } from '../utils/lighthouse'

export function useToolLighthouseReport() {
  const report = ref<ParsedLighthouseReport | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function apply(input: string | object) {
    const outcome = parseLighthouseReport(input)
    if (outcome._tag === 'Err')
      error.value = outcome.message
    else
      report.value = outcome.report
    loading.value = false
  }

  function loadReport(input: string | object) {
    error.value = null
    apply(input)
  }

  function loadFromFile(file: File): Promise<void> {
    loading.value = true
    error.value = null

    return new Promise<void>((resolve) => {
      const reader = new FileReader()
      // `FileReader` runs this outside the promise chain, so a throw here reaches
      // `window.onerror` and no `catch` below can see it. `parseLighthouseReport` returns its
      // failure instead of throwing, which is what keeps a bad upload out of Sentry.
      reader.onload = (e) => {
        apply(String(e.target?.result ?? ''))
        resolve()
      }
      reader.onerror = () => {
        error.value = 'Failed to read file'
        loading.value = false
        resolve()
      }
      reader.readAsText(file)
    })
  }

  function loadFromText(text: string) {
    loading.value = true
    error.value = null
    apply(text)
  }

  function clear() {
    report.value = null
    error.value = null
  }

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
