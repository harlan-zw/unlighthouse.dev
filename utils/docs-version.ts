export type DocsVersion = 'stable' | 'beta'

export function docsVersion(path: string): DocsVersion {
  return /^\/v1(?:\/|$)/.test(path) ? 'beta' : 'stable'
}

export function unversionedDocPath(path: string): string {
  return path.replace(/^\/v1(?=\/|$)/, '') || '/'
}

export function versionedDocPath(path: string, version: DocsVersion): string {
  const base = unversionedDocPath(path)
  return version === 'beta' ? `/v1${base}` : base
}

export function docsBranch(path: string): '0.x' | 'v1' {
  return docsVersion(path) === 'beta' ? 'v1' : '0.x'
}

export function switchDocsVersion(path: string, version: DocsVersion, availablePaths: readonly string[]): string {
  const target = versionedDocPath(path, version)
  return availablePaths.includes(target) ? target : versionedDocPath('/guide/getting-started/installation', version)
}
