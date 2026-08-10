<script setup lang="ts">
const store = useToolBackgroundRequests()
const route = useRoute()
const toast = useToast()

const requestStatuses = computed(() => Object.fromEntries(
  Object.entries(store.value).map(([id, request]) => [id, request.status]),
))

watch(requestStatuses, (current, previous) => {
  for (const [id, status] of Object.entries(current)) {
    const request = store.value[id]
    if (!request || previous[id] !== 'loading' || status === 'loading' || route.path === request.path)
      continue

    if (status === 'success') {
      toast.add({
        title: `${request.title} ready`,
        description: `Results for ${request.url}`,
        icon: 'i-heroicons-check-circle',
        color: 'success',
        actions: [{
          label: 'View Results',
          onClick: async () => {
            await navigateTo(request.path)
          },
        }],
      })
    }
    else {
      toast.add({
        title: `${request.title} failed`,
        description: request.error || 'Request failed',
        icon: 'i-heroicons-x-circle',
        color: 'error',
      })
    }
  }
}, { flush: 'sync' })

const backgroundRequests = computed(() =>
  Object.values(store.value).filter(r =>
    r.status === 'loading' && route.path !== r.path,
  ),
)

const activeRequest = computed(() => backgroundRequests.value[0])
const { elapsedLabel } = useToolElapsed(() => activeRequest.value?.startedAt)
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition-all duration-300"
      enter-from-class="opacity-0 translate-y-2"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200"
      leave-from-class="opacity-100 translate-y-0"
      leave-to-class="opacity-0 translate-y-2"
    >
      <NuxtLink
        v-if="activeRequest"
        :to="activeRequest.path"
        role="status"
        aria-live="polite"
        aria-busy="true"
        class="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 inline-flex items-center gap-3 px-4 py-2.5 rounded-full bg-white dark:bg-gray-800 shadow-lg border border-gray-200 dark:border-gray-700 hover:border-violet-300 dark:hover:border-violet-600 transition-colors cursor-pointer group"
      >
        <UIcon name="i-heroicons-arrow-path" class="w-4 h-4 text-violet-500 animate-spin motion-reduce:animate-none" />
        <span class="text-sm text-gray-700 dark:text-gray-300">
          {{ activeRequest.title }}
          <span class="text-gray-400">running · {{ elapsedLabel }}</span>
        </span>
        <span v-if="backgroundRequests.length > 1" class="text-xs text-gray-400">
          +{{ backgroundRequests.length - 1 }}
        </span>
        <UIcon name="i-heroicons-arrow-right" class="w-3.5 h-3.5 text-gray-400 group-hover:translate-x-0.5 transition-transform" />
      </NuxtLink>
    </Transition>
  </Teleport>
</template>
