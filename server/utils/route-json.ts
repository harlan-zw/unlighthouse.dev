import type { ServerFetchResponse } from 'nuxt/server'
import { createError } from 'nuxt/server'

export async function readRouteJson<Data>(request: Promise<ServerFetchResponse<Data>>): Promise<Data> {
  const response = await request
  if (!response.ok)
    throw createError({ status: response.status, statusText: response.statusText })
  return response.json()
}
