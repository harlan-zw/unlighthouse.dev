<script setup lang="ts">
const PsiServerMapClient = defineAsyncComponent(() => import('./PsiServerMapClient.vue'))
const { target: mapRoot, isVisible: shouldLoadMap } = useVisibleWhenNearViewport({
  rootMargin: '900px 0px',
  idleTimeout: 4000,
})
</script>

<template>
  <div ref="mapRoot" class="my-6 min-h-[462px]">
    <div
      v-if="!shouldLoadMap"
      aria-hidden="true"
      class="rounded-xl border border-default overflow-hidden bg-elevated"
    >
      <div class="h-[360px] relative bg-default">
        <div class="absolute inset-8 rounded-full border border-default opacity-70" />
        <div class="absolute inset-16 rounded-full border border-default opacity-50" />
        <div class="absolute left-[24%] top-[36%] size-3 rounded-full bg-primary" />
        <div class="absolute left-[46%] top-[31%] size-3 rounded-full bg-primary" />
        <div class="absolute left-[70%] top-[48%] size-3 rounded-full bg-primary" />
        <div class="absolute left-[82%] top-[57%] size-3 rounded-full bg-primary" />
      </div>
      <div class="p-4 border-t border-default">
        <div class="h-8 w-56 rounded-md bg-accented" />
      </div>
    </div>
    <ClientOnly>
      <PsiServerMapClient v-if="shouldLoadMap" />
    </ClientOnly>
  </div>
</template>
