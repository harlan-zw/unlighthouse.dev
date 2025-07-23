/**
 * Generic function to walk through a payload structure and find specified elements
 * @param node The current node to process (could be a string or array)
 * @param predicate Function to determine if the current node matches criteria
 * @param callback Function called when a matching element is found
 * @param path Current path in the tree structure
 */
export function walk<T = any>(
  node: any,
  predicate: (node: any, path: string[]) => boolean,
  callback: (node: T, path: string[]) => void,
  path: string[] = [],
): void {
  // Handle arrays (most content elements are arrays)
  if (Array.isArray(node)) {
    // Check if this node matches the predicate
    if (predicate(node, path)) {
      callback(node as T, path)
    }

    // Process children
    for (let i = 0; i < node.length; i++) {
      walk(node[i], predicate, callback, [...path, i.toString()])
    }
  }
  // Handle objects (like attributes)
  else if (node && typeof node === 'object') {
    // Check if this object matches the predicate
    if (predicate(node, path)) {
      callback(node as T, path)
    }

    // Process each property of the object
    for (const key of Object.keys(node)) {
      walk(node[key], predicate, callback, [...path, key])
    }
  }
}

export function stripHeaderAnchorLinks(payload: any) {
  // match header tag then see if a is inside to a #
  walk(payload, (node) => {
    return Array.isArray(node) && typeof node[0] === 'string' && node[0].startsWith('h')
  }, (child) => {
    if (child[1].id) {
      // remove the id
      delete child[1].id
    }
  })
}

export function modifyRelativeDocLinksWithFramework(
  payload: any,
): any[] {
  const links = []
  // find a tags and check the href, if it's relative and contains docs and does not have a framework (getPathFramework)
  // then we should add the framework getPathWithFramework
  walk(
    payload,
    node => Array.isArray(node) && node[0] === 'a' && typeof node[1].href === 'string',
    (node) => {
      const href = node[1].href
      // while we're here make any absolute links target="_blank"
      if (href.startsWith('http') && !href.includes('/docs/')) {
        node[1].target = '_blank'
        node[1].rel = 'noopener noreferrer'
      }
      links.push(node)
    },
  )
  return links
}
