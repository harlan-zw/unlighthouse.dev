import { defineEventHandler } from 'h3'
import { getWorkerEnv } from '../utils/worker-env'

export default defineEventHandler((event) => {
  return {
    ASSETS: !!getWorkerEnv<{ ASSETS: unknown }>(event)?.ASSETS,
  }
})
