import { readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { defineExternalCheck } from '@harlan-zw/nuxt-checkin/external'
import { parseWorkflowName, summarizeWorkflowRuns } from '../../scripts/tools/checkin-observability.mjs'
import { commandJson } from '../lib/commands.mjs'
import { evaluateWorkflows } from '../lib/evidence.mjs'

export default defineExternalCheck({
  id: 'repository.ci',
  async run(context) {
    const directory = join(context.rootDir, '.github/workflows')
    const files = (await readdir(directory)).filter(file => /\.ya?ml$/.test(file))
    const names = (await Promise.all(files.map(async file => parseWorkflowName(await readFile(join(directory, file), 'utf8'))))).filter(Boolean).sort()
    const fields = 'databaseId,workflowName,displayTitle,headSha,status,conclusion,createdAt,updatedAt,url'
    const rows = []
    for (const name of names)
      rows.push(...await commandJson(context, 'gh', ['run', 'list', '--workflow', name, '--limit', '10', '--json', fields]))
    return evaluateWorkflows(summarizeWorkflowRuns(rows, names))
  },
})
