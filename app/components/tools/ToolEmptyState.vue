<script setup lang="ts">
defineProps<{
  icon: string
  message: string
  hint?: string
}>()
</script>

<template>
  <div class="p-8 text-center text-gray-500">
    <UIcon :name="icon" class="w-12 h-12 mx-auto mb-3 opacity-30" />
    <p>{{ message }}</p>
    <p v-if="hint" class="text-xs mt-2">
      {{ hint }}
    </p>
  </div>
</template>
