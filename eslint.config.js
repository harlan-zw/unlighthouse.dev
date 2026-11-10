import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu({
  vue: {
    sfcBlocks: false,
  },
  typescript: true,
}, ...harlanzw({ base: { type: 'app' } }), {
  files: ['tests/**/*.test.ts'],
  rules: {
    // This repository runs its tests with Node's built-in runner.
    'test/no-import-node-test': 'off',
  },
}, {
  files: ['content/**/*.md/*.{js,jsx,ts,tsx}'],
  rules: {
    'harlanzw/nuxt-no-side-effects-in-setup': 'off',
  },
}, {
  files: ['**/AGENTS.md', '**/CLAUDE.md', '**/SKILL.md', '**/*.prompt', '**/*.prompt.md'],
  rules: {
    'harlanzw/prompt-missing-examples': 'off',
  },
}, {
  files: ['pnpm-workspace.yaml'],
  rules: {
    // Nuxt tools retain TypeScript 6 alongside the native TypeScript 7 checker.
    'pnpm/yaml-no-duplicate-catalog-item': ['error', { checkDuplicates: 'exact-version' }],
  },
})
