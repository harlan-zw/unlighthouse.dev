export type ToolQueryValue = string | string[] | null | undefined
export type ToolQuery = Record<string, ToolQueryValue>

export interface ToolQueryRouter {
  currentRoute: {
    value: {
      query: Readonly<ToolQuery>
    }
  }
  replace: (location: { query: ToolQuery }) => Promise<unknown>
}

export function replaceToolQuery(
  router: ToolQueryRouter,
  paramKey: string,
  value: string,
  defaultValue?: string,
): Promise<unknown> {
  const query: ToolQuery = { ...router.currentRoute.value.query }

  if (!value || value === defaultValue)
    delete query[paramKey]
  else
    query[paramKey] = value

  return router.replace({ query })
}

export function readToolQueryValue(value: ToolQueryValue): string | undefined {
  return Array.isArray(value) ? value[0] : value ?? undefined
}
