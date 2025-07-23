<script setup lang="ts">
const navigation = inject('navigation')
</script>

<template>
  <footer class="relative z-10 antialiased font-sans  text-sm text-neutral-700 dark:text-neutral-200">
    <svg viewBox="0 0 1440 181" fill="none" xmlns="http://www.w3.org/2000/svg" class="text-primary-900/30 pointer-events-none absolute w-full top-[1px] transition-all text-(--ui-primary) flex-shrink-0 opacity-100 duration-[400ms] opacity-30 z-20"><mask id="path-1-inside-1_414_5526" fill="white"><path d="M0 0H1440V181H0V0Z" /></mask><path d="M0 0H1440V181H0V0Z" fill="url(#paint0_linear_414_5526)" fill-opacity="0.22" /><path d="M0 2H1440V-2H0V2Z" fill="url(#paint1_linear_414_5526)" mask="url(#path-1-inside-1_414_5526)" /><defs><linearGradient id="paint0_linear_414_5526" x1="720" y1="0" x2="720" y2="181" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient><linearGradient id="paint1_linear_414_5526" x1="0" y1="90.5" x2="1440" y2="90.5" gradientUnits="userSpaceOnUse"><stop stop-color="currentColor" stop-opacity="0" /><stop offset="0.395" stop-color="currentColor" /><stop offset="1" stop-color="currentColor" stop-opacity="0" /></linearGradient></defs></svg>
    <div class="border-t border-neutral-200 dark:border-neutral-800">
      <UContainer class="py-10">
        <div class="flex lg:flex-row flex-col items-center justify-center gap-3 mb-10">
          <div class="sm:flex items-center justify-center gap-3 ">
            <UButton
              aria-label="Unlighthouse on GitHub"
              to="https://github.com/harlan-zw/unlighthouse"
              target="_blank"
              color="neutral"
              variant="ghost"
              class="transition opacity-85"
              icon="i-carbon-logo-github"
            >
              GitHub
            </UButton>
            <UButton
              aria-label="Harlan's Discord"
              to="https://discord.com/invite/275MBUBvgP"
              target="_blank"
              color="neutral"
              variant="ghost"
              class="transition opacity-85"
              icon="i-carbon-logo-discord"
            >
              Discord
            </UButton>
            <ColorModeButton verbose />
            <ULink target="_blank" external href="/llms.txt" class="flex items-center gap-1 hover:underline transition">
              <UIcon dynamic name="i-noto-sparkles" class="w-4 h-4" />
              /llms.txt
            </ULink>
          </div>
        </div>
        <div class="py-10 grid xl:grid-cols-3 lg:gap-20 gap-10">
          <div v-for="(category, cKey) in navigation || []" :key="cKey">
            <h3 class="font-bold mb-5 flex items-center gap-1">
              {{ category.title }}
            </h3>
            <nav>
              <ul class="grid grid-cols-2 gap-6">
                <li v-for="(link, key) in category.children" :key="key">
                  <ULink :to="link.children?.length ? link.children[0].path : link.path" class="flex items-center gap-1 hover:underline transition">
                    {{ link.children?.length ? link.children[0].title : link.title }}
                  </ULink>
                </li>
              </ul>
            </nav>
          </div>
        </div>
        <div class="sm:flex items-center gap-10 mb-6">
          <Logo />
        </div>
      </UContainer>
    </div>
    <div class="border-t border-neutral-200 dark:border-neutral-800">
      <UContainer>
        <div class="py-10">
          Copyright © 2023-{{ new Date().getFullYear() }} Harlan Wilton - <a href="https://github.com/harlan-zw/unlighthouse/blob/main/LICENSE">MIT License</a>
        </div>
      </UContainer>
    </div>
  </footer>
</template>
