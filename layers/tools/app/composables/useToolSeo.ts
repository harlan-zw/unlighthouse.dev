interface FAQ {
  question: string
  answer: string
}

interface ToolSeoOptions {
  title: string
  description: string
  icon?: string
  faqs?: FAQ[]
}

export function useToolSeo(opts: ToolSeoOptions) {
  useSeoMeta({
    title: opts.title,
    description: opts.description,
  })

  defineOgImage('NuxtSeo', {
    title: opts.title,
    description: opts.description,
    theme: '#10b981',
  })

  useSchemaOrg([
    {
      '@type': 'WebApplication',
      'name': opts.title,
      'description': opts.description,
      'url': useRequestURL().href,
      'applicationCategory': 'DeveloperApplication',
      'operatingSystem': 'Web',
      'offers': {
        '@type': 'Offer',
        'price': '0',
        'priceCurrency': 'USD',
      },
    },
  ])

  // Add FAQ schema if provided
  if (opts.faqs?.length) {
    useSchemaOrg([
      {
        '@type': 'FAQPage',
        'mainEntity': opts.faqs.map(faq => ({
          '@type': 'Question',
          'name': faq.question,
          'acceptedAnswer': {
            '@type': 'Answer',
            'text': faq.answer,
          },
        })),
      },
    ])
  }
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://'))
    return `https://${trimmed}`
  return trimmed
}
