declare module '#og-image' {
  interface OgImageComponents {
    Docs: typeof import('../app/components/OgImage/Docs.satori.vue')['default']
    Home: typeof import('../app/components/OgImage/Home.satori.vue')['default']
    NuxtSeo: typeof import('../app/components/OgImage/NuxtSeo.satori.vue')['default']
    Release: typeof import('../app/components/OgImage/Release.satori.vue')['default']
  }
}

export {}
