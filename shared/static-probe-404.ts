export const ALLOWED_DYNAMIC_PREFIXES = [
  '/_nuxt/',
  '/_og/',
  '/_og-static-fonts/',
  '/_ipx/',
  '/_fonts/',
  '/api/',
  '/auth/',
  '/__comark_content/',
  '/__nuxt_content/',
  '/__ai-ready/',
  '/__ai-ready__/',
  '/__link-checker__/',
  '/__sitemap__/',
  '/__skew/',
  '/__skew-devtools/',
  '/skills/',
  '/.well-known/agent-skills/',
  '/.well-known/acme-challenge/',
  '/.well-known/mcp/',
] as const

export const ALLOWED_EXACT_PATHS = new Set([
  '/_nuxt-skew-sw.js',
  '/__nuxt_error',
  '/__ai-ready-debug',
  '/__nuxt-skew-protection',
  '/robots.txt',
  '/sitemap.xml',
  '/sitemap_index.xml',
  '/sitemap.md',
  '/llms.txt',
  '/llms-full.txt',
  '/skill.md',
  '/404.html',
  '/guide/config.html',
  '/api-doc/.md',
  '/api-doc/index.md',
  '/.well-known/api-catalog',
  '/.well-known/mcp.json',
  '/.well-known/apple-developer-merchantid-domain-association',
  '/site.webmanifest',
])

const SITEMAP_XML_RE = /^\/sitemap[^/]*\.xml$/i

const SCANNER_SEGMENTS = new Set([
  'wp-admin',
  'wp-content',
  'wp-includes',
  'wp-json',
  'wp-login',
  'wp-login.php',
  'wp-config',
  'wp-config.php',
  'wp-cron.php',
  'wp-signup.php',
  'xmlrpc.php',
  'wlwmanifest.xml',
  'phpmyadmin',
  'pma',
  'cgi-bin',
  'ckeditor',
  'fckeditor',
  'elfinder',
  'autodiscover',
  'boaform',
  'actuator',
])

const SCANNER_PREFIXES = [
  '/reports/',
  '/vendor/phpunit/',
  '/wordpress/',
  '/wp/',
] as const

const SERVER_SCRIPT_EXTENSION_RE = /\.(?:php\d?|phtml|phar|aspx?|jspx?|cgi|pl|py|rb|sh|bat|exe|dll)$/i

// Note: `.md` is intentionally excluded so nuxt-ai-ready markdown twin routes still resolve.
const STATIC_ASSET_OR_BACKUP_EXTENSION_RE = /\.(?:png|jpe?g|gif|webp|avif|svg|ico|bmp|tiff?|mp4|webm|mp3|wav|ogg|pdf|js|mjs|cjs|css|map|woff2?|ttf|eot|otf|wasm|json|xml|txt|webmanifest|html?|shtml|env|bak|backup|old|orig|save|swp|tmp|log|sql|sqlite|db|ini|cfg|conf|ya?ml|toml|zip|tar|gz|tgz|bz2|rar|7z|pem|key|crt|ds_store)$/i

function decodePathname(rawPath: string): string {
  const withoutQuery = rawPath.split(/[?#]/, 1)[0] || '/'
  try {
    return decodeURIComponent(withoutQuery)
  }
  catch {
    return withoutQuery
  }
}

function isAllowedPath(lowerPath: string): boolean {
  if (ALLOWED_EXACT_PATHS.has(lowerPath) || SITEMAP_XML_RE.test(lowerPath))
    return true

  return ALLOWED_DYNAMIC_PREFIXES.some(prefix => lowerPath.startsWith(prefix))
}

/**
 * Identifies static-asset misses, CMS/scanner probes, hidden dotfiles, unknown
 * `.well-known` paths, and retired demo report paths that should receive a
 * plain-text 404 before entering Nuxt SSR.
 */
export function isStaticProbePath(rawPath: string): boolean {
  const decoded = decodePathname(rawPath)
  const lowerPath = decoded.toLowerCase()

  if (lowerPath === '/' || isAllowedPath(lowerPath))
    return false

  if (lowerPath === '/.well-known' || lowerPath.startsWith('/.well-known/'))
    return true

  if (lowerPath === '/reports' || SCANNER_PREFIXES.some(prefix => lowerPath.startsWith(prefix)))
    return true

  const segments = lowerPath.split('/').filter(Boolean)
  if (segments.length === 0)
    return false

  for (const segment of segments) {
    if (segment.startsWith('.'))
      return true
    if (SCANNER_SEGMENTS.has(segment))
      return true
    if (SERVER_SCRIPT_EXTENSION_RE.test(segment))
      return true
  }

  const lastSegment = segments.at(-1)
  if (lastSegment && STATIC_ASSET_OR_BACKUP_EXTENSION_RE.test(lastSegment))
    return true

  return false
}
