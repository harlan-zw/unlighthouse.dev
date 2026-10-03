<script setup lang="ts">
import { useClipboard } from '@vueuse/core'

const { editUrl, markdownUrl } = defineProps<{ editUrl: string, markdownUrl: string }>()
const { copy, copied } = useClipboard({ copiedDuring: 2000 })
const copying = ref(false)
const toast = useToast()
const route = useRoute()
const origin = useRequestURL().origin
const prompt = computed(() => `Read ${origin}${route.path}.md so I can ask you questions about it.`)

async function copyPage() {
  copying.value = true
  const markdown = await $fetch<string>(markdownUrl, { responseType: 'text' }).catch((error: unknown) => {
    console.warn('[docs] Could not load page Markdown', error)
    toast.add({ title: 'Could not copy page', description: 'Open Markdown and copy the page.', color: 'error' })
    return undefined
  })
  copying.value = false
  if (markdown !== undefined)
    await copy(markdown)
}

const items = computed(() => [
  [
    { label: 'Open in ChatGPT', icon: 'i-simple-icons-openai', to: `https://chatgpt.com/?hints=search&q=${encodeURIComponent(prompt.value)}`, target: '_blank' },
    { label: 'Open in Claude', to: `https://claude.ai/new?q=${encodeURIComponent(prompt.value)}`, target: '_blank' },
  ],
  [{ label: 'Edit this page', icon: 'i-simple-icons-github', to: editUrl, target: '_blank' }],
])
</script>

<template>
  <div class="flex flex-wrap items-center gap-3 text-sm text-muted">
    <UButton color="neutral" variant="ghost" :loading="copying" :icon="copied ? 'i-carbon-checkmark' : 'i-carbon-copy'" class="min-h-11" @click="copyPage">
      {{ copied ? 'Copied' : 'Copy page' }}
    </UButton>
    <UButton color="neutral" variant="ghost" :to="markdownUrl" target="_blank" icon="i-simple-icons-markdown" class="min-h-11">
      View as Markdown
    </UButton>
    <UDropdownMenu :items="items">
      <UButton color="neutral" variant="ghost" icon="i-carbon-overflow-menu-horizontal" aria-label="More page actions" class="min-h-11 min-w-11" />
    </UDropdownMenu>
  </div>
</template>
