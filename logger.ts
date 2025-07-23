import { createConsola } from 'consola'
import { colorize } from 'consola/utils'

export const logger = createConsola({
  defaults: {
    tag: 'unlighthouse.dev',
  },
})

export const gray = (s: string) => colorize('gray', s)
