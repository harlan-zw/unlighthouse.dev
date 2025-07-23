export function getLastPathSegment(path: string) {
  // Split the path into segments
  const segments = path.split('/')

  // Return the last 'size' segments joined by '/'
  return segments.slice(-1).join('/')
}

export function getPathSegments(path: string, size: number): string {
  // Split the path into segments
  const segments = path.split('/')

  // Check if the number of segments is less than or equal to the size
  if (segments.length <= size) {
    return path
  }

  // Return the last 'size' segments joined by '/'
  return segments.slice(0, size + 1).join('/')
}

export function getPathSubSection(path: string): string {
  return getPathSegments(path, 3)
}

export function getPathSection(path: string): string {
  return getPathSegments(path, 2)
}
