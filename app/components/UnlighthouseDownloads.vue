<script lang="ts" setup>
const colorMode = useColorMode()
const { target: chartRoot, isVisible: shouldLoadChart } = useVisibleWhenNearViewport({
  rootMargin: '900px 0px',
  idleTimeout: 4000,
})

const src = computed(() => {
  return colorMode.value === 'dark'
    ? 'https://npm.chart.dev/embed/@unlighthouse/core?primary=purple&gray=slate&theme=dark'
    : 'https://npm.chart.dev/embed/@unlighthouse/core?primary=purple&gray=slate&theme=light'
})
</script>

<template>
  <div ref="chartRoot" style="padding:56.25% 0 0 0;position:relative;min-height: 700px;">
    <div
      v-if="!shouldLoadChart"
      aria-hidden="true"
      class="absolute inset-0 bg-elevated border border-default rounded-xl overflow-hidden"
    >
      <div class="h-full p-5 flex flex-col gap-4">
        <div class="h-5 w-36 bg-accented rounded" />
        <div class="flex-1 grid grid-cols-12 items-end gap-2">
          <div v-for="height in [28, 44, 38, 62, 52, 68, 58, 72, 66, 78, 70, 84]" :key="height" class="bg-accented rounded-t" :style="{ height: `${height}%` }" />
        </div>
      </div>
    </div>
    <ClientOnly>
      <iframe v-if="shouldLoadChart" :src="src" frameborder="0" loading="lazy" allow="clipboard-write;" style="position:absolute;top:0;left:0;width:100%;height:100%;" title="NPM Chart" />
    </ClientOnly>
  </div>
</template>
