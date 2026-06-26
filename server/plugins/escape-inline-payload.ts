const NUXT_PAYLOAD_MARKER = 'data-nuxt-data="nuxt-app"'
const SCRIPT_CLOSE = '</script>'
const ESCAPED_SCRIPT_CLOSE = '<\\u002Fscript>'

function minifyShikiCss(css: string) {
  return css
    .replace(/\s+/g, ' ')
    .replace(/\s*\{\s*/g, '{')
    .replace(/:\s*/g, ':')
    .replace(/;\s*\}/g, '}')
    .replace(/;\s*/g, ';')
    .replace(/,\s*/g, ',')
    .replace(/\s*\}\s*/g, '}')
    .trim()
}

function isShikiCss(value: string) {
  return value.includes('--shiki-') && value.includes('.shiki')
}

function minifyShikiCssStrings(value: unknown): boolean {
  let changed = false

  if (Array.isArray(value)) {
    for (let i = 0; i < value.length; i++) {
      const item = value[i]
      if (typeof item === 'string' && isShikiCss(item)) {
        const minified = minifyShikiCss(item)
        if (minified !== item) {
          value[i] = minified
          changed = true
        }
      }
      else if (item && typeof item === 'object') {
        changed = minifyShikiCssStrings(item) || changed
      }
    }
    return changed
  }

  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>
    for (const key of Object.keys(record)) {
      const item = record[key]
      if (typeof item === 'string' && isShikiCss(item)) {
        const minified = minifyShikiCss(item)
        if (minified !== item) {
          record[key] = minified
          changed = true
        }
      }
      else if (item && typeof item === 'object') {
        changed = minifyShikiCssStrings(item) || changed
      }
    }
  }

  return changed
}

function minifyShikiCssJsonStrings(payload: string) {
  return payload.replace(/"html \.[^"]*--shiki-[^"]*"/g, (match) => {
    const value = match.slice(1, -1)
    return isShikiCss(value) ? `"${minifyShikiCss(value)}"` : match
  })
}

function normalizeInlinePayload(payload: string) {
  let normalized = payload

  if (payload.includes('--shiki-')) {
    try {
      const parsed = JSON.parse(payload) as unknown
      if (minifyShikiCssStrings(parsed)) {
        normalized = JSON.stringify(parsed)
      }
    }
    catch {
      normalized = minifyShikiCssJsonStrings(payload)
    }
  }

  return normalized.replaceAll(SCRIPT_CLOSE, ESCAPED_SCRIPT_CLOSE)
}

function findJsonValueEnd(source: string, start: number) {
  let depth = 0
  let inString = false
  let isEscaped = false
  let hasStarted = false

  for (let i = start; i < source.length; i++) {
    const char = source[i]

    if (inString) {
      if (isEscaped) {
        isEscaped = false
      }
      else if (char === '\\') {
        isEscaped = true
      }
      else if (char === '"') {
        inString = false
      }
      continue
    }

    if (char === '"') {
      inString = true
      continue
    }

    if (char === '[' || char === '{') {
      depth++
      hasStarted = true
      continue
    }

    if (char === ']' || char === '}') {
      depth--
      if (hasStarted && depth === 0) {
        return i + 1
      }
      if (depth < 0) {
        return -1
      }
      continue
    }

    if (!hasStarted && !/\s/.test(char)) {
      return -1
    }
  }

  return -1
}

function findNextNonWhitespace(source: string, start: number) {
  for (let i = start; i < source.length; i++) {
    if (!/\s/.test(source[i])) {
      return i
    }
  }
  return -1
}

function escapeInlineNuxtPayload(chunk: string) {
  let result = ''
  let cursor = 0

  while (true) {
    const markerStart = chunk.indexOf(NUXT_PAYLOAD_MARKER, cursor)
    if (markerStart === -1) {
      return result + chunk.slice(cursor)
    }

    const payloadStart = chunk.lastIndexOf('<script', markerStart)
    const payloadOpenEnd = chunk.indexOf('>', markerStart)
    const payloadEnd = payloadOpenEnd === -1 ? -1 : findJsonValueEnd(chunk, payloadOpenEnd + 1)
    const payloadCloseStart = payloadEnd === -1 ? -1 : findNextNonWhitespace(chunk, payloadEnd)

    if (
      payloadStart === -1
      || payloadOpenEnd === -1
      || payloadEnd === -1
      || payloadCloseStart === -1
      || !chunk.startsWith(SCRIPT_CLOSE, payloadCloseStart)
    ) {
      return result + chunk.slice(cursor)
    }

    result += chunk.slice(cursor, payloadOpenEnd + 1)
    result += normalizeInlinePayload(chunk.slice(payloadOpenEnd + 1, payloadEnd))
    result += chunk.slice(payloadEnd, payloadCloseStart + SCRIPT_CLOSE.length)
    cursor = payloadCloseStart + SCRIPT_CLOSE.length
  }
}

export default defineNitroPlugin((nitroApp) => {
  nitroApp.hooks.hook('render:response', (response) => {
    if (typeof response.body === 'string' && response.body.includes(NUXT_PAYLOAD_MARKER)) {
      response.body = escapeInlineNuxtPayload(response.body)
    }
  })

  nitroApp.hooks.hook('render:html', (html) => {
    const htmlSections = html as unknown as Record<string, unknown>

    for (const key of ['head', 'body', 'bodyPrepend', 'bodyAppend']) {
      const section = htmlSections[key]
      if (typeof section === 'string') {
        htmlSections[key] = escapeInlineNuxtPayload(section)
      }
      else if (Array.isArray(section)) {
        htmlSections[key] = section.map((chunk) => {
          return typeof chunk === 'string' ? escapeInlineNuxtPayload(chunk) : chunk
        })
      }
    }
  })
})
