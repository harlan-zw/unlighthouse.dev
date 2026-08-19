import type { ParsedHar } from '../utils/har'
import { parseHar } from '../utils/har'

export function useToolHarReport() {
  const report = ref<ParsedHar | null>(null)
  const error = ref<string | null>(null)
  const loading = ref(false)

  function apply(input: string) {
    const outcome = parseHar(input)
    if (outcome._tag === 'Err')
      error.value = outcome.message
    else
      report.value = outcome.report
    loading.value = false
  }

  function loadFromFile(file: File): Promise<void> {
    loading.value = true
    error.value = null

    return new Promise<void>((resolve) => {
      const reader = new FileReader()
      // `FileReader` runs this outside the promise chain, so a throw here reaches
      // `window.onerror` and no `catch` below can see it. `parseHar` returns its
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

  return { report, error, loading, loadFromFile, loadFromText, clear }
}
