import antfu from '@antfu/eslint-config'
import harlanzw from 'eslint-plugin-harlanzw'

export default antfu({
  rules: {
    'node/prefer-global/process': 'off',
    'node/prefer-global/buffer': 'off',
  },
  ignores: [
    '.data/**',
    '.claude/**',
  ],
}, ...harlanzw(), {
  rules: {
    'harlanzw/prompt-missing-examples': 'off',
  },
})
