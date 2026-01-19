import { parseURL, withHttps } from 'ufo'

const VALID_URL_RE = /^(https?:\/\/)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(\/\S*)?$/

export function isValidUrl(url: string) {
  return VALID_URL_RE.test(url)
}

export function normalizeUrl(url: string) {
  return withHttps(url.toLowerCase().trim())
}

export async function validateUrl(url?: string) {
  if (!url)
    throw createError({ message: 'URL is required', statusCode: 400 })

  const normalized = normalizeUrl(url)

  if (!isValidUrl(normalized))
    throw createError({ message: 'Invalid URL format', statusCode: 422 })

  const parsed = parseURL(normalized)
  if (!parsed.host)
    throw createError({ message: 'Invalid URL: no host found', statusCode: 422 })

  return normalized
}
