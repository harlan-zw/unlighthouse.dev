<script setup lang="ts">
const props = defineProps<{
  placeholder?: string
  loading?: boolean
  loadingText?: string
  buttonText?: string
  buttonClass?: string
}>()

const emit = defineEmits<{ submit: [] }>()
const model = defineModel<string>({ default: '' })

function handleSubmit() {
  if (model.value.trim())
    emit('submit')
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter')
    handleSubmit()
}

// Connect to ToolInputGlow if present
const glowContext = inject<{ onFocus: () => void, onBlur: () => void } | null>('toolInputGlow', null)

function onFocus() {
  glowContext?.onFocus()
}

function onBlur() {
  glowContext?.onBlur()
}
</script>

<template>
  <form class="flex flex-col sm:flex-row gap-3" @submit.prevent="handleSubmit">
    <UInput
      v-model="model"
      :placeholder="placeholder || 'https://example.com'"
      size="lg"
      class="flex-1"
      icon="i-heroicons-globe-alt"
      :disabled="loading"
      @keydown="handleKeydown"
      @focus="onFocus"
      @blur="onBlur"
    />
    <UButton
      type="submit"
      size="lg"
      :loading="loading"
      :disabled="!model.trim() || loading"
      :class="buttonClass"
    >
      {{ loading ? (loadingText || 'Analyzing...') : (buttonText || 'Analyze') }}
    </UButton>
  </form>
</template>
