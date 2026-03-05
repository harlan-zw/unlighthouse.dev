export function useToolFloatingLoader(loading: Ref<boolean>, containerRef: Ref<HTMLElement | ComponentPublicInstance | null>) {
  const showFloatingLoader = ref(false)

  onMounted(() => {
    const handleScroll = () => {
      if (!loading.value || !containerRef.value) {
        showFloatingLoader.value = false
        return
      }
      const el = '$el' in containerRef.value ? containerRef.value.$el as HTMLElement : containerRef.value
      const rect = el.getBoundingClientRect()
      showFloatingLoader.value = rect.bottom < 0
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  })

  return { showFloatingLoader }
}
