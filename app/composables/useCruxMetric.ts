import type { CruxMetricResponse } from '~~/server/api/crux/metric.post'
import type { MetricKey } from '~/utils/crux'

export type FormFactor = 'PHONE' | 'DESKTOP'

export function useCruxMetric(
  url: Ref<string>,
  metric: MetricKey,
  formFactor: Ref<FormFactor>,
) {
  const data = ref<CruxMetricResponse | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function fetch() {
    if (!url.value)
      return

    loading.value = true
    error.value = null

    $fetch<CruxMetricResponse>('/api/crux/metric', {
      method: 'POST',
      body: {
        url: url.value,
        metric,
        formFactor: formFactor.value,
      },
    })
      .then((response) => {
        data.value = response
      })
      .catch(() => {
        error.value = 'No field data available'
        data.value = null
      })
      .finally(() => {
        loading.value = false
      })
  }

  return { data, loading, error, fetch }
}
