export const menu = computed(() => {
  return [
    {
      label: 'Guide',
      to: '/guide/getting-started/unlighthouse-cli',
    },
    {
      label: 'Integration',
      to: '/integrations/cli',
    },
    {
      label: 'API',
      to: '/api-doc',
    },
    {
      label: 'Releases',
      to: '/releases',
    },
  ]
})
