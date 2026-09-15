import { join } from 'node:path'
import { runCheckCommand } from '@harlan-zw/nuxt-checkin/external'

export async function command(context, executable, args) {
  const result = await runCheckCommand(context, executable, args, { maxBytes: 20 * 1024 * 1024 })
  if (result._tag === 'Err')
    throw new Error(result.reason)
  return result.stdout.trim()
}

export async function commandJson(context, executable, args) {
  return JSON.parse(await command(context, executable, args))
}

export function wrangler(context, args) {
  return commandJson(context, join(context.rootDir, 'node_modules/.bin/wrangler'), [
    ...args,
    '--config',
    join(context.rootDir, 'wrangler.local.toml'),
  ])
}

export async function d1Query(context, sql) {
  const output = await wrangler(context, ['d1', 'execute', 'DB', '--remote', '--json', '--command', sql])
  const statement = output[0]
  if (!statement?.success)
    throw new Error('D1 query did not succeed.')
  return statement.results ?? []
}

export async function revListBefore(context, date, ref) {
  try {
    return await command(context, 'git', ['rev-list', '-1', `--before=${date}`, ref]) || null
  }
  catch {
    return null
  }
}

export function deployment(context) {
  return context.collect(deployment, 'deployment', async () => {
    const deployments = await wrangler(context, ['deployments', 'list', '--json'])
    const latest = [...deployments].sort((a, b) => String(b.created_on).localeCompare(String(a.created_on)))[0]
    if (!latest)
      throw new Error('Worker deployment is missing.')
    return { value: {
      id: latest.id,
      createdOn: latest.created_on,
      versionId: latest.versions?.find(version => version.percentage === 100)?.version_id ?? null,
      message: latest.annotations?.['workers/message'] ?? null,
      approxDeployedSha: await revListBefore(context, latest.created_on, 'origin/main'),
    } }
  })
}
