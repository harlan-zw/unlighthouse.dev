import { defineExternalCheck, pass } from '@harlan-zw/nuxt-checkin/external'
import { command } from '../lib/commands.mjs'

export default defineExternalCheck({
  id: 'repository.git',
  async run(context) {
    const commits = await command(context, 'git', ['log', `--since=${context.since.toISOString()}`, '--pretty=format:%H%x09%aI%x09%s'])
    return pass({
      since: context.since.toISOString(),
      until: context.now.toISOString(),
      branch: await command(context, 'git', ['branch', '--show-current']),
      head: await command(context, 'git', ['rev-parse', 'HEAD']),
      dirtyFiles: (await command(context, 'git', ['status', '--short'])).split('\n').filter(Boolean),
      commitsSinceLastRun: commits.split('\n').filter(Boolean).map((line) => {
        const [sha, authoredAt, ...subject] = line.split('\t')
        return { sha, authoredAt, subject: subject.join('\t') }
      }),
    })
  },
})
