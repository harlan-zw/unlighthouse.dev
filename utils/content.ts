import type { Node } from '@harlan-zw/comark-content'
import { walkNodes } from '@harlan-zw/comark-content'

type AnchorNode = [tag: 'a', props: Record<string, unknown>, ...children: Node[]]

function isAnchor(node: Node): node is AnchorNode {
  return typeof node !== 'string' && node[0] === 'a' && typeof node[1].href === 'string'
}

/**
 * Marks every off-site link in a parsed document so it opens in a new tab.
 * Returns the anchor nodes it visited.
 */
export function modifyRelativeDocLinksWithFramework(nodes: readonly Node[]): AnchorNode[] {
  const links: AnchorNode[] = []

  walkNodes(nodes, (node) => {
    if (!isAnchor(node))
      return

    const href = node[1].href as string
    if (href.startsWith('http') && !href.includes('/docs/')) {
      node[1].target = '_blank'
      node[1].rel = 'noopener noreferrer'
    }
    links.push(node)
  })

  return links
}
