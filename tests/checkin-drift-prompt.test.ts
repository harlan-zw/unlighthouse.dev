/* eslint-disable test/no-import-node-test */
import assert from 'node:assert/strict'
import { register } from 'node:module'
import { it } from 'node:test'

register('./support/resolve-ts.mjs', import.meta.url)

const { default: config } = await import('../nuxt.config.ts')

const prompts = (config as unknown as {
  checkin: { external: { prompts: { id: string, prompt: string }[] } }
}).checkin.external.prompts

it('compares the deployed sha against origin/main, not the checked-out head', () => {
  const prompt = prompts.find(prompt => prompt.id === 'site.health-analysis')
  assert.ok(prompt, 'the site.health-analysis prompt is configured')
  const driftLine = prompt.prompt
    .split('\n')
    .find(line => line.includes('deploy.latest.approxDeployedSha'))
  assert.ok(driftLine, 'the prompt instructs a drift comparison on approxDeployedSha')
  assert.match(driftLine, /against `(origin\/main|health\.report\.release)`/)
  assert.doesNotMatch(driftLine, /git\.head/)
})
