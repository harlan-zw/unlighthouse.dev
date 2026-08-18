import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu({
  vue: {
    sfcBlocks: false,
  },
  typescript: true,
}, ...harlanzw({ base: { type: 'app' } }), {
  files: ['content/**/*.md/*.{js,jsx,ts,tsx}'],
  rules: {
    'harlanzw/nuxt-no-side-effects-in-setup': 'off',
  },
}, {
  files: ['**/AGENTS.md', '**/CLAUDE.md', '**/SKILL.md', '**/*.prompt', '**/*.prompt.md'],
  rules: {
    'harlanzw/prompt-missing-examples': 'off',
  },
})
