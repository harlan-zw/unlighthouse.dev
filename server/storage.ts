export function appStorage() {
  if (import.meta.prerender)
    return useStorage('fs')
  return useStorage('kv')
}
