<script lang="ts" setup>
const route = useRoute()
const { target: adRoot, isVisible: shouldLoadAd } = useVisibleWhenNearViewport({
  rootMargin: '900px 0px',
  idleTimeout: 6000,
})
</script>

<template>
  <div ref="adRoot" class="min-h-36">
    <ClientOnly>
      <ScriptCarbonAds
        v-if="shouldLoadAd"
        :key="route.path"
        format="cover"
        serve="CW7DTKJL"
        placement="unlighthousedev"
        trigger="onNuxtReady"
      >
        <AdsFallback />
      </ScriptCarbonAds>
    </ClientOnly>
  </div>
</template>

<style>
.dark #carbon-responsive {
  --carbon-padding: 1em;
  --carbon-max-char: 20ch;
  --carbon-bg-primary: var(--ui-bg);
  --carbon-bg-secondary: var(--ui-bg-muted);
  --carbon-text-color: var(--ui-text);
}

#carbon-responsive .carbon-responsive-wrap {
  border-radius: var(--ui-radius);
  max-width: 100%;
}
</style>
