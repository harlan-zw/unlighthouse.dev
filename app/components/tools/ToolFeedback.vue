<script lang="ts" setup>
import type { FormSubmitEvent } from '#ui/types'
import type { CommentFeedbackSchemaOutput, ThumbsFeedbackResponse } from '~~/types/schemas'
import { useTimeoutFn } from '@vueuse/core'
import { CommentFeedbackSchema } from '~~/types/schemas'

const props = defineProps<{
  toolId: string
  context?: Record<string, unknown>
}>()

const thumbSubmissionStatus = ref<false | 'loading' | 'submitted'>(false)
const commentSubmissionStatus = ref<false | 'loading' | 'submitted'>(false)

const toast = useToast()
const thumbsResponse = ref<ThumbsFeedbackResponse>()

const state = reactive<Partial<CommentFeedbackSchemaOutput>>({
  comment: undefined,
})

function thumbsNextStep(val: ThumbsFeedbackResponse) {
  useTimeoutFn(() => {
    thumbSubmissionStatus.value = 'submitted'
    thumbsResponse.value = val
  }, 300)
}

function thumbs(thumbs: 'up' | 'down') {
  thumbSubmissionStatus.value = 'loading'
  $fetch<ThumbsFeedbackResponse>('/api/feedback-thumbs', {
    method: 'POST',
    body: { thumbs, toolId: props.toolId, context: props.context },
  })
    .then(thumbsNextStep)
    .catch((error) => {
      thumbSubmissionStatus.value = false
      toast.add({ title: 'Error', description: error.message, color: 'error' })
    })
}

async function onSubmit(event: FormSubmitEvent<CommentFeedbackSchemaOutput>) {
  commentSubmissionStatus.value = 'loading'
  $fetch('/api/feedback', {
    method: 'POST',
    body: JSON.stringify({ ...event.data, toolId: props.toolId, context: props.context }),
  })
    .then(() => {
      toast.add({ title: 'Thanks!', description: 'Your feedback helps us improve this tool.', color: 'success' })
    })
    .catch((error) => {
      toast.add({ title: 'Error', description: error.message, color: 'error' })
    })
    .finally(() => {
      commentSubmissionStatus.value = 'submitted'
    })
}
</script>

<template>
  <UCard class="mt-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
      <div>
        <div class="text-sm font-medium text-highlighted">
          Was this tool helpful?
        </div>
        <p class="text-xs text-muted mt-0.5">
          Your feedback helps us improve
        </p>
      </div>

      <div class="flex items-center gap-3">
        <template v-if="thumbSubmissionStatus === 'loading'">
          <UIcon name="i-carbon-in-progress" class="w-5 h-5 animate-spin text-muted" />
        </template>
        <template v-else-if="thumbSubmissionStatus === 'submitted'">
          <div v-if="thumbsResponse?.thumbs === 'up'" class="flex items-center gap-2 text-success">
            <UIcon name="i-carbon-thumbs-up-filled" class="w-5 h-5" />
            <span v-if="thumbsResponse.stats.up > 0" class="text-sm">
              {{ thumbsResponse.stats.up }} {{ thumbsResponse.stats.up > 1 ? 'agree' : 'agrees' }}
            </span>
          </div>
          <div v-else class="flex items-center gap-2 text-muted">
            <UIcon name="i-carbon-thumbs-down-filled" class="w-5 h-5" />
            <span class="text-sm">Thanks for the feedback</span>
          </div>
        </template>
        <template v-else>
          <UButton
            type="button"
            class="cursor-pointer"
            size="sm"
            color="success"
            variant="soft"
            @click="thumbs('up')"
          >
            <UIcon name="i-carbon-thumbs-up" class="w-4 h-4" />
            <span>Yes</span>
          </UButton>
          <UButton
            type="button"
            class="cursor-pointer"
            size="sm"
            color="neutral"
            variant="soft"
            @click="thumbs('down')"
          >
            <UIcon name="i-carbon-thumbs-down" class="w-4 h-4" />
            <span>No</span>
          </UButton>
        </template>
      </div>
    </div>

    <!-- Comment Form (shown after thumbs down or can be expanded) -->
    <div v-if="thumbSubmissionStatus === 'submitted' && thumbsResponse?.thumbs === 'down' && commentSubmissionStatus !== 'submitted'" class="mt-4 pt-4 border-t border-[var(--ui-border)]">
      <UForm :schema="CommentFeedbackSchema" :state="state" class="space-y-3" :validate-on="['change']" @submit="onSubmit">
        <UFormField label="What could be better?" name="comment">
          <UTextarea v-model="state.comment" placeholder="Tell us how we can improve this tool..." class="w-full" :rows="2" />
        </UFormField>
        <div class="flex items-center gap-2">
          <UButton type="submit" size="xs" color="primary" :loading="commentSubmissionStatus === 'loading'">
            Submit Feedback
          </UButton>
          <UButton type="button" size="xs" variant="ghost" color="neutral" @click="commentSubmissionStatus = 'submitted'">
            Skip
          </UButton>
        </div>
      </UForm>
    </div>
  </UCard>
</template>
