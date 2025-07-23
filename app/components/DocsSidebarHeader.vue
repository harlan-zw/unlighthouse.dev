<script setup lang="ts">
const route = useRoute()
const navigation = inject('navigation')
const bottom = computed(() => {
  return (navigation.value || []).find((l) => {
    const parentPath = l.path.split('/').slice(0, 2).join('/') || ''
    return route.path.startsWith(parentPath)
  })?.children || []
})
</script>

<template>
  <div>
    <nav aria-title="Documentation Navigation" class="flex flex-col gap-5">
      <ContentNavigation
        as="div" default-open :collapsible="false" :navigation="bottom" highlight
        :ui="{ listWithChildren: 'sm:ml-0 mt-2' }"
      >
        <template #link="{ link }">
          <div
            v-if="!link.html" class="flex items-center justify-between gap-2 w-full"
            :class="link.deprecated ? 'opacity-50' : ''"
          >
            <div class="flex items-center gap-2">
              <UIcon
                v-if="link.icon" :name="link.icon"
                class="w-4 h-4 transition-all hover:brightness-50 brightness-120"
              />
              <div :class="link.children?.length ? 'text-sm font-bold' : ''">
                {{ link.title }}
              </div>
            </div>
            <UIcon v-if="link.tag" :name="`i-logos-${link.tag}`" dynamclic ass="w-4 h-4" />
          </div>
          <div v-else :class="link.deprecated ? 'opacity-50' : ''">
            <UIcon v-if="link.icon" :name="link.icon" class="w-4 h-4 text-(--ui-primary)-400 dark:text-sky-200" />
            <div v-html="link.title" />
          </div>
          <div v-if="link.new">
            <UBadge size="sm" variant="subtle" color="success">
              New
            </UBadge>
          </div>
          <div v-else-if="link.deprecated" class="opacity-50">
            <UBadge size="sm" variant="subtle" color="neutral">
              Deprecated
            </UBadge>
          </div>
        </template>
      </ContentNavigation>
    </nav>
  </div>
</template>
