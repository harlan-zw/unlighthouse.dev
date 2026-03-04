export type FormFactor = 'PHONE' | 'DESKTOP'

export function useFormFactorBridge(formFactor: Ref<FormFactor>) {
  const device = computed<'mobile' | 'desktop'>({
    get: () => formFactor.value === 'DESKTOP' ? 'desktop' : 'mobile',
    set: (v: 'mobile' | 'desktop') => { formFactor.value = v === 'desktop' ? 'DESKTOP' : 'PHONE' },
  })

  return { device }
}
