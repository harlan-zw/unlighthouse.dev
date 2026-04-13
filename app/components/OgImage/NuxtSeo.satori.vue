<script setup lang="ts">
defineProps({
  colorMode: { type: String, required: false, default: 'light' },
  title: { type: String, required: false, default: 'title' },
  description: { type: String, required: false },
  isPro: { type: Boolean, required: false },
  theme: { type: String, required: false, default: '#22c55e' },
})
</script>

<template>
  <div
    class="w-full h-full flex flex-col justify-center items-center relative p-[60px]"
    :class="[
      colorMode === 'light' ? ['bg-white', 'text-neutral-900'] : ['bg-neutral-900', 'text-neutral-50'],
    ]"
  >
    <!-- Your background and logo SVGs here (omitted for brevity) -->
    <div class="relative flex flex-col items-center text-center gap-8">
      <h1 class="text-[80px] font-bold m-0 leading-tight max-w-[1000px]">
        {{ title }}
      </h1>
      <p v-if="description" class="text-[32px] opacity-70 max-w-[900px] leading-relaxed">
        {{ description }}
      </p>
    </div>
  </div>
</template>

<style>
:root{font-family:Hubot Sans}
</style>
