<script setup lang="ts">
defineProps<{
  error: string | null
}>()
</script>

<template>
  <UAlert
    v-if="error"
    color="error"
    variant="subtle"
    icon="i-heroicons-exclamation-circle"
    class="mx-4 sm:mx-6 my-4"
  >
    <template #title>
      {{ error }}
    </template>
  </UAlert>
</template>
