// Left side: Unlighthouse-specific items (simple links)
export const productMenu = computed(() => [
  {
    label: 'Guide',
    title: 'Guide',
    to: '/guide/getting-started/unlighthouse-cli',
  },
  {
    label: 'Integrations',
    title: 'Integrations',
    to: '/integrations/cli',
  },
  {
    label: 'API',
    title: 'API',
    to: '/api-doc',
  },
  {
    label: 'Releases',
    title: 'Releases',
    to: '/releases',
  },
])

// Right side: General tools and learning resources
export const resourcesMenu = computed(() => [
  {
    label: 'Learn',
    title: 'Learn',
    icon: 'i-heroicons-academic-cap',
    to: '/learn-lighthouse',
    children: [
      {
        label: 'Core Web Vitals',
        title: 'Core Web Vitals',
        icon: 'i-heroicons-chart-pie',
        to: '/learn-lighthouse/core-web-vitals',
      },
      {
        label: 'LCP Fixes',
        title: 'LCP Fixes',
        icon: 'i-heroicons-photo',
        to: '/learn-lighthouse/lcp',
      },
      {
        label: 'CLS Fixes',
        title: 'CLS Fixes',
        icon: 'i-heroicons-arrows-pointing-out',
        to: '/learn-lighthouse/cls',
      },
      {
        label: 'INP Fixes',
        title: 'INP Fixes',
        icon: 'i-heroicons-cursor-arrow-rays',
        to: '/learn-lighthouse/inp',
      },
      {
        label: 'Accessibility',
        title: 'Accessibility',
        icon: 'i-heroicons-eye',
        to: '/learn-lighthouse/accessibility',
      },
      {
        label: 'SEO',
        title: 'SEO',
        icon: 'i-heroicons-magnifying-glass',
        to: '/learn-lighthouse/seo',
      },
    ],
  },
  {
    label: 'Tools',
    title: 'Tools',
    icon: 'i-heroicons-wrench-screwdriver',
    to: '/tools',
    children: [
      {
        label: 'Score Calculator',
        title: 'Score Calculator',
        icon: 'i-heroicons-calculator',
        to: '/tools/lighthouse-score-calculator',
      },
      {
        label: 'All Tools',
        title: 'All Tools',
        icon: 'i-heroicons-squares-2x2',
        to: '/tools',
      },
    ],
  },
])

// Combined for mobile
export const menu = computed(() => [...productMenu.value, ...resourcesMenu.value])
