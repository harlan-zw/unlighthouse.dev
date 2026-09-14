import { fail, pass, unavailable, warn } from '@harlan-zw/nuxt-checkin/server'

export function evaluateWorkflows(workflows) {
  const evidence = { workflows }
  const incomplete = !workflows.length || workflows.some(workflow => workflow.state._tag === 'missing')
  const coverage = incomplete ? { coverage: 'incomplete' } : {}
  if (workflows.some(workflow => workflow.state._tag === 'failure'))
    return { ...fail('A workflow failed.', evidence), ...coverage }
  if (workflows.some(workflow => workflow.state._tag === 'pending'))
    return { ...warn('A workflow is pending.', evidence), ...coverage }
  if (incomplete)
    return unavailable('Workflow evidence is missing.')
  return pass(evidence)
}

export function evaluateWorkers(evidence) {
  return evidence.errors || evidence.nonOk.length
    ? warn('Worker errors need attention.', evidence)
    : pass(evidence)
}
