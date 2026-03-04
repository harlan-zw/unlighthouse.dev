export function useFloatingLoader(loading: Ref<boolean>, containerRef: Ref<HTMLElement | null>) {
  const showFloatingLoader = ref(false)

  onMounted(() => {
    const handleScroll = () => {
      if (!loading.value || !containerRef.value) {
        showFloatingLoader.value = false
        return
      }
      const rect = containerRef.value.getBoundingClientRect()
      showFloatingLoader.value = rect.bottom < 0
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    onUnmounted(() => window.removeEventListener('scroll', handleScroll))
  })

  return { showFloatingLoader }
}
